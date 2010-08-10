var out;
/**
 * @constructor
 * @param {string} filename
 * @param {SymbolTable} st
 * @param {number} flags
 * @param {string=} sourceCodeForAnnotation used to add original source to listing if desired
 */
function Compiler(filename, st, flags, sourceCodeForAnnotation)
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

    this.source = sourceCodeForAnnotation ? sourceCodeForAnnotation.split("\n") : false;
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
    this.firstlineno = 0;
    this.lineno = 0;
    this.linenoSet = false;

    this.blocknum = 0;
    this.blocks = [];
    this.curblock = 0;

    // stack of where to go on a break
    this.breakBlocks = [];
    // stack of where to go on a continue
    this.continueBlocks = [];
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

Compiler.prototype.getSourceLine = function(lineno)
{
    goog.asserts.assert(this.source);
    return this.source[lineno - 1];
};

Compiler.prototype.annotateSource = function(ast)
{
    if (this.source)
    {
        var lineno = ast.lineno;
        var col_offset = ast.col_offset;
        out("\n/* line ", lineno, "\n", this.getSourceLine(lineno), "\n");
        for (var i = 0; i < col_offset; ++i) out(" ");
        out("^\n*/");
    }
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

Compiler.prototype._jumpfalse = function(test, block)
{
    var cond = this._gr('jfalse', "(", test, "===false||!Sk.builtin.object_.isTrue$(", test, "))");
    out("if(", cond, "){/*test failed */$blk=", block, ";continue;}");
};

Compiler.prototype._jumpundef = function(test, block)
{
    out("if(", test, "===undefined){$blk=", block, ";continue;}");
};

Compiler.prototype._jumptrue = function(test, block)
{
    var cond = this._gr('jtrue', "(", test, "===true||Sk.builtin.object_.isTrue$(", test, "))");
    out("if(", cond, "){/*test passed */$blk=", block, ";continue;}");
};

Compiler.prototype._jump = function(block)
{
    out("$blk=", block, ";/* jump */continue;");
};

Compiler.prototype.ctupleorlist = function(e, data, tuporlist)
{
    goog.asserts.assert(tuporlist === 'tuple' || tuporlist === 'list');
    if (e.ctx === Store)
    {
        for (var i = 0; i < e.elts.length; ++i)
        {
            this.vexpr(e.elts[i], data + ".mp$subscript(" + i + ")");
        }
    }
    else if (e.ctx === Load)
    {
        var items = [];
        for (var i = 0; i < e.elts.length; ++i)
        {
            items.push(this._gr('elem', this.vexpr(e.elts[i])));
        }
        return this._gr('load'+tuporlist, "new Sk.builtin.", tuporlist, "([", items, "])");
    }
};

Compiler.prototype.cdict = function(e)
{
    goog.asserts.assert(e.values.length === e.keys.length);
    var items = [];
    for (var i = 0; i < e.values.length; ++i)
    {
        var v = this.vexpr(e.values[i]); // "backwards" to match order in cpy
        items.push(this.vexpr(e.keys[i]));
        items.push(v);
    }
    return this._gr('loaddict', "new Sk.builtin.dict([", items, "])");
};

Compiler.prototype.clistcompgen = function(tmpname, generators, genIndex, elt)
{
    var start = this.newBlock('list gen start');
    var skip = this.newBlock('list gen skip');
    var ifCleanup = this.newBlock('list gen cleanup');
    var anchor = this.newBlock('list gen anchor');

    var l = generators[genIndex];
    var toiter = this.vexpr(l.iter);
    var iter = this._gr("iter", toiter, ".tp$iter()");
    this._jump(start);
    this.setBlock(start);

    // load targets
    var nexti = this._gr('next', iter, ".tp$iternext()");
    this._jumpundef(nexti, anchor); // todo; this should be handled by StopIteration
    var target = this.vexpr(l.target, nexti);

    var n = l.ifs.length;
    for (var i = 0; i < n; ++i)
    {
        var ifres = this.vexpr(l.ifs[i]);
        this._jumpfalse(ifres, ifCleanup);
    }

    if (++genIndex < generators.length)
    {
        this.clistcompgen(tmpname, generators, genIndex, elt);
    }

    if (genIndex >= generators.length)
    {
        var velt = this.vexpr(elt);
        out(tmpname, ".v.push(", velt, ");"); // todo;
        this._jump(skip);
        this.setBlock(skip);
    }

    this._jump(start);

    this.setBlock(anchor);

    return tmpname;
};

Compiler.prototype.clistcomp = function(e)
{
    goog.asserts.assert(e instanceof ListComp);
    var tmp = this._gr("_compr", "new Sk.builtin.list([])"); // note: _ is impt. for hack in name mangling (same as cpy)
    return this.clistcompgen(tmp, e.generators, 0, e.elt);
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

Compiler.prototype.csimpleslice = function(s, ctx, obj, dataToStore)
{
    goog.asserts.assert(s.step === null);
    var lower = 'null', upper = 'null';
    if (s.lower && ctx !== AugStore)
        lower = this.vexpr(s.lower);
    if (s.upper && ctx !== AugStore)
        upper = this.vexpr(s.upper);

    // todo; don't require making a slice obj, and move logic into general sequence place
    switch (ctx)
    {
        case AugLoad:
        case Load:
            return this._gr("simpsliceload", obj, ".mp$subscript(new Sk.builtin.slice(", lower, ",", upper, "))");
        case AugStore:
        case Store:
            out(obj, ".__setitem__(new Sk.builtin.slice(", lower, ",", upper, "),", dataToStore, ");");
            break;
        case Del:
            out(obj, ".__delitem__(new Sk.builtin.slice(", lower, ",", upper, ");");
        case Param:
        default:
            goog.asserts.fail("invalid simple slice");
    }
};

Compiler.prototype.cslice = function(s, ctx, obj, dataToStore)
{
    goog.asserts.fail("todo;");
};

Compiler.prototype.vslice = function(s, ctx, obj, dataToStore)
{
    var kindname = null;
    var subs;
    switch (s.constructor)
    {
        case Index:
            kindname = "index";
            if (ctx !== AugStore)
                subs = this.vexpr(s.value);
            break;
        case Slice:
            if (!s.step)
                return this.csimpleslice(s, ctx, obj, dataToStore);
            if (ctx !== AugStore)
                return this.cslice(s, ctx, obj, dataToStore);
        case Ellipsis:
        case ExtSlice:
            goog.asserts.fail("todo;");
            break;
        default:
            goog.asserts.fail("invalid subscript kind");
    }
    return this.chandlesubscr(kindname, ctx, obj, subs, dataToStore);
};

Compiler.prototype.chandlesubscr = function(kindname, ctx, obj, subs, data)
{
    if (ctx === Load || ctx === AugLoad)
        return this._gr('lsubscr', obj, '.mp$subscript(', subs, ')');
    else if (ctx === Store || ctx === AugStore)
        out(obj, '.__setitem__(', subs, ',', data, ');');
    else if (ctx === Del)
        out(obj, '.__delitem__(', subs, ');');
    else
        goog.asserts.fail("handlesubscr fail");
};

Compiler.prototype.cboolop = function(e)
{
    goog.asserts.assert(e instanceof BoolOp);
    var jtype;
    var ifFailed;
    if (e.op === And)
        jtype = this._jumpfalse;
    else
        jtype = this._jumptrue;
    var end = this.newBlock('end of boolop');
    var retval = this._gr('boolopsucc', e.op !== And);
    var s = e.values;
    var n = s.length;
    for (var i = 0; i < n; ++i)
    {
        jtype.call(this, this.vexpr(s[i]), end);
    }
    out(retval, "=", e.op === And, ";");
    this.setBlock(end);
    return retval;
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
    //this.annotateSource(e);
    switch (e.constructor)
    {
        case BoolOp:
            return this.cboolop(e);
        case BinOp:
            return this._gr('binop', "Sk.abstract.numberBinOp(", this.vexpr(e.left), ",", this.vexpr(e.right), ",'", e.op._astname, "')");
        case UnaryOp:
            goog.asserts.fail();
        case Lambda:
            return this.clambda(e);
        case IfExp:
            return this.cifexp(e);
        case Dict:
            return this.cdict(e);
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
            return this._gr('str', "new Sk.builtin.str(", e.s.__repr__().v, ")");
        case Attribute:
            if (e.ctx !== AugStore)
                var val = this.vexpr(e.value);
            switch (e.ctx)
            {
                case AugLoad:
                case Load:
                    return this._gr("lattr", val, ".tp$getattr(new Sk.builtin.str(", e.attr.__repr__().v, "))");
                case AugStore:
                case Store:
                    goog.asserts.fail("todo;");
                    break;
                case Del:
                    goog.asserts.fail("todo;");
                    break;
                case Param:
                default:
                    goog.asserts.fail("invalid attribute expression");
            }
            break;
        case Subscript:
            switch (e.ctx)
            {
                case AugLoad:
                case Load:
                case Store:
                case Del:
                    return this.vslice(e.slice, e.ctx, this.vexpr(e.value), data);
                case AugStore:
                    this.vslice(e.slice, e.ctx, data);
                    break;
                case Param:
                default:
                    goog.asserts.fail("invalid subscript expression");
            }
            break;
        case Name:
            return this.nameop(e.id, e.ctx, data);
        case List:
            return this.ctupleorlist(e, data, 'list');
        case Tuple:
            return this.ctupleorlist(e, data, 'tuple');
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
            var res = this._gr('inplbinop', "Sk.abstract.numberInplaceBinOp(", to, ",", val, ",'", s.op._astname, "')");
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
};

Compiler.prototype.pushBreakBlock = function(n)
{
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.breakBlocks.push(n);
};
Compiler.prototype.popBreakBlock = function()
{
    this.u.breakBlocks.pop();
};

Compiler.prototype.pushContinueBlock = function(n)
{
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.continueBlocks.push(n);
};
Compiler.prototype.popContinueBlock = function()
{
    this.u.continueBlocks.pop();
};

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

            ret += "goog.asserts.fail('unterminated block');";
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
        var next = this.newBlock('next branch of if');

        var test = this.vexpr(s.test);
        this._jumpfalse(this.vexpr(s.test), next);
        this.vseqstmt(s.body);
        this._jump(end);

        this.setBlock(next);
        if (s.orelse)
            this.vseqstmt(s.orelse);
        this._jump(end);
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
        this._jump(top);
        this.setBlock(top);

        var next = this.newBlock('after while');
        var orelse = s.orelse.length > 0 ? this.newBlock('while orelse') : null;
        var body = this.newBlock('while body');

        this._jumpfalse(this.vexpr(s.test), orelse ? orelse : next);
        this._jump(body);

        this.pushBreakBlock(next);
        this.pushContinueBlock(top);

        this.setBlock(body);
        this.vseqstmt(s.body);
        this._jump(top);

        this.popContinueBlock(top);
        this.popBreakBlock();

        if (s.orelse.length > 0)
        {
            this.setBlock(orelse);
            this.vseqstmt(s.orelse);
        }

        this.setBlock(next);
    }
};

Compiler.prototype.cfor = function(s)
{
    var start = this.newBlock('for start');
    var cleanup = this.newBlock('for cleanup');
    var end = this.newBlock('for end');

    this.pushBreakBlock(end);
    this.pushContinueBlock(start);

    // get the iterator
    var toiter = this.vexpr(s.iter);
    var iter = this._gr("iter", toiter, ".tp$iter()");
    this._jump(start);

    this.setBlock(start);

    // load targets
    var nexti = this._gr('next', iter, ".tp$iternext()");
    this._jumpundef(nexti, cleanup); // todo; this should be handled by StopIteration
    var target = this.vexpr(s.target, nexti);

    // execute body
    this.vseqstmt(s.body);
    
    // jump to top of loop
    this._jump(start);

    this.setBlock(cleanup);
    this.popContinueBlock();
    this.popBreakBlock();

    this.vseqstmt(s.orelse);
    this._jump(end);

    this.setBlock(end);
};

Compiler.prototype.cfunction = function(s)
{
    goog.asserts.assert(s instanceof FunctionDef);
    var args = s.args;
    var decos = s.decorator_list;
    var defaults = [];

    // decorators and defaults have to be evaluated out here
    //this.vseqexpr(decos);
    if (args.defaults)
    {
        defaults = this.vseqexpr(args.defaults);
    }

    var scopename = this.enterScope(s.name, s, s.lineno);

    // todo; probably need to have 'out' go to the prefix/suffix properly for this

    this.u.prefixCode = "var " + scopename + "=(function " + s.name.v + "__$outer($globals,"
        + (defaults.length > 0 ? "$defaults," : "")
        + "$rest){var $gbl=$globals;";
    if (defaults.length > 0)
    {
        this.u.prefixCode += "$rest = Array.prototype.slice.call($rest);"; // this is 'arguments' from outer
        this.u.prefixCode += "for (var $defi = 0; $defi < $defaults.length; ++$defi) { if ($rest[$defi] === undefined) $rest[$defi] = $defaults[$defi]; }";
    }
    this.u.prefixCode += "return(function " + s.name.v + "(";

    for (var i = 0; i < args.args.length; ++i)
    {
        this.u.prefixCode += this.nameop(args.args[i].id, Load);
        if (i !== args.args.length - 1)
            this.u.prefixCode += ",";
    }

    this.u.prefixCode += "){";
    var entryBlock = this.newBlock('function entry');
    this.u.prefixCode += "var $blk=" + entryBlock + ",$loc={};while(true){switch($blk){";
    this.u.suffixCode = "}break;}}).apply(null,$rest);});";

    this.vseqstmt(s.body);
    out("break;");

    this.exitScope();

    var wrapped = this._gr("wrapped", "(function ", s.name.v, "__$wrap(){return ", scopename,
            "($gbl,", (defaults.length > 0 ? "[" + defaults.join(',') + "]," : ""), "arguments);})");
    this.nameop(s.name, Store, wrapped);
};

Compiler.prototype.ccontinue = function(s)
{
    if (this.u.continueBlocks.length === 0)
        throw new SyntaxError("'continue' outside loop");
    // todo; continue out of exception blocks
    this._jump(this.u.continueBlocks[this.u.continueBlocks.length - 1]);
};

/**
 * compiles a statement
 */
Compiler.prototype.vstmt = function(s)
{
    this.u.lineno = s.lineno;
    this.u.linenoSet = false;

    this.annotateSource(s);

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
        case Expr:
            this.vexpr(s.value);
            break;
        case Pass:
            break;
        case Break_:
            if (this.u.breakBlocks.length === 0)
                throw new SyntaxError("'break' outside loop");
            this._jump(this.u.breakBlocks[this.u.breakBlocks.length - 1]);
            break;
        case Continue_:
            this.ccontinue(s);
            break;
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
    if ((ctx === Store || ctx === AugStore || ctx === Del) && name.__str__() === "__debug__")
        this.error("can not assign to __debug__");
    if ((ctx === Store || ctx === AugStore || ctx === Del) && name.__str__() === "None")
        this.error("can not assign to None");

    if (name.__str__() === "None") return "null";

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
    goog.asserts.assert(scope || name.v.charAt(1) === '_');

    switch (optype)
    {
        case OP_FAST:
            switch (ctx)
            {
                case Load:
                    return mangled;
                case Store:
                    out(mangled+ "=", dataToStore, ";");
                    break;
                default:
                    goog.asserts.fail("unhandled");
            }
            break;
        case OP_NAME:
            switch (ctx)
            {
                case Load:
                    var v = this.gensym('loadname');
                    out("var ", v, "=$loc.", mangled, "!==undefined?$loc.",mangled,":Sk.loadname('",mangled,"',$gbl);");
                    return v;
                case Store:
                    out("$loc.", mangled, "=", dataToStore, ";");
                    break;
                case Del:
                    out("delete $loc.", mangled, ";");
                    break;
                default:
                    goog.asserts.fail("unhandled");
            }
            break;
        case OP_GLOBAL:
            switch (ctx)
            {
                case Load:
                    return this._gr("loadgbl", "Sk.loadname('", mangled, "',$gbl)");
                case Store:
                    out("$gbl.", mangled, "=", dataToStore, ';');
                    break;
                case Del:
                    out("delete $gbl.", mangled);
                    break;
                default:
                    goog.asserts.fail("unhandled case in name op_global");
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
    out("break;");
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
        out('Sk.output(', /*dest, ',',*/ "new Sk.builtin.str(", this.vexpr(s.values[i]), ').v);');
    if (s.nl)
        out('Sk.output(', /*dest, ',*/ '"\\n");');
};

Compiler.prototype.cmod = function(mod)
{
    //print("-----");
    //print(Sk.astDump(mod));
    var modf = this.enterScope(new Sk.builtin.str("<module>"), mod, 0);

    var entryBlock = this.newBlock('module entry');
    this.u.prefixCode = "var " + modf + "=(function _module_(){var $blk=" + entryBlock + ",$gbl={},$loc=$gbl;while(true){switch($blk){";
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
    var c = new Compiler(filename, st, 0, source); // todo; CO_xxx
    c.cmod(ast);
    var ret = c.result.join('');
    return ret;
};

goog.exportSymbol("Sk.compile", Sk.compile);
