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

var ModuleBlock = 'module';
var FunctionBlock = 'function';
var ClassBlock = 'class';

/*
 *  
 */
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

/*
 *
 */
function SymbolTableScope(table, name, type, lineno)
{
    this.symFlags = {};
    this.name = name;
    this.varnames = [];
    this.children = [];
    this.blockType = type;

    this.isNested = false;
    this.hasFree = false;
    this.childHasFree = false;  // true if child block has free vars including free refs to globals
    this.generator = false;
    this.varargs = false;
    this.varkeywords = false;
    this.returnsValue = false;

    this.lineno = lineno;
    this.tmpname = 0;

    this.table = table;

    // cache of Symbols for returning to other parts of code
    this.symbols = {};
}
SymbolTableScope.prototype.get_type = function() { return this.blockType; };
SymbolTableScope.prototype.get_name = function() { return this.name; };
SymbolTableScope.prototype.get_lineno = function() { return this.lineno; };
SymbolTableScope.prototype.is_nested = function() { return this.isNested; };
SymbolTableScope.prototype.has_children = function() { return this.children.length > 0; };
SymbolTableScope.prototype.get_identifiers = function() { return this._identsMatching(function(x) { return true; }); };
SymbolTableScope.prototype.lookup = function(name)
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
SymbolTableScope.prototype.__check_children = function(name)
{
    //print("  check_children:", name);
    var ret = [];
    for (var i = 0; i < this.children.length; ++i)
    {
        var child = this.children[i];
        if (child.name === name)
            ret.push(child);
    }
    return ret;
};

SymbolTableScope.prototype._identsMatching = function(f)
{
    var ret = [];
    for (var k in this.symFlags)
    {
        if (this.symFlags.hasOwnProperty(k))
        {
            if (f(this.symFlags[k]))
                ret.push(k);
        }
    }
    ret.sort();
    return ret;
};
SymbolTableScope.prototype.get_parameters = function()
{
    goog.asserts.assert(this.get_type() == 'function', "get_parameters only valid for function scopes");
    if (!this._funcParams)
        this._funcParams = this._identsMatching(function(x) { return x & DEF_PARAM; });
    return this._funcParams;
};
SymbolTableScope.prototype.get_locals = function()
{
    goog.asserts.assert(this.get_type() == 'function', "get_locals only valid for function scopes");
    if (!this._funcLocals)
        this._funcLocals = this._identsMatching(function(x) { return x & DEF_BOUND; });
    return this._funcLocals;
};
SymbolTableScope.prototype.get_globals = function()
{
    goog.asserts.assert(this.get_type() == 'function', "get_globals only valid for function scopes");
    if (!this._funcGlobals)
    {
        this._funcGlobals = this._identsMatching(function(x) {
                var masked = (x >> SCOPE_OFF) & SCOPE_MASK;
                return masked == GLOBAL_IMPLICIT || masked == GLOBAL_EXPLICIT;
            });
    }
    return this._funcGlobals;
};
SymbolTableScope.prototype.get_frees = function()
{
    goog.asserts.assert(this.get_type() == 'function', "get_frees only valid for function scopes");
    if (!this._funcFrees)
    {
        this._funcFrees = this._identsMatching(function(x) {
                var masked = (x >> SCOPE_OFF) & SCOPE_MASK;
                return masked == FREE;
            });
    }
    return this._funcFrees;
};


/*
 *
 */
function SymbolTable(filename, mod_ast)
{
    this.filename = filename;
    this.cur = null;
    this.top = null;
    this.symbols = {};
    this.stack = [];
    this.global = null; // points at top level module symFlags
    this.curClass = null; // current class or null
    this.tmpname = 0;
}
SymbolTable.prototype.SEQStmt = function(nodes)
{
    goog.asserts.assert(goog.isArrayLike(nodes), "SEQ: nodes isn't array? got %s (%s)", nodes, nodes.constructor);
    goog.iter.forEach(goog.iter.toIterator(nodes), function(val) {
            if (val) this.visitStmt(val);
        }, this);
};
SymbolTable.prototype.SEQExpr = function(nodes)
{
    goog.asserts.assert(goog.isArrayLike(nodes), "SEQ: nodes isn't array? got %s (%s)", nodes, nodes.constructor);
    goog.iter.forEach(goog.iter.toIterator(nodes), function(val) {
            if (val) this.visitExpr(val);
        }, this);
};

SymbolTable.prototype.mangle = function(name)
{
    // todo;
    return name;
};

SymbolTable.prototype.enterBlock = function(name, blockType, ast, lineno)
{
    //print("enterBlock:", name);
    var prev = null;
    if (this.cur)
    {
        prev = this.cur;
        this.stack.push(this.cur);
    }
    this.cur = new SymbolTableScope(this, name, blockType, lineno);
    if (name === 'top')
    {
        //print("    setting global because it's top");
        this.global = this.cur.symFlags;
    }
    if (prev)
    {
        //print("    adding", this.cur.name, "to", prev.name);
        prev.children.push(this.cur);
    }
};

SymbolTable.prototype.exitBlock = function()
{
    //print("exitBlock");
    this.cur = null;
    if (this.stack.length > 0)
        this.cur = this.stack.pop();
};

SymbolTable.prototype.visitArguments = function(func)
{
    goog.asserts.assert(func instanceof Sk.Ast.Function_);
    // todo; this doesn't handle tuple destructuring args yet;
    // the ast/transform is wrong i think we just have argnames, but it
    // should really be nodes of either name or tuple
    goog.iter.forEach(goog.iter.toIterator(func.argnames), function(argname) {
                //print("visiting argument", argname);
                this.addDef(argname, DEF_PARAM);
            }, this);
    // todo; vararg?
    // todo; kwargs?
};

SymbolTable.prototype.addDef = function(name, flag)
{
    var mangled = this.mangle(name);
    var val = this.cur.symFlags[mangled];
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
    this.cur.symFlags[mangled] = val;
    if (flag & DEF_PARAM)
    {
        this.cur.varnames.push(mangled);
    }
    else if (flag & DEF_GLOBAL)
    {
        val = flag;
        var fromGlobal = this.global[mangled];
        if (fromGlobal !== undefined) val |= fromGlobal;
        this.global[mangled] = val;
    }
};

SymbolTable.prototype.visitStmt = function(stmt)
{
    goog.asserts.assert(stmt !== undefined, "visitStmt called with undefined");
    //print("  stmt: ", stmt.constructor.name);
    switch (stmt.constructor)
    {
        case Sk.Ast.Assign:
            this.SEQExpr(stmt.nodes);
            this.visitExpr(stmt.expr);
            break;
        case Sk.Ast.AugAssign:
            this.visitExpr(stmt.node);
            this.visitExpr(stmt.expr);
            break;
        case Sk.Ast.If_:
            var isBody = false;
            for (var i = 0; i < stmt.tests.length; ++i)
            {
                var tst = stmt.tests[i];
                if (isBody)
                    this.SEQStmt(tst.nodes);
                else
                    this.visitExpr(tst);
                isBody = !isBody;
            }
            if (stmt.else_)
                this.SEQStmt(stmt.else_.nodes);
            break;
        case Sk.Ast.While_:
            this.visitExpr(stmt.test);
            this.SEQStmt(stmt.body.nodes);
            if (stmt.else_) this.SEQStmt(stmt.else_.nodes);
            break;
        case Sk.Ast.For_:
            this.visitExpr(stmt.assign);
            this.visitExpr(stmt.list);
            this.SEQStmt(stmt.body.nodes);
            if (stmt.else_) this.SEQStmt(stmt.else_.nodes);
            break;
        case Sk.Ast.Print:
            if (stmt.dest) this.visitExpr(stmt.dest);
            this.SEQExpr(stmt.nodes);
            break;
        case Sk.Ast.Function_:
            this.addDef(stmt.name, DEF_LOCAL);
            //print("  func:", Sk.astDump(stmt));
            if (stmt.defaults) this.SEQExpr(stmt.defaults);
            if (stmt.decorators) this.SEQExpr(stmt.decorators);
            this.enterBlock(stmt.name, FunctionBlock, stmt, stmt.lineno);
            this.visitArguments(stmt);
            this.SEQStmt(stmt.code.nodes);
            this.exitBlock();
            break;
        case Sk.Ast.Return_:
            if (stmt.value)
            {
                this.visitExpr(stmt.value);
                this.cur.returnsValue = true;
                if (this.cur.isGenerator)
                {
                    throw new SyntaxError("'return' with argument inside generator");
                }
            }
            break;
        case Sk.Ast.Global:
            for (var i = 0; i < stmt.names.length; ++i)
            {
                var name = this.mangle(stmt.names[i]);
                var cur = this.cur.symFlags[name];
                if (cur & (DEF_LOCAL | USE))
                {
                    if (cur & DEF_LOCAL)
                        Sk.warn("name '" + name + "' is assigned to before global declaration");
                    else
                        Sk.warn("name '" + name + "' is used prior to global declaration");
                }
                this.addDef(name, DEF_GLOBAL);
            }
            break;
        case Sk.Ast.Pass:
        case Sk.Ast.Break_:
        case Sk.Ast.Continue_:
            // nothing to do
            break;
        case Sk.Ast.Discard:
            this.visitExpr(stmt.expr);
            break;
        default:
            goog.asserts.fail("Unhandled type " + stmt.constructor.name + " in visitStmt");
    }
};

SymbolTable.prototype.visitExpr = function(expr)
{
    goog.asserts.assert(expr !== undefined, "visitExpr called with undefined");
    //print("  expr: ", expr.constructor.name);
    switch (expr.constructor)
    {
        case Sk.Ast.Add:
        case Sk.Ast.Sub:
        case Sk.Ast.Mul:
        case Sk.Ast.Div:
        case Sk.Ast.Mod:
        case Sk.Ast.Power:
        case Sk.Ast.FloorDiv:
        case Sk.Ast.Bitor:
        case Sk.Ast.Bitxor:
        case Sk.Ast.Bitand:
            this.visitExpr(expr.left);
            this.visitExpr(expr.right);
            break;
        case Sk.Ast.Or:
        case Sk.Ast.And:
            this.SEQExpr(expr.nodes);
            break;
        case Sk.Ast.Not:
        case Sk.Ast.UnaryAdd:
        case Sk.Ast.UnarySub:
            this.visitExpr(expr.expr);
            break;
        case Sk.Ast.Const_:
            // nothing to do for number, string, etc.
            break;
        case Sk.Ast.Tuple:
        case Sk.Ast.List:
            this.SEQExpr(expr.nodes);
            break;
        case Sk.Ast.AssTuple:
            this.SEQExpr(expr.nodes);
            break;
        case Sk.Ast.AssName:
            this.addDef(expr.name, DEF_LOCAL);
            break;
        case Sk.Ast.Name:
            this.addDef(expr.name, USE);
            break;
        case Sk.Ast.Compare:
            this.visitExpr(expr.expr);
            for (var i = 1; i < expr.ops.length; i += 2) this.visitExpr(expr.ops[i]);
            break;
        case Sk.Ast.CallFunc:
            this.visitExpr(expr.node);
            this.SEQExpr(expr.args);
            // todo; keywords?
            if (expr.star_args)
                this.visitExpr(expr.star_args);
            if (expr.dstar_args)
                this.visitExpr(expr.dstar_args);
            break;
        case Sk.Ast.Dict:
            this.SEQExpr(expr.items);
            break;
        case Sk.Ast.Subscript:
            this.visitExpr(expr.expr);
            this.SEQExpr(expr.subs);
            break;
        case Sk.Ast.Getattr:
            this.visitExpr(expr.expr);
            break;
        case Sk.Ast.Sliceobj:
            this.SEQExpr(expr.nodes);
            break;
        case Sk.Ast.ListComp:
            this.addDef("_[" + (++this.tmpname) + "]", DEF_LOCAL);
            this.visitExpr(expr.expr);
            this.visitComprehension(expr.quals);
            break;
        default:
            goog.asserts.fail("Unhandled type " + expr.constructor.name + " in visitExpr");
    }
};

SymbolTable.prototype.visitComprehension = function(quals)
{
    var len = quals.length;
    for (var i = 0; i < len; ++i)
    {
        var qual = quals[i];
        switch (qual.constructor)
        {
            case Sk.Ast.ListCompFor:
                this.visitExpr(qual.assign);
                this.visitExpr(qual.list);
                this.SEQExpr(qual.ifs);
                break;
        }
    }
};

function _dictUpdate(a, b)
{
    for (var kb in b)
    {
        a[kb] = b[kb];
    }
}

SymbolTable.prototype.analyzeBlock = function(ste, bound, free, global)
{
    var local = {};
    var scope = {};
    var newglobal = {};
    var newbound = {};
    var newfree = {};

    if (ste.blockType == ClassBlock)
    {
        goog.asserts.fail("todo; ClassBlock in analyze");
    }

    for (var name in ste.symFlags)
    {
        var flags = ste.symFlags[name];
        this.analyzeName(ste, scope, name, flags, bound, local, free, global);
    }

    if (ste.blockType !== ClassBlock)
    {
        if (ste.blockType === FunctionBlock)
            _dictUpdate(newbound, local);
        if (bound)
            _dictUpdate(newbound, bound);
        _dictUpdate(newglobal, global);
    }

    var allfree = {};
    var childlen = ste.children.length;
    for (var i = 0; i < childlen; ++i)
    {
        var c = ste.children[i];
        this.analyzeChildBlock(c, newbound, newfree, newglobal, allfree);
        if (c.hasFree || c.childHasFree)
            ste.childHasFree = true;
    }

    _dictUpdate(newfree, allfree);
    if (ste.blockType === FunctionBlock) this.analyzeCells(scope, newfree);
    this.updateSymbols(ste.symFlags, scope, bound, newfree, ste.blockType === ClassBlock);

    _dictUpdate(free, newfree);
};

SymbolTable.prototype.analyzeChildBlock = function(entry, bound, free, global, childFree)
{
    var tempBound = {};
    _dictUpdate(tempBound, bound);
    var tempFree = {};
    _dictUpdate(tempFree, free);
    var tempGlobal = {};
    _dictUpdate(tempGlobal, global);

    this.analyzeBlock(entry, tempBound, tempFree, tempGlobal);
    _dictUpdate(childFree, tempFree);
};

SymbolTable.prototype.analyzeCells = function(scope, free)
{
    for (var name in scope)
    {
        var flags = scope[name];
        if (flags !== LOCAL) continue;
        if (free[name] === undefined) continue;
        scope[name] = CELL;
        delete free[name];
    }
};

/**
 * store scope info back into the st symbols dict. symbols is modified,
 * others are not.
 */
SymbolTable.prototype.updateSymbols = function(symbols, scope, bound, free, classflag)
{
    for (var name in symbols)
    {
        var flags = symbols[name];
        var w = scope[name];
        flags |= w << SCOPE_OFF;
        symbols[name] = flags;
    }

    var freeValue = FREE << SCOPE_OFF;
    var pos = 0;
    for (var name in free)
    {
        var o = symbols[name];
        if (o !== undefined)
        {
            // it could be a free variable in a method of the class that has
            // the same name as a local or global in the class scope
            if (classflag && (o & (DEF_BOUND | DEF_GLOBAL)))
            {
                var i = o | DEF_FREE_CLASS;
                symbols[name] = i;
            }
            // else it's not free, probably a cell
            continue;
        }
        if (bound[name] === undefined) continue;
        symbols[name] = freeValue;
    }
};

SymbolTable.prototype.analyzeName = function(ste, dict, name, flags, bound, local, free, global)
{
    if (flags & DEF_GLOBAL)
    {
        if (flags & DEF_PARAM) throw new Sk.builtin.SyntaxError("name '" + name + "' is local and global");
        dict[name] = GLOBAL_EXPLICIT;
        global[name] = null;
        if (bound && bound[name] !== undefined) delete bound[name];
        return;
    }
    if (flags & DEF_BOUND)
    {
        dict[name] = LOCAL;
        local[name] = null;
        delete global[name];
        return;
    }

    if (bound && bound[name] !== undefined)
    {
        dict[name] = FREE;
        ste.hasFree = true;
        free[name] = null;
    }
    else if (global && global[name] !== undefined)
    {
        dict[name] = GLOBAL_IMPLICIT;
    }
    else
    {
        if (ste.isNested)
            ste.hasFree = true;
        dict[name] = GLOBAL_IMPLICIT;
    }
};

SymbolTable.prototype.analyze = function()
{
    var free = {};
    var global = {};
    this.analyzeBlock(this.top, null, free, global);
};

Sk.symboltable = function(ast)
{
    var ret = new SymbolTable();

    ret.enterBlock('top', ModuleBlock, ast, [[0,0],[0,0]]);
    ret.top = ret.cur;

    goog.iter.forEach(goog.iter.toIterator(ast.node.nodes), function(val) {
        ret.visitStmt(val);
    });

    ret.exitBlock();

    ret.analyze();

    return ret.top;
};

Sk.dumpSymtab = function(st)
{
    var pyBoolStr = function(b) { return b ? "True" : "False"; }
    var pyList = function(l) {
        var ret = [];
        for (var i = 0; i < l.length; ++i)
        {
            ret.push(Sk.uneval(l[i]).replace(/"/g, "'")); // todo; quote hacking
        }
        return '[' + ret.join(', ') + ']';
    };
    var getIdents = function(obj, indent)
    {
        if (indent === undefined) indent = "";
        var ret = "";
        ret += indent + "Sym_type: " + obj.get_type() + "\n";
        ret += indent + "Sym_name: " + obj.get_name() + "\n";
        ret += indent + "Sym_lineno: " + obj.get_lineno()[0][0] + "\n"; // [0] == our line is [[startrow,startcol],[endrow,endcol],text] rather than just lineno
        ret += indent + "Sym_nested: " + pyBoolStr(obj.is_nested()) + "\n";
        ret += indent + "Sym_haschildren: " + pyBoolStr(obj.has_children()) + "\n";
        if (obj.get_type() === "class")
        {
            ret += indent + "Class_methods: " + obj.get_methods() + "\n";
        }
        else if (obj.get_type() === "function")
        {
            ret += indent + "Func_params: " + pyList(obj.get_parameters()) + "\n";
            ret += indent + "Func_locals: " + pyList(obj.get_locals()) + "\n";
            ret += indent + "Func_globals: " + pyList(obj.get_globals()) + "\n";
            ret += indent + "Func_frees: " + pyList(obj.get_frees()) + "\n";
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
            var sub = [];
            for (var j = 0; j < nsslen; ++j)
            {
                var ns = nss[j];
                sub.push(getIdents(ns, indent + "    "));
            }
            ret += sub.join('\n');
            ret += indent + "  ]\n";
        }
        return ret;
    }
    return getIdents(st);
};

goog.exportSymbol("Sk.symboltable", Sk.symboltable);
goog.exportSymbol("Sk.dumpSymtab", Sk.dumpSymtab);

}());
