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
    this.argcount = null;
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

/**
 *
 * compiles an expression. to 'return' something, it'll gensym a var and store
 * into that var so that the calling code doesn't have avoid just paste the
 * returned name.
 */
Compiler.prototype.vexpr = function(e)
{
    if (e.lineno > this.u.lineno)
    {
        this.u.lineno = e.lineno;
        this.u.linenoSet = false;
    }
    switch (e.constructor)
    {
        case Str:
            var v = this.gensym('str');
            out('var ', v, '=', e.s.__repr__().v, ';'); 
            return v;
        default:
            goog.asserts.fail("unhandled case in vexpr");
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
        case FunctionDef: this.cfunction(s); break;
        case ClassDef: this.cclass(s); break;
        case Print: this.cprint(s); break;
        default:
            goog.asserts.fail("unhandled case in vstmt");
    }
}

Compiler.prototype.enterScope = function(name, key, lineno)
{
    // todo; many things
    this.u = new CompilerUnit();
};

Compiler.prototype.exitScope = function()
{
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
    print(Sk.astDump(mod));
    this.enterScope(new Sk.builtin.str("<module>"), mod, 0);
    out("(function(){");
    switch (mod.constructor)
    {
        case Module:
            this.cbody(mod.body);
            break;
        default:
            goog.asserts.fail("todo; unhandled case in compilerMod");
    }
    out("}());");
    this.exitScope();
};

/**
 * @param {string} source the code
 * @param {string} filename where it came from
 * @param {string} mode one of 'exec', 'eval', or 'single'
 */
Sk.compile = function(source, filename, mode)
{
    var cst = Sk.parse(filename, source);
    var ast = Sk.astFromParse(cst, filename);
    var st = Sk.symboltable(ast);
    var c = new Compiler(filename, st, 0); // todo; CO_xxx
    c.cmod(ast);
    var ret = c.result.join('');
    return ret;
};

goog.exportSymbol("Sk.compile", Sk.compile);
