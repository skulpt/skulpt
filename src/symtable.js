/* Flags for def-use information */

var DEF_GLOBAL = 1;
/* global stmt */
var DEF_LOCAL = 2;
/* assignment in code block */
var DEF_PARAM = 2 << 1;
/* formal parameter */
var USE = 2 << 2;
/* name is used */
var DEF_STAR = 2 << 3;
/* parameter is star arg */
var DEF_DOUBLESTAR = 2 << 4;
/* parameter is star-star arg */
var DEF_INTUPLE = 2 << 5;
/* name defined in tuple in parameters */
var DEF_FREE = 2 << 6;
/* name used but not defined in nested block */
var DEF_FREE_GLOBAL = 2 << 7;
/* free variable is actually implicit global */
var DEF_FREE_CLASS = 2 << 8;
/* free variable from class's method */
var DEF_IMPORT = 2 << 9;
/* assignment occurred via import */
var DEF_NONLOCAL = 2 << 10;
/* nonlocal stmt */
var DEF_ANNOT = 2 << 11;
/* this name is annotated */

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
var OPT_TOPLEVEL = 8;
/* top-level names, including eval and exec */

var GENERATOR = 2;
var GENERATOR_EXPRESSION = 2;

var ModuleBlock = "module";
var FunctionBlock = "function";
var ClassBlock = "class";

var SYMTAB_CONSTS = {
    DEF_GLOBAL: DEF_GLOBAL,
    DEF_LOCAL: DEF_LOCAL,
    DEF_PARAM: DEF_PARAM,
    USE: USE,
    DEF_STAR: DEF_STAR,
    DEF_DOUBLESTAR: DEF_DOUBLESTAR,
    DEF_INTUPLE: DEF_INTUPLE,
    DEF_FREE: DEF_FREE,
    DEF_FREE_GLOBAL: DEF_FREE_GLOBAL,
    DEF_FREE_CLASS: DEF_FREE_CLASS,
    DEF_IMPORT: DEF_IMPORT,
    DEF_BOUND: DEF_BOUND,
    SCOPE_OFF: SCOPE_OFF,
    SCOPE_MASK: SCOPE_MASK,
    LOCAL: LOCAL,
    GLOBAL_EXPLICIT: GLOBAL_EXPLICIT,
    GLOBAL_IMPLICIT: GLOBAL_IMPLICIT,
    FREE: FREE,
    CELL: CELL,
    OPT_IMPORT_STAR: OPT_IMPORT_STAR,
    OPT_EXEC: OPT_EXEC,
    OPT_BARE_EXEC: OPT_BARE_EXEC,
    OPT_TOPLEVEL: OPT_TOPLEVEL,
    GENERATOR: GENERATOR,
    GENERATOR_EXPRESSION: GENERATOR_EXPRESSION,
    ModuleBlock: ModuleBlock,
    FunctionBlock: FunctionBlock,
    ClassBlock: ClassBlock
};

Sk.exportSymbol("Sk.SYMTAB_CONSTS", SYMTAB_CONSTS);

/**
 * @constructor
 * @param {string} name
 * @param {number} flags
 * @param {Array.<SymbolTableScope>} namespaces
 */
function Symbol_ (name, flags, namespaces) {
    this.__name = name;
    this.__flags = flags;
    this.__scope = (flags >> SCOPE_OFF) & SCOPE_MASK;
    this.__namespaces = namespaces || [];
}
Symbol_.prototype.get_name = function () {
    return this.__name;
};
Symbol_.prototype.is_referenced = function () {
    return !!(this.__flags & USE);
};
Symbol_.prototype.is_parameter = function () {
    return !!(this.__flags & DEF_PARAM);
};
Symbol_.prototype.is_global = function () {
    return this.__scope === GLOBAL_IMPLICIT || this.__scope == GLOBAL_EXPLICIT;
};
Symbol_.prototype.is_declared_global = function () {
    return this.__scope == GLOBAL_EXPLICIT;
};
Symbol_.prototype.is_local = function () {
    return !!(this.__flags & DEF_BOUND);
};
Symbol_.prototype.is_free = function () {
    return this.__scope == FREE;
};
Symbol_.prototype.is_imported = function () {
    return !!(this.__flags & DEF_IMPORT);
};
Symbol_.prototype.is_assigned = function () {
    return !!(this.__flags & DEF_LOCAL);
};
Symbol_.prototype.is_namespace = function () {
    return this.__namespaces && this.__namespaces.length > 0;
};
Symbol_.prototype.get_namespaces = function () {
    return this.__namespaces;
};

var astScopeCounter = 0;

/**
 * @constructor
 * @param {SymbolTable} table
 * @param {string} name
 * @param {string} type
 * @param {number} lineno
 */
function SymbolTableScope (table, name, type, ast, lineno) {
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

    this.table = table;

    if (table.cur && (table.cur.nested || table.cur.blockType === FunctionBlock)) {
        this.isNested = true;
    }

    ast.scopeId = astScopeCounter++;
    table.stss[ast.scopeId] = this;

    // cache of Symbols for returning to other parts of code
    this.symbols = {};
}
SymbolTableScope.prototype.get_type = function () {
    return this.blockType;
};
SymbolTableScope.prototype.get_name = function () {
    return this.name;
};
SymbolTableScope.prototype.get_lineno = function () {
    return this.lineno;
};
SymbolTableScope.prototype.is_nested = function () {
    return this.isNested;
};
SymbolTableScope.prototype.has_children = function () {
    return this.children.length > 0;
};
SymbolTableScope.prototype.get_identifiers = function () {
    return this._identsMatching(function () {
        return true;
    });
};
SymbolTableScope.prototype.lookup = function (name) {
    var namespaces;
    var flags;
    var sym;
    if (!this.symbols.hasOwnProperty(name)) {
        flags = this.symFlags[name];
        namespaces = this.__check_children(name);
        sym = this.symbols[name] = new Symbol_(name, flags, namespaces);
    }
    else {
        sym = this.symbols[name];
    }
    return sym;
};
SymbolTableScope.prototype.__check_children = function (name) {
    //print("  check_children:", name);
    var child;
    var i;
    var ret = [];
    for (i = 0; i < this.children.length; ++i) {
        child = this.children[i];
        if (child.name === name) {
            ret.push(child);
        }
    }
    return ret;
};

SymbolTableScope.prototype._identsMatching = function (f) {
    var k;
    var ret = [];
    for (k in this.symFlags) {
        if (this.symFlags.hasOwnProperty(k)) {
            if (f(this.symFlags[k])) {
                ret.push(k);
            }
        }
    }
    ret.sort();
    return ret;
};
SymbolTableScope.prototype.get_parameters = function () {
    Sk.asserts.assert(() => this.get_type() == "function", "get_parameters only valid for function scopes");
    if (!this._funcParams) {
        this._funcParams = this._identsMatching(function (x) {
            return x & DEF_PARAM;
        });
    }
    return this._funcParams;
};
SymbolTableScope.prototype.get_locals = function () {
    Sk.asserts.assert(() => this.get_type() == "function", "get_locals only valid for function scopes");
    if (!this._funcLocals) {
        this._funcLocals = this._identsMatching(function (x) {
            return x & DEF_BOUND;
        });
    }
    return this._funcLocals;
};
SymbolTableScope.prototype.get_globals = function () {
    Sk.asserts.assert(() => this.get_type() == "function", "get_globals only valid for function scopes");
    if (!this._funcGlobals) {
        this._funcGlobals = this._identsMatching(function (x) {
            var masked = (x >> SCOPE_OFF) & SCOPE_MASK;
            return masked == GLOBAL_IMPLICIT || masked == GLOBAL_EXPLICIT;
        });
    }
    return this._funcGlobals;
};
SymbolTableScope.prototype.get_frees = function () {
    Sk.asserts.assert(() => this.get_type() == "function", "get_frees only valid for function scopes");
    if (!this._funcFrees) {
        this._funcFrees = this._identsMatching(function (x) {
            var masked = (x >> SCOPE_OFF) & SCOPE_MASK;
            return masked == FREE;
        });
    }
    return this._funcFrees;
};
SymbolTableScope.prototype.get_methods = function () {
    var i;
    var all;
    Sk.asserts.assert(() => this.get_type() == "class", "get_methods only valid for class scopes");
    if (!this._classMethods) {
        // todo; uniq?
        all = [];
        for (i = 0; i < this.children.length; ++i) {
            all.push(this.children[i].name);
        }
        all.sort();
        this._classMethods = all;
    }
    return this._classMethods;
};
SymbolTableScope.prototype.getScope = function (name) {
    //print("getScope");
    //for (var k in this.symFlags) print(k);
    var v = this.symFlags[name];
    if (v === undefined) {
        return 0;
    }
    return (v >> SCOPE_OFF) & SCOPE_MASK;
};

/**
 * @constructor
 * @param {string} filename
 */
function SymbolTable (filename) {
    this.filename = filename;
    this.cur = null;
    this.top = null;
    this.stack = [];
    this.global = null; // points at top level module symFlags
    this.curClass = null; // current class or null
    this.tmpname = 0;

    // mapping from ast nodes to their scope if they have one. we add an
    // id to the ast node when a scope is created for it, and store it in
    // here for the compiler to lookup later.
    this.stss = {};
}
SymbolTable.prototype.getStsForAst = function (ast) {
    var v;
    Sk.asserts.assert(() => ast.scopeId !== undefined, "ast wasn't added to st?");
    v = this.stss[ast.scopeId];
    Sk.asserts.assert(() => v !== undefined, "unknown sym tab entry");
    return v;
};

SymbolTable.prototype.SEQStmt = function (nodes) {
    var val;
    var i;
    var len;
    if (nodes !== null) {
        Sk.asserts.assert(() => Sk.isArrayLike(nodes), "SEQ: nodes isn't array? got " + nodes.toString());
        len = nodes.length;
        for (i = 0; i < len; ++i) {
            val = nodes[i];
            if (val) {
                this.visitStmt(val);
            }
        }
    }
};

SymbolTable.prototype.SEQExpr = function (nodes) {
    var val;
    var i;
    var len;
    if (nodes !== null) {
        Sk.asserts.assert(() => Sk.isArrayLike(nodes), "SEQ: nodes isn't array? got " + nodes.toString());
        len = nodes.length;
        for (i = 0; i < len; ++i) {
            val = nodes[i];
            if (val) {
                this.visitExpr(val);
            }
        }
    }
};

SymbolTable.prototype.enterBlock = function (name, blockType, ast, lineno) {
    var prev;
    name = Sk.fixReserved(name);
    //print("enterBlock:", name);
    prev = null;
    if (this.cur) {
        prev = this.cur;
        this.stack.push(this.cur);
    }
    this.cur = new SymbolTableScope(this, name, blockType, ast, lineno);
    if (name === "top") {
        this.global = this.cur.symFlags;
    }
    if (prev) {
        //print("    adding", this.cur.name, "to", prev.name);
        prev.children.push(this.cur);
    }
};

SymbolTable.prototype.exitBlock = function () {
    //print("exitBlock");
    this.cur = null;
    if (this.stack.length > 0) {
        this.cur = this.stack.pop();
    }
};

SymbolTable.prototype.visitParams = function (args, toplevel) {
    var arg;
    var i;
    for (i = 0; i < args.length; ++i) {
        arg = args[i];
        if (arg.constructor === Sk.astnodes.arg) {
            // TODO arguments are more complicated in Python 3...
            this.addDef(arg.arg, DEF_PARAM, arg.lineno);
        }
        else {
            // Tuple isn't supported
            throw new Sk.builtin.SyntaxError("invalid expression in parameter list", this.filename);
        }
    }
};

SymbolTable.prototype.visitArguments = function (a, lineno) {
    if (a.args) {
        this.visitParams(a.args, true);
    }
    if (a.kwonlyargs) {
        this.visitParams(a.kwonlyargs, true);
    }
    if (a.vararg) {
        this.addDef(a.vararg.arg, DEF_PARAM, lineno);
        this.cur.varargs = true;
    }
    if (a.kwarg) {
        this.addDef(a.kwarg.arg, DEF_PARAM, lineno);
        this.cur.varkeywords = true;
    }
};

SymbolTable.prototype.newTmpname = function (lineno) {
    this.addDef(new Sk.builtin.str("_[" + (++this.tmpname) + "]"), DEF_LOCAL, lineno);
};

SymbolTable.prototype.addDef = function (name, flag, lineno) {
    var fromGlobal;
    var val;
    var mangled = Sk.mangleName(this.curClass, name).v;
    mangled = Sk.fixReserved(mangled);
    val = this.cur.symFlags[mangled];
    if (val !== undefined) {
        if ((flag & DEF_PARAM) && (val & DEF_PARAM)) {
            throw new Sk.builtin.SyntaxError("duplicate argument '" + name.v + "' in function definition", this.filename, lineno);
        }
        val |= flag;
    }
    else {
        val = flag;
    }
    this.cur.symFlags[mangled] = val;
    if (flag & DEF_PARAM) {
        this.cur.varnames.push(mangled);
    }
    else if (flag & DEF_GLOBAL) {
        val = flag;
        fromGlobal = this.global[mangled];
        if (fromGlobal !== undefined) {
            val |= fromGlobal;
        }
        this.global[mangled] = val;
    }
};

SymbolTable.prototype.visitSlice = function (s) {
    var i;
    switch (s.constructor) {
        case Sk.astnodes.Slice:
            if (s.lower) {
                this.visitExpr(s.lower);
            }
            if (s.upper) {
                this.visitExpr(s.upper);
            }
            if (s.step) {
                this.visitExpr(s.step);
            }
            break;
        case Sk.astnodes.ExtSlice:
            for (i = 0; i < s.dims.length; ++i) {
                this.visitSlice(s.dims[i]);
            }
            break;
        case Sk.astnodes.Index:
            this.visitExpr(s.value);
            break;
        case Sk.astnodes.Ellipsis:
            break;
    }
};

SymbolTable.prototype.visitStmt = function (s) {
    var cur;
    var name;
    var i;
    var nameslen;
    var tmp;
    var e_name;
    Sk.asserts.assert(() => s !== undefined, "visitStmt called with undefined");
    switch (s.constructor) {
        case Sk.astnodes.FunctionDef:
            this.addDef(s.name, DEF_LOCAL, s.lineno);
            if (s.args.defaults) {
                this.SEQExpr(s.args.defaults);
            }
            if (s.decorator_list) {
                this.SEQExpr(s.decorator_list);
            }
            this.enterBlock(s.name.v, FunctionBlock, s, s.lineno);
            this.visitArguments(s.args, s.lineno);
            this.SEQStmt(s.body);
            this.exitBlock();
            break;
        case Sk.astnodes.ClassDef:
            this.addDef(s.name, DEF_LOCAL, s.lineno);
            this.SEQExpr(s.bases);
            if (s.decorator_list) {
                this.SEQExpr(s.decorator_list);
            }
            this.enterBlock(s.name.v, ClassBlock, s, s.lineno);
            tmp = this.curClass;
            this.curClass = s.name;
            this.SEQStmt(s.body);
            this.exitBlock();
            break;
        case Sk.astnodes.Return:
            if (s.value) {
                this.visitExpr(s.value);
                this.cur.returnsValue = true;
                if (this.cur.generator) {
                    throw new Sk.builtin.SyntaxError("'return' with argument inside generator", this.filename);
                }
            }
            break;
        case Sk.astnodes.Delete:
            this.SEQExpr(s.targets);
            break;
        case Sk.astnodes.Assign:
            this.SEQExpr(s.targets);
            this.visitExpr(s.value);
            break;
        case Sk.astnodes.AnnAssign:
            if (s.target.constructor == Sk.astnodes.Name) {
                e_name = s.target;
                name = Sk.mangleName(this.curClass, e_name.id).v;
                name = Sk.fixReserved(name);
                cur = this.cur.symFlags[name];
                if ((cur & (DEF_GLOBAL | DEF_NONLOCAL) )
                    && (this.global != this.cur.symFlags) // TODO
                    && (s.simple)) {
                    throw new Sk.builtin.SyntaxError("annotated name '"+ name +"' can't be global", this.filename, s.lineno);
                }
                if (s.simple) {
                    this.addDef(new Sk.builtin.str(name), DEF_ANNOT | DEF_LOCAL, s.lineno);
                } else if (s.value) {
                    this.addDef(new Sk.builtin.str(name), DEF_LOCAL, s.lineno);
                }
            } else {
                this.visitExpr(s.target);
            }
            this.visitExpr(s.annotation);
            if (s.value) {
                this.visitExpr(s.value);
            }
            break;
        case Sk.astnodes.AugAssign:
            this.visitExpr(s.target);
            this.visitExpr(s.value);
            break;
        case Sk.astnodes.Print:
            if (s.dest) {
                this.visitExpr(s.dest);
            }
            this.SEQExpr(s.values);
            break;
        case Sk.astnodes.For:
            this.visitExpr(s.target);
            this.visitExpr(s.iter);
            this.SEQStmt(s.body);
            if (s.orelse) {
                this.SEQStmt(s.orelse);
            }
            break;
        case Sk.astnodes.While:
            this.visitExpr(s.test);
            this.SEQStmt(s.body);
            if (s.orelse) {
                this.SEQStmt(s.orelse);
            }
            break;
        case Sk.astnodes.If:
            this.visitExpr(s.test);
            this.SEQStmt(s.body);
            if (s.orelse) {
                this.SEQStmt(s.orelse);
            }
            break;
        case Sk.astnodes.Raise:
            if (s.exc) {
                this.visitExpr(s.exc);
                // Our hacked AST supports both Python 2 (inst, tback)
                // and Python 3 (cause) versions of the Raise statement
                if (s.inst) {
                    this.visitExpr(s.inst);
                    if (s.tback) {
                        this.visitExpr(s.tback);
                    }
                }
                if (s.cause) {
                    this.visitExpr(s.cause);
                }
            }
            break;
        case Sk.astnodes.Assert:
            this.visitExpr(s.test);
            if (s.msg) {
                this.visitExpr(s.msg);
            }
            break;
        case Sk.astnodes.Import:
        case Sk.astnodes.ImportFrom:
            this.visitAlias(s.names, s.lineno);
            break;
        case Sk.astnodes.Global:
            nameslen = s.names.length;
            for (i = 0; i < nameslen; ++i) {
                name = Sk.mangleName(this.curClass, s.names[i]).v;
                name = Sk.fixReserved(name);
                cur = this.cur.symFlags[name];
                if (cur & (DEF_LOCAL | USE)) {
                    if (cur & DEF_LOCAL) {
                        throw new Sk.builtin.SyntaxError("name '" + name + "' is assigned to before global declaration", this.filename, s.lineno);
                    }
                    else {
                        throw new Sk.builtin.SyntaxError("name '" + name + "' is used prior to global declaration", this.filename, s.lineno);
                    }
                }
                this.addDef(new Sk.builtin.str(name), DEF_GLOBAL, s.lineno);
            }
            break;
        case Sk.astnodes.Expr:
            this.visitExpr(s.value);
            break;
        case Sk.astnodes.Pass:
        case Sk.astnodes.Break:
        case Sk.astnodes.Continue:
        case Sk.astnodes.Debugger:
            // nothing
            break;
        case Sk.astnodes.With:
            VISIT_SEQ(this.visit_withitem.bind(this), s.items);
            VISIT_SEQ(this.visitStmt.bind(this), s.body);
            break;

        case Sk.astnodes.Try:
            this.SEQStmt(s.body);
            this.visitExcepthandlers(s.handlers)
            this.SEQStmt(s.orelse);
            this.SEQStmt(s.finalbody);
            break;

        default:
            Sk.asserts.fail("Unhandled type " + s.constructor.name + " in visitStmt");
    }
};

SymbolTable.prototype.visit_withitem = function(item) {
    this.visitExpr(item.context_expr);
    if (item.optional_vars) {
        this.visitExpr(item.optional_vars);
    }
}


function VISIT_SEQ(visitFunc, seq) {
    var i;
    for (i = 0; i < seq.length; i++) {
        var elt = seq[i];
        visitFunc(elt)
    }
}

SymbolTable.prototype.visitExpr = function (e) {
    var i;
    Sk.asserts.assert(() => e !== undefined, "visitExpr called with undefined");
    // console.log("  e: ", e.constructor.name);
    switch (e.constructor) {
        case Sk.astnodes.BoolOp:
            this.SEQExpr(e.values);
            break;
        case Sk.astnodes.BinOp:
            this.visitExpr(e.left);
            this.visitExpr(e.right);
            break;
        case Sk.astnodes.UnaryOp:
            this.visitExpr(e.operand);
            break;
        case Sk.astnodes.Lambda:
            this.addDef(new Sk.builtin.str("lambda"), DEF_LOCAL, e.lineno);
            if (e.args.defaults) {
                this.SEQExpr(e.args.defaults);
            }
            this.enterBlock("lambda", FunctionBlock, e, e.lineno);
            this.visitArguments(e.args, e.lineno);
            this.visitExpr(e.body);
            this.exitBlock();
            break;
        case Sk.astnodes.IfExp:
            this.visitExpr(e.test);
            this.visitExpr(e.body);
            this.visitExpr(e.orelse);
            break;
        case Sk.astnodes.Dict:
            this.SEQExpr(e.keys);
            this.SEQExpr(e.values);
            break;
        case Sk.astnodes.DictComp:
        case Sk.astnodes.SetComp:
            this.visitComprehension(e.generators, 0);
            break;
        case Sk.astnodes.ListComp:
            this.newTmpname(e.lineno);
            this.visitExpr(e.elt);
            this.visitComprehension(e.generators, 0);
            break;
        case Sk.astnodes.GeneratorExp:
            this.visitGenexp(e);
            break;
        case Sk.astnodes.Yield:
            if (e.value) {
                this.visitExpr(e.value);
            }
            this.cur.generator = true;
            if (this.cur.returnsValue) {
                throw new Sk.builtin.SyntaxError("'return' with argument inside generator", this.filename);
            }
            break;
        case Sk.astnodes.Compare:
            this.visitExpr(e.left);
            this.SEQExpr(e.comparators);
            break;
        case Sk.astnodes.Call:
            this.visitExpr(e.func);
            if (e.args) {
                for (let a of e.args) {
                    if (a.constructor === Sk.astnodes.Starred) {
                        this.visitExpr(a.value);
                    } else {
                        this.visitExpr(a);
                    }
                }
            }
            if (e.keywords) {
                for (let k of e.keywords) {
                    this.visitExpr(k.value);
                }
            }
            break;
        case Sk.astnodes.Num:
        case Sk.astnodes.Str:
        case Sk.astnodes.Bytes:
            break;
        case Sk.astnodes.JoinedStr:
            for (let s of e.values) {
                this.visitExpr(s);
            }
            break;
        case Sk.astnodes.FormattedValue:
            this.visitExpr(e.value);
            if (e.format_spec) {
                this.visitExpr(e.format_spec);
            }
            break;
        case Sk.astnodes.Attribute:
            this.visitExpr(e.value);
            break;
        case Sk.astnodes.Subscript:
            this.visitExpr(e.value);
            this.visitSlice(e.slice);
            break;
        case Sk.astnodes.Name:
            this.addDef(e.id, e.ctx === Sk.astnodes.Load ? USE : DEF_LOCAL, e.lineno);
            break;
        case Sk.astnodes.NameConstant:
            break;
        case Sk.astnodes.List:
        case Sk.astnodes.Tuple:
        case Sk.astnodes.Set:
            this.SEQExpr(e.elts);
            break;
        case Sk.astnodes.Starred:
            this.visitExpr(e.value);
            break;
        default:
            Sk.asserts.fail("Unhandled type " + e.constructor.name + " in visitExpr");
    }
};

SymbolTable.prototype.visitComprehension = function (lcs, startAt) {
    var lc;
    var i;
    var len = lcs.length;
    for (i = startAt; i < len; ++i) {
        lc = lcs[i];
        this.visitExpr(lc.target);
        this.visitExpr(lc.iter);
        this.SEQExpr(lc.ifs);
    }
};

SymbolTable.prototype.visitAlias = function (names, lineno) {
    /* Compute store_name, the name actually bound by the import
     operation.  It is diferent than a->name when a->name is a
     dotted package name (e.g. spam.eggs)
     */
    var dot;
    var storename;
    var name;
    var a;
    var i;
    for (i = 0; i < names.length; ++i) {
        a = names[i];
        name = a.asname === null ? a.name.v : a.asname.v;
        storename = name;
        dot = name.indexOf(".");
        if (dot !== -1) {
            storename = name.substr(0, dot);
        }
        if (name !== "*") {
            this.addDef(new Sk.builtin.str(storename), DEF_IMPORT, lineno);
        }
        else {
            if (this.cur.blockType !== ModuleBlock) {
                throw new Sk.builtin.SyntaxError("import * only allowed at module level", this.filename);
            }
        }
    }
};

SymbolTable.prototype.visitGenexp = function (e) {
    var outermost = e.generators[0];
    // outermost is evaled in current scope
    this.visitExpr(outermost.iter);
    this.enterBlock("genexpr", FunctionBlock, e, e.lineno);
    this.cur.generator = true;
    this.addDef(new Sk.builtin.str(".0"), DEF_PARAM, e.lineno);
    this.visitExpr(outermost.target);
    this.SEQExpr(outermost.ifs);
    this.visitComprehension(e.generators, 1);
    this.visitExpr(e.elt);
    this.exitBlock();
};

SymbolTable.prototype.visitExcepthandlers = function (handlers) {
    var i, eh;
    for (i = 0; eh = handlers[i]; ++i) {
        if (eh.type) {
            this.visitExpr(eh.type);
        }
        if (eh.name) {
            this.visitExpr(eh.name);
        }
        this.SEQStmt(eh.body);
    }
};

function _dictUpdate (a, b) {
    var kb;
    for (kb in b) {
        a[kb] = b[kb];
    }
}

SymbolTable.prototype.analyzeBlock = function (ste, bound, free, global) {
    var c;
    var i;
    var childlen;
    var allfree;
    var flags;
    var name;
    var local = {};
    var scope = {};
    var newglobal = {};
    var newbound = {};
    var newfree = {};

    if (ste.blockType == ClassBlock) {
        _dictUpdate(newglobal, global);
        if (bound) {
            _dictUpdate(newbound, bound);
        }
    }

    for (name in ste.symFlags) {
        flags = ste.symFlags[name];
        this.analyzeName(ste, scope, name, flags, bound, local, free, global);
    }

    if (ste.blockType !== ClassBlock) {
        if (ste.blockType === FunctionBlock) {
            _dictUpdate(newbound, local);
        }
        if (bound) {
            _dictUpdate(newbound, bound);
        }
        _dictUpdate(newglobal, global);
    }

    allfree = {};
    childlen = ste.children.length;
    for (i = 0; i < childlen; ++i) {
        c = ste.children[i];
        this.analyzeChildBlock(c, newbound, newfree, newglobal, allfree);
        if (c.hasFree || c.childHasFree) {
            ste.childHasFree = true;
        }
    }

    _dictUpdate(newfree, allfree);
    if (ste.blockType === FunctionBlock) {
        this.analyzeCells(scope, newfree);
    }
    let discoveredFree = this.updateSymbols(ste.symFlags, scope, bound, newfree, ste.blockType === ClassBlock);
    ste.hasFree = ste.hasFree || discoveredFree;

    _dictUpdate(free, newfree);
};

SymbolTable.prototype.analyzeChildBlock = function (entry, bound, free, global, childFree) {
    var tempGlobal;
    var tempFree;
    var tempBound = {};
    _dictUpdate(tempBound, bound);
    tempFree = {};
    _dictUpdate(tempFree, free);
    tempGlobal = {};
    _dictUpdate(tempGlobal, global);

    this.analyzeBlock(entry, tempBound, tempFree, tempGlobal);
    _dictUpdate(childFree, tempFree);
};

SymbolTable.prototype.analyzeCells = function (scope, free) {
    var flags;
    var name;
    for (name in scope) {
        flags = scope[name];
        if (flags !== LOCAL) {
            continue;
        }
        if (free[name] === undefined) {
            continue;
        }
        scope[name] = CELL;
        delete free[name];
    }
};

/**
 * store scope info back into the st symbols dict. symbols is modified,
 * others are not.
 */
SymbolTable.prototype.updateSymbols = function (symbols, scope, bound, free, classflag) {
    var i;
    var o;
    var pos;
    var freeValue;
    var w;
    var flags;
    var name;
    var discoveredFree = false;
    for (name in symbols) {
        flags = symbols[name];
        w = scope[name];
        flags |= w << SCOPE_OFF;
        symbols[name] = flags;
    }

    freeValue = FREE << SCOPE_OFF;
    pos = 0;
    for (name in free) {
        o = symbols[name];
        if (o !== undefined) {
            // it could be a free variable in a method of the class that has
            // the same name as a local or global in the class scope
            if (classflag && (o & (DEF_BOUND | DEF_GLOBAL))) {
                i = o | DEF_FREE_CLASS;
                symbols[name] = i;
            }
            // else it's not free, probably a cell
            continue;
        }
        if (bound[name] === undefined) {
            continue;
        }
        symbols[name] = freeValue;
        discoveredFree = true;
    }
    return discoveredFree;
};

SymbolTable.prototype.analyzeName = function (ste, dict, name, flags, bound, local, free, global) {
    if (flags & DEF_GLOBAL) {
        if (flags & DEF_PARAM) {
            throw new Sk.builtin.SyntaxError("name '" + name + "' is local and global", this.filename, ste.lineno);
        }
        dict[name] = GLOBAL_EXPLICIT;
        global[name] = null;
        if (bound && bound[name] !== undefined) {
            delete bound[name];
        }
        return;
    }
    if (flags & DEF_BOUND) {
        dict[name] = LOCAL;
        local[name] = null;
        delete global[name];
        return;
    }

    if (bound && bound[name] !== undefined) {
        dict[name] = FREE;
        ste.hasFree = true;
        free[name] = null;
    }
    else if (global && global[name] !== undefined) {
        dict[name] = GLOBAL_IMPLICIT;
    }
    else {
        if (ste.isNested) {
            ste.hasFree = true;
        }
        dict[name] = GLOBAL_IMPLICIT;
    }
};

SymbolTable.prototype.analyze = function () {
    var free = {};
    var global = {};
    this.analyzeBlock(this.top, null, free, global);
};

/**
 * @param {Object} ast
 * @param {string} filename
 */
Sk.symboltable = function (ast, filename) {
    var i;
    var ret = new SymbolTable(filename);

    ret.enterBlock("top", ModuleBlock, ast, 0);
    ret.top = ret.cur;

    //print(Sk.astDump(ast));
    for (i = 0; i < ast.body.length; ++i) {
        ret.visitStmt(ast.body[i]);
    }

    ret.exitBlock();

    ret.analyze();

    return ret;
};

Sk.dumpSymtab = function (st) {
    var pyBoolStr = function (b) {
        return b ? "True" : "False";
    }
    var pyList = function (l) {
        var i;
        var ret = [];
        for (i = 0; i < l.length; ++i) {
            ret.push(new Sk.builtin.str(l[i])["$r"]().v);
        }
        return "[" + ret.join(", ") + "]";
    };
    var getIdents = function (obj, indent) {
        var ns;
        var j;
        var sub;
        var nsslen;
        var nss;
        var info;
        var i;
        var objidentslen;
        var objidents;
        var ret;
        if (indent === undefined) {
            indent = "";
        }
        ret = "";
        ret += indent + "Sym_type: " + obj.get_type() + "\n";
        ret += indent + "Sym_name: " + obj.get_name() + "\n";
        ret += indent + "Sym_lineno: " + obj.get_lineno() + "\n";
        ret += indent + "Sym_nested: " + pyBoolStr(obj.is_nested()) + "\n";
        ret += indent + "Sym_haschildren: " + pyBoolStr(obj.has_children()) + "\n";
        if (obj.get_type() === "class") {
            ret += indent + "Class_methods: " + pyList(obj.get_methods()) + "\n";
        }
        else if (obj.get_type() === "function") {
            ret += indent + "Func_params: " + pyList(obj.get_parameters()) + "\n";
            ret += indent + "Func_locals: " + pyList(obj.get_locals()) + "\n";
            ret += indent + "Func_globals: " + pyList(obj.get_globals()) + "\n";
            ret += indent + "Func_frees: " + pyList(obj.get_frees()) + "\n";
        }
        ret += indent + "-- Identifiers --\n";
        objidents = obj.get_identifiers();
        objidentslen = objidents.length;
        for (i = 0; i < objidentslen; ++i) {
            info = obj.lookup(objidents[i]);
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
            nss = info.get_namespaces();
            nsslen = nss.length;
            ret += indent + "  namespaces: [\n";
            sub = [];
            for (j = 0; j < nsslen; ++j) {
                ns = nss[j];
                sub.push(getIdents(ns, indent + "    "));
            }
            ret += sub.join("\n");
            ret += indent + "  ]\n";
        }
        return ret;
    };
    return getIdents(st.top, "");
};

Sk.exportSymbol("Sk.symboltable", Sk.symboltable);
Sk.exportSymbol("Sk.dumpSymtab", Sk.dumpSymtab);
