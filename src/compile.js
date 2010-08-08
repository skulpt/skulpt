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
    var resultarr = this.result;
    out = function() {
        for (var i = 0; i < arguments.length; ++i)
            resultarr.push(arguments[i]);
    };

    this.gensymcount = 0;
}

/**
 *
 * @constructor
 *
 * stuff that changes on entry/exit of code blocks. must be saved and restored
 * when returning to a block.
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
}

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
        case BinOp:
            return this._gr('binop', "Sk.binop(", this.vexpr(e.left), ",", this.vexpr(e.right), ",'", e.op._astname, "')");
        case Str:
            return e.s.__repr__().v;
        case Num:
            return e.n;
        case Name:
            return this.nameop(e.id, e.ctx, data);
        case Tuple:
            return this.ctuple(e, data);
        default:
            goog.asserts.fail("unhandled case in vexpr");
    }
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
        default:
            goog.asserts.fail("unhandled case in vstmt");
    }
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

    goog.asserts.assert(scope || name.charAt(0) === '_');

    switch (optype)
    {
        case OP_NAME:
            switch (ctx)
            {
                case Load:
                    var v = this.gensym('load');
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
    this.u = u;
    this.nestlevel++;

    out("(function(){var $loc={};");
};

Compiler.prototype.exitScope = function()
{
    out("}());");
    this.nestlevel--;
    if (this.stack.length - 1 >= 0)
        this.u = this.stack.pop();
    else
        this.u = null;
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
    this.enterScope(new Sk.builtin.str("<module>"), mod, 0);
    switch (mod.constructor)
    {
        case Module:
            this.cbody(mod.body);
            break;
        default:
            goog.asserts.fail("todo; unhandled case in compilerMod");
    }
    this.exitScope();
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
