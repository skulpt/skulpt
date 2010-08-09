var out;
/**
 * @constructor
 * @param {string} filename
 * @param {SymbolTable} st
 * @param {number} flags
 */
function Compiler(filename, st, flags)
{
    this.filename = filename;
    this.st = st;
    this.flags = flags;
    this.interactive = false;
    this.nestlevel = 0;

    this.u = null;
    this.stack = [];

    this.result = [];

    this.gensymcount = 0;

    this.allUnits = [];
}

/**
 * @constructor
 *
 * Stuff that changes on entry/exit of code blocks. must be saved and restored
 * when returning to a block.
 *
 * Corresponds to the body of a module, class, or function.
 */

function CompilerUnit()
{
    this.ste = null;
    this.name = null;
    this.consts = null;

    this.names = null;
    this.varnames = null;
    this.cellvars = null;
    this.freevars = null;

    this.private_ = null;
    this.argcount = 0;
    this.tmpname = 0;
    this.firstlineno = 0;
    this.lineno = 0;
    this.linenoSet = false;

    this.blocknum = 0;
    this.blocks = [];
    this.curblock = 0;
}

CompilerUnit.prototype.activateScope = function()
{
    var self = this;
    out = function() {
        var b = self.blocks[self.curblock];
        for (var i = 0; i < arguments.length; ++i)
            b.push(arguments[i]);
    };
};

Compiler.prototype.gensym = function(hint)
{
    hint = hint || '';
    hint = '$' + hint;
    hint += this.gensymcount++;
    return hint;
};

function mangleName(priv, ident)
{
    var name = ident.__str__();
    if (priv === null || name === null || name.charAt(0) !== '_' || name.charAt(1) !== '_')
        return ident;
    // don't mangle __id__
    if (name.charAt(name.length - 1) === '_' && name.charAt(name.length - 2) === '_')
        return ident;
    // don't mangle classes that are all _ (obscure much?)
    if (priv.replace(/_/g, '') === '')
        return ident;
    priv = priv.replace(/^_*/, '');
    return new Sk.builtin.str('_' + priv + name);
}

Compiler.prototype._gr = function(hint)
{
    var v = this.gensym(hint);
    out("var ", v, "=");
    for (var i = 1; i < arguments.length; ++i)
    {
        out(arguments[i]);
    }
    out(";");
    return v;
}

Compiler.prototype.ctuple = function(e, data)
{
    if (e.ctx === Store)
    {
        for (var i = 0; i < e.elts.length; ++i)
        {
            // todo; the indexing is hokey, i think it needs to use a proper iter
            this.vexpr(e.elts[i], data + ".v[" + i + "]");
        }
    }
    else if (e.ctx === Load)
    {
        var items = [];
        for (var i = 0; i < e.elts.length; ++i)
        {
            items.push(this._gr('tupelem', this.vexpr(e.elts[i])));
        }
        return this._gr('loadtup', "new Sk.builtin.tuple([", items, "])");
    }
};

Compiler.prototype.ccompare = function(e)
{
    var left = this.vexpr(e.left);
    goog.asserts.assert(e.ops.length === 1 && e.comparators.length === 1, "todo; >1 compares");

    goog.asserts.assert(e.ops.length === e.comparators.length);
    return this._gr('compare', "Sk.cmp(", left, ",", this.vexpr(e.comparators[0]), ",'", e.ops[0]._astname, "')");
};

Compiler.prototype.ccall = function(e)
{
    var func = this.vexpr(e.func);
    var args = this.vseqexpr(e.args);
    goog.asserts.assert(e.keywords.length === 0, "todo;");
    goog.asserts.assert(!e.starargs, "todo;");
    goog.asserts.assert(!e.kwargs, "todo;");
    // todo; __call__ gunk
    return this._gr('call', func, "(", args, ")");
};

/**
 *
 * compiles an expression. to 'return' something, it'll gensym a var and store
 * into that var so that the calling code doesn't have avoid just paste the
 * returned name.
 *
 * @param {Object} e
 * @param {Object=} data
 */
Compiler.prototype.vexpr = function(e, data)
{
    if (e.lineno > this.u.lineno)
    {
        this.u.lineno = e.lineno;
        this.u.linenoSet = false;
    }
    switch (e.constructor)
    {
        case BoolOp:
            return this.cboolop(e);
        case BinOp:
            return this._gr('binop', "Sk.binop(", this.vexpr(e.left), ",", this.vexpr(e.right), ",'", e.op._astname, "')");
        case UnaryOp:
            goog.asserts.fail();
        case Lambda:
            return this.clambda(e);
        case IfExp:
            return this.cifexp(e);
        case Dict:
            goog.asserts.fail();
        case ListComp:
            return this.clistcomp(e);
        case GeneratorExp:
            return this.cgenexp(e);
        case Yield:
            goog.asserts.fail();
        case Compare:
            return this.ccompare(e);
        case Call:
            return this.ccall(e);
        case Num:
            return e.n;
        case Str:
            return e.s.__repr__().v;
        case Attribute:
            goog.asserts.fail();
        case Subscript:
            goog.asserts.fail();
        case Name:
            return this.nameop(e.id, e.ctx, data);
        case List:
            return this.clist(e, data);
        case Tuple:
            return this.ctuple(e, data);
        default:
            goog.asserts.fail("unhandled case in vexpr");
    }
};
Compiler.prototype.vseqexpr = function(exprs, data)
{
    goog.asserts.assert(data === undefined || exprs.length === data.length);
    var ret = [];
    for (var i = 0; i < exprs.length; ++i)
        ret.push(this.vexpr(exprs[i], data === undefined ? undefined : data[i]));
    return ret;
};

Compiler.prototype.caugassign = function(s)
{
    goog.asserts.assert(s instanceof AugAssign);
    var e = s.target;
    switch (e.constructor)
    {
        case Name:
            var to = this.nameop(e.id, Load);
            var val = this.vexpr(s.value);
            var res = this._gr('inplbinop', "Sk.inplacebinop(", to, ",", val, ",'", s.op._astname, "')");
            return this.nameop(e.id, Store, res);
        default:
            goog.asserts.fail("unhandled case in augassign");
    }
};

/**
 * optimize some constant exprs. returns 0 if always 0, 1 if always 1 or -1 otherwise.
 */
Compiler.prototype.exprConstant = function(e)
{
    switch (e.constructor)
    {
        case Num:
            return Sk.builtin.object_.isTrue$(e.n);
        case Str:
            return Sk.builtin.object_.isTrue$(e.s);
        case Name:
            // todo; do __debug__ test here if opt
        default:
            return -1;
    }
};

Compiler.prototype.newBlock = function(name)
{
    var ret = this.u.blocknum++;
    this.u.blocks[ret] = [];
    this.u.blocks[ret]._name = name || '<unnamed>';
    return ret;
};
Compiler.prototype.setBlock = function(n)
{
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.curblock = n;
}

Compiler.prototype.outputAllUnits = function()
{
    var ret = '';
    for (var j = 0; j < this.allUnits.length; ++j)
    {
        var unit = this.allUnits[j];
        ret += unit.prefixCode;
        var blocks = unit.blocks;
        for (var i = 0; i < blocks.length; ++i)
        {
            ret += "case " + i + ": /* --- " + blocks[i]._name + " --- */";
            ret += blocks[i].join('');
            ret += "break;";
        }
        ret += unit.suffixCode;
    }
    return ret;
};

Compiler.prototype.cif = function(s)
{
    goog.asserts.assert(s instanceof If_);
    var constant = this.exprConstant(s.test);
    if (constant === 0)
    {
        if (s.orelse) 
            this.vseqstmt(s.orelse);
    }
    else if (constant === 1)
    {
        this.vseqstmt(s.body);
    }
    else
    {
        var end = this.newBlock('end of if');
        var next = this.newBlock('after if');
        var test = this.vexpr(s.test);
        var cond = this._gr('ifbr', "(", test, "===false||!Sk.builtin.object_.isTrue$(", test, "))");
        out("if(", cond, "){$blk=", next, ";continue;}");
        this.vseqstmt(s.body);
        out("$blk=", end, ";continue;");
        this.setBlock(next);
        if (s.orelse)
            this.vseqstmt(s.orelse);
    }
    this.setBlock(end);

};

Compiler.prototype.cwhile = function(s)
{
    var constant = this.exprConstant(s.test);
    if (constant === 0)
    {
        if (s.orelse)
            this.vseqstmt(s.orelse);
    }
    else
    {
        var top = this.newBlock('while test');
        out("$blk=", top, ";continue;");
        this.setBlock(top);

        var next = this.newBlock('after while');
        var orelse = s.orelse.length > 0 ? this.newBlock('while orelse') : null;
        var body = this.newBlock('while body');

        var test = this.vexpr(s.test);
        var cond = this._gr('whilebr', "(", test, "===false||!Sk.builtin.object_.isTrue$(", test, "))");
        out("if(",cond,"){$blk=", orelse ? orelse : next, ";continue;}");
        out("else{$blk=", body, ";continue;}");

        this.setBlock(body);
        this.vseqstmt(s.body);
        out("$blk=", top, ";continue;");

        if (s.orelse.length > 0)
        {
            this.setBlock(orelse);
            this.vseqstmt(s.orelse);
        }

        this.setBlock(next);
    }
};

Compiler.prototype.cfunction = function(s)
{
    goog.asserts.assert(s instanceof FunctionDef);
    var args = s.args;
    var decos = s.decorator_list;

    //this.vseqexpr(decos);

    var scopename = this.enterScope(s.name, s, s.lineno);

    // todo; probably need to have 'out' go to the prefix/suffix properly for this

    this.u.prefixCode = "var " + scopename + "=(function(";

    for (var i = 0; i < args.args.length; ++i)
    {
        this.u.prefixCode += this.nameop(args.args[i].id, Load);
        if (i !== args.args.length - 1)
            this.u.prefixCode += ",";
    }

    var entryBlock = this.newBlock();
    this.u.prefixCode += "){";
    /*
    if (args.defaults)
        this.vseqexpr(args.defaults);
        */
    this.u.prefixCode += "var $blk=" + entryBlock + ",$loc={};while(true){switch($blk){";
    this.u.suffixCode = "}break;}});";

    this.vseqstmt(s.body);

    this.exitScope();

    this.nameop(s.name, Store, scopename);
};

/**
 * compiles a statement
 */
Compiler.prototype.vstmt = function(s)
{
    this.u.lineno = s.lineno;
    this.u.linenoSet = false;
    switch (s.constructor)
    {
        case FunctionDef:
            this.cfunction(s);
            break;
        case ClassDef:
            this.cclass(s);
            break;
        case Return_:
            if (this.u.ste.blockType !== FunctionBlock)
                throw new SyntaxError("'return' outside function");
            if (s.value)
                out("return ", this.vexpr(s.value), ";");
            else
                out("return null;");
            break;
        case Assign:
            var n = s.targets.length;
            var val = this.vexpr(s.value);
            for (var i = 0; i < n; ++i)
                this.vexpr(s.targets[i], val);
            break;
        case AugAssign:
            return this.caugassign(s);
        case Print:
            this.cprint(s);
            break;
        case For_:
            return this.cfor(s);
        case While_:
            return this.cwhile(s);
        case If_:
            return this.cif(s);
        default:
            goog.asserts.fail("unhandled case in vstmt");
    }
};

Compiler.prototype.vseqstmt = function(stmts)
{
    for (var i = 0; i < stmts.length; ++i) this.vstmt(stmts[i]);
};

var OP_FAST = 0;
var OP_GLOBAL = 1;
var OP_DEREF = 2;
var OP_NAME = 3;
var D_NAMES = 0;
var D_FREEVARS = 1;
var D_CELLVARS = 2;
Compiler.prototype.nameop = function(name, ctx, dataToStore)
{
    if ((ctx === Store || ctx === AugStore || ctx === Del) && name === "__debug__")
        this.error("can not assign to __debug__");

    var mangled = mangleName(this.u.private_, name).__str__();
    var op = 0;
    var optype = OP_NAME;
    var scope = this.u.ste.getScope(mangled);
    var dict = D_NAMES;
    switch (scope)
    {
        case FREE:
            dict = D_FREEVARS;
            optype = OP_DEREF;
            break;
        case CELL:
            dict = D_CELLVARS;
            optype = OP_DEREF;
            break;
        case LOCAL:
            if (this.u.ste.blockType === FunctionBlock)
                optype = OP_FAST;
            break;
        case GLOBAL_IMPLICIT:
            if (this.u.ste.blockType === FunctionBlock)
                optype = OP_GLOBAL;
            break;
        case GLOBAL_EXPLICIT:
            optype = OP_GLOBAL;
        default:
            break;
    }

    //print("mangled", mangled);
    goog.asserts.assert(scope || name.charAt(0) === '_');

    switch (optype)
    {
        case OP_FAST:
            switch (ctx)
            {
                case Load:
                    return mangled;
                case Store:
                    out(mangled+ "=", dataToStore, ";");
                default:
                    goog.asserts.fail("unhandled");
            }
            break;
        case OP_NAME:
            switch (ctx)
            {
                case Load:
                    var v = this.gensym('loadname');
                    // todo; need to pass globals and builtins
                    out("var ", v, "=$loc.", mangled, ";if(", v, "===undefined)", v, "=Sk.loadname('", mangled, "');");
                    return v;
                case Store:
                    out("$loc.", mangled, "=", dataToStore, ';');
                    break;
                default:
                    goog.asserts.fail("unhandled");
            }
            break;
        default:
            goog.asserts.fail("unhandled case");
    }
};

Compiler.prototype.enterScope = function(name, key, lineno)
{
    var u = new CompilerUnit();
    u.ste = this.st.getStsForAst(key);
    u.name = name;
    u.firstlineno = lineno;
    u.consts = {};
    u.names = {};

    this.stack.push(this.u);
    this.allUnits.push(u);
    this.u = u;

    var scopeName = this.gensym('scope')
    this.u.activateScope();

    this.nestlevel++;

    return scopeName;
};

Compiler.prototype.exitScope = function()
{
    this.nestlevel--;
    if (this.stack.length - 1 >= 0)
        this.u = this.stack.pop();
    else
        this.u = null;
    if (this.u)
        this.u.activateScope();
    
};

Compiler.prototype.cbody = function(stmts)
{
    for (var i = 0; i < stmts.length; ++i)
        this.vstmt(stmts[i]);
};

Compiler.prototype.cprint = function(s)
{
    goog.asserts.assert(s instanceof Print);
    var dest = 'null';
    if (s.dest)
        dest = this.vexpr(v.dest);

    var n = s.values.length;
    // todo; dest disabled
    for (var i = 0; i < n; ++i)
        out('Sk.output(', /*dest, ',',*/ this.vexpr(s.values[i]), ');');
    if (s.nl)
        out('Sk.output(', /*dest, ',*/ '"\\n");');
};

Compiler.prototype.cmod = function(mod)
{
    //print("-----");
    //print(Sk.astDump(mod));
    var modf = this.enterScope(new Sk.builtin.str("<module>"), mod, 0);

    var entryBlock = this.newBlock();
    this.u.prefixCode = "var " + modf + "=(function(){var $blk=" + entryBlock + ",$loc={};while(true){switch($blk){";
    this.u.suffixCode = "}break;}});";

    switch (mod.constructor)
    {
        case Module:
            this.cbody(mod.body);
            break;
        default:
            goog.asserts.fail("todo; unhandled case in compilerMod");
    }
    this.exitScope();

    this.result.push(this.outputAllUnits());
    this.result.push(modf + "();");
};

/**
 * @param {string} source the code
 * @param {string} filename where it came from
 * @param {string} mode one of 'exec', 'eval', or 'single'
 */
Sk.compile = function(source, filename, mode)
{
    //print("FILE:", filename);
    var cst = Sk.parse(filename, source);
    var ast = Sk.astFromParse(cst, filename);
    var st = Sk.symboltable(ast);
    var c = new Compiler(filename, st, 0); // todo; CO_xxx
    c.cmod(ast);
    var ret = c.result.join('');
    return ret;
};

goog.exportSymbol("Sk.compile", Sk.compile);
