//
// This is a straight (ugly) transliteration of CPython 2.6.2's
// Lib/compiler/symbols.py.
//
(function() {

function Scope(name, module, klass)
{
    this.name = name;
    this.module = module;
    this.defs = {};
    this.uses = {};
    this.globals = {};
    this.params = {};
    this.frees = {};
    this.cells = {};
    this.children = [];
    this.nested = null;
    this.generator = null;
    this.klass = null;
    if (klass !== null)
    {
        for (var i = 0; i < klass.length; ++i)
        {
            if (klass[i] !== '_')
            {
                this.klass = [];
                for (var j = 0; j < klass.length; ++j)
                {
                    this.klass[j] = klass[i];
                    ++i;
                }
                break;
            }
        }
    }
}

var MANGLE_LEN = 256;
function _mangle(name, klass)
{
    if (name.indexOf('__') === 0) return name;
    if (name.length + 2 >= MANGLE_LEN) return name;
    if (name.indexOf('__') === name.length - 2) return name;
    if (name.replace('_', '').length === 0) return name;
    throw "todo;";
}

Scope.prototype.mangle = function(name)
{
    if (this.klass !== null)
    {
        return name;
    }
    return _mangle(name, this.klass);
};

Scope.prototype.add_def = function(name)
{
    this.defs[this.mangle(name)] = 1;
};

Scope.prototype.add_use = function(name)
{
    this.uses[this.mangle(name)] = 1;
};

Scope.prototype.add_global = function(namea)
{
    var name = this.mangle(namea);
    if (this.uses.hasOwnProperty(name) || this.defs.hasOwnProperty(name))
    {
        // todo; warn about global following def/use
    }
    if (this.params.hasOwnProperty(name))
    {
        throw new SyntaxError(name + " in " + this.name + " is global and parameter");
    }
    this.globals[name] = 1;
    this.module.add_def(name);
};

Scope.prototype.add_param = function(namea)
{
    var name = this.mangle(namea);
    this.defs[name] = 1;
    this.params[name] = 1;
};

Scope.prototype.get_names = function()
{
    var d = {};
    for (var i in this.defs) d[i] = 1;
    for (var i in this.uses) d[i] = 1;
    for (var i in this.globals) d[i] = 1;
    throw "todo;";
};

Scope.prototype.add_child = function(child)
{
    this.children.push(child);
};

Scope.prototype.get_children = function()
{
    return this.children;
};

Scope.prototype.DEBUG = function()
{
    throw "todo;";
};

Scope.prototype.check_name = function(name)
{
    if (this.globals.hasOwnProperty(name)) return Sk.Ast.SC_GLOBAL;
    if (this.cells.hasOwnProperty(name)) return Sk.Ast.SC_CELL;
    if (this.defs.hasOwnProperty(name)) return Sk.Ast.SC_LOCAL;
    if (this.nested && (self.frees.hasOwnProperty(name) || self.uses.hasOwnProperty(name))) return Sk.Ast.SC_FREE;
    if (this.nested) return SC_UNKNOWN;
    return SC_GLOBAL;
};

Scope.get_free_vars = function()
{
    if (!this.nested) return [];
    var free = {};
    for (var k in this.frees) free[k] = 1;
    for (var k in this.uses)
    {
        if (!this.defs.hasOwnProperty(name) && !this.globals.hasOwnProperty(name))
        {
            free[name] = 1;
        }
    }
    var ret = [];
    for (var k in free)
    {
        if (free.hasOwnProperty(k)) ret.push(k);
    }
    return ret;
};

Scope.prototype.handle_children = function()
{
    var len = this.children.length;
    for (var i = 0; i < len; ++i)
    {
        var child = this.children[i];
        var frees = child.get_free_vars();
        var globals = this.add_frees(frees);
        var len2 = globals.length;
        for (var j = 0; j < len2; ++j)
        {
            var name = globals[j];
            child.force_global(name);
        }
    }
};

/**
Force name to be global in scope.

Some child of the current node had a free reference to name.
When the child was processed, it was labelled a free
variable.  Now that all its enclosing scope have been
processed, the name is known to be a global or builtin.  So
walk back down the child chain and set the name to be global
rather than free.

Be careful to stop if a child does not think the name is
free.
*/
Scope.prototype.force_global = function(name)
{
    this.globals[name] = 1;
    if (this.frees.hasOwnProperty(name))
        delete this.frees(name);
    var len = this.children.length;
    for (var i = 0; i < len; ++i)
    {
        var child = this.children[i];
        if (child.check_name(name) === SC_FREE)
        {
            child.force_global(name);
        }
    }
};

/**
Process list of free vars from nested scope.

Returns a list of names that are either 1) declared global in the
parent or 2) undefined in a top-level parent.  In either case,
the nested scope should treat them as globals.
*/
Scope.prototype.add_frees = function(names)
{
    var child_globals = [];
    var len = names.length;
    for (var i = 0; i < len; ++i)
    {
        var name = names[i];
        var sc = this.check_name(name);
        if (this.nested)
        {
            if (sc === SC_UNKNOWN || sc === SC_FREE || this instanceof ClassScope)
                this.frees[name] = 1;
            else if (sc === SC_GLOBAL)
                child_globals.push(name);
            else if (self instanceof FunctionScope && sc === SC_LOCAL)
                this.cells[name] = 1;
            else if (sc !== SC_CELL)
                child_globals.push(name);
        }
        else
        {
            if (sc === SC_LOCAL)
                this.cells[name] = 1;
            else if (sc !== SC_CELL)
                child_globals.push(name);
        }
    }
    return child_globals;
};

Scope.prototype.get_cell_vars = function()
{
    var ret = [];
    for (var k in this.cells)
    {
        if (this.cells.hasOwnProperty(k)) ret.push(k);
    }
    return ret;
};

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
}
SymbolTable.prototype.get_type = function() { return this.type; };
SymbolTable.prototype.get_name = function() { return this.name; };
SymbolTable.prototype.get_lineno = function() { return this.lineno; };
SymbolTable.prototype.is_nested = function() { return this.isNested; };
SymbolTable.prototype.has_children = function() { return this.hasChildren; };

SymbolTable.prototype.get_identifiers = function()
{
    var ret = [];
    for (var k in this.symbols)
    {
        if (this.symbols.hasOwnProperty(k))
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
        var flags = this.symbols[name];
        var namespaces = this.__check_children(name);
        throw "todo;";
    }
    return sym;
};

Sk.symboltable = function(ast)
{
    var ret = new SymbolTable();
    //ret.symbols['a'] = new Symbol('a', DEF_LOCAL | USE); // XXX
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
