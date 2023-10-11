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

    this.consts = {};

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
    // state of where to go on a return
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
    Sk.asserts.assert(this.source);
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

        Sk.asserts.assert(ast.lineno !== undefined && ast.col_offset !== undefined);
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

var reservedWords_ = Sk.builtin.str.reservedWords_; // defined in str.js


function fixReserved(name) {
    if (reservedWords_[name] === undefined) {
        return name;
    }
    return name + "_$rw$";
}

const reservedSuffix = /_\$rw\$$/;
function unfixReserved(name) {
    return name.replace(reservedSuffix, "");
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
 * @param {...*} rest
 */
Compiler.prototype.makeConstant = function (rest) {
    var i;
    var v;
    var val = "";
    var cval;

    // Construct constant value
    for (i = 0; i < arguments.length; ++i) {
        val += arguments[i];
    }

    // Check if we've already defined this exact constant
    for (var constant in this.u.consts) {
        if (this.u.consts.hasOwnProperty(constant)) {
            cval = this.u.consts[constant];
            if (cval == val) {
                // We have, just use it
                return constant;
            }
        }
    }

    // We have not, build new one
    v = this.u.scopename + "." + this.gensym("const");
    this.u.consts[v] = val;
    return v;
};

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
            output += "if ($dateNow - Sk.execStart > Sk.execLimit) {throw new Sk.builtin.TimeoutError(Sk.timeoutMsg())}";
        }
        if (Sk.yieldLimit !== null && this.u.canSuspend) {
            output += "if (!$waking && ($dateNow - Sk.lastYield > Sk.yieldLimit)) {";
            output += "var $susp = $saveSuspension({data: {type: 'Sk.yield'}, resume: function() {}}, '"+this.filename+"',$currLineNo,$currColNo);";
            output += "$susp.$blk = $blk;";
            output += "$susp.optional = true;";
            output += "return $susp;";
            output += "}";
            output += "$waking = false;";
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

Compiler.prototype._jumpnotundef = function (test, block) {
    out("if(", test, "!==undefined){$blk=", block, ";continue;}");
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
Compiler.prototype.cunpackstarstoarray = function(elts, permitEndOnly) {
    if (!elts || elts.length == 0) {
        return "[]";
    }

    let hasStars = false;
    // If there are no stars, we have a nice fast path here
    for (let elt of elts) {
        if (permitEndOnly && hasStars) {
            throw new Sk.builtin.SyntaxError("Extended argument unpacking is not permitted in Python 2");
        }
        if (elt.constructor === Sk.astnodes.Starred) {
            hasStars = true;
        }
    }

    if (hasStars) {
        // Slow path
        let arr = this._gr("unpack", "[]");
        for (let elt of elts) {
            if (elt.constructor !== Sk.astnodes.Starred) {
                out(arr,".push(",this.vexpr(elt),");");
            } else {
                out("$ret = Sk.misceval.iterFor(Sk.abstr.iter(",this.vexpr(elt.value),"), function(e) { ",arr,".push(e); });");
                this._checkSuspension();
            }
        }
        return arr;
    } else {
        // Fast path
        return "[" + elts.map((expr) => this.vexpr(expr)).join(",") + "]";
    }
};

Compiler.prototype.cunpackkwstoarray = function (keywords, codeobj) {
        
    let keywordArgs = "undefined";

    if (keywords && keywords.length > 0) {
        let hasStars = false;
        const kwarray = [];
        for (let kw of keywords) {
            if (hasStars && !Sk.__future__.python3) {
                throw new SyntaxError("Advanced unpacking of function arguments is not supported in Python 2");
            }
            if (kw.arg) {
                kwarray.push("'" + kw.arg.v + "'");
                kwarray.push(this.vexpr(kw.value));
            } else {
                hasStars = true;
            }
        }
        keywordArgs = "[" + kwarray.join(",") + "]";
        if (hasStars) {
            keywordArgs = this._gr("keywordArgs", keywordArgs);
            for (let kw of keywords) {
                if (!kw.arg) {
                    out("$ret = Sk.abstr.mappingUnpackIntoKeywordArray(",keywordArgs,",",this.vexpr(kw.value),",",codeobj,");");
                    this._checkSuspension();
                }
            }
        }
    }
    return keywordArgs;
};

Compiler.prototype.ctuplelistorset = function(e, data, tuporlist) {
    var i;
    var items;
    var item;
    var allconsts;
    Sk.asserts.assert(tuporlist === "tuple" || tuporlist === "list" || tuporlist === "set");

    let hasStars = false;
    let starIdx;
    for (i = 0; i < e.elts.length; i++) {
        if (e.elts[i].constructor === Sk.astnodes.Starred) {
            hasStars = true;
            starIdx = i;
            break;
        }
    }

    if (e.ctx === Sk.astnodes.Store) {
        if (hasStars) {
            if (!Sk.__future__.python3) {
                throw new Sk.builtin.SyntaxError("assignment unpacking with stars is not supported in Python 2", this.filename, e.lineno);
            }
            for (i = starIdx + 1; i < e.elts.length; i++) {
                if (e.elts[i].constructor === Sk.astnodes.Starred) {
                    throw new Sk.builtin.SyntaxError("multiple starred expressions in assignment", this.filename, e.lineno);
                }
            }
        }
        const breakIdx = hasStars ? starIdx : e.elts.length;
        const numvals = hasStars ? e.elts.length - 1 : breakIdx;
        out("$ret = Sk.abstr.sequenceUnpack(" + data + "," + breakIdx + "," + numvals + ", " + hasStars + ");");
        this._checkSuspension();
        items = this._gr("items", "$ret");
        
        for (i = 0; i < e.elts.length; ++i) {
            if (i === starIdx) {
                this.vexpr(e.elts[i].value, items + "[" + i + "]");
            } else {
                this.vexpr(e.elts[i], items + "[" + i + "]");
            }
        }
    } else if (e.ctx === Sk.astnodes.Load || tuporlist === "set") {
        //because set's can't be assigned to.

        if (hasStars) {
            if (!Sk.__future__.python3) {
                throw new Sk.builtin.SyntaxError("List packing with stars is not supported in Python 2");
            }
            return this._gr("load" + tuporlist, "new Sk.builtins['", tuporlist, "'](", this.cunpackstarstoarray(e.elts), ")");
        } else if (tuporlist === "tuple") {
            allconsts = true;
            items = [];
            for (i = 0; i < e.elts.length; ++i) {
                item = this.vexpr(e.elts[i]);

                // The following is an ugly check to see if item was
                // turned into a constant.  As vexpr returns a string,
                // this requires seeing if "$const" is contained
                // within it.  A better solution would require a
                // change to vexpr, which would be more invasive.
                if (allconsts && (item.indexOf("$const") == -1)) {
                    allconsts = false;
                }
                items.push(item);
            }

            if (allconsts) {
                return this.makeConstant("new Sk.builtin.tuple([" + items + "])");
            } else {
                for (i = 0; i < items.length; ++i) {
                    items[i] = this._gr("elem", items[i]);
                }
                return this._gr("load" + tuporlist, "new Sk.builtins['", tuporlist, "']([", items, "])");
            }
        } else {
            items = [];
            for (i = 0; i < e.elts.length; ++i) {
                items.push(this._gr("elem", this.vexpr(e.elts[i])));
            }
            return this._gr("load" + tuporlist, "new Sk.builtins['", tuporlist, "']([", items, "])");
        }
    }
};

Compiler.prototype.csubdict = function(e, begin, end) {
    const items = [];
    for (let i = begin; i < end; i++) {
        items.push(this.vexpr(e.keys[i]));
        items.push(this.vexpr(e.values[i])); 
    }
    return this._gr("loaddict", "new Sk.builtins['dict']([", items, "])");
}

Compiler.prototype.cdict = function (e) {
    let have_dict = 0;
    let is_unpacking = false;
    const n = e.values ? e.values.length : 0;
    let elements = 0;
    let main_dict;
    let sub_dict;

    for (let i = 0; i<n; i++) {
        is_unpacking = e.keys[i] === null;
        if (is_unpacking) {
            if (elements) {
                sub_dict = this.csubdict(e, i-elements, i);
                if (have_dict) {
                    out(main_dict, ".dict$merge(", sub_dict, ");");
                    // update the current dict (this won't suspend)
                } else {
                    main_dict = sub_dict;
                    have_dict = 1;
                }
                elements = 0;
            }
            if (have_dict === 0) {
                main_dict = this._gr("loaddict", "new Sk.builtins.dict([])");
                have_dict = 1;
            }
            sub_dict = this.vexpr(e.values[i]);
            out("$ret = ", main_dict, ".dict$merge(", sub_dict, ");");
            this._checkSuspension(e);
            // could suspend
        } else {
            elements ++;
        }
    }
    if (elements) {
        sub_dict = this.csubdict(e, n-elements, n)
        if (have_dict) {
            out(main_dict, ".dict$merge(", sub_dict, ");");
            // update the current dict (this won't suspend)
        } else {
            main_dict = sub_dict;
            have_dict = 1;
        }
    }
    if (have_dict === 0) {
        // add op buildmap
        main_dict = this._gr("loaddict", "new Sk.builtins.dict([])");
    }
    return main_dict;
};

Compiler.prototype.clistcomp = function(e) {
    Sk.asserts.assert(e instanceof Sk.astnodes.ListComp);
    var tmp = this._gr("_compr", "new Sk.builtins['list']([])"); // note: _ is impt. for hack in name mangling (same as cpy)
    return this.ccompgen("list", tmp, e.generators, 0, e.elt, null, e);
};

Compiler.prototype.cdictcomp = function(e) {
    Sk.asserts.assert(e instanceof Sk.astnodes.DictComp);
    var tmp = this._gr("_dcompr", "new Sk.builtins.dict([])");
    return this.ccompgen("dict", tmp, e.generators, 0, e.value, e.key, e);
};

Compiler.prototype.csetcomp = function(e) {
    Sk.asserts.assert(e instanceof Sk.astnodes.SetComp);
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

    n = l.ifs ? l.ifs.length : 0;
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
        } else if (type === "list") {
            out(tmpname, ".v.push(", lvalue, ");"); // todo;
        } else if (type === "set") {
            out(tmpname, ".v.mp$ass_subscript(", lvalue, ", true);");
        }
        this._jump(skip);
        this.setBlock(skip);
    }

    this._jump(start);

    this.setBlock(anchor);

    return tmpname;
};

Compiler.prototype.cyield = function(e) {
    if (this.u.ste.blockType !== Sk.SYMTAB_CONSTS.FunctionBlock) {
        throw new Sk.builtin.SyntaxError("'yield' outside function", this.filename, e.lineno);
    }
    var val = "Sk.builtin.none.none$",
        nextBlock;
    if (e.value) {
        val = this.vexpr(e.value);
    }
    nextBlock = this.newBlock("after yield");
    // return a pair: resume target block and yielded value
    out("return [/*resume*/", nextBlock, ",/*ret*/", val, "];");
    this.setBlock(nextBlock);
    return "$gen.gi$sentvalue"; // will either be none if none sent, or the value from gen.send(value)
};

Compiler.prototype.cyieldfrom = function (e) {
    if (this.u.ste.blockType !== Sk.SYMTAB_CONSTS.FunctionBlock) {
        throw new Sk.builtin.SyntaxError("'yield' outside function", this.filename, e.lineno);
    }
    var iterable = this.vexpr(e.value);
    // get the iterator we are yielding from and store it
    iterable = this._gr("iter", "Sk.abstr.iter(", iterable, ")");
    out("$gen." + iterable + "=", iterable, ";");
    var afterIter = this.newBlock("after iter");
    var afterBlock = this.newBlock("after yield from");
    this._jump(afterIter);
    this.setBlock(afterIter);
    var retval = this.gensym("retval");
    // We may have entered this block resuming from a yield
    // So get the iterable stored on $gen.
    out(iterable, "=$gen.", iterable, ";");
    out("var ", retval, ";");
    // fast path -> we're sending None (not sending a value) 
    // or we use gen.tp$iternext(true, val) (see generator.js) which is the equivalent of gen.send(val)
    out("if ($gen.gi$sentvalue === Sk.builtin.none.none$ || " + iterable + ".constructor === Sk.builtin.generator) {");
    out(    "$ret=", iterable, ".tp$iternext(true, $gen.gi$sentvalue);");
    out("} else {");
    var send = this.makeConstant("new Sk.builtin.str('send');");
    // slow path -> get the send method of the non-generator iterator and call it
    // throw anything other than a StopIteration
    out(    "$ret=Sk.misceval.tryCatch(");
    out(        "function(){");
    out(            "return Sk.misceval.callsimOrSuspendArray(Sk.abstr.gattr(", iterable, ",", send, "), [$gen.gi$sentvalue]);},");
    out(        "function (e) { ");
    out(            "if (e instanceof Sk.builtin.StopIteration) { ");
    out(                    iterable ,".gi$ret = e.$value;");
                            // store the return value on the iterator
                            // otherwise we lose it beause iterator code in skulpt relies on returning undefined;
                            // one day maybe we can use the js .next protocol {value: ret, done: true} ;-)
    out(                    "return undefined;"); 
    out(            "} else { throw e; }");
    out(        "}");
    out(    ");");
    out("}");
    this._checkSuspension(e);
    out(retval, "=$ret;");
    // if the iterator is done (undefined) and we still have an unused sent value, it will be in `[iterable].gi$ret`, so we grab it from there and move on from the `yield from` ("afterBlock")
    out("if(", retval, "===undefined) {");
    out(    "$gen.gi$sentvalue=$gen." + iterable + ".gi$ret;");
    out(    "$blk=", afterBlock, ";continue;");
    out("}");
    out("return [/*resume*/", afterIter, ",/*ret*/", retval, "];");
    this.setBlock(afterBlock);
    return "$gen.gi$sentvalue"; // will either be none if none sent, or the value retuned from gen.send(value)
};


Compiler.prototype.ccompare = function (e) {
    var res;
    var rhs;
    var i;
    var fres;
    var done;
    var n;
    var cur;
    Sk.asserts.assert(e.ops.length === e.comparators.length);
    cur = this.vexpr(e.left);
    n = e.ops.length;
    done = this.newBlock("done");
    fres = this._gr("compareres", "null");

    for (i = 0; i < n; ++i) {
        rhs = this.vexpr(e.comparators[i]);
        const op = e.ops[i];
        if (op === Sk.astnodes.Is) {
            out("$ret = ", cur, "===", rhs, ";");
        } else if (op === Sk.astnodes.IsNot) {
            out("$ret = ", cur, "!==", rhs, ";");
        } else{
            out("$ret = Sk.misceval.richCompareBool(", cur, ",", rhs, ",'", op.prototype._astname, "', true);");
            this._checkSuspension(e);
        }
        out(fres, "=Sk.builtin.bool($ret);");
        this._jumpfalse("$ret", done);
        cur = rhs;
    }
    this._jump(done);
    this.setBlock(done);
    return fres;
};

Compiler.prototype.ccall = function (e) {
    var func = this.vexpr(e.func);
    var kwarray = null;
    // Okay, here's the deal. We have some set of positional args
    // and we need to unpack them. We have some set of keyword args
    // and we need to unpack those too. Then we make a call.
    // The existing Sk.misceval.call() and .apply() signatures do not
    // help us here; we do it by hand.

    let positionalArgs = this.cunpackstarstoarray(e.args, !Sk.__future__.python3);
    let keywordArgs = this.cunpackkwstoarray(e.keywords, func);

    if (Sk.__future__.super_args && e.func.id && e.func.id.v === "super" && positionalArgs === "[]") {
        // make sure there is a self variable
        // note that it's part of the js API spec: https://developer.mozilla.org/en/docs/Web/API/Window/self
        // so we should probably add self to the mangling
        // TODO: feel free to ignore the above
        this.u.tempsToSave.push("$sup");
        out("if (typeof $sup === \"undefined\") { throw new Sk.builtin.RuntimeError(\"super(): no arguments\") };");
        positionalArgs = "[$gbl.__class__,$sup]";
    }
    out ("$ret = (",func,".tp$call)?",func,".tp$call(",positionalArgs,",",keywordArgs,") : Sk.misceval.applyOrSuspend(",func,",undefined,undefined,",keywordArgs,",",positionalArgs,");");

    this._checkSuspension(e);

    return this._gr("call", "$ret");
};

Compiler.prototype.cslice = function (s) {
    var step;
    var high;
    var low;
    Sk.asserts.assert(s instanceof Sk.astnodes.Slice);
    if (Sk.__future__.python3) {
        low = s.lower ? this.vexpr(s.lower) : "Sk.builtin.none.none$";
        high = s.upper ? this.vexpr(s.upper) : "Sk.builtin.none.none$";
        step = s.step ? this.vexpr(s.step) : "Sk.builtin.none.none$";
    } else {
        // This implements Python 2's idea of slice literals, which is...idiosyncratic.
        // The rules for when you get None, and when you get an arbitrary integer (0 or maxint)
        // seem pretty arbitrary. Python 3's are much saner.
        low = s.lower ? this.vexpr(s.lower) : s.step ? "Sk.builtin.none.none$" : "new Sk.builtin.int_(0)"; // todo;ideally, these numbers would be constants
        high = s.upper ? this.vexpr(s.upper) : s.step ? "Sk.builtin.none.none$" : "new Sk.builtin.int_(2147483647)";
        step = s.step ? this.vexpr(s.step) : "Sk.builtin.none.none$";
    }
    return this._gr("slice", "new Sk.builtins['slice'](", low, ",", high, ",", step, ")");
};

Compiler.prototype.eslice = function (dims) {
    var i;
    var dimSubs, subs;
    Sk.asserts.assert(dims instanceof Array);
    dimSubs = [];
    for (i = 0; i < dims.length; i++) {
        dimSubs.push(this.vslicesub(dims[i]));
    }
    return this._gr("extslice", "new Sk.builtins['tuple']([", dimSubs, "])");
};

Compiler.prototype.vslicesub = function (s) {
    var subs;
    switch (s.constructor) {
        case Sk.astnodes.Index:
            subs = this.vexpr(s.value);
            break;
        case Sk.astnodes.Slice:
            subs = this.cslice(s);
            break;
        case Sk.astnodes.Ellipsis:
            Sk.asserts.fail("todo compile.js Ellipsis;");
            break;
        case Sk.astnodes.ExtSlice:
            subs = this.eslice(s.dims);
            break;
        default:
            Sk.asserts.fail("invalid subscript kind");
    }
    return subs;
};

Compiler.prototype.vslice = function (s, ctx, obj, dataToStore) {
    var subs = this.vslicesub(s);
    return this.chandlesubscr(ctx, obj, subs, dataToStore);
};

Compiler.prototype.chandlesubscr = function (ctx, obj, subs, data) {
    if (ctx === Sk.astnodes.Load || ctx === Sk.astnodes.AugLoad) {
        out("$ret = Sk.abstr.objectGetItem(", obj, ",", subs, ", true);");
        this._checkSuspension();
        return this._gr("lsubscr", "$ret");
    } else if (ctx === Sk.astnodes.Store || ctx === Sk.astnodes.AugStore) {
        out("$ret = Sk.abstr.objectSetItem(", obj, ",", subs, ",", data, ", true);");
        this._checkSuspension();
    } else if (ctx === Sk.astnodes.Del) {
        out("Sk.abstr.objectDelItem(", obj, ",", subs, ");");
    } else {
        Sk.asserts.fail("handlesubscr fail");
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
    Sk.asserts.assert(e instanceof Sk.astnodes.BoolOp);
    if (e.op === Sk.astnodes.And) {
        jtype = this._jumpfalse;
    } else {
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


Compiler.prototype.cjoinedstr = function (e) {
    let ret;
    Sk.asserts.assert(e instanceof Sk.astnodes.JoinedStr);

    for (let s of e.values) {
        let v = this.vexpr(s);
        if (!ret) {
            ret = this._gr("joinedstr", v);
        } else {
            out(ret,"=",ret,".sq$concat(",v,");");
        }
    }

    if (!ret) {
        ret = "Sk.builtin.str.$emptystr";
    }

    return ret;
};

Compiler.prototype.cformattedvalue = function(e) {
    let value = this.vexpr(e.value);
    switch (e.conversion) {
        case "s":
            value = this._gr("value", "new Sk.builtin.str(",value,")");
            break;
        case "a":
            value = this._gr("value", "Sk.builtin.ascii(",value,")");
            break;
        case "r":
            value = this._gr("value", "Sk.builtin.repr(",value,")");
            break;
    }
    let formatSpec = (e.format_spec ? this.vexpr(e.format_spec) : "Sk.builtin.str.$emptystr");
    return this._gr("formatted", "Sk.abstr.objectFormat("+value+","+formatSpec+")");
};

function getJsLiteralForString(s) {
    let r = "\"";
    for (let i = 0; i < s.length; i++) {
        let c = s.charCodeAt(i);
        // Escape quotes, anything before space, and anything non-ASCII
        if (c == 0x0a) {
            r += "\\n";
        } else if (c == 92) {
            r += "\\\\";
        } else if (c == 34 || c < 32 || c >= 0x7f && c < 0x100) {
            r += "\\x" + ("0" + c.toString(16)).substr(-2);
        } else if (c >= 0x100) {
            r += "\\u" + ("000" + c.toString(16)).substr(-4);
        } else {
            r += s.charAt(i);
        }
    }
    r += "\"";
    return r;
}

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
    var mangled, mname;
    var val;
    var result;
    var nStr; // used for preserving signs for floats (zeros)
    if (e.lineno > this.u.lineno) {
        this.u.lineno = e.lineno;
        this.u.linenoSet = false;
    }
    //this.annotateSource(e);
    switch (e.constructor) {
        case Sk.astnodes.BoolOp:
            return this.cboolop(e);
        case Sk.astnodes.BinOp:
            return this._gr("binop", "Sk.abstr.numberBinOp(", this.vexpr(e.left), ",", this.vexpr(e.right), ",'", e.op.prototype._astname, "')");
        case Sk.astnodes.UnaryOp:
            return this._gr("unaryop", "Sk.abstr.numberUnaryOp(", this.vexpr(e.operand), ",'", e.op.prototype._astname, "')");
        case Sk.astnodes.Lambda:
            return this.clambda(e);
        case Sk.astnodes.IfExp:
            return this.cifexp(e);
        case Sk.astnodes.Dict:
            return this.cdict(e);
        case Sk.astnodes.ListComp:
            return this.clistcomp(e);
        case Sk.astnodes.DictComp:
            return this.cdictcomp(e);
        case Sk.astnodes.SetComp:
            return this.csetcomp(e);
        case Sk.astnodes.GeneratorExp:
            return this.cgenexp(e);
        case Sk.astnodes.Yield:
            return this.cyield(e);
        case Sk.astnodes.YieldFrom:
            return this.cyieldfrom(e);
        case Sk.astnodes.Compare:
            return this.ccompare(e);
        case Sk.astnodes.Call:
            result = this.ccall(e);
            // After the function call, we've returned to this line
            this.annotateSource(e);
            return result;
        case Sk.astnodes.Num:
            if (typeof e.n === "number") {
                return e.n;
            } else if (e.n instanceof Sk.builtin.lng) {
                return this.makeConstant("new Sk.builtin.lng('" + e.n.v.toString() + "')"); 
            } else if (e.n instanceof Sk.builtin.int_) {
                if (typeof e.n.v === "number") {
                    return this.makeConstant("new Sk.builtin.int_(" + e.n.v + ")");
                }
                return this.makeConstant("new Sk.builtin.int_('" + e.n.v.toString() + "')"); 
            } else if (e.n instanceof Sk.builtin.float_) {
                // Preserve sign of zero for floats
                nStr = e.n.v === 0 && 1/e.n.v === -Infinity ? "-0" : e.n.v;
                return this.makeConstant("new Sk.builtin.float_(" + nStr + ")");
            } else if (e.n instanceof Sk.builtin.complex) {
                // preserve sign of zero here too
                var real_val = e.n.real === 0 && 1/e.n.real === -Infinity ? "-0" : e.n.real;
                var imag_val = e.n.imag === 0 && 1/e.n.imag === -Infinity ? "-0" : e.n.imag;
                return this.makeConstant("new Sk.builtin.complex(" + real_val + ", " + imag_val + ")");
            }
            Sk.asserts.fail("unhandled Num type");
        case Sk.astnodes.Bytes:
            if (Sk.__future__.python3) {
                const source = [];
                const str = e.s.$jsstr();
                for (let i = 0; i < str.length; i++) {
                    source.push(str.charCodeAt(i));
                }
                return this.makeConstant("new Sk.builtin.bytes([", source.join(", "), "])");
            }
            // else fall through and make a string instead
        case Sk.astnodes.Str:
            return this.makeConstant("new Sk.builtin.str(", getJsLiteralForString(e.s.$jsstr()), ")");
        case Sk.astnodes.Attribute:
            if (e.ctx !== Sk.astnodes.AugLoad && e.ctx !== Sk.astnodes.AugStore) {
                val = this.vexpr(e.value);
            }
            mangled = e.attr["$r"]().v;
            mangled = mangled.substring(1, mangled.length - 1);
            mangled = mangleName(this.u.private_, new Sk.builtin.str(mangled)).v;
            mname = this.makeConstant("new Sk.builtin.str('" + mangled + "')");
            switch (e.ctx) {
                case Sk.astnodes.AugLoad:
                    out("$ret = ", augvar, ".tp$getattr(", mname, ", true);");
                    this._checkSuspension(e);
                    out("\nif ($ret === undefined) {");
                    out("\nthrow new Sk.builtin.AttributeError(", augvar, ".sk$attrError() + \" has no attribute '\" + ", mname,".$jsstr() + \"'\");");
                    out("\n};");
                    return this._gr("lattr", "$ret");
                case Sk.astnodes.Load:
                    out("$ret = ", val, ".tp$getattr(", mname, ", true);");
                    this._checkSuspension(e);
                    out("\nif ($ret === undefined) {");
                    out("\nthrow new Sk.builtin.AttributeError(", val, ".sk$attrError() + \" has no attribute '\" + ", mname,".$jsstr() + \"'\");");
                    out("\n};");
                    return this._gr("lattr", "$ret");
                case Sk.astnodes.AugStore:
                    // To be more correct, we shouldn't sattr() again if the in-place update worked.
                    // At the time of writing (26/Feb/2015), Sk.abstr.numberInplaceBinOp never returns undefined,
                    // so this will never *not* execute. But it could, if Sk.abstr.numberInplaceBinOp were fixed.
                    out("$ret = undefined;");
                    out("if(", data, "!==undefined){");
                    out("$ret = ",augvar, ".tp$setattr(", mname, ",", data, ", true);");
                    out("}");
                    this._checkSuspension(e);
                    break;
                case Sk.astnodes.Store:
                    out("$ret = ", val, ".tp$setattr(", mname, ",", data, ", true);");
                    this._checkSuspension(e);
                    break;
                case Sk.astnodes.Del:
                    out("$ret = ", val, ".tp$setattr(", mname, ", undefined, true);");
                    this._checkSuspension(e);
                    break;
                case Sk.astnodes.Param:
                default:
                    Sk.asserts.fail("invalid attribute expression");
            }
            break;
        case Sk.astnodes.Subscript:
            switch (e.ctx) {
                case Sk.astnodes.AugLoad:
                    out("$ret = Sk.abstr.objectGetItem(",augvar,",",augsubs,", true);");
                    this._checkSuspension(e);
                    return this._gr("gitem", "$ret");
                case Sk.astnodes.Load:
                case Sk.astnodes.Store:
                case Sk.astnodes.Del:
                    return this.vslice(e.slice, e.ctx, this.vexpr(e.value), data);
                case Sk.astnodes.AugStore:
                    // To be more correct, we shouldn't sattr() again if the in-place update worked.
                    // At the time of writing (26/Feb/2015), Sk.abstr.numberInplaceBinOp never returns undefined,
                    // so this will never *not* execute. But it could, if Sk.abstr.numberInplaceBinOp were fixed.

                    out("$ret=undefined;");
                    out("if(", data, "!==undefined){");
                    out("$ret=Sk.abstr.objectSetItem(",augvar,",",augsubs,",",data,", true)");
                    out("}");
                    this._checkSuspension(e);
                    break;
                case Sk.astnodes.Param:
                default:
                    Sk.asserts.fail("invalid subscript expression");
            }
            break;
        case Sk.astnodes.Name:
            return this.nameop(e.id, e.ctx, data);
        case Sk.astnodes.NameConstant:
            if (e.ctx === Sk.astnodes.Store || e.ctx === Sk.astnodes.AugStore || e.ctx === Sk.astnodes.Del) {
                throw new Sk.builtin.SyntaxError("can not assign to a constant name");
            }

            switch (e.value) {
                case Sk.builtin.none.none$:
                    return "Sk.builtin.none.none$";
                case Sk.builtin.bool.true$:
                    return "Sk.builtin.bool.true$";
                case Sk.builtin.bool.false$:
                    return "Sk.builtin.bool.false$";
                default:
                    Sk.asserts.fail("invalid named constant");
            }
            break;
        case Sk.astnodes.List:
            return this.ctuplelistorset(e, data, "list");
        case Sk.astnodes.Tuple:
            return this.ctuplelistorset(e, data, "tuple");
        case Sk.astnodes.Set:
            return this.ctuplelistorset(e, data, "set");
        case Sk.astnodes.Starred:
            switch (e.ctx) {
                case Sk.astnodes.Store:
                    /* In all legitimate cases, the Starred node was already replaced
                     * by compiler_list/compiler_tuple. XXX: is that okay? */
                    throw new Sk.builtin.SyntaxError("starred assignment target must be in a list or tuple", this.filename, e.lineno);
                default:
                    throw new Sk.builtin.SyntaxError("can't use starred expression here", this.filename, e.lineno);
            }
        case Sk.astnodes.JoinedStr:
            return this.cjoinedstr(e);
        case Sk.astnodes.FormattedValue:
            return this.cformattedvalue(e);
        case Sk.astnodes.Ellipsis:
            return this.makeConstant("Sk.builtin.Ellipsis");
        default:
            Sk.asserts.fail("unhandled case " + e.constructor.name + " vexpr");
    }
};

/**
 * @param {Array.<Object>} exprs
 * @param {Array.<string>=} data
 */
Compiler.prototype.vseqexpr = function (exprs, data) {
    var i;
    var ret;
    Sk.asserts.assert(data === undefined || exprs.length === data.length);
    ret = [];

    // if (exprs.length === 1 && exprs[0].constructor === Sk.astnodes.Starred) {
    //     exprs = exprs[0].value;
    // }

    for (i = 0; i < exprs.length; ++i) {
        ret.push(this.vexpr(exprs[i], data === undefined ? undefined : data[i]));
    }
    return ret;
};


Compiler.prototype.cannassign = function (s) {
    const target = s.target;
    let val = s.value;
    // perform the actual assignment first
    if (val) {
        val = this.vexpr(s.value);
        this.vexpr(target, val);
    }
    switch (target.constructor) {
        case Sk.astnodes.Name:
            if (s.simple && (this.u.ste.blockType === Sk.SYMTAB_CONSTS.ClassBlock || this.u.ste.blockType == Sk.SYMTAB_CONSTS.ModuleBlock)) {
                this.u.hasAnnotations = true;
                const val = this.vexpr(s.annotation);
                let mangled = mangleName(this.u.private_, target.id).v;
                const key = this.makeConstant("new Sk.builtin.str('" + mangled + "')");
                this.chandlesubscr(Sk.astnodes.Store, "$loc.__annotations__", key, val);
            }
    }
};


Compiler.prototype.caugassign = function (s) {
    var to;
    var augsub;
    var res;
    var val;
    var aug;
    var auge;
    var e;
    Sk.asserts.assert(s instanceof Sk.astnodes.AugAssign);
    e = s.target;
    switch (e.constructor) {
        case Sk.astnodes.Attribute:
            to = this.vexpr(e.value);
            auge = new Sk.astnodes.Attribute(e.value, e.attr, Sk.astnodes.AugLoad, e.lineno, e.col_offset);
            aug = this.vexpr(auge, undefined, to);
            val = this.vexpr(s.value);
            res = this._gr("inplbinopattr", "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
            auge.ctx = Sk.astnodes.AugStore;
            return this.vexpr(auge, res, to);
        case Sk.astnodes.Subscript:
            // Only compile the subscript value once
            to = this.vexpr(e.value);
            augsub = this.vslicesub(e.slice);
            auge = new Sk.astnodes.Subscript(e.value, augsub, Sk.astnodes.AugLoad, e.lineno, e.col_offset);
            aug = this.vexpr(auge, undefined, to, augsub);
            val = this.vexpr(s.value);
            res = this._gr("inplbinopsubscr", "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
            auge.ctx = Sk.astnodes.AugStore;
            return this.vexpr(auge, res, to, augsub);
        case Sk.astnodes.Name:
            to = this.nameop(e.id, Sk.astnodes.Load);
            val = this.vexpr(s.value);
            res = this._gr("inplbinop", "Sk.abstr.numberInplaceBinOp(", to, ",", val, ",'", s.op.prototype._astname, "')");
            return this.nameop(e.id, Sk.astnodes.Store, res);
        default:
            Sk.asserts.fail("unhandled case in augassign");
    }
};

/**
 * optimize some constant exprs. returns 0 if always false, 1 if always true or -1 otherwise.
 */
Compiler.prototype.exprConstant = function (e) {
    switch (e.constructor) {
        case Sk.astnodes.Num:
            return Sk.misceval.isTrue(e.n) ? 1 : 0;
        case Sk.astnodes.Str:
            return Sk.misceval.isTrue(e.s) ? 1 : 0;
        case Sk.astnodes.Name:
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
    Sk.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.curblock = n;
};

Compiler.prototype.pushBreakBlock = function (n) {
    Sk.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.breakBlocks.push(n);
};
Compiler.prototype.popBreakBlock = function () {
    this.u.breakBlocks.pop();
};

Compiler.prototype.pushContinueBlock = function (n) {
    Sk.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.continueBlocks.push(n);
};
Compiler.prototype.popContinueBlock = function () {
    this.u.continueBlocks.pop();
};

Compiler.prototype.pushExceptBlock = function (n) {
    Sk.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.exceptBlocks.push(n);
};
Compiler.prototype.popExceptBlock = function () {
    this.u.exceptBlocks.pop();
};

Compiler.prototype.pushFinallyBlock = function (n) {
    Sk.asserts.assert(n >= 0 && n < this.u.blocknum);
    Sk.asserts.assert(this.u.breakBlocks.length === this.u.continueBlocks.length);
    this.u.finallyBlocks.push({blk: n, breakDepth: this.u.breakBlocks.length});
};
Compiler.prototype.popFinallyBlock = function () {
    this.u.finallyBlocks.pop();
};
Compiler.prototype.peekFinallyBlock = function() {
    return (this.u.finallyBlocks.length > 0) ? this.u.finallyBlocks[this.u.finallyBlocks.length-1] : undefined;
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
    var hasCell = unit.ste.blockType === Sk.SYMTAB_CONSTS.FunctionBlock && unit.ste.childHasFree;
    var output = (localsToSave.length > 0 ? ("var " + localsToSave.join(",") + ";") : "") +
                 "var $wakeFromSuspension = function() {" +
                    "var susp = "+unit.scopename+".$wakingSuspension; "+unit.scopename+".$wakingSuspension = undefined;" +
                    "$blk=susp.$blk; $loc=susp.$loc; $gbl=susp.$gbl; $exc=susp.$exc; $err=susp.$err; $postfinally=susp.$postfinally;" +
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
                "susp.data=susp.child.data;susp.$blk=$blk;susp.$loc=$loc;susp.$gbl=$gbl;susp.$exc=$exc;susp.$err=$err;susp.$postfinally=$postfinally;" +
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
};

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
            if (block in generatedBlocks) {continue;}
            while (true) {
                generatedBlocks[block] = true;

                ret += "case " + block + ": /* --- " + blocks[block]._name + " --- */";
                ret += blocks[block].join("");

                if (blocks[block]._next !== null) {
                    if (!(blocks[block]._next in generatedBlocks)) {
                        ret += "/* allowing case fallthrough */";
                        block = blocks[block]._next;
                    } else {
                        ret += "/* jump */ continue;";
                        break;
                    }
                } else {
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
    Sk.asserts.assert(s instanceof Sk.astnodes.If);
    constant = this.exprConstant(s.test);
    if (constant === 0) {
        if (s.orelse && s.orelse.length > 0) {
            this.vseqstmt(s.orelse);
        }
    } else if (constant === 1) {
        this.vseqstmt(s.body);
    } else {
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
        } else {
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
    } else {
        top = this.newBlock("while test");
        this._jump(top);
        this.setBlock(top);

        if ((Sk.debugging || Sk.killableWhile) && this.u.canSuspend) {
            var suspType = "Sk.delay";
            var debugBlock = this.newBlock("debug breakpoint for line "+s.lineno);
            out("if (Sk.breakpoints('"+this.filename+"',"+s.lineno+","+s.col_offset+")) {",
                "var $susp = $saveSuspension({data: {type: '"+suspType+"'}, resume: function() {}}, '"+this.filename+"',"+s.lineno+","+s.col_offset+");",
                "$susp.$blk = "+debugBlock+";",
                "$susp.optional = true;",
                "return $susp;",
                "}");
            this._jump(debugBlock);
            this.setBlock(debugBlock);
            this.u.doesSuspend = true;
        }

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
    } else {
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

    if ((Sk.debugging || Sk.killableFor) && this.u.canSuspend) {
        var suspType = "Sk.delay";
        var debugBlock = this.newBlock("debug breakpoint for line "+s.lineno);
        out("if (Sk.breakpoints('"+this.filename+"',"+s.lineno+","+s.col_offset+")) {",
            "var $susp = $saveSuspension({data: {type: '"+suspType+"'}, resume: function() {}}, '"+this.filename+"',"+s.lineno+","+s.col_offset+");",
            "$susp.$blk = "+debugBlock+";",
            "$susp.optional = true;",
            "return $susp;",
            "}");
        this._jump(debugBlock);
        this.setBlock(debugBlock);
        this.u.doesSuspend = true;
    }

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
    if (s.exc) {
        var exc = this._gr("exc", this.vexpr(s.exc));
        // This is tricky - we're supporting both the weird-ass semantics
        // of the Python 2 "raise (exc), (inst), (tback)" version,
        // plus the sensible Python "raise (exc) from (cause)".
        // ast.js takes care of ensuring that you can only use the right one
        // for the Python version you're using.

        var instantiatedException = this.newBlock("exception now instantiated");
        var isClass = this._gr("isclass", exc + ".prototype instanceof Sk.builtin.BaseException");
        this._jumpfalse(isClass, instantiatedException);
        //this._jumpfalse(instantiatedException, isClass);

        // Instantiate exc with inst
        if (s.inst) {
            var inst = this._gr("inst", this.vexpr(s.inst));
            out("if(!(",inst," instanceof Sk.builtin.tuple)) {",
                inst,"= new Sk.builtin.tuple([",inst,"]);",
                "}");
            out("$ret = Sk.misceval.callsimOrSuspendArray(",exc,",",inst,".v);");
        } else {
            out("$ret = Sk.misceval.callsimOrSuspend(",exc,");");
        }
        this._checkSuspension(s);
        out(exc,"=$ret;");

        this._jump(instantiatedException);

        this.setBlock(instantiatedException);

        // TODO TODO TODO set cause appropriately
        // (and perhaps traceback for py2 if we care before it gets fully deprecated)

        out("if (", exc, " instanceof Sk.builtin.BaseException) {throw ",exc,";} else {throw new Sk.builtin.TypeError('exceptions must derive from BaseException');};");
    } else {
        // re-raise
        out("throw $err;");
    }
};

Compiler.prototype.outputFinallyCascade = function (thisFinally) {
    var nextFinally;

    // What do we do when we're done executing a 'finally' block?
    // Normally you just fall off the end. If we're 'return'ing,
    // 'continue'ing or 'break'ing, $postfinally tells us what to do.
    //
    // But we might be in a nested pair of 'finally' blocks. If so, we need
    // to work out whether to jump to the outer finally block.
    //
    // (NB we do NOT deal with re-raising exceptions here. That's handled
    // elsewhere, because 'with' does special things with exceptions.)

    if (this.u.finallyBlocks.length == 0) {
        // No nested 'finally' block. Easy.
        out("if($postfinally!==undefined) { if ($postfinally.returning) { return $postfinally.returning; } else { $blk=$postfinally.gotoBlock; $postfinally=undefined; continue; } }");
    } else {

        // OK, we're nested. Do we jump straight to the outer 'finally' block?
        // Depends on how we got here here.

        // Normal execution ($postfinally===undefined)? No, we're done here.

        // Returning ($postfinally.returning)? Yes, we want to execute all the
        // 'finally' blocks on the way out.

        // Breaking ($postfinally.isBreak)? It depends. Is the outer 'finally'
        // block inside or outside the loop we're breaking out of? We compare
        // its breakDepth to ours to find out. If we're at the same breakDepth,
        // we're both inside the innermost loop, so we both need to execute.
        // ('continue' is the same thing as 'break' for us)

        nextFinally = this.peekFinallyBlock();

        out("if($postfinally!==undefined) {",
            "if ($postfinally.returning",
            (nextFinally.breakDepth == thisFinally.breakDepth) ? "|| $postfinally.isBreak" : "", ") {",

            "$blk=",nextFinally.blk,";continue;",
            "} else {",
            "$blk=$postfinally.gotoBlock;$postfinally=undefined;continue;",
            "}",
            "}");
    }
};

Compiler.prototype.ctry = function (s) {
    var check;
    var next;
    var handlertype;
    var handler;
    var end;
    var orelse;
    var unhandled;
    var i;
    var n = s.handlers.length;

    var finalBody, finalExceptionHandler, finalExceptionToReRaise;
    var thisFinally;

    if (s.finalbody) {
        finalBody = this.newBlock("finalbody");
        finalExceptionHandler = this.newBlock("finalexh");
        finalExceptionToReRaise = this._gr("finally_reraise", "undefined");

        this.u.tempsToSave.push(finalExceptionToReRaise);
        this.pushFinallyBlock(finalBody);
        thisFinally = this.peekFinallyBlock();
        this.setupExcept(finalExceptionHandler);
    }

    // Create a block for each except clause
    var handlers = [];
    for (i = 0; i < n; ++i) {
        handlers.push(this.newBlock("except_" + i + "_"));
    }

    unhandled = this.newBlock("unhandled");
    orelse = this.newBlock("orelse");
    end = this.newBlock("end");

    if (handlers.length != 0) {
        this.setupExcept(handlers[0]);
    }
    this.vseqstmt(s.body);
    if (handlers.length != 0) {
        this.endExcept();
    }
    this._jump(orelse);

    for (i = 0; i < n; ++i) {
        this.setBlock(handlers[i]);
        handler = s.handlers[i];
        if (!handler.type && i < n - 1) {
            throw new Sk.builtin.SyntaxError("default 'except:' must be last", this.filename, handler.lineno);
        }

        if (handler.type) {
            // should jump to next handler if err not isinstance of handler.type
            handlertype = this.vexpr(handler.type);
            next = (i == n - 1) ? unhandled : handlers[i + 1];

            // var isinstance = this.nameop(new Sk.builtin.str("isinstance"), Load));
            // var check = this._gr('call', "Sk.misceval.callsimArray(", isinstance, ", [$err, ", handlertype, "])");

            check = this._gr("instance", "Sk.misceval.isTrue(Sk.builtin.isinstance($err, ", handlertype, "))");
            this._jumpfalse(check, next);
        }

        if (handler.name) {
            this.vexpr(handler.name, "$err");
        }

        this.vseqstmt(handler.body);

        this._jump(end);
    }

    // If no except clause catches exception, throw it again
    this.setBlock(unhandled);
    out("throw $err;");

    this.setBlock(orelse);
    this.vseqstmt(s.orelse);
    this._jump(end);

    this.setBlock(end);
    // End of the try/catch/else segment
    if (s.finalbody) {
        this.endExcept();

        this._jump(finalBody);

        this.setBlock(finalExceptionHandler);
        // Exception handling also goes to the finally body,
        // stashing the original exception to re-raise
        out(finalExceptionToReRaise,"=$err;");
        this._jump(finalBody);

        this.setBlock(finalBody);
        this.popFinallyBlock();
        this.vseqstmt(s.finalbody);
        // If finalbody executes normally, AND we have an exception
        // to re-raise, we raise it.
        out("if(",finalExceptionToReRaise,"!==undefined) { throw ",finalExceptionToReRaise,";}");

        this.outputFinallyCascade(thisFinally);
        // Else, we continue from here.
    }
};

Compiler.prototype.cwith = function (s, itemIdx) {
    var mgr, exit, value, exception;
    var exceptionHandler = this.newBlock("withexh"), tidyUp = this.newBlock("withtidyup");
    var carryOn = this.newBlock("withcarryon");
    var thisFinallyBlock;

    // NB this does not *quite* match the semantics in PEP 343, which
    // specifies "exit = type(mgr).__exit__" rather than getattr()ing,
    // presumably for performance reasons.

    mgr = this._gr("mgr", this.vexpr(s.items[itemIdx].context_expr));

    // exit = mgr.__exit__
    out("$ret = Sk.abstr.lookupSpecial(",mgr,",Sk.builtin.str.$exit);");
    this._checkSuspension(s);
    exit = this._gr("exit", "$ret");
    this.u.tempsToSave.push(exit);

    // value = mgr.__enter__()
    out("$ret = Sk.abstr.lookupSpecial(",mgr,",Sk.builtin.str.$enter);");
    this._checkSuspension(s);
    out("$ret = Sk.misceval.callsimOrSuspendArray($ret);");
    this._checkSuspension(s);
    value = this._gr("value", "$ret");

    // try:
    this.pushFinallyBlock(tidyUp);
    thisFinallyBlock = this.u.finallyBlocks[this.u.finallyBlocks.length-1];
    this.setupExcept(exceptionHandler);

    //    VAR = value
    if (s.items[itemIdx].optional_vars) {
        this.nameop(s.items[itemIdx].optional_vars.id, Sk.astnodes.Store, value);
    }

    //    (try body)

    if (itemIdx +1 < s.items.length) {
        // "with" statements with multiple items (context managers) are
        // treated as nested "with" statements
        this.cwith(s, itemIdx + 1);
    } else {
        this.vseqstmt(s.body);
    }

    this.endExcept();
    this._jump(tidyUp);

    // except:
    this.setBlock(exceptionHandler);

    //   if not exit(*sys.exc_info()):
    //     raise
    out("$ret = Sk.misceval.applyOrSuspend(",exit,",undefined,Sk.builtin.getExcInfo($err),undefined,[]);");
    this._checkSuspension(s);
    this._jumptrue("$ret", carryOn);
    out("throw $err;");

    // finally: (kinda. NB that this is a "finally" that doesn't run in the
    //           exception case!)
    this.setBlock(tidyUp);
    this.popFinallyBlock();

    //   exit(None, None, None)
    out("$ret = Sk.misceval.callsimOrSuspendArray(",exit,",[Sk.builtin.none.none$,Sk.builtin.none.none$,Sk.builtin.none.none$]);");
    this._checkSuspension(s);
    // Ignore $ret.

    this.outputFinallyCascade(thisFinallyBlock);

    this._jump(carryOn);

    this.setBlock(carryOn);
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
    // maybe replace with Sk.asserts.fail?? or just an alert?
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
            cur = this._gr("lattr", "Sk.abstr.gattr(", cur, ", new Sk.builtin.str('", attr, "'))");
            src = src.substr(dotLoc + 1);
        }
    }
    return this.nameop(asname, Sk.astnodes.Store, cur);
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
        out("$ret = Sk.builtin.__import__(", alias.name["$r"]().v, ",$gbl,$loc,[],",(Sk.__future__.absolute_import?0:-1),");");

        this._checkSuspension(s);

        mod = this._gr("module", "$ret");

        if (alias.asname) {
            this.cimportas(alias.name, alias.asname, mod);
        } else {
            tmp = alias.name;
            lastDot = tmp.v.indexOf(".");
            if (lastDot !== -1) {
                tmp = new Sk.builtin.str(tmp.v.substr(0, lastDot));
            }
            this.nameop(tmp, Sk.astnodes.Store, mod);
        }
    }
};

Compiler.prototype.cfromimport = function (s) {
    var storeName;
    var got;
    var alias;
    var aliasOut;
    var mod;
    var i;
    var n = s.names.length;
    var names = [];
    var level = s.level;
    if (level == 0 && !Sk.__future__.absolute_import) {
        level = -1;
    }
    for (i = 0; i < n; ++i) {
        names[i] = "'" + s.names[i].name.v + "'";
    }
    out("$ret = Sk.builtin.__import__(", s.module["$r"]().v, ",$gbl,$loc,[", names, "],",level,");");

    this._checkSuspension(s);

    //out("print('__import__ returned ' + $ret);");
    //out("for (var x in $ret) { print(x); }");
    mod = this._gr("module", "$ret");
    for (i = 0; i < n; ++i) {
        alias = s.names[i];
        aliasOut = "'" + alias.name.v + "'";
        if (i === 0 && alias.name.v === "*") {
            Sk.asserts.assert(n === 1);
            out("Sk.importStar(", mod, ",$loc, $gbl);");
            return;
        }

        //out("print(\"getting Sk.abstr.gattr(", mod, ",", alias.name["$r"]().v, ")\");");
        got = this._gr("item", "Sk.abstr.gattr(", mod, ", new Sk.builtin.str(", aliasOut, "), undefined)");
        //out("print('got');");
        storeName = alias.name;
        if (alias.asname) {
            storeName = alias.asname;
        }
        this.nameop(storeName, Sk.astnodes.Store, got);
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
 * @param {Sk.astnodes.arguments_} args arguments to function, if any
 * @param {Function} callback called after setup to do actual work of function
 * @param {Sk.builtin.str=} class_for_super
 *
 * @returns the name of the newly created function or generator object.
 *
 */
Compiler.prototype.buildcodeobj = function (n, coname, decorator_list, args, callback, class_for_super) {
    var containingHasFree;
    var frees;
    var argnamesarr = [];
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
    var kw_defaults = [];
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

    const func_annotations = this.cannotations(args, n.returns);

    if (args && args.kw_defaults) {
        kw_defaults = args.kw_defaults.map(e => e ? this.vexpr(e) : "undefined");
    }
    if (args && args.vararg) {
        vararg = args.vararg;
    }
    if (args && args.kwarg) {
        kwarg = args.kwarg;
    }
    if (!Sk.__future__.python3 && args && args.kwonlyargs && args.kwonlyargs.length != 0) {
        throw new Sk.builtin.SyntaxError("Keyword-only arguments are not supported in Python 2");
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
        // TODO make generators deal with arguments properly
        if (kwarg) {
            throw new Sk.builtin.SyntaxError(coname.v + "(): keyword arguments in generators not supported",
                                             this.filename, n.lineno);
        }
        if (vararg) {
            throw new Sk.builtin.SyntaxError(coname.v + "(): variable number of arguments in generators not supported",
                                             this.filename, n.lineno);
        }
        funcArgs.push("$gen");
    } else {
        if (kwarg) {
            funcArgs.push("$kwa");
            this.u.tempsToSave.push("$kwa");
        }
        for (i = 0; args && i < args.args.length; ++i) {
            funcArgs.push(this.nameop(args.args[i].arg, Sk.astnodes.Param));
        }
        for (i = 0; args && args.kwonlyargs && i < args.kwonlyargs.length; ++i) {
            funcArgs.push(this.nameop(args.kwonlyargs[i].arg, Sk.astnodes.Param));
        }
        if (vararg) {
            funcArgs.push(this.nameop(args.vararg.arg, Sk.astnodes.Param));
        }
    }
    // Are we using the new fast-call mechanism, where the
    // function we define implements the tp$call interface?
    // (Right now we haven't migrated generators because they're
    // a mess, but if this works we can move everything over)
    let fastCall = !isGenerator;

    if (hasFree) {
        if (!fastCall) {
            funcArgs.push("$free");
        }
        this.u.tempsToSave.push("$free");
    }

    if (fastCall) {
        this.u.prefixCode += "$posargs,$kwargs";
    } else {
        this.u.prefixCode += funcArgs.join(",");
    }

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

    if (fastCall) {
        this.u.prefixCode += "\n// fast call\n";
    }

    //
    // set up standard dicts/variables
    //
    locals = "{}";
    if (isGenerator) {
        entryBlock = "$gen.gi$resumeat";
        locals = "$gen.gi$locals";
    }
    cells = ",$cell={}";
    if (hasCell) {
        if (isGenerator) {
            cells = ",$cell=$gen.gi$cells";
        }
    }

    // note special usage of 'this' to avoid having to slice globals into
    // all function invocations in call
    // (fastcall doesn't need to do this, as 'this' is the func object)
    this.u.varDeclsCode += "var $blk=" + entryBlock + ",$exc=[],$loc=" + locals + cells + ",$gbl=" +(fastCall?"this && this.func_globals":"this") + ((fastCall&&hasFree)?",$free=this && this.func_closure":"") + ",$err=undefined,$ret=undefined,$postfinally=undefined,$currLineNo=undefined,$currColNo=undefined;";
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
    this.u.varDeclsCode += "var $waking=false; if ("+scopename+".$wakingSuspension!==undefined) { $wakeFromSuspension(); $waking=true; } else {";

    if (fastCall) {
        // Resolve our arguments from $posargs+$kwargs.
        // If we're posargs-only, we can handle the fast path
        // without even calling out
        if (!kwarg && !vararg && (!args || !args.kwonlyargs || args.kwonlyargs.length === 0)) {
            this.u.varDeclsCode += "var $args = ((!$kwargs || $kwargs.length===0) && $posargs.length===" + funcArgs.length + ") ? $posargs : this.$resolveArgs($posargs,$kwargs)";
        } else {
            this.u.varDeclsCode += "\nvar $args = this.$resolveArgs($posargs,$kwargs)\n";
        }
        for (let i = 0; i < funcArgs.length; i++) {
            this.u.varDeclsCode += "," + funcArgs[i] + "=$args[" + i + "]";
        }
        const instanceForSuper = funcArgs[kwarg ? 1 : 0];
        if (instanceForSuper) {
            this.u.varDeclsCode += `,$sup=${instanceForSuper}`;
        }
        this.u.varDeclsCode += ";\n";
    }


    // TODO update generators to do their arg checks in outside generated code,
    // like functions do
    //
    // this could potentially get removed if generators would learn to deal with args, kw, kwargs, varargs
    // initialize default arguments. we store the values of the defaults to
    // this code object as .$defaults just below after we exit this scope.
    //
    if (isGenerator && defaults.length > 0) {
        // defaults have to be "right justified" so if there's less defaults
        // than args we offset to make them match up (we don't need another
        // correlation in the ast)
        offset = args.args.length - defaults.length;
        for (i = 0; i < defaults.length; ++i) {
            argname = this.nameop(args.args[i + offset].arg, Sk.astnodes.Param);
            this.u.varDeclsCode += "if(" + argname + "===undefined)" + argname + "=" + scopename + ".$defaults[" + i + "];";
        }
    }

    //
    // copy all parameters that are also cells into the cells dict. this is so
    // they can be accessed correctly by nested scopes.
    //
    for (i = 0; args && i < args.args.length; ++i) {
        id = args.args[i].arg;
        if (this.isCell(id)) {
            let mangled = fixReserved(mangleName(this.u.private_, id).v);
            this.u.varDeclsCode += "$cell." + mangled + "=" + mangled + ";";
        }
    }
    for (i = 0; args && args.kwonlyargs && i < args.kwonlyargs.length; ++i) {
        id = args.kwonlyargs[i].arg;
        if (this.isCell(id)) {
            let mangled = fixReserved(mangleName(this.u.private_, id).v);
            this.u.varDeclsCode += "$cell." + mangled + "=" + mangled + ";";
        }
    }
    if (vararg && this.isCell(vararg.arg)) {
        let mangled = fixReserved(mangleName(this.u.private_, vararg.arg).v);
        this.u.varDeclsCode += "$cell." + mangled + "=" + mangled + ";";
    }

    //
    // initialize kwarg, if any
    //
    if (kwarg) {
        this.u.localnames.push(kwarg.arg.v);
        this.u.varDeclsCode += kwarg.arg.v + "=new Sk.builtins['dict']($kwa);";
        if (this.isCell(kwarg.arg)) {
            let mangled = fixReserved(mangleName(this.u.private_, kwarg.arg).v);
            this.u.varDeclsCode += "$cell." + mangled + "=" + mangled + ";";
        }
    }

    //
    // close the else{} block from the wakingSuspension check
    //
    this.u.varDeclsCode += "}";

    // inject __class__ cell when running python3
    if (Sk.__future__.python3 && class_for_super) {
        this.u.varDeclsCode += "$gbl.__class__=$gbl." + class_for_super.v + ";";
    }

    // finally, set up the block switch that the jump code expects
    //
    // Old switch code
    // this.u.switchCode += "while(true){switch($blk){";
    // this.u.suffixCode = "}break;}});";

    // New switch code to catch exceptions
    this.u.switchCode = "while(true){try{";
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
    if (args) {
        for (let arg of args.args) {
            argnamesarr.push(arg.arg.v);
        }
        for (let arg of args.kwonlyargs || []) {
            argnamesarr.push(arg.arg.v);
        }

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
    if (args && args.kwonlyargs && args.kwonlyargs.length > 0) {
        out(scopename, ".co_argcount=", args.args.length, ";");
        out(scopename, ".co_kwonlyargcount=", args.kwonlyargs.length, ";");
        out(scopename, ".$kwdefs=[", kw_defaults.join(","), "];");
    }

    //
    // attach co_varnames (only the argument names) for keyword argument
    // binding.
    //
    if (argnamesarr.length > 0) {
        out(scopename, ".co_varnames=['", argnamesarr.join("','"), "'];");
    } else {
        out(scopename, ".co_varnames=[];");
    }

    //
    // Skulpt doesn't have "co_consts", so record the docstring (or
    // None) in the "co_docstring" property of the code object, ready
    // for use by the Sk.builtin.func constructor.
    //
    out(scopename, ".co_docstring=", this.cDocstringOfCode(n), ";");

    //
    // attach flags
    //
    if (kwarg) {
        out(scopename, ".co_kwargs=1;");
    }
    if (vararg) {
        out(scopename, ".co_varargs=1;");
    }
    if (!isGenerator) {
        out(scopename, ".co_fastcall=1;");
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
    if (isGenerator) {
    // Keyword and variable arguments are not currently supported in generators.
    // The call to pyCheckArgs assumes they can't be true.
        if (args && args.args.length > 0) {
            return this._gr("gener", "new Sk.builtins['function']((function(){var $origargs=Array.prototype.slice.call(arguments);Sk.builtin.pyCheckArgsLen(\"",
                            coname.v, "\",arguments.length,", args.args.length - defaults.length, ",", args.args.length,
                            ");return new Sk.builtins['generator'](", scopename, ",$gbl,$origargs", frees, ");}))");
        } else {
            return this._gr("gener", "new Sk.builtins['function']((function(){Sk.builtin.pyCheckArgsLen(\"", coname.v,
                            "\",arguments.length,0,0);return new Sk.builtins['generator'](", scopename, ",$gbl,[]", frees, ");}))");
        }
    } else {
        let funcobj;
        if (decos.length > 0) {
            out("$ret = new Sk.builtins['function'](", scopename, ",$gbl", frees, ");");
            for (let decorator of decos.reverse()) {
                out("$ret = Sk.misceval.callsimOrSuspendArray(", decorator, ",[$ret]);");
                this._checkSuspension();
            }
            funcobj = this._gr("funcobj", "$ret");
        } else {
            funcobj = this._gr("funcobj", "new Sk.builtins['function'](", scopename, ",$gbl", frees, ")");
        }
        if (func_annotations) {
            out(funcobj, ".func_annotations=", func_annotations, ";");
        }

        return funcobj;
    }
};


Compiler.prototype.cargannotation = function (id, annotation, ann_dict) {
    if (annotation) {
        const mangled = mangleName(this.u.private_, id).v;
        // var scope = this.u.ste.getScope(mangled);
        ann_dict.push(`'${mangled}'`);
        ann_dict.push(this.vexpr(annotation));
    }
};

Compiler.prototype.cargannotations = function (args, ann_dict) {
    if (!args) {
        return;
    }
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        this.cargannotation(arg.arg, arg.annotation, ann_dict);
    }
};

const return_str = new Sk.builtin.str("return");

Compiler.prototype.cannotations = function (args, returns) {
    const ann_dict = [];
    if (args) {
        this.cargannotations(args.posonlyargs, ann_dict);
        this.cargannotations(args.args, ann_dict);
        if (args.vararg && args.vararg.annotation) {
            this.cargannotation(args.vararg.arg, args.vararg.annotation, ann_dict);
        }
        this.cargannotations(args.kwonlyargs, ann_dict);
        if (args.kwarg && args.kwarg.annotation) {
            this.cargannotation(args.kwarg.arg, args.kwarg.annotation, ann_dict);
        }
    }
    if (returns) {
        this.cargannotation(return_str, returns, ann_dict);
    }
    if (ann_dict.length === 0) {
        return;
    }
    // return as kw dict like list.
    // This will get turned into a dict when requested in python code
    // see func.js;
    return "[" + ann_dict.join(",") + "]";
};

/** JavaScript for the docstring of the given body, or null if the
 * body has no docstring.
 */
Compiler.prototype.maybeCDocstringOfBody = function(body) {
    if (body.length === 0)  // Don't think this can happen?
        return null;

    const stmt_0 = body[0];
    if (stmt_0.constructor !== Sk.astnodes.Expr)
        return null;

    const expr = stmt_0.value;
    if (expr.constructor !== Sk.astnodes.Str)
        return null;

    return this.vexpr(expr);
};

/** JavaScript for the docstring of the given node.  Only called from
 * buildcodeobj(), and expects a FunctionDef, Lambda, or GeneratorExp
 * node.  We give a "None" docstring to a GeneratorExp node, although
 * it is not carried over to the final generator; this is harmless.
 */
Compiler.prototype.cDocstringOfCode = function(node) {
    switch (node.constructor) {
    case Sk.astnodes.AsyncFunctionDef:  // For when it's supported
    case Sk.astnodes.FunctionDef:
        return (
            this.maybeCDocstringOfBody(node.body)
            || "Sk.builtin.none.none$"
        );

    case Sk.astnodes.Lambda:
    case Sk.astnodes.GeneratorExp:
        return "Sk.builtin.none.none$";

    default:
        Sk.asserts.fail(`unexpected node kind ${node.constructor.name}`);
    }
}

Compiler.prototype.cfunction = function (s, class_for_super) {
    var funcorgen;
    Sk.asserts.assert(s instanceof Sk.astnodes.FunctionDef);
    funcorgen = this.buildcodeobj(s, s.name, s.decorator_list, s.args, function (scopename) {
        this.vseqstmt(s.body);
        out("return Sk.builtin.none.none$;"); // if we fall off the bottom, we want the ret to be None
    }, class_for_super);
    this.nameop(s.name, Sk.astnodes.Store, funcorgen);
};

Compiler.prototype.clambda = function (e) {
    var func;
    Sk.asserts.assert(e instanceof Sk.astnodes.Lambda);
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
    } else {
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

    n = ge.ifs ? ge.ifs.length : 0;
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
    var gener = this._gr("gener", "Sk.misceval.callsimArray(", gen, ");");
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
    Sk.asserts.assert(s instanceof Sk.astnodes.ClassDef);

    decos = this.vseqexpr(s.decorator_list);

    bases = this.vseqexpr(s.bases);

    let keywordArgs = this.cunpackkwstoarray(s.keywords);
    scopename = this.enterScope(s.name, s, s.lineno);
    entryBlock = this.newBlock("class entry");

    this.u.prefixCode = "var " + scopename + "=(function $" + s.name.v + "$class_outer($globals,$locals,$cell){var $gbl=$globals,$loc=$locals,$free=$globals;";
    this.u.switchCode += "(function $" + s.name.v + "$_closure($cell){";
    this.u.switchCode += "var $blk=" + entryBlock + ",$exc=[],$ret=undefined,$postfinally=undefined,$currLineNo=undefined,$currColNo=undefined;";

    if (Sk.execLimit !== null) {
        this.u.switchCode += "if (typeof Sk.execStart === 'undefined') {Sk.execStart = Date.now()}";
    }
    if (Sk.yieldLimit !== null && this.u.canSuspend) {
        this.u.switchCode += "if (typeof Sk.lastYield === 'undefined') {Sk.lastYield = Date.now()}";
    }

    this.u.switchCode += "while(true){try{";
    this.u.switchCode += this.outputInterruptTest();
    this.u.switchCode += "switch($blk){";
    this.u.suffixCode = "}}catch(err){ if (!(err instanceof Sk.builtin.BaseException)) { err = new Sk.builtin.ExternalError(err); } err.traceback.push({lineno: $currLineNo, colno: $currColNo, filename: '"+this.filename+"'}); if ($exc.length>0) { $err = err; $blk=$exc.pop(); continue; } else { throw err; }}}";
    this.u.suffixCode += "}).call(null, $cell);});";

    this.u.private_ = s.name;

    this.cbody(s.body, s.name);
    out("return;");

    // build class

    this.exitScope();

    out("$ret = Sk.misceval.buildClass($gbl,", scopename, ",", s.name["$r"]().v, ",[", bases, "], $cell, ", keywordArgs, ");");
    this._checkSuspension();

    // apply decorators

    for (let decorator of decos.reverse()) {
        out("$ret = Sk.misceval.callsimOrSuspendArray(", decorator, ", [$ret]);");
        this._checkSuspension();
    }

    // store our new class under the right name
    this.nameop(s.name, Sk.astnodes.Store, "$ret");
};

Compiler.prototype.ccontinue = function (s) {
    var nextFinally = this.peekFinallyBlock(), gotoBlock;
    if (this.u.continueBlocks.length == 0) {
        throw new Sk.builtin.SyntaxError("'continue' outside loop", this.filename, s.lineno);
    }
    // todo; continue out of exception blocks
    gotoBlock = this.u.continueBlocks[this.u.continueBlocks.length - 1];
    Sk.asserts.assert(this.u.breakBlocks.length === this.u.continueBlocks.length);
    if (nextFinally && nextFinally.breakDepth == this.u.continueBlocks.length) {
        out("$postfinally={isBreak:true,gotoBlock:",gotoBlock,"};");
    } else {
        this._jump(gotoBlock);
    }
};

Compiler.prototype.cbreak = function (s) {
    var nextFinally = this.peekFinallyBlock(), gotoBlock;

    if (this.u.breakBlocks.length === 0) {
        throw new Sk.builtin.SyntaxError("'break' outside loop", this.filename, s.lineno);
    }
    gotoBlock = this.u.breakBlocks[this.u.breakBlocks.length - 1];
    if (nextFinally && nextFinally.breakDepth == this.u.breakBlocks.length) {
        out("$postfinally={isBreak:true,gotoBlock:",gotoBlock,"};");
    } else {
        this._jump(gotoBlock);
    }
};

/**
 * compiles a statement
 * @param {Object} s
 * @param {Sk.builtin.str=} class_for_super
 */
Compiler.prototype.vstmt = function (s, class_for_super) {
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
            "$susp.$blk = " + debugBlock + ";",
            "$susp.optional = true;",
            "return $susp;",
            "}");
        this._jump(debugBlock);
        this.setBlock(debugBlock);
        this.u.doesSuspend = true;
    }

    this.annotateSource(s);

    switch (s.constructor) {
        case Sk.astnodes.FunctionDef:
            this.cfunction(s, class_for_super);
            break;
        case Sk.astnodes.ClassDef:
            this.cclass(s);
            break;
        case Sk.astnodes.Return:
            if (this.u.ste.blockType !== Sk.SYMTAB_CONSTS.FunctionBlock) {
                throw new Sk.builtin.SyntaxError("'return' outside function", this.filename, s.lineno);
            }
            val = s.value ? this.vexpr(s.value) : "Sk.builtin.none.none$";
            if (this.u.finallyBlocks.length == 0) {
                out("return ", val, ";");
            } else {
                out("$postfinally={returning:",val,"};");
                this._jump(this.peekFinallyBlock().blk);
            }
            break;
        case Sk.astnodes.Delete:
            this.vseqexpr(s.targets);
            break;
        case Sk.astnodes.Assign:
            n = s.targets.length;
            val = this.vexpr(s.value);
            for (i = 0; i < n; ++i) {
                this.vexpr(s.targets[i], val);
            }
            break;
        case Sk.astnodes.AnnAssign:
            return this.cannassign(s);
        case Sk.astnodes.AugAssign:
            return this.caugassign(s);
        case Sk.astnodes.Print:
            this.cprint(s);
            break;
        case Sk.astnodes.For:
            return this.cfor(s);
        case Sk.astnodes.While:
            return this.cwhile(s);
        case Sk.astnodes.If:
            return this.cif(s);
        case Sk.astnodes.Raise:
            return this.craise(s);
        case Sk.astnodes.Try:
            return this.ctry(s);
        case Sk.astnodes.With:
            return this.cwith(s, 0);
        case Sk.astnodes.Assert:
            return this.cassert(s);
        case Sk.astnodes.Import:
            return this.cimport(s);
        case Sk.astnodes.ImportFrom:
            return this.cfromimport(s);
        case Sk.astnodes.Global:
            break;
        case Sk.astnodes.Expr:
            this.vexpr(s.value);
            break;
        case Sk.astnodes.Pass:
            break;
        case Sk.astnodes.Break:
            this.cbreak(s);
            break;
        case Sk.astnodes.Continue:
            this.ccontinue(s);
            break;
        case Sk.astnodes.Debugger:
            out("debugger;");
            break;
        default:
            Sk.asserts.fail("unhandled case in vstmt: " + JSON.stringify(s));
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
    var mangled = fixReserved(mangleName(this.u.private_, name).v);
    var scope = this.u.ste.getScope(mangled);
    var dict = null;
    return scope === Sk.SYMTAB_CONSTS.CELL;

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
    if ((ctx === Sk.astnodes.Store || ctx === Sk.astnodes.AugStore || ctx === Sk.astnodes.Del) && name.v === "__debug__") {
        throw new Sk.builtin.SyntaxError("can not assign to __debug__", this.filename, this.u.lineno);
    }
    Sk.asserts.assert(name.v !== "None");

    if (name.v === "NotImplemented") {
        return "Sk.builtin.NotImplemented.NotImplemented$";
    }

    mangled = mangleName(this.u.private_, name).v;
    // Have to do this before looking it up in the scope
    mangled = fixReserved(mangled);
    op = 0;
    optype = OP_NAME;
    scope = this.u.ste.getScope(mangled);
    dict = null;
    switch (scope) {
        case Sk.SYMTAB_CONSTS.FREE:
            dict = "$free";
            optype = OP_DEREF;
            break;
        case Sk.SYMTAB_CONSTS.CELL:
            dict = "$cell";
            optype = OP_DEREF;
            break;
        case Sk.SYMTAB_CONSTS.LOCAL:
            // can't do FAST in generators or at module/class scope
            if (this.u.ste.blockType === Sk.SYMTAB_CONSTS.FunctionBlock && !this.u.ste.generator) {
                optype = OP_FAST;
            }
            break;
        case Sk.SYMTAB_CONSTS.GLOBAL_IMPLICIT:
            if (this.u.ste.blockType === Sk.SYMTAB_CONSTS.FunctionBlock) {
                optype = OP_GLOBAL;
            }
            break;
        case Sk.SYMTAB_CONSTS.GLOBAL_EXPLICIT:
            optype = OP_GLOBAL;
        default:
            break;
    }


    //print("mangled", mangled);
    // TODO TODO TODO todo; import * at global scope failing here
    Sk.asserts.assert(scope || name.v.charAt(1) === "_");

    // in generator or at module scope, we need to store to $loc, rather that
    // to actual JS stack variables.
    mangledNoPre = mangled;
    if (this.u.ste.generator || this.u.ste.blockType !== Sk.SYMTAB_CONSTS.FunctionBlock) {
        mangled = "$loc." + mangled;
    } else if (optype === OP_FAST || optype === OP_NAME) {
        this.u.localnames.push(mangled);
    }

    switch (optype) {
        case OP_FAST:
            switch (ctx) {
                case Sk.astnodes.Load:
                case Sk.astnodes.Param:
                    // Need to check that it is bound!
                    out("if (", mangled, " === undefined) { throw new Sk.builtin.UnboundLocalError('local variable \\\'", mangled, "\\\' referenced before assignment'); }\n");
                    return mangled;
                case Sk.astnodes.Store:
                    out(mangled, "=", dataToStore, ";");
                    break;
                case Sk.astnodes.Del:
                    out("delete ", mangled, ";");
                    break;
                default:
                    Sk.asserts.fail("unhandled");
            }
            break;
        case OP_NAME:
            switch (ctx) {
                case Sk.astnodes.Load:
                    // can't be || for loc.x = 0 or null
                    return this._gr("loadname", mangled, "!==undefined?", mangled, ":Sk.misceval.loadname('", mangledNoPre, "',$gbl);");
                case Sk.astnodes.Store:
                    out(mangled, "=", dataToStore, ";");
                    break;
                case Sk.astnodes.Del:
                    out("delete ", mangled, ";");
                    break;
                case Sk.astnodes.Param:
                    return mangled;
                default:
                    Sk.asserts.fail("unhandled");
            }
            break;
        case OP_GLOBAL:
            switch (ctx) {
                case Sk.astnodes.Load:
                    return this._gr("loadgbl", "Sk.misceval.loadname('", mangledNoPre, "',$gbl)");
                case Sk.astnodes.Store:
                    out("$gbl.", mangledNoPre, "=", dataToStore, ";");
                    break;
                case Sk.astnodes.Del:
                    out("delete $gbl.", mangledNoPre);
                    break;
                default:
                    Sk.asserts.fail("unhandled case in name op_global");
            }
            break;
        case OP_DEREF:
            switch (ctx) {
                case Sk.astnodes.Load:
                    return dict + "." + mangledNoPre;
                case Sk.astnodes.Store:
                    out(dict, ".", mangledNoPre, "=", dataToStore, ";");
                    break;
                case Sk.astnodes.Param:
                    return mangledNoPre;
                default:
                    Sk.asserts.fail("unhandled case in name op_deref");
            }
            break;
        default:
            Sk.asserts.fail("unhandled case");
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
    } else {
        this.u = null;
    }
    if (this.u) {
        this.u.activateScope();
    }

    if (prev.name.v !== "<module>") {// todo; hacky
        mangled = prev.name["$r"]().v;
        mangled = mangled.substring(1, mangled.length - 1);
        out(prev.scopename, ".co_name=new Sk.builtins['str']('", mangled, "');");
        if (this.stack.length && this.u.ste.blockType == "class") {
            const classname = this.u.name.v;
            out(prev.scopename, ".co_qualname=new Sk.builtins['str']('"+classname+ "." + mangled + "');");
        }
    }
    for (var constant in prev.consts) {
        if (prev.consts.hasOwnProperty(constant)) {
            prev.suffixCode += constant + " = " + prev.consts[constant] + ";";
        }
    }
};

/**
 * @param {Array} stmts
 * @param {Sk.builtin.str=} class_for_super
 */
Compiler.prototype.cbody = function (stmts, class_for_super) {
    var i = 0;

    // If we have a docstring, then assign it to __doc__, and skip over
    // the expression when properly compiling the rest of the body.  This
    // happens for class and module bodies.
    //
    const maybeDocstring = this.maybeCDocstringOfBody(stmts);
    if (maybeDocstring !== null) {
        out("$loc.__doc__ = ", maybeDocstring, ";");
        i = 1;
    }

    for (; i < stmts.length; ++i) {
        this.vstmt(stmts[i], class_for_super);
    }
    /* Every annotated class and module should have __annotations__. */
    if (this.u.hasAnnotations) {
        this.u.varDeclsCode += "$loc.__annotations__ || ($loc.__annotations__ = new Sk.builtin.dict());";
    }
};



Compiler.prototype.cprint = function (s) {
    var i;
    var n;
    var dest;
    Sk.asserts.assert(s instanceof Sk.astnodes.Print);
    dest = "null";
    if (s.dest) {
        dest = this.vexpr(s.dest);
    }

    n = s.values.length;
    // todo; dest disabled
    for (i = 0; i < n; ++i) {
        out("$ret = Sk.misceval.print_(", /*dest, ',',*/ "new Sk.builtins['str'](", this.vexpr(s.values[i]), ").v);");
        this._checkSuspension(s);
    }
    if (s.nl) {
        out("$ret = Sk.misceval.print_(", /*dest, ',*/ "\"\\n\");");
        this._checkSuspension(s);
    }

};

Compiler.prototype.cmod = function (mod) {
    //print("-----");
    //print(Sk.astDump(mod));
    var modf = this.enterScope(new Sk.builtin.str("<module>"), mod, 0, this.canSuspend);

    var entryBlock = this.newBlock("module entry");
    this.u.prefixCode = "var " + modf + "=(function($forcegbl, $forceloc){";
    this.u.varDeclsCode =
        "var $gbl = $forcegbl || {}, $blk=" + entryBlock +
        ",$exc=[],$loc=$forceloc || $gbl,$cell={},$err=undefined;" +
        "var $ret=undefined,$postfinally=undefined,$currLineNo=undefined,$currColNo=undefined;";

    if (Sk.execLimit !== null) {
        this.u.varDeclsCode += "if (typeof Sk.execStart === 'undefined') {Sk.execStart = Date.now()}";
    }

    if (Sk.yieldLimit !== null && this.u.canSuspend) {
        this.u.varDeclsCode += "if (typeof Sk.lastYield === 'undefined') {Sk.lastYield = Date.now()}";
    }

    this.u.varDeclsCode += "var $waking=false; if ("+modf+".$wakingSuspension!==undefined) { $wakeFromSuspension(); $waking=true; }" +
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
    this.u.suffixCode = "}";
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
        case Sk.astnodes.Module:
            this.cbody(mod.body);
            out("return $loc;");
            break;
        default:
            Sk.asserts.fail("todo; unhandled case in compilerMod");
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
    // __future__ flags can be set from code
    // (with "from __future__ import ..." statements),
    // so make a temporary object that can be edited.
    var savedFlags = Sk.__future__;
    Sk.__future__ = Object.create(Sk.__future__);

    var parse = Sk.parse(filename, source);
    var ast = Sk.astFromParse(parse.cst, filename, parse.flags);
    // console.log(JSON.stringify(ast, undefined, 2));

    // compilers flags, later we can add other ones too
    var flags = {};
    flags.cf_flags = parse.flags;

    var st = Sk.symboltable(ast, filename);
    var c = new Compiler(filename, st, flags.cf_flags, canSuspend, source); // todo; CO_xxx
    var funcname = c.cmod(ast);

    // Restore the global __future__ flags
    Sk.__future__ = savedFlags;

    var ret = `var $compiledmod = function() {${c.result.join("")}\nreturn ${funcname};}();\n$compiledmod;`;

    return {
        funcname: "$compiledmod",
        code    : ret,
        filename: filename,
    };
};

Sk.exportSymbol("Sk.compile", Sk.compile);

Sk.resetCompiler = function () {
    Sk.gensymcount = 0;
};

Sk.exportSymbol("Sk.resetCompiler", Sk.resetCompiler);

Sk.fixReserved = fixReserved;
Sk.exportSymbol("Sk.fixReserved", Sk.fixReserved);

Sk.unfixReserved = unfixReserved;
Sk.exportSymbol("Sk.unfixReserved", Sk.unfixReserved);

Sk.mangleName = mangleName;
Sk.exportSymbol("Sk.mangleName", Sk.mangleName);

Sk.reservedWords_ = reservedWords_;
Sk.exportSymbol("Sk.reservedWords_", Sk.reservedWords_);
