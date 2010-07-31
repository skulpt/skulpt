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

Sk.buildSymtab = function(ast)
{
};

Sk.dumpSymtab = function(st)
{
};

goog.exportSymbol("Sk.buildSymtab", Sk.buildSymtab);
goog.exportSymbol("Sk.dumpSymtab", Sk.dumpSymtab);

}());
