/** @param {...*} x */
var out;

Sk.gensymcount = 0;

/**
 * @constructor
 * @param {string} filename
 * @param {SymbolTable} st
 * @param {number} flags
 * @param {boolean=} canSuspend whether compiled code can suspend
 * @param {string=} sourceCodeForAnnotation used to add original source to listing if desired
 */
function Compiler (filename, st, flags, canSuspend, sourceCodeForAnnotation) {
    this.filename = filename;
    this.st = st;
    this.flags = flags;
    this.canSuspend = canSuspend;
    this.interactive = false;
    this.nestlevel = 0;

    this.u = null;
    this.stack = [];

    this.result = [];

    // this.gensymcount = 0;

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

function CompilerUnit () {
    this.ste = null;
    this.name = null;
    this.canSuspend = false;
    this.doesSuspend = false;

    this.private_ = null;
    this.firstlineno = 0;
    this.lineno = 0;
    this.linenoSet = false;
    this.localnames = [];

    this.localtemps = [];
    this.tempsToSave = [];

    this.blocknum = 0;
    this.blocks = [];
    this.curblock = 0;

    this.scopename = null;

    this.prefixCode = "";
    this.varDeclsCode = "";
    this.switchCode = "";
    this.suffixCode = "";

    // stack of where to go on a break
    this.breakBlocks = [];
    // stack of where to go on a continue
    this.continueBlocks = [];
    this.exceptBlocks = [];
    this.finallyBlocks = [];
}

CompilerUnit.prototype.activateScope = function () {
    var self = this;

    out = function () {
        var i;
        var b = self.blocks[self.curblock];
        if (b._next === null) {
            for (i = 0; i < arguments.length; ++i) {
                b.push(arguments[i]);
            }
        }
        // TODO: Warn about unreachable code after an unconditional jump?
    };
};

Compiler.prototype.getSourceLine = function (lineno) {
    goog.asserts.assert(this.source);
    return this.source[lineno - 1];
};

Compiler.prototype.annotateSource = function (ast) {
    var i;
    var col_offset;
    var lineno;
    if (this.source) {
        lineno = ast.lineno;
        col_offset = ast.col_offset;
        out("\n//\n// line ", lineno, ":\n// ", this.getSourceLine(lineno), "\n// ");
        for (i = 0; i < col_offset; ++i) {
            out(" ");
        }
        out("^\n//\n");

        out("$currLineNo = ", lineno, ";\n$currColNo = ", col_offset, ";\n\n");
    }
};

Compiler.prototype.gensym = function (hint) {
    hint = hint || "";
    hint = "$" + hint;
    hint += Sk.gensymcount++;
    return hint;
};

Compiler.prototype.niceName = function (roughName) {
    return this.gensym(roughName.replace("<", "").replace(">", "").replace(" ", "_"));
};

var reservedWords_ = {
    "abstract": true,
    "as": true,
    "boolean": true,
    "break": true,
    "byte": true,
    "case": true,
    "catch": true,
    "char": true,
    "class": true,
    "continue": true,
    "const": true,
    "debugger": true,
    "default": true,
    "delete": true,
    "do": true,
    "double": true,
    "else": true,
    "enum": true,
    "export": true,
    "extends": true,
    "false": true,
    "final": true,
    "finally": true,
    "float": true,
    "for": true,
    "function": true,
    "goto": true,
    "if": true,
    "implements": true,
    "import": true,
    "in": true,
    "instanceof": true,
    "int": true,
    "interface": true,
    "is": true,
    "long": true,
    "namespace": true,
    "native": true,
    "new": true,
    "null": true,
    "package": true,
    "private": true,
    "protected": true,
    "public": true,
    "return": true,
    "short": true,
    "static": true,
    "super": false,
    "switch": true,
    "synchronized": true,
    "this": true,
    "throw": true,
    "throws": true,
    "transient": true,
    "true": true,
    "try": true,
    "typeof": true,
    "use": true,
    "var": true,
    "void": true,
    "volatile": true,
    "while": true,
    "with": true
};

function fixReservedWords (name) {
    if (reservedWords_[name] !== true) {
        return name;
    }
    return name + "_$rw$";
}

var reservedNames_ = {
    "__defineGetter__": true,
    "__defineSetter__": true,
    "apply": true,
    "call": true,
    "eval": true,
    "hasOwnProperty": true,
    "isPrototypeOf": true,
    "__lookupGetter__": true,
    "__lookupSetter__": true,
    "__noSuchMethod__": true,
    "propertyIsEnumerable": true,
    "toSource": true,
    "toLocaleString": true,
    "toString": true,
    "unwatch": true,
    "valueOf": true,
    "watch": true,
    "length": true
};

function fixReservedNames (name) {
    if (reservedNames_[name]) {
        return name + "_$rn$";
    }
    return name;
}

function mangleName (priv, ident) {
    var name = ident.v;
    var strpriv = null;

    if (priv === null || name === null || name.charAt(0) !== "_" || name.charAt(1) !== "_") {
        return ident;
    }
    // don't mangle __id__
    if (name.charAt(name.length - 1) === "_" && name.charAt(name.length - 2) === "_") {
        return ident;
    }
    // don't mangle classes that are all _ (obscure much?)
    strpriv = priv.v;
    strpriv.replace(/_/g, "");
    if (strpriv === "") {
        return ident;
    }

    strpriv = priv.v;
    strpriv.replace(/^_*/, "");
    strpriv = new Sk.builtin.str("_" + strpriv + name);
    return strpriv;
}

/**
 * @param {string} hint basename for gensym
 * @param {...*} rest
 */
Compiler.prototype._gr = function (hint, rest) {
    var i;
    var v = this.gensym(hint);
    this.u.localtemps.push(v);
    out("var ", v, "=");
    for (i = 1; i < arguments.length; ++i) {
        out(arguments[i]);
    }
    out(";");
    return v;
};

/**
 * Function to test if an interrupt should occur if the program has been running for too long.
 * This function is executed at every test/branch operation.
 */
Compiler.prototype.outputInterruptTest = function () { // Added by RNL
    var output = "";
    if (Sk.execLimit !== null || Sk.yieldLimit !== null && this.u.canSuspend) {
            output += "var $dateNow = Date.now();";
        if (Sk.execLimit !== null) {
            output += "if ($dateNow - Sk.execStart > Sk.execLimit) {throw new Sk.builtin.TimeLimitError(Sk.timeoutMsg())}";
        }
        if (Sk.yieldLimit !== null && this.u.canSuspend) {
            output += "if ($dateNow - Sk.lastYield > Sk.yieldLimit) {";
            output += "var $susp = $saveSuspension({data: {type: 'Sk.yield'}, resume: function() {}}, '"+this.filename+"',$currLineNo,$currColNo);";
            output += "$susp.$blk = $blk;";
            output += "$susp.optional = true;";
            output += "return $susp;";
            output += "}";
            this.u.doesSuspend = true;
        }
    }
    return output;
};

Compiler.prototype._jumpfalse = function (test, block) {
    var cond = this._gr("jfalse", "(", test, "===false||!Sk.misceval.isTrue(", test, "))");
    out("if(", cond, "){/*test failed */$blk=", block, ";continue;}");
};

Compiler.prototype._jumpundef = function (test, block) {
    out("if(", test, "===undefined){$blk=", block, ";continue;}");
};

Compiler.prototype._jumptrue = function (test, block) {
    var cond = this._gr("jtrue", "(", test, "===true||Sk.misceval.isTrue(", test, "))");
    out("if(", cond, "){/*test passed */$blk=", block, ";continue;}");
};

Compiler.prototype._jump = function (block) {
    if (this.u.blocks[this.u.curblock]._next === null) {
        out("$blk=", block, ";");
        this.u.blocks[this.u.curblock]._next = block;
    }
};

/**
 * @param {Object=} e Object with keys 'lineno' and 'col_offset'
 */
Compiler.prototype._checkSuspension = function(e) {
    var retblk;
    if (this.u.canSuspend) {

        retblk = this.newBlock("function return or resume suspension");
        this._jump(retblk);
        this.setBlock(retblk);

        e = e || {lineno: "$currLineNo", col_offset: "$currColNo"};

        out ("if ($ret && $ret.$isSuspension) { return $saveSuspension($ret,'"+this.filename+"',"+e.lineno+","+e.col_offset+"); }");

        this.u.doesSuspend = true;
        this.u.tempsToSave = this.u.tempsToSave.concat(this.u.localtemps);

    } else {
        out ("if ($ret && $ret.$isSuspension) { $ret = Sk.misceval.retryOptionalSuspensionOrThrow($ret); }");
    }
};
Compiler.prototype.ctuplelistorset = function(e, data, tuporlist) {
    var i;
    var items;
    goog.asserts.assert(tuporlist === "tuple" || tuporlist === "list" || tuporlist === "set");
    if (e.ctx === Store) {
        items = this._gr("items", "Sk.abstr.sequenceUnpack(" + data + "," + e.elts.length + ")");
        for (i = 0; i < e.elts.length; ++i) {
            this.vexpr(e.elts[i], items + "[" + i + "]");
        }
    }
    else if (e.ctx === Load || tuporlist === "set") { //because set's can't be assigned to.
        items = [];
        for (i = 0; i < e.elts.length; ++i) {
            items.push(this._gr("elem", this.vexpr(e.elts[i])));
        }
        return this._gr("load" + tuporlist, "new Sk.builtins['", tuporlist, "']([", items, "])");
    }
};

Compiler.prototype.cdict = function (e) {
    var v;
    var i;
    var items;
    goog.asserts.assert(e.values.length === e.keys.length);
    items = [];
    for (i = 0; i < e.values.length; ++i) {
        v = this.vexpr(e.values[i]); // "backwards" to match order in cpy
        items.push(this.vexpr(e.keys[i]));
        items.push(v);
    }
    return this._gr("loaddict", "new Sk.builtins['dict']([", items, "])");
};

Compiler.prototype.clistcomp = function(e) {
    goog.asserts.assert(e instanceof ListComp);
    var tmp = this._gr("_compr", "new Sk.builtins['list']([])"); // note: _ is impt. for hack in name mangling (same as cpy)
    return this.ccompgen("list", tmp, e.generators, 0, e.elt, null, e);
};

Compiler.prototype.cdictcomp = function(e) {
    goog.asserts.assert(e instanceof DictComp);
    var tmp = this._gr("_dcompr", "new Sk.builtins.dict([])");
    return this.ccompgen("dict", tmp, e.generators, 0, e.value, e.key, e);
};

Compiler.prototype.csetcomp = function(e) {
    goog.asserts.assert(e instanceof SetComp);
    var tmp = this._gr("_setcompr", "new Sk.builtins.set([])");
    return this.ccompgen("set", tmp, e.generators, 0, e.elt, null, e);
};

Compiler.prototype.ccompgen = function (type, tmpname, generators, genIndex, value, key, e) {
    var start = this.newBlock(type + " comp start");
    var skip = this.newBlock(type + " comp skip");
    var anchor = this.newBlock(type + " comp anchor");

    var l = generators[genIndex];
    var toiter = this.vexpr(l.iter);
    var iter = this._gr("iter", "Sk.abstr.iter(", toiter, ")");
    var lvalue;
    var lkey;
    var ifres;
    var i;
    var target;
    var nexti;
    var n;

    this._jump(start);
    this.setBlock(start);

    // load targets
    out("$ret = Sk.abstr.iternext(", iter, ", true);");

    this._checkSuspension(e);

    nexti = this._gr("next", "$ret");
    this._jumpundef(nexti, anchor); // todo; this should be handled by StopIteration
    target = this.vexpr(l.target, nexti);

    n = l.ifs.length;
    for (i = 0; i < n; ++i) {
        ifres = this.vexpr(l.ifs[i]);
        this._jumpfalse(ifres, start);
    }

    if (++genIndex < generators.length) {
        this.ccompgen(type, tmpname, generators, genIndex, value, key, e);
    }

    if (genIndex >= generators.length) {
        lvalue = this.vexpr(value);
        if (type === "dict") {
            lkey = this.vexpr(key);
            out(tmpname, ".mp$ass_subscript(", lkey, ",", lvalue, ");");
        }
        else if (type === "list") {
            out(tmpname, ".v.push(", lvalue, ");"); // todo;
        }
        else if (type === "set") {
            out(tmpname, ".v.mp$ass_subscript(", lvalue, ", true);");
        }
        this._jump(skip);
        this.setBlock(skip);
    }

    this._jump(start);

    this.setBlock(anchor);

    return tmpname;
};

Compiler.prototype.cyield = function(e)
{
    if (this.u.ste.blockType !== FunctionBlock) {
        throw new SyntaxError("'yield' outside function");
    }
    var val = "null",
        nextBlock;
    if (e.value) {
        val = this.vexpr(e.value);
    }
    nextBlock = this.newBlock("after yield");
    // return a pair: resume target block and yielded value
    out("return [/*resume*/", nextBlock, ",/*ret*/", val, "];");
    this.setBlock(nextBlock);
    return "$gen.gi$sentvalue"; // will either be null if none sent, or the value from gen.send(value)
};

Compiler.prototype.ccompare = function (e) {
    var res;
    var rhs;
    var i;
    var fres;
    var done;
    var n;
    var cur;
    goog.asserts.assert(e.ops.length === e.comparators.length);
    cur = this.vexpr(e.left);
    n = e.ops.length;
    done = this.newBlock("done");
    fres = this._gr("compareres", "null");

    for (i = 0; i < n; ++i) {
        rhs = this.vexpr(e.comparators[i]);
        out("$ret = Sk.builtin.bool(Sk.misceval.richCompareBool(", cur, ",", rhs, ",'", e.ops[i].prototype._astname, "', true));");
        this._checkSuspension(e);
        out(fres, "=$ret;");
        this._jumpfalse("$ret", done);
        cur = rhs;
    }
    this._jump(done);
    this.setBlock(done);
    return fres;
};

Compiler.prototype.ccall = function (e) {
    var kwargs;
    var starargs;
    var keywords;
    var i;
    var kwarray;
    var func = this.vexpr(e.func);
    var args = this.vseqexpr(e.args);

    //print(JSON.stringify(e, null, 2));
    if (e.keywords.length > 0 || e.starargs || e.kwargs) {
        kwarray = [];
        for (i = 0; i < e.keywords.length; ++i) {
            kwarray.push("'" + e.keywords[i].arg.v + "'");
            kwarray.push(this.vexpr(e.keywords[i].value));
        }
        keywords = "[" + kwarray.join(",") + "]";
        starargs = "undefined";
        kwargs = "undefined";
        if (e.starargs) {
            starargs = this.vexpr(e.starargs);
        }
        if (e.kwargs) {
            kwargs = this.vexpr(e.kwargs);
        }
        out ("$ret;"); // This forces a failure if $ret isn't defined
        out ("$ret = Sk.misceval.callOrSuspend(", func, ",", kwargs, ",", starargs, ",", keywords, args.length > 0 ? "," : "", args, ");");
    }
    else {
        out ("$ret;"); // This forces a failure if $ret isn't defined
        out ("$ret = Sk.misceval.callsimOrSuspend(", func, args.length > 0 ? "," : "", args, ");");
    }

    this._checkSuspension(e);

    return this._gr("call", "$ret");
};

Compiler.prototype.cslice = function (s) {
    var step;
    var high;
    var low;
    goog.asserts.assert(s instanceof Slice);
    low = s.lower ? this.vexpr(s.lower) : s.step ? "Sk.builtin.none.none$" : "new Sk.builtin.int_(0)"; // todo;ideally, these numbers would be constants
    high = s.upper ? this.vexpr(s.upper) : s.step ? "Sk.builtin.none.none$" : "new Sk.builtin.int_(2147483647)";
    step = s.step ? this.vexpr(s.step) : "Sk.builtin.none.none$";
    return this._gr("slice", "new Sk.builtins['slice'](", low, ",", high, ",", step, ")");
};

Compiler.prototype.eslice = function (dims) {
    var i;
    var dimSubs, subs;
    goog.asserts.assert(dims instanceof Array);
    dimSubs = [];
    for (i = 0; i < dims.length; i++) {
        dimSubs.push(this.vslicesub(dims[i]));
    }
    return this._gr("extslice", "new Sk.builtins['tuple']([", dimSubs, "])");
};

Compiler.prototype.vslicesub = function (s) {
    var subs;
    switch (s.constructor) {
        case Index:
            subs = this.vexpr(s.value);
            break;
        case Slice:
            subs = this.cslice(s);
            break;
        case Ellipsis:
            goog.asserts.fail("todo compile.js Ellipsis;");
            break;
        case ExtSlice:
            subs = this.eslice(s.dims);
            break;
        default:
            goog.asserts.fail("invalid subscript kind");
    }
    return subs;
};

Compiler.prototype.vslice = function (s, ctx, obj, dataToStore) {
    var subs = this.vslicesub(s);
    return this.chandlesubscr(ctx, obj, subs, dataToStore);
};

Compiler.prototype.chandlesubscr = function (ctx, obj, subs, data) {
    if (ctx === Load || ctx === AugLoad) {
        out("$ret = Sk.abstr.objectGetItem(", obj, ",", subs, ", true);");
        this._checkSuspension();
        return this._gr("lsubscr", "$ret");
    }
    else if (ctx === Store || ctx === AugStore) {
        out("$ret = Sk.abstr.objectSetItem(", obj, ",", subs, ",", data, ", true);");
        this._checkSuspension();
    }
    else if (ctx === Del) {
        out("Sk.abstr.objectDelItem(", obj, ",", subs, ");");
    }
    else {
        goog.asserts.fail("handlesubscr fail");
    }
};

Compiler.prototype.cboolop = function (e) {
    var expres;
    var i;
    var retval;
    var n;
    var s;
    var end;
    var ifFailed;
    var jtype;
    goog.asserts.assert(e instanceof BoolOp);
    if (e.op === And) {
        jtype = this._jumpfalse;
    }
    else {
        jtype = this._jumptrue;
    }
    end = this.newBlock("end of boolop");
    s = e.values;
    n = s.length;
    for (i = 0; i < n; ++i) {
        expres = this.vexpr(s[i]);
        if (i === 0) {
            retval = this._gr("boolopsucc", expres);
        }
        out(retval, "=", expres, ";");
        jtype.call(this, expres, end);
    }
    this._jump(end);
    this.setBlock(end);
    return retval;
};


/**
 *
 * compiles an expression. to 'return' something, it'll gensym a var and store
 * into that var so that the calling code doesn't have avoid just pasting the
 * returned name.
 *
 * @param {Object} e
 * @param {string=} data data to store in a store operation
 * @param {Object=} augvar var to load/store to for augmented assignments like '+='.
 *                  (already vexpr'ed, so we can evaluate it once and reuse for both load and store ops)
 * @param {Object=} augsubs precomputed subscript for augmented assignments like '+='.
 *                  (already vexpr'ed, so we can evaluate it once and reuse for both load and store ops)
 */
Compiler.prototype.vexpr = function (e, data, augvar, augsubs) {
    var mangled;
    var val;
    var result;
    var nStr; // used for preserving signs for floats (zeros)
    if (e.lineno > this.u.lineno) {
        this.u.lineno = e.lineno;
        this.u.linenoSet = false;
    }
    //this.annotateSource(e);
    switch (e.constructor) {
        case BoolOp:
            return this.cboolop(e);
        case BinOp:
            return this._gr("binop", "Sk.abstr.numberBinOp(", this.vexpr(e.left), ",", this.vexpr(e.right), ",'", e.op.prototype._astname, "')");
        case UnaryOp:
            return this._gr("unaryop", "Sk.abstr.numberUnaryOp(", this.vexpr(e.operand), ",'", e.op.prototype._astname, "')");
        case Lambda:
            return this.clambda(e);
        case IfExp:
            return this.cifexp(e);
        case Dict:
            return this.cdict(e);
        case ListComp:
            return this.clistcomp(e);
        case DictComp:
            return this.cdictcomp(e);
        case SetComp:
            return this.csetcomp(e);
        case GeneratorExp:
            return this.cgenexp(e);
        case Yield:
            return this.cyield(e);
        case Compare:
            return this.ccompare(e);
        case Call:
            result = this.ccall(e);
            // After the function call, we've returned to this line
            this.annotateSource(e);
            return result;
        case Num:
            if (typeof e.n === "number") {
                return e.n;
            }
            else if (e.n instanceof Sk.builtin.int_) {
                return "new Sk.builtin.int_(" + e.n.v + ")";
            } else if (e.n instanceof Sk.builtin.float_) {
                // Preserve sign of zero for floats
                nStr = e.n.v === 0 && 1/e.n.v === -Infinity ? "-0" : e.n.v;
                return "new Sk.builtin.float_(" + nStr + ")";
            }
            else if (e.n instanceof Sk.builtin.lng) {
                // long uses the tp$str() method which delegates to nmber.str$ which preserves the sign
                return "Sk.longFromStr('" + e.n.tp$str().v + "')";
            }
            else if (e.n instanceof Sk.builtin.complex) {
                // preserve sign of zero here too
                var real_val = e.n.real.v === 0 && 1/e.n.real.v === -Infinity ? "-0" : e.n.real.v;
                var imag_val = e.n.imag.v === 0 && 1/e.n.imag.v === -Infinity ? "-0" : e.n.imag.v;
                return "new Sk.builtin.complex(new Sk.builtin.float_(" + real_val + "), new Sk.builtin.float_(" + imag_val + "))";
            }
            goog.asserts.fail("unhandled Num type");
        case Str:
            return this._gr("str", "new Sk.builtins['str'](", e.s["$r"]().v, ")");
        case Attribute:
            if (e.ctx !== AugLoad && e.ctx !== AugStore) {
                val = this.vexpr(e.value);
            }
            mangled = e.attr["$r"]().v;
            mangled = mangled.substring(1, mangled.length - 1);
            mangled = mangleName(this.u.private_, new Sk.builtin.str(mangled)).v;
            mangled = fixReservedWords(mangled);
            mangled = fixReservedNames(mangled);
            switch (e.ctx) {
                case AugLoad:
                    out("$ret = Sk.abstr.gattr(", augvar, ",'", mangled, "', true);");
                    this._checkSuspension(e);
                    return this._gr("lattr", "$ret");
                case Load:
                    out("$ret = Sk.abstr.gattr(", val, ",'", mangled, "', true);");
                    this._checkSuspension(e);
                    return this._gr("lattr", "$ret");
                case AugStore:
                    // To be more correct, we shouldn't sattr() again if the in-place update worked.
                    // At the time of writing (26/Feb/2015), Sk.abstr.numberInplaceBinOp never returns undefined,
                    // so this will never *not* execute. But it could, if Sk.abstr.numberInplaceBinOp were fixed.
                    out("$ret = undefined;");
                    out("if(", data, "!==undefined){");
                    out("$ret = Sk.abstr.sattr(", augvar, ",'", mangled, "',", data, ", true);");
                    out("}");
                    this._checkSuspension(e);
                    break;
                case Store:
                    out("$ret = Sk.abstr.sattr(", val, ",'", mangled, "',", data, ", true);");
                    this._checkSuspension(e);
                    break;
                case Del:
                    goog.asserts.fail("todo Del;");
                    break;
                case Param:
                default:
                    goog.asserts.fail("invalid attribute expression");
            }
            break;
        case Subscript:
            switch (e.ctx) {
                case AugLoad:
                    out("$ret = Sk.abstr.objectGetItem(",augvar,",",augsubs,", true);");
                    this._checkSuspension(e)
                    return this._gr("gitem", "$ret");
                case Load:
                case Store:
                case Del:
                    return this.vslice(e.slice, e.ctx, this.vexpr(e.value), data);
                case AugStore:
                    // To be more correct, we shouldn't sattr() again if the in-place update worked.
                    // At the time of writing (26/Feb/2015), Sk.abstr.numberInplaceBinOp never returns undefined,
                    // so this will never *not* execute. But it could, if Sk.abstr.numberInplaceBinOp were fixed.

                    out("$ret=undefined;");
                    out("if(", data, "!==undefined){");
                    out("$ret=Sk.abstr.objectSetItem(",augvar,",",augsubs,",",data,", true)");
                    out("}");
                    this._checkSuspension(e);
                    break;
                case Param:
                default:
                    goog.asserts.fail("invalid subscript expression");
            }
            break;
        case Name:
            return this.nameop(e.id, e.ctx, data);
        case List:
            return this.ctuplelistorset(e, data, 'list');
        case Tuple:
            return this.ctuplelistorset(e, data, 'tuple');
        case Set:
            return this.ctuplelistorset(e, data, 'set');
        default:
            goog.asserts.fail("unhandled case in vexpr");
    }
};

/**
 * @param {Array.<Object>} exprs
 * @param {Array.<string>=} data
 */
Compiler.prototype.vseqexpr = function (exprs, data) {
    var i;
    var ret;
    goog.asserts.assert(data === undefined || exprs.length === data.length);
    ret = [];
    for (i = 0; i < exprs.length; ++i) {
        ret.push(this.vexpr(exprs[i], data === undefined ? undefined : data[i]));
    }
    return ret;
};

Compiler.prototype.caugassign = function (s) {
    var to;
    var augsub;
    var res;
    var val;
    var aug;
    var auge;
    var e;
    goog.asserts.assert(s instanceof AugAssign);
    e = s.target;
    switch (e.constructor) {
        case Attribute:
            to = this.vexpr(e.value);
            auge = new Attribute(e.value, e.attr, AugLoad, e.lineno, e.col_offset);
            aug = this.vexpr(auge, undefined, to);
            val = this.vexpr(s.value);
            res = this._gr("inplbinopattr", "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
            auge.ctx = AugStore;
            return this.vexpr(auge, res, to);
        case Subscript:
            // Only compile the subscript value once
            to = this.vexpr(e.value);
            augsub = this.vslicesub(e.slice);
            auge = new Subscript(e.value, augsub, AugLoad, e.lineno, e.col_offset);
            aug = this.vexpr(auge, undefined, to, augsub);
            val = this.vexpr(s.value);
            res = this._gr("inplbinopsubscr", "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
            auge.ctx = AugStore;
            return this.vexpr(auge, res, to, augsub);
        case Name:
            to = this.nameop(e.id, Load);
            val = this.vexpr(s.value);
            res = this._gr("inplbinop", "Sk.abstr.numberInplaceBinOp(", to, ",", val, ",'", s.op.prototype._astname, "')");
            return this.nameop(e.id, Store, res);
        default:
            goog.asserts.fail("unhandled case in augassign");
    }
};

/**
 * optimize some constant exprs. returns 0 if always false, 1 if always true or -1 otherwise.
 */
Compiler.prototype.exprConstant = function (e) {
    switch (e.constructor) {
        case Num:
            return Sk.misceval.isTrue(e.n) ? 1 : 0;
        case Str:
            return Sk.misceval.isTrue(e.s) ? 1 : 0;
        case Name:
        // todo; do __debug__ test here if opt
        default:
            return -1;
    }
};

Compiler.prototype.newBlock = function (name) {
    var ret = this.u.blocknum++;
    this.u.blocks[ret] = [];
    this.u.blocks[ret]._name = name || "<unnamed>";
    this.u.blocks[ret]._next = null;
    return ret;
};
Compiler.prototype.setBlock = function (n) {
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.curblock = n;
};

Compiler.prototype.pushBreakBlock = function (n) {
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.breakBlocks.push(n);
};
Compiler.prototype.popBreakBlock = function () {
    this.u.breakBlocks.pop();
};

Compiler.prototype.pushContinueBlock = function (n) {
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.continueBlocks.push(n);
};
Compiler.prototype.popContinueBlock = function () {
    this.u.continueBlocks.pop();
};

Compiler.prototype.pushExceptBlock = function (n) {
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.exceptBlocks.push(n);
};
Compiler.prototype.popExceptBlock = function () {
    this.u.exceptBlocks.pop();
};

Compiler.prototype.pushFinallyBlock = function (n) {
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.finallyBlocks.push(n);
};
Compiler.prototype.popFinallyBlock = function () {
    this.u.finallyBlocks.pop();
};

Compiler.prototype.setupExcept = function (eb) {
    out("$exc.push(", eb, ");");
    //this.pushExceptBlock(eb);
};

Compiler.prototype.endExcept = function () {
    out("$exc.pop();");
};

Compiler.prototype.outputLocals = function (unit) {
    var name;
    var output;
    var i;
    var have = {};
    //print("args", unit.name.v, JSON.stringify(unit.argnames));
    for (i = 0; unit.argnames && i < unit.argnames.length; ++i) {
        have[unit.argnames[i]] = true;
    }
    unit.localnames.sort();
    output = [];
    for (i = 0; i < unit.localnames.length; ++i) {
        name = unit.localnames[i];
        if (have[name] === undefined) {
            output.push(name);
            have[name] = true;
        }
    }
    if (output.length > 0) {
        return "var " + output.join(",") + "; /* locals */";
    }
    return "";
};

Compiler.prototype.outputSuspensionHelpers = function (unit) {
    var i, t;
    var localSaveCode = [];
    var localsToSave = unit.localnames.concat(unit.tempsToSave);
    var seenTemps = {};
    var hasCell = unit.ste.blockType === FunctionBlock && unit.ste.childHasFree;
    var output = "var $wakeFromSuspension = function() {" +
                    "var susp = "+unit.scopename+".$wakingSuspension; delete "+unit.scopename+".$wakingSuspension;" +
                    "$blk=susp.$blk; $loc=susp.$loc; $gbl=susp.$gbl; $exc=susp.$exc; $err=susp.$err;" +
                    "$currLineNo=susp.$lineno; $currColNo=susp.$colno; Sk.lastYield=Date.now();" +
                    (hasCell?"$cell=susp.$cell;":"");

    for (i = 0; i < localsToSave.length; i++) {
        t = localsToSave[i];
        if (seenTemps[t]===undefined) {
            output += t + "=susp.$tmps." + t + ";";
            seenTemps[t] = true;
        }
    }

    output +=  "try { $ret=susp.child.resume(); } catch(err) { if (!(err instanceof Sk.builtin.BaseException)) { err = new Sk.builtin.ExternalError(err); } err.traceback.push({lineno: $currLineNo, colno: $currColNo, filename: '"+this.filename+"'}); if($exc.length>0) { $err=err; $blk=$exc.pop(); } else { throw err; } }" +
                "};";

    output += "var $saveSuspension = function($child, $filename, $lineno, $colno) {" +
                "var susp = new Sk.misceval.Suspension(); susp.child=$child;" +
                "susp.resume=function(){"+unit.scopename+".$wakingSuspension=susp; return "+unit.scopename+"("+(unit.ste.generator?"$gen":"")+"); };" +
                "susp.data=susp.child.data;susp.$blk=$blk;susp.$loc=$loc;susp.$gbl=$gbl;susp.$exc=$exc;susp.$err=$err;" +
                "susp.$filename=$filename;susp.$lineno=$lineno;susp.$colno=$colno;" +
                "susp.optional=susp.child.optional;" +
                (hasCell ? "susp.$cell=$cell;" : "");

    seenTemps = {};
    for (i = 0; i < localsToSave.length; i++) {
        t = localsToSave[i];
        if (seenTemps[t]===undefined) {
            localSaveCode.push("\"" + t + "\":" + t);
            seenTemps[t]=true;
        }
    }
    output +=   "susp.$tmps={" + localSaveCode.join(",") + "};" +
                "return susp;" +
              "};";

    return output;
}

Compiler.prototype.outputAllUnits = function () {
    var i;
    var blocks;
    var unit;
    var j;
    var ret = "";
    var block;
    var generatedBlocks;
    for (j = 0; j < this.allUnits.length; ++j) {
        unit = this.allUnits[j];
        ret += unit.prefixCode;
        ret += this.outputLocals(unit);
        if (unit.doesSuspend) {
            ret += this.outputSuspensionHelpers(unit);
        }
        ret += unit.varDeclsCode;
        ret += unit.switchCode;
        blocks = unit.blocks;
        generatedBlocks = Object.create(null);
        for (i = 0; i < blocks.length; ++i) {
            block = i;
            if (block in generatedBlocks)
                continue;
            while (true) {
                generatedBlocks[block] = true;

                ret += "case " + block + ": /* --- " + blocks[block]._name + " --- */";
                ret += blocks[block].join("");

                if (blocks[block]._next !== null) {
                    if (!(blocks[block]._next in generatedBlocks)) {
                        ret += "/* allowing case fallthrough */";
                        block = blocks[block]._next;
                    }
                    else {
                        ret += "/* jump */ continue;";
                        break;
                    }
                }
                else {
                    ret += "throw new Sk.builtin.SystemError('internal error: unterminated block');";
                    break;
                }
            }
        }
        ret += unit.suffixCode;
    }
    return ret;
};

Compiler.prototype.cif = function (s) {
    var test;
    var next;
    var end;
    var constant;
    goog.asserts.assert(s instanceof If_);
    constant = this.exprConstant(s.test);
    if (constant === 0) {
        if (s.orelse && s.orelse.length > 0) {
            this.vseqstmt(s.orelse);
        }
    }
    else if (constant === 1) {
        this.vseqstmt(s.body);
    }
    else {
        end = this.newBlock("end of if");
        if (s.orelse && s.orelse.length > 0) {
            next = this.newBlock("next branch of if");
        }

        test = this.vexpr(s.test);

        if (s.orelse && s.orelse.length > 0) {
            this._jumpfalse(test, next);
            this.vseqstmt(s.body);
            this._jump(end);

            this.setBlock(next);
            this.vseqstmt(s.orelse);
        }
        else {
            this._jumpfalse(test, end);
            this.vseqstmt(s.body);
        }
        this._jump(end);
        this.setBlock(end);
    }

};

Compiler.prototype.cwhile = function (s) {
    var body;
    var orelse;
    var next;
    var top;
    var constant = this.exprConstant(s.test);
    if (constant === 0) {
        if (s.orelse) {
            this.vseqstmt(s.orelse);
        }
    }
    else {
        top = this.newBlock("while test");
        this._jump(top);
        this.setBlock(top);

        next = this.newBlock("after while");
        orelse = s.orelse.length > 0 ? this.newBlock("while orelse") : null;
        body = this.newBlock("while body");

        this.annotateSource(s);
        this._jumpfalse(this.vexpr(s.test), orelse ? orelse : next);
        this._jump(body);

        this.pushBreakBlock(next);
        this.pushContinueBlock(top);

        this.setBlock(body);
        this.vseqstmt(s.body);
        this._jump(top);

        this.popContinueBlock();
        this.popBreakBlock();

        if (s.orelse.length > 0) {
            this.setBlock(orelse);
            this.vseqstmt(s.orelse);
            this._jump(next);
        }

        this.setBlock(next);
    }
};

Compiler.prototype.cfor = function (s) {
    var target;
    var nexti;
    var iter;
    var toiter;
    var start = this.newBlock("for start");
    var cleanup = this.newBlock("for cleanup");
    var end = this.newBlock("for end");

    this.pushBreakBlock(end);
    this.pushContinueBlock(start);

    // get the iterator
    toiter = this.vexpr(s.iter);
    if (this.u.ste.generator) {
        // if we're in a generator, we have to store the iterator to a local
        // so it's preserved (as we cross blocks here and assume it survives)
        iter = "$loc." + this.gensym("iter");
        out(iter, "=Sk.abstr.iter(", toiter, ");");
    }
    else {
        iter = this._gr("iter", "Sk.abstr.iter(", toiter, ")");
        this.u.tempsToSave.push(iter); // Save it across suspensions
    }

    this._jump(start);

    this.setBlock(start);

    // load targets
    out ("$ret = Sk.abstr.iternext(", iter,(this.u.canSuspend?", true":", false"),");");

    this._checkSuspension(s);

    nexti = this._gr("next", "$ret");
    this._jumpundef(nexti, cleanup); // todo; this should be handled by StopIteration
    target = this.vexpr(s.target, nexti);

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

Compiler.prototype.craise = function (s) {
    var inst = "", exc;
    if (s.inst) {
        // handles: raise Error, arguments
        inst = this.vexpr(s.inst);
        out("throw ", this.vexpr(s.type), "(", inst, ");");
    }
    else if (s.type) {
        if (s.type.func) {
            // handles: raise Error(arguments)
            out("throw ", this.vexpr(s.type), ";");
        }
        else {
            // handles: raise Error OR raise someinstance
            exc = this._gr("err", this.vexpr(s.type));
            out("if(",exc," instanceof Sk.builtin.type) {",
                "throw Sk.misceval.callsim(", exc, ");",
                "} else if(typeof(",exc,") === 'function') {",
                "throw ",exc,"();",
                "} else {",
                "throw ", exc, ";",
                "}");
        }
    }
    else {
        // re-raise
        out("throw $err;");
    }
};

Compiler.prototype.ctryexcept = function (s) {
    var check;
    var next;
    var handlertype;
    var handler;
    var end;
    var orelse;
    var unhandled;
    var i;
    var n = s.handlers.length;

    // Create a block for each except clause
    var handlers = [];
    for (i = 0; i < n; ++i) {
        handlers.push(this.newBlock("except_" + i + "_"));
    }

    unhandled = this.newBlock("unhandled");
    orelse = this.newBlock("orelse");
    end = this.newBlock("end");

    this.setupExcept(handlers[0]);
    this.vseqstmt(s.body);
    this.endExcept();
    this._jump(orelse);

    for (i = 0; i < n; ++i) {
        this.setBlock(handlers[i]);
        handler = s.handlers[i];
        if (!handler.type && i < n - 1) {
            throw new SyntaxError("default 'except:' must be last");
        }

        if (handler.type) {
            // should jump to next handler if err not isinstance of handler.type
            handlertype = this.vexpr(handler.type);
            next = (i == n - 1) ? unhandled : handlers[i + 1];

            // var isinstance = this.nameop(new Sk.builtin.str("isinstance"), Load));
            // var check = this._gr('call', "Sk.misceval.callsim(", isinstance, ", $err, ", handlertype, ")");

            // this check is not right, should use isinstance, but exception objects
            // are not yet proper Python objects
            check = this._gr("instance", "$err instanceof ", handlertype);
            this._jumpfalse(check, next);
        }

        if (handler.name) {
            this.vexpr(handler.name, "$err");
        }

        // Need to execute finally before leaving body if an exception is raised
        this.vseqstmt(handler.body);

        // Should jump to finally, but finally is not implemented yet
        this._jump(end);
    }

    // If no except clause catches exception, throw it again
    this.setBlock(unhandled);
    // Should execute finally first
    out("throw $err;");

    this.setBlock(orelse);
    this.vseqstmt(s.orelse);
    // Should jump to finally, but finally is not implemented yet
    this._jump(end);
    this.setBlock(end);
};

Compiler.prototype.ctryfinally = function (s) {
    out("/*todo; tryfinally*/");
    // everything but the finally?
    this.ctryexcept(s.body[0]);
};

Compiler.prototype.cassert = function (s) {
    /* todo; warnings method
     if (s.test instanceof Tuple && s.test.elts.length > 0)
     Sk.warn("assertion is always true, perhaps remove parentheses?");
     */

    var test = this.vexpr(s.test);
    var end = this.newBlock("end");
    this._jumptrue(test, end);
    // todo; exception handling
    // maybe replace with goog.asserts.fail?? or just an alert?
    out("throw new Sk.builtin.AssertionError(", s.msg ? this.vexpr(s.msg) : "", ");");
    this.setBlock(end);
};

Compiler.prototype.cimportas = function (name, asname, mod) {
    var attr;
    var src = name.v;
    var dotLoc = src.indexOf(".");
    //print("src", src);
    //print("dotLoc", dotLoc);
    var cur = mod;
    if (dotLoc !== -1) {
        // if there's dots in the module name, __import__ will have returned
        // the top-level module. so, we need to extract the actual module by
        // getattr'ing up through the names, and then storing the leaf under
        // the name it was to be imported as.
        src = src.substr(dotLoc + 1);
        //print("src now", src);
        while (dotLoc !== -1) {
            dotLoc = src.indexOf(".");
            attr = dotLoc !== -1 ? src.substr(0, dotLoc) : src;
            cur = this._gr("lattr", "Sk.abstr.gattr(", cur, ",'", attr, "')");
            src = src.substr(dotLoc + 1);
        }
    }
    return this.nameop(asname, Store, cur);
};

Compiler.prototype.cimport = function (s) {
    var lastDot;
    var tmp;
    var mod;
    var alias;
    var i;
    var n = s.names.length;
    for (i = 0; i < n; ++i) {
        alias = s.names[i];
        out("$ret = Sk.builtin.__import__(", alias.name["$r"]().v, ",$gbl,$loc,[]);");

        this._checkSuspension(s);

        mod = this._gr("module", "$ret");

        if (alias.asname) {
            this.cimportas(alias.name, alias.asname, mod);
        }
        else {
            tmp = alias.name;
            lastDot = tmp.v.indexOf(".");
            if (lastDot !== -1) {
                tmp = new Sk.builtin.str(tmp.v.substr(0, lastDot));
            }
            this.nameop(tmp, Store, mod);
        }
    }
};

Compiler.prototype.cfromimport = function (s) {
    var storeName;
    var got;
    var alias;
    var mod;
    var i;
    var n = s.names.length;
    var names = [];
    for (i = 0; i < n; ++i) {
        names[i] = s.names[i].name["$r"]().v;
    }
    out("$ret = Sk.builtin.__import__(", s.module["$r"]().v, ",$gbl,$loc,[", names, "]);");

    this._checkSuspension(s);

    //out("print('__import__ returned ' + $ret);");
    //out("for (var x in $ret) { print(x); }");
    mod = this._gr("module", "$ret");
    for (i = 0; i < n; ++i) {
        alias = s.names[i];
        if (i === 0 && alias.name.v === "*") {
            goog.asserts.assert(n === 1);
            out("Sk.importStar(", mod, ",$loc, $gbl);");
            return;
        }

        //out("print(\"getting Sk.abstr.gattr(", mod, ",", alias.name["$r"]().v, ")\");");
        got = this._gr("item", "Sk.abstr.gattr(", mod, ",", alias.name["$r"]().v, ")");
        //out("print('got');");
        storeName = alias.name;
        if (alias.asname) {
            storeName = alias.asname;
        }
        this.nameop(storeName, Store, got);
    }
};

/**
 * builds a code object (js function) for various constructs. used by def,
 * lambda, generator expressions. it isn't used for class because it seemed
 * different enough.
 *
 * handles:
 * - setting up a new scope
 * - decorators (if any)
 * - defaults setup
 * - setup for cell and free vars
 * - setup and modification for generators
 *
 * @param {Object} n ast node to build for
 * @param {Sk.builtin.str} coname name of code object to build
 * @param {Array} decorator_list ast of decorators if any
 * @param {arguments_} args arguments to function, if any
 * @param {Function} callback called after setup to do actual work of function
 *
 * @returns the name of the newly created function or generator object.
 *
 */
Compiler.prototype.buildcodeobj = function (n, coname, decorator_list, args, callback) {
    var containingHasFree;
    var frees;
    var argnamesarr;
    var argnames;
    var start;
    var kw;
    var maxargs;
    var minargs;
    var id;
    var argname;
    var offset;
    var cells;
    var locals;
    var i;
    var funcArgs;
    var entryBlock;
    var hasCell;
    var hasFree;
    var isGenerator;
    var scopename;
    var decos = [];
    var defaults = [];
    var vararg = null;
    var kwarg = null;

    // decorators and defaults have to be evaluated out here before we enter
    // the new scope. we output the defaults and attach them to this code
    // object, but only once we know the name of it (so we do it after we've
    // exited the scope near the end of this function).
    if (decorator_list) {
        decos = this.vseqexpr(decorator_list);
    }
    if (args && args.defaults) {
        defaults = this.vseqexpr(args.defaults);
    }
    if (args && args.vararg) {
        vararg = args.vararg;
    }
    if (args && args.kwarg) {
        kwarg = args.kwarg;
    }

    //
    // enter the new scope, and create the first block
    //
    scopename = this.enterScope(coname, n, n.lineno, this.canSuspend);

    isGenerator = this.u.ste.generator;
    hasFree = this.u.ste.hasFree;
    hasCell = this.u.ste.childHasFree;

    entryBlock = this.newBlock("codeobj entry");

    //
    // the header of the function, and arguments
    //
    this.u.prefixCode = "var " + scopename + "=(function " + this.niceName(coname.v) + "$(";

    funcArgs = [];
    if (isGenerator) {
        if (kwarg) {
            throw new SyntaxError(coname.v + "(): keyword arguments in generators not supported");
        }
        if (vararg) {
            throw new SyntaxError(coname.v + "(): variable number of arguments in generators not supported");
        }
        funcArgs.push("$gen");
    }
    else {
        if (kwarg) {
            funcArgs.push("$kwa");
            this.u.tempsToSave.push("$kwa");
        }
        for (i = 0; args && i < args.args.length; ++i) {
            funcArgs.push(this.nameop(args.args[i].id, Param));
        }
    }
    if (hasFree) {
        funcArgs.push("$free");
        this.u.tempsToSave.push("$free");
    }
    this.u.prefixCode += funcArgs.join(",");

    this.u.prefixCode += "){";

    if (isGenerator) {
        this.u.prefixCode += "\n// generator\n";
    }
    if (hasFree) {
        this.u.prefixCode += "\n// has free\n";
    }
    if (hasCell) {
        this.u.prefixCode += "\n// has cell\n";
    }

    //
    // set up standard dicts/variables
    //
    locals = "{}";
    if (isGenerator) {
        entryBlock = "$gen.gi$resumeat";
        locals = "$gen.gi$locals";
    }
    cells = "";
    if (hasCell) {
        if (isGenerator) {
            cells = ",$cell=$gen.gi$cells";
        }
        else {
            cells = ",$cell={}";
        }
    }

    // note special usage of 'this' to avoid having to slice globals into
    // all function invocations in call
    this.u.varDeclsCode += "var $blk=" + entryBlock + ",$exc=[],$loc=" + locals + cells + ",$gbl=this,$err=undefined,$ret=undefined,$currLineNo=undefined,$currColNo=undefined;";
    if (Sk.execLimit !== null) {
        this.u.varDeclsCode += "if (typeof Sk.execStart === 'undefined') {Sk.execStart = Date.now()}";
    }
    if (Sk.yieldLimit !== null && this.u.canSuspend) {
        this.u.varDeclsCode += "if (typeof Sk.lastYield === 'undefined') {Sk.lastYield = Date.now()}";
    }

    //
    // If there is a suspension, resume from it. Otherwise, initialise
    // parameters appropriately.
    //
    this.u.varDeclsCode += "if ("+scopename+".$wakingSuspension!==undefined) { $wakeFromSuspension(); } else {";

    //
    // initialize default arguments. we store the values of the defaults to
    // this code object as .$defaults just below after we exit this scope.
    //
    if (defaults.length > 0) {
        // defaults have to be "right justified" so if there's less defaults
        // than args we offset to make them match up (we don't need another
        // correlation in the ast)
        offset = args.args.length - defaults.length;
        for (i = 0; i < defaults.length; ++i) {
            argname = this.nameop(args.args[i + offset].id, Param);
            this.u.varDeclsCode += "if(" + argname + "===undefined)" + argname + "=" + scopename + ".$defaults[" + i + "];";
        }
    }

    //
    // copy all parameters that are also cells into the cells dict. this is so
    // they can be accessed correctly by nested scopes.
    //
    for (i = 0; args && i < args.args.length; ++i) {
        id = args.args[i].id;
        if (this.isCell(id)) {
            this.u.varDeclsCode += "$cell." + id.v + "=" + id.v + ";";
        }
    }

    //
    // make sure correct number of arguments were passed (generators handled below)
    //
    if (!isGenerator) {
        minargs = args ? args.args.length - defaults.length : 0;
        maxargs = vararg ? Infinity : (args ? args.args.length : 0);
        kw = kwarg ? true : false;
        this.u.varDeclsCode += "Sk.builtin.pyCheckArgs(\"" + coname.v +
            "\", arguments, " + minargs + ", " + maxargs + ", " + kw +
            ", " + hasFree + ");";
    }

    //
    // initialize vararg, if any
    //
    if (vararg) {
        start = funcArgs.length;
        this.u.localnames.push(vararg.v);
        this.u.varDeclsCode += vararg.v + "=new Sk.builtins['tuple'](Array.prototype.slice.call(arguments," + start + ")); /*vararg*/";
    }

    //
    // initialize kwarg, if any
    //
    if (kwarg) {
        this.u.localnames.push(kwarg.v);
        this.u.varDeclsCode += kwarg.v + "=new Sk.builtins['dict']($kwa);";
    }

    //
    // close the else{} block from the wakingSuspension check
    //
    this.u.varDeclsCode += "}";


    //
    // finally, set up the block switch that the jump code expects
    //
    // Old switch code
    // this.u.switchCode += "while(true){switch($blk){";
    // this.u.suffixCode = "}break;}});";

    // New switch code to catch exceptions
    this.u.switchCode = "while(true){try{"
    this.u.switchCode += this.outputInterruptTest();
    this.u.switchCode += "switch($blk){";
    this.u.suffixCode = "} }catch(err){ if (!(err instanceof Sk.builtin.BaseException)) { err = new Sk.builtin.ExternalError(err); } err.traceback.push({lineno: $currLineNo, colno: $currColNo, filename: '"+this.filename+"'}); if ($exc.length>0) { $err = err; $blk=$exc.pop(); continue; } else { throw err; }} }});";

    //
    // jump back to the handler so it can do the main actual work of the
    // function
    //
    callback.call(this, scopename);

    //
    // get a list of all the argument names (used to attach to the code
    // object, and also to allow us to declare only locals that aren't also
    // parameters).
    if (args && args.args.length > 0) {
        argnamesarr = [];
        for (i = 0; i < args.args.length; ++i) {
            argnamesarr.push(args.args[i].id.v);
        }

        argnames = argnamesarr.join("', '");
        // store to unit so we know what local variables not to declare
        this.u.argnames = argnamesarr;
    }

    //
    // and exit the code object scope
    //
    this.exitScope();

    //
    // attach the default values we evaluated at the beginning to the code
    // object so that it can get at them to set any arguments that are left
    // unset.
    //
    if (defaults.length > 0) {
        out(scopename, ".$defaults=[", defaults.join(","), "];");
    }


    //
    // attach co_varnames (only the argument names) for keyword argument
    // binding.
    //
    if (argnames) {
        out(scopename, ".co_varnames=['", argnames, "'];");
    }

    //
    // attach flags
    //
    if (kwarg) {
        out(scopename, ".co_kwargs=1;");
    }

    //
    // build either a 'function' or 'generator'. the function is just a simple
    // constructor call. the generator is more complicated. it needs to make a
    // new generator every time it's called, so the thing that's returned is
    // actually a function that makes the generator (and passes arguments to
    // the function onwards to the generator). this should probably actually
    // be a function object, rather than a js function like it is now. we also
    // have to build the argument names to pass to the generator because it
    // needs to store all locals into itself so that they're maintained across
    // yields.
    //
    // todo; possibly this should be outside?
    //
    frees = "";
    if (hasFree) {
        frees = ",$cell";
        // if the scope we're in where we're defining this one has free
        // vars, they may also be cell vars, so we pass those to the
        // closure too.
        containingHasFree = this.u.ste.hasFree;
        if (containingHasFree) {
            frees += ",$free";
        }
    }
    if (isGenerator)
    // Keyword and variable arguments are not currently supported in generators.
    // The call to pyCheckArgs assumes they can't be true.
    {
        if (args && args.args.length > 0) {
            return this._gr("gener", "new Sk.builtins['function']((function(){var $origargs=Array.prototype.slice.call(arguments);Sk.builtin.pyCheckArgs(\"",
                coname.v, "\",arguments,", args.args.length - defaults.length, ",", args.args.length,
                ");return new Sk.builtins['generator'](", scopename, ",$gbl,$origargs", frees, ");}))");
        }
        else {
            return this._gr("gener", "new Sk.builtins['function']((function(){Sk.builtin.pyCheckArgs(\"", coname.v,
                "\",arguments,0,0);return new Sk.builtins['generator'](", scopename, ",$gbl,[]", frees, ");}))");
        }
    }
    else {
        return this._gr("funcobj", "new Sk.builtins['function'](", scopename, ",$gbl", frees, ")");
    }
};

Compiler.prototype.cfunction = function (s) {
    var funcorgen;
    goog.asserts.assert(s instanceof FunctionDef);
    funcorgen = this.buildcodeobj(s, s.name, s.decorator_list, s.args, function (scopename) {
        this.vseqstmt(s.body);
        out("return Sk.builtin.none.none$;"); // if we fall off the bottom, we want the ret to be None
    });
    this.nameop(s.name, Store, funcorgen);
};

Compiler.prototype.clambda = function (e) {
    var func;
    goog.asserts.assert(e instanceof Lambda);
    func = this.buildcodeobj(e, new Sk.builtin.str("<lambda>"), null, e.args, function (scopename) {
        var val = this.vexpr(e.body);
        out("return ", val, ";");
    });
    return func;
};

Compiler.prototype.cifexp = function (e) {
    var next = this.newBlock("next of ifexp");
    var end = this.newBlock("end of ifexp");
    var ret = this._gr("res", "null");

    var test = this.vexpr(e.test);
    this._jumpfalse(test, next);

    out(ret, "=", this.vexpr(e.body), ";");
    this._jump(end);

    this.setBlock(next);
    out(ret, "=", this.vexpr(e.orelse), ";");
    this._jump(end);

    this.setBlock(end);
    return ret;
};

Compiler.prototype.cgenexpgen = function (generators, genIndex, elt) {
    var velt;
    var ifres;
    var i;
    var n;
    var target;
    var nexti;
    var toiter;
    var start = this.newBlock("start for " + genIndex);
    var skip = this.newBlock("skip for " + genIndex);
    var ifCleanup = this.newBlock("if cleanup for " + genIndex);
    var end = this.newBlock("end for " + genIndex);

    var ge = generators[genIndex];

    var iter;
    if (genIndex === 0) {
        // the outer most iterator is evaluated in the scope outside so we
        // have to evaluate it outside and store it into the generator as a
        // local, which we retrieve here.
        iter = "$loc.$iter0";
    }
    else {
        toiter = this.vexpr(ge.iter);
        iter = "$loc." + this.gensym("iter");
        out(iter, "=", "Sk.abstr.iter(", toiter, ");");
    }
    this._jump(start);
    this.setBlock(start);

    this.annotateSource(elt);

    // load targets
    out ("$ret = Sk.abstr.iternext(", iter,(this.u.canSuspend?", true":", false"),");");

    this._checkSuspension(elt);

    nexti = this._gr("next", "$ret");
    this._jumpundef(nexti, end); // todo; this should be handled by StopIteration
    target = this.vexpr(ge.target, nexti);

    n = ge.ifs.length;
    for (i = 0; i < n; ++i) {
        this.annotateSource(ge.ifs[i]);

        ifres = this.vexpr(ge.ifs[i]);
        this._jumpfalse(ifres, start);
    }

    if (++genIndex < generators.length) {
        this.cgenexpgen(generators, genIndex, elt);
    }

    if (genIndex >= generators.length) {
        this.annotateSource(elt);

        velt = this.vexpr(elt);
        out("return [", skip, "/*resume*/,", velt, "/*ret*/];");
        this.setBlock(skip);
    }

    this._jump(start);

    this.setBlock(end);

    if (genIndex === 1) {
        out("return Sk.builtin.none.none$;");
    }
};

Compiler.prototype.cgenexp = function (e) {
    var gen = this.buildcodeobj(e, new Sk.builtin.str("<genexpr>"), null, null, function (scopename) {
        this.cgenexpgen(e.generators, 0, e.elt);
    });

    // call the generator maker to get the generator. this is kind of dumb,
    // but the code builder builds a wrapper that makes generators for normal
    // function generators, so we just do it outside (even just new'ing it
    // inline would be fine).
    var gener = this._gr("gener", "Sk.misceval.callsim(", gen, ");");
    // stuff the outermost iterator into the generator after evaluating it
    // outside of the function. it's retrieved by the fixed name above.
    out(gener, ".gi$locals.$iter0=Sk.abstr.iter(", this.vexpr(e.generators[0].iter), ");");
    return gener;
};


Compiler.prototype.cclass = function (s) {
    var wrapped;
    var entryBlock;
    var scopename;
    var bases;
    var decos;
    goog.asserts.assert(s instanceof ClassDef);
    decos = s.decorator_list;

    // decorators and bases need to be eval'd out here
    //this.vseqexpr(decos);

    bases = this.vseqexpr(s.bases);

    scopename = this.enterScope(s.name, s, s.lineno);
    entryBlock = this.newBlock("class entry");

    this.u.prefixCode = "var " + scopename + "=(function $" + s.name.v + "$class_outer($globals,$locals,$rest){var $gbl=$globals,$loc=$locals;";
    this.u.switchCode += "(function $" + s.name.v + "$_closure(){";
    this.u.switchCode += "var $blk=" + entryBlock + ",$exc=[],$ret=undefined,$currLineNo=undefined,$currColNo=undefined;"
    if (Sk.execLimit !== null) {
        this.u.switchCode += "if (typeof Sk.execStart === 'undefined') {Sk.execStart = Date.now()}";
    }
    if (Sk.yieldLimit !== null && this.u.canSuspend) {
        this.u.switchCode += "if (typeof Sk.lastYield === 'undefined') {Sk.lastYield = Date.now()}";
    }

    this.u.switchCode += "while(true){try{";
    this.u.switchCode += this.outputInterruptTest();
    this.u.switchCode += "switch($blk){";
    this.u.suffixCode = "}}catch(err){ if (!(err instanceof Sk.builtin.BaseException)) { err = new Sk.builtin.ExternalError(err); } err.traceback.push({lineno: $currLineNo, colno: $currColNo, filename: '"+this.filename+"'}); if ($exc.length>0) { $err = err; $blk=$exc.pop(); continue; } else { throw err; }}}"
    this.u.suffixCode += "}).apply(null,$rest);});";

    this.u.private_ = s.name;

    this.cbody(s.body);
    out("return;");

    // build class

    // apply decorators

    this.exitScope();

    // todo; metaclass
    wrapped = this._gr("built", "Sk.misceval.buildClass($gbl,", scopename, ",", s.name["$r"]().v, ",[", bases, "])");

    // store our new class under the right name
    this.nameop(s.name, Store, wrapped);
};

Compiler.prototype.ccontinue = function (s) {
    if (this.u.continueBlocks.length === 0) {
        throw new SyntaxError("'continue' outside loop");
    }
    // todo; continue out of exception blocks
    this._jump(this.u.continueBlocks[this.u.continueBlocks.length - 1]);
};

/**
 * compiles a statement
 */
Compiler.prototype.vstmt = function (s) {
    var i;
    var val;
    var n;
    var debugBlock;
    this.u.lineno = s.lineno;
    this.u.linenoSet = false;
    this.u.localtemps = [];

    if (Sk.debugging && this.u.canSuspend) {
        debugBlock = this.newBlock("debug breakpoint for line "+s.lineno);
        out("if (Sk.breakpoints('"+this.filename+"',"+s.lineno+","+s.col_offset+")) {",
            "var $susp = $saveSuspension({data: {type: 'Sk.debug'}, resume: function() {}}, '"+this.filename+"',"+s.lineno+","+s.col_offset+");",
            "$susp.$blk = "+debugBlock+";",
            "$susp.optional = true;",
            "return $susp;",
            "}");
        this._jump(debugBlock);
        this.setBlock(debugBlock);
        this.u.doesSuspend = true;
    }

    this.annotateSource(s);

    switch (s.constructor) {
        case FunctionDef:
            this.cfunction(s);
            break;
        case ClassDef:
            this.cclass(s);
            break;
        case Return_:
            if (this.u.ste.blockType !== FunctionBlock) {
                throw new SyntaxError("'return' outside function");
            }
            if (s.value) {
                out("return ", this.vexpr(s.value), ";");
            }
            else {
                out("return Sk.builtin.none.none$;");
            }
            break;
        case Delete_:
            this.vseqexpr(s.targets);
            break;
        case Assign:
            n = s.targets.length;
            val = this.vexpr(s.value);
            for (i = 0; i < n; ++i) {
                this.vexpr(s.targets[i], val);
            }
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
        case Raise:
            return this.craise(s);
        case TryExcept:
            return this.ctryexcept(s);
        case TryFinally:
            return this.ctryfinally(s);
        case Assert:
            return this.cassert(s);
        case Import_:
            return this.cimport(s);
        case ImportFrom:
            return this.cfromimport(s);
        case Global:
            break;
        case Expr:
            this.vexpr(s.value);
            break;
        case Pass:
            break;
        case Break_:
            if (this.u.breakBlocks.length === 0) {
                throw new SyntaxError("'break' outside loop");
            }
            this._jump(this.u.breakBlocks[this.u.breakBlocks.length - 1]);
            break;
        case Continue_:
            this.ccontinue(s);
            break;
        case Debugger_:
            out("debugger;");
            break;
        default:
            goog.asserts.fail("unhandled case in vstmt");
    }
};

Compiler.prototype.vseqstmt = function (stmts) {
    var i;
    for (i = 0; i < stmts.length; ++i) {
        this.vstmt(stmts[i]);
    }
};

var OP_FAST = 0;
var OP_GLOBAL = 1;
var OP_DEREF = 2;
var OP_NAME = 3;
var D_NAMES = 0;
var D_FREEVARS = 1;
var D_CELLVARS = 2;

Compiler.prototype.isCell = function (name) {
    var mangled = mangleName(this.u.private_, name).v;
    var scope = this.u.ste.getScope(mangled);
    var dict = null;
    return scope === CELL;

};

/**
 * @param {Sk.builtin.str} name
 * @param {Object} ctx
 * @param {string=} dataToStore
 */
Compiler.prototype.nameop = function (name, ctx, dataToStore) {
    var v;
    var mangledNoPre;
    var dict;
    var scope;
    var optype;
    var op;
    var mangled;
    if ((ctx === Store || ctx === AugStore || ctx === Del) && name.v === "__debug__") {
        throw new Sk.builtin.SyntaxError("can not assign to __debug__");
    }
    if ((ctx === Store || ctx === AugStore || ctx === Del) && name.v === "None") {
        throw new Sk.builtin.SyntaxError("can not assign to None");
    }

    if (name.v === "None") {
        return "Sk.builtin.none.none$";
    }
    if (name.v === "True") {
        return "Sk.builtin.bool.true$";
    }
    if (name.v === "False") {
        return "Sk.builtin.bool.false$";
    }
    if (name.v === "NotImplemented") {
        return "Sk.builtin.NotImplemented.NotImplemented$";
    }

    mangled = mangleName(this.u.private_, name).v;
    // Have to do this before looking it up in the scope
    mangled = fixReservedNames(mangled);
    op = 0;
    optype = OP_NAME;
    scope = this.u.ste.getScope(mangled);
    dict = null;
    switch (scope) {
        case FREE:
            dict = "$free";
            optype = OP_DEREF;
            break;
        case CELL:
            dict = "$cell";
            optype = OP_DEREF;
            break;
        case LOCAL:
            // can't do FAST in generators or at module/class scope
            if (this.u.ste.blockType === FunctionBlock && !this.u.ste.generator) {
                optype = OP_FAST;
            }
            break;
        case GLOBAL_IMPLICIT:
            if (this.u.ste.blockType === FunctionBlock) {
                optype = OP_GLOBAL;
            }
            break;
        case GLOBAL_EXPLICIT:
            optype = OP_GLOBAL;
        default:
            break;
    }

    // have to do this after looking it up in the scope
    mangled = fixReservedWords(mangled);

    //print("mangled", mangled);
    // TODO TODO TODO todo; import * at global scope failing here
    goog.asserts.assert(scope || name.v.charAt(1) === "_");

    // in generator or at module scope, we need to store to $loc, rather that
    // to actual JS stack variables.
    mangledNoPre = mangled;
    if (this.u.ste.generator || this.u.ste.blockType !== FunctionBlock) {
        mangled = "$loc." + mangled;
    }
    else if (optype === OP_FAST || optype === OP_NAME) {
        this.u.localnames.push(mangled);
    }

    switch (optype) {
        case OP_FAST:
            switch (ctx) {
                case Load:
                case Param:
                    // Need to check that it is bound!
                    out("if (", mangled, " === undefined) { throw new Sk.builtin.UnboundLocalError('local variable \\\'", mangled, "\\\' referenced before assignment'); }\n");
                    return mangled;
                case Store:
                    out(mangled, "=", dataToStore, ";");
                    break;
                case Del:
                    out("delete ", mangled, ";");
                    break;
                default:
                    goog.asserts.fail("unhandled");
            }
            break;
        case OP_NAME:
            switch (ctx) {
                case Load:
                    // can't be || for loc.x = 0 or null
                    return this._gr("loadname", mangled, "!==undefined?", mangled, ":Sk.misceval.loadname('", mangledNoPre, "',$gbl);");
                case Store:
                    out(mangled, "=", dataToStore, ";");
                    break;
                case Del:
                    out("delete ", mangled, ";");
                    break;
                case Param:
                    return mangled;
                default:
                    goog.asserts.fail("unhandled");
            }
            break;
        case OP_GLOBAL:
            switch (ctx) {
                case Load:
                    return this._gr("loadgbl", "Sk.misceval.loadname('", mangledNoPre, "',$gbl)");
                case Store:
                    out("$gbl.", mangledNoPre, "=", dataToStore, ";");
                    break;
                case Del:
                    out("delete $gbl.", mangledNoPre);
                    break;
                default:
                    goog.asserts.fail("unhandled case in name op_global");
            }
            break;
        case OP_DEREF:
            switch (ctx) {
                case Load:
                    return dict + "." + mangledNoPre;
                case Store:
                    out(dict, ".", mangledNoPre, "=", dataToStore, ";");
                    break;
                case Param:
                    return mangledNoPre;
                default:
                    goog.asserts.fail("unhandled case in name op_deref");
            }
            break;
        default:
            goog.asserts.fail("unhandled case");
    }
};

/**
 * @param {Sk.builtin.str} name
 * @param {Object} key
 * @param {number} lineno
 * @param {boolean=} canSuspend
 */
Compiler.prototype.enterScope = function (name, key, lineno, canSuspend) {
    var scopeName;
    var u = new CompilerUnit();
    u.ste = this.st.getStsForAst(key);
    u.name = name;
    u.firstlineno = lineno;
    u.canSuspend = canSuspend || false;

    if (this.u && this.u.private_) {
        u.private_ = this.u.private_;
    }

    this.stack.push(this.u);
    this.allUnits.push(u);
    scopeName = this.gensym("scope");
    u.scopename = scopeName;

    this.u = u;
    this.u.activateScope();

    this.nestlevel++;

    return scopeName;
};

Compiler.prototype.exitScope = function () {
    var mangled;
    var prev = this.u;
    this.nestlevel--;
    if (this.stack.length - 1 >= 0) {
        this.u = this.stack.pop();
    }
    else {
        this.u = null;
    }
    if (this.u) {
        this.u.activateScope();
    }

    if (prev.name.v !== "<module>") {// todo; hacky
        mangled = prev.name["$r"]().v;
        mangled = mangled.substring(1, mangled.length - 1);
        mangled = fixReservedWords(mangled);
        mangled = fixReservedNames(mangled);
        out(prev.scopename, ".co_name=new Sk.builtins['str']('", mangled, "');");
    }
};

Compiler.prototype.cbody = function (stmts) {
    var i;
    for (i = 0; i < stmts.length; ++i) {
        this.vstmt(stmts[i]);
    }
};

Compiler.prototype.cprint = function (s) {
    var i;
    var n;
    var dest;
    goog.asserts.assert(s instanceof Print);
    dest = "null";
    if (s.dest) {
        dest = this.vexpr(s.dest);
    }

    n = s.values.length;
    // todo; dest disabled
    for (i = 0; i < n; ++i) {
        out("Sk.misceval.print_(", /*dest, ',',*/ "new Sk.builtins['str'](", this.vexpr(s.values[i]), ").v);");
    }
    if (s.nl) {
        out("Sk.misceval.print_(", /*dest, ',*/ "\"\\n\");");
    }
};
Compiler.prototype.cmod = function (mod) {
    //print("-----");
    //print(Sk.astDump(mod));
    var modf = this.enterScope(new Sk.builtin.str("<module>"), mod, 0, this.canSuspend);

    var entryBlock = this.newBlock("module entry");
    this.u.prefixCode = "var " + modf + "=(function($modname){";
    this.u.varDeclsCode =
        "var $gbl = {}, $blk=" + entryBlock +
        ",$exc=[],$loc=$gbl,$err=undefined;$gbl.__name__=$modname;$loc.__file__=new Sk.builtins.str('" + this.filename +
        "');var $ret=undefined,$currLineNo=undefined,$currColNo=undefined;";

    if (Sk.execLimit !== null) {
        this.u.varDeclsCode += "if (typeof Sk.execStart === 'undefined') {Sk.execStart = Date.now()}";
    }

    if (Sk.yieldLimit !== null && this.u.canSuspend) {
        this.u.varDeclsCode += "if (typeof Sk.lastYield === 'undefined') {Sk.lastYield = Date.now()}";
    }

    this.u.varDeclsCode += "if ("+modf+".$wakingSuspension!==undefined) { $wakeFromSuspension(); }" +
        "if (Sk.retainGlobals) {" +
        "    if (Sk.globals) { $gbl = Sk.globals; Sk.globals = $gbl; $loc = $gbl; }" +
        "    else { Sk.globals = $gbl; }" +
        "} else { Sk.globals = $gbl; }";

    // Add the try block that pops the try/except stack if one exists
    // Github Issue #38
    // Google Code Issue: 109 / 114

    // Old code:
    //this.u.switchCode = "while(true){switch($blk){";
    //this.u.suffixCode = "}}});";

    // New Code:
    this.u.switchCode = "while(true){try{";
    this.u.switchCode += this.outputInterruptTest();
    this.u.switchCode += "switch($blk){";
    this.u.suffixCode = "}"
    this.u.suffixCode += "}catch(err){ if (!(err instanceof Sk.builtin.BaseException)) { err = new Sk.builtin.ExternalError(err); } err.traceback.push({lineno: $currLineNo, colno: $currColNo, filename: '"+this.filename+"'}); if ($exc.length>0) { $err = err; $blk=$exc.pop(); continue; } else { throw err; }} } });";

    // Note - this change may need to be adjusted for all the other instances of
    // switchCode and suffixCode in this file.  Not knowing how to test those
    // other cases I left them alone.   At least the changes to
    // setupExcept and endExcept will insure that the generated JavaScript
    // will be syntactically correct.  The worst that will happen is that when
    // code in a try block blows up, we will not know to run the except block.
    // The other problem is that we might catch something that is really an internal
    // error - it might be nice to add code in the above catch block that looked at
    // the kind of exception and only popped the stack for exceptions that are
    // from the original code rather than artifacts of some code generation or
    // exeution environment error.  We at least err on the side of exceptions
    // being revealed to the user.  drchuck - Wed Jan 23 19:20:18 EST 2013

    switch (mod.constructor) {
        case Module:
            this.cbody(mod.body);
            out("return $loc;");
            break;
        default:
            goog.asserts.fail("todo; unhandled case in compilerMod");
    }
    this.exitScope();

    this.result.push(this.outputAllUnits());
    return modf;
};

/**
 * @param {string} source the code
 * @param {string} filename where it came from
 * @param {string} mode one of 'exec', 'eval', or 'single'
 * @param {boolean=} canSuspend if the generated code supports suspension
 */
Sk.compile = function (source, filename, mode, canSuspend) {
    //print("FILE:", filename);
    var parse = Sk.parse(filename, source);
    var ast = Sk.astFromParse(parse.cst, filename, parse.flags);

    // compilers flags, later we can add other ones too
    var flags = {};
    flags.cf_flags = parse.flags;

    var st = Sk.symboltable(ast, filename);
    var c = new Compiler(filename, st, flags.cf_flags, canSuspend, source); // todo; CO_xxx
    var funcname = c.cmod(ast);

    var ret = c.result.join("");
    return {
        funcname: funcname,
        code    : ret
    };
};

goog.exportSymbol("Sk.compile", Sk.compile);

Sk.resetCompiler = function () {
    Sk.gensymcount = 0;
};

goog.exportSymbol("Sk.resetCompiler", Sk.resetCompiler);
