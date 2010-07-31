(function() {

/* Flags for def-use information */

var DEF_GLOBAL = 1;           /* global stmt */
var DEF_LOCAL = 2;            /* assignment in code block */
var DEF_PARAM = 2<<1;         /* formal parameter */
var USE = 2<<2;               /* name is used */
var DEF_STAR = 2<<3;          /* parameter is star arg */
var DEF_DOUBLESTAR = 2<<4;    /* parameter is star-star arg */
var DEF_INTUPLE = 2<<5;       /* name defined in tuple in parameters */
var DEF_FREE = 2<<6;          /* name used but not defined in nested block */
var DEF_FREE_GLOBAL = 2<<7;   /* free variable is actually implicit global */
var DEF_FREE_CLASS = 2<<8;    /* free variable from class's method */
var DEF_IMPORT = 2<<9;        /* assignment occurred via import */

var DEF_BOUND = (DEF_LOCAL | DEF_PARAM | DEF_IMPORT);

/* GLOBAL_EXPLICIT and GLOBAL_IMPLICIT are used internally by the symbol
   table.  GLOBAL is returned from PyST_GetScope() for either of them. 
   It is stored in ste_symbols at bits 12-14.
*/
var SCOPE_OFF = 11;
var SCOPE_MASK = 7;

var LOCAL = 1;
var GLOBAL_EXPLICIT = 2;
var GLOBAL_IMPLICIT = 3;
var FREE = 4;
var CELL = 5;

/* The following three names are used for the ste_unoptimized bit field */
var OPT_IMPORT_STAR = 1;
var OPT_EXEC = 2;
var OPT_BARE_EXEC = 4;
var OPT_TOPLEVEL = 8;  /* top-level names, including eval and exec */

var GENERATOR = 2;
var GENERATOR_EXPRESSION = 2;

function Symbol(name, flags, namespaces)
{
    this.__name = name;
    this.__flags = flags;
    this.__scope = (flags >> SCOPE_OFF) & SCOPE_MASK;
    this.__namespaces = namespaces || [];
};
Symbol.prototype.get_name = function() { return this.__name; }
Symbol.prototype.is_referenced = function() { return !!(this.__flags & USE); }
Symbol.prototype.is_parameter = function() { return !!(this.__flags & DEF_PARAM); }
Symbol.prototype.is_global = function() { return this.__scope === GLOBAL_IMPLICIT || this.__scope == GLOBAL_EXPLICIT; }
Symbol.prototype.is_declared_global = function() { return this.__scope == GLOBAL_EXPLICIT; }
Symbol.prototype.is_local = function() { return !!(this.__flags & DEF_BOUND); }
Symbol.prototype.is_free = function() { return this.__scope == FREE; }
Symbol.prototype.is_imported = function() { return !!(this.__flags & DEF_IMPORT); }
Symbol.prototype.is_assigned = function() { return !!(this.__flags & DEF_LOCAL); }
Symbol.prototype.is_namespace = function() { return this.__namespaces && this.__namespaces.length > 0; }
Symbol.prototype.get_namespaces = function() { return this.__namespaces; }

function SymbolTable()
{
    this.type = 'module'; // or class or function
    this.name = 'top';
    this.lineno = 0;
    this.isNested = false;
    this.hasChildren = false;
    this.symbols = {};
    this.symFlags = {};
    this.module = null; // points at top level Module
}
SymbolTable.prototype.get_type = function() { return this.type; };
SymbolTable.prototype.get_name = function() { return this.name; };
SymbolTable.prototype.get_lineno = function() { return this.lineno; };
SymbolTable.prototype.is_nested = function() { return this.isNested; };
SymbolTable.prototype.has_children = function() { return this.hasChildren; };

SymbolTable.prototype.get_identifiers = function()
{
    var ret = [];
    for (var k in this.symFlags)
    {
        if (this.symFlags.hasOwnProperty(k))
        {
            ret.push(k);
        }
    }
    return ret;
};
SymbolTable.prototype.lookup = function(name)
{
    var sym = this.symbols[name];
    if (sym === undefined)
    {
        var flags = this.symFlags[name];
        var namespaces = this.__check_children(name);
        sym = this.symbols[name] = new Symbol(name, flags, namespaces);
    }
    return sym;
};

SymbolTable.prototype.__check_children = function(name)
{
    return null;
};

function SEQ(nodes, f, th) { goog.iter.forEach(goog.iter.toIterator(nodes), f, th); }

SymbolTable.prototype.mangle = function(name)
{
    // todo;
    return name;
};

SymbolTable.prototype.addDef = function(name, flag)
{
    var mangled = this.mangle(name);
    var val = this.symFlags[mangled];
    if (val !== undefined)
    {
        if ((flag & DEF_PARAM) && (val & DEF_PARAM))
        {
            throw new Sk.builtin.SyntaxError("duplicate argument '" + name + "' in function definition");
        }
        val |= flag;
    }
    else
    {
        val = flag;
    }
    this.symFlags[mangled] = val;
    if (flag & DEF_PARAM)
    {
        this.varnames.push(mangled);
    }
    else if (flag & DEF_GLOBAL)
    {
        val = flag;
        var fromGlobal = this.module[mangled];
        if (fromGlobal !== undefined) val |= fromGlobal;
        this.module[val];
    }
};

SymbolTable.prototype.visitStmt = function(stmt)
{
    if (stmt instanceof Sk.Ast.Assign)
    {
        SEQ(stmt.nodes, this.visitExpr, this);
        this.visitExpr(stmt.expr);
    }
    else if (stmt instanceof Sk.Ast.Print)
    {
        if (stmt.dest) this.visitExpr(stmt.dest);
        SEQ(stmt.nodes, this.visitExpr, this);
    }
    else
    {
        throw "Unhandled type " + stmt.constructor.name + " in visitStmt";
    }
};

SymbolTable.prototype.visitExpr = function(expr)
{
    if (expr instanceof Sk.Ast.AssName)
    {
        this.addDef(expr.name, DEF_LOCAL);
    }
    else if (expr instanceof Sk.Ast.Name)
    {
        this.addDef(expr.name, USE);
    }
    else if (expr instanceof Sk.Ast.Const_)
    {
        // nothing to do for number, string, etc.
    }
    else
    {
        throw "Unhandled type " + expr.constructor.name + " in visitExpr";
    }
};

Sk.symboltable = function(ast)
{
    var ret = new SymbolTable();
    //ret.symbols['a'] = new Symbol('a', DEF_LOCAL | USE); // XXX
    goog.iter.forEach(goog.iter.toIterator(ast.node.nodes), function(val) {
        ret.visitStmt(val);
    });
    return ret;
};

Sk.dumpSymtab = function(st)
{
    var pyBoolStr = function(b) { return b ? "True" : "False"; }
    var getIdents = function(obj, indent)
    {
        if (indent === undefined) indent = "";
        var ret = "";
        ret += indent + "Sym_type: " + obj.get_type() + "\n";
        ret += indent + "Sym_name: " + obj.get_name() + "\n";
        ret += indent + "Sym_lineno: " + obj.get_lineno() + "\n";
        ret += indent + "Sym_nested: " + pyBoolStr(obj.is_nested()) + "\n";
        ret += indent + "Sym_haschildren: " + pyBoolStr(obj.has_children()) + "\n";
        if (obj.get_type() === "class")
        {
        }
        else if (obj.get_type() === "function")
        {
        }
        ret += indent + "-- Identifiers --\n";
        var objidents = obj.get_identifiers();
        var objidentslen = objidents.length;
        for (var i = 0; i < objidentslen; ++i)
        {
            var info = obj.lookup(objidents[i]);
            ret += indent + "name: " + info.get_name() + "\n";
            ret += indent + "  is_referenced: " + pyBoolStr(info.is_referenced()) + "\n";
            ret += indent + "  is_imported: " + pyBoolStr(info.is_imported()) + "\n";
            ret += indent + "  is_parameter: " + pyBoolStr(info.is_parameter()) + "\n";
            ret += indent + "  is_global: " + pyBoolStr(info.is_global()) + "\n";
            ret += indent + "  is_declared_global: " + pyBoolStr(info.is_declared_global()) + "\n";
            ret += indent + "  is_local: " + pyBoolStr(info.is_local()) + "\n";
            ret += indent + "  is_free: " + pyBoolStr(info.is_free()) + "\n";
            ret += indent + "  is_assigned: " + pyBoolStr(info.is_assigned()) + "\n";
            ret += indent + "  is_namespace: " + pyBoolStr(info.is_namespace()) + "\n";
            var nss = info.get_namespaces();
            var nsslen = nss.length;
            ret += indent + "  namespaces: [\n";
            for (var j = 0; j < nsslen; ++j)
            {
            }
            ret += indent + "  ]\n";
        }
        return ret;
    }
    return getIdents(st);
};

goog.exportSymbol("Sk.buildSymtab", Sk.buildSymtab);
goog.exportSymbol("Sk.dumpSymtab", Sk.dumpSymtab);

}());
