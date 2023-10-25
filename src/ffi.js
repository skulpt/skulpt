/**
 * @namespace Sk.ffi
 *
 */
Sk.ffi = {
    remapToPy: toPy,
    remapToJs: toJs,
    remapToJsOrWrap,
    toPy,
    toJs,

    isTrue,

    toJsString,
    toJsNumber,
    toJsArray,

    toJsHashMap,

    toPyDict,
    toPyFloat,
    toPyInt,
    toPyNumber,
    toPyStr,
    toPyList,
    toPyTuple,
    toPySet,

    numberToPy,
    proxy,
};

const OBJECT_PROTO = Object.prototype;
const FUNC_PROTO = Function.prototype;

/**
 * maps from Javascript Object/Array/string to Python dict/list/str.
 *
 * only works on basic objects that are being used as storage, doesn't handle
 * functions, etc.
 * hooks.funcHook
 * hooks.dictHook
 */
function toPy(obj, hooks) {
    if (obj === null || obj === undefined) {
        return Sk.builtin.none.none$;
    }

    if (obj.sk$object) {
        return obj;
    } else if (obj.$isPyWrapped && obj.unwrap) {
        // wrap protocol
        return obj.unwrap();
    }

    const type = typeof obj;
    hooks = hooks || {};

    if (type === "string") {
        return new Sk.builtin.str(obj);
    } else if (type === "symbol") {
        return new WrappedSymbol(obj);
    } else if (type === "number") {
        return numberToPy(obj);
    } else if (type === "boolean") {
        return new Sk.builtin.bool(obj);
    } else if (type === "function") {
        // should the defualt behaviour be to proxy or new Sk.builtin.func?
        // old remap used to do an Sk.builtin.func
        return hooks.funcHook ? hooks.funcHook(obj) : proxy(obj);
    } else if (JSBI.__isBigInt(obj)) {
        // might be type === "bigint" if bigint native or an array like object for older browsers
        return new Sk.builtin.int_(JSBI.numberIfSafe(obj));
    } else if (Array.isArray(obj)) {
        return hooks.arrayHook ? hooks.arrayHook(obj) : new Sk.builtin.list(obj.map((x) => toPy(x, hooks)));
    } else if (type === "object") {
        const constructor = obj.constructor; // it's possible that a library deleted the constructor
        if (constructor === Object && Object.getPrototypeOf(obj) === OBJECT_PROTO || constructor === undefined /* Object.create(null) */) {
            return hooks.dictHook ? hooks.dictHook(obj) : toPyDict(obj, hooks);
        } else if (constructor === Uint8Array) {
            return new Sk.builtin.bytes(obj);
        } else if (constructor === Set) {
            return hooks.setHook ? hooks.setHook(obj) : toPySet(obj, hooks);
        } else if (constructor === Map) {
            if (hooks.mapHook) {
                return hooks.mapHook(obj);
            }
            const ret = new Sk.builtin.dict();
            obj.forEach((val, key) => {
                ret.mp$ass_subscript(toPy(key, hooks), toPy(val, hooks));
            });
            return ret;
        } else if (constructor === Sk.misceval.Suspension) {
            return obj;
        } else {
            // all objects get proxied - previously they were converted to dictionaries
            // can override this behaviour with a proxy hook
            return hooks.proxyHook ? hooks.proxyHook(obj) : proxy(obj);
        }
    } else if (hooks.unhandledHook) {
        // there aren't very many types left
        return hooks.unhandledHook(obj);
    }
    Sk.asserts.fail("unhandled remap case of type " + type);
}

/**
 *
 * @param {*} obj
 * @param {*} hooks
 *
 * This will handle any object and conver it to javascript
 *
 * simple objects - str, int, float, bool, tuple, list, set, dict, bytes
 * are converted as you might expect
 *
 * str - string
 * int - number or bigint (depending on the size)
 * float - number
 * bool - boolean
 * tuple/list - array
 * set - Set
 * dict - object literal
 * bytes - Uint8Array
 *
 * dict - all keys are allowed - this may cause unexpected bevaiour for non str keys
 * {None: 'a', (1,): 'b', True: 'c', A(): 'd'} => {null: 'a', '1,': 'b', true: 'c', "<'A' object>": 'd'}
 * and on conversion back will convert all the keys to str objects
 *
 * All js objects passed to this function will be returned
 *
 * All other python objects are wrapped
 * wrapped objects have a truthy $isPyWrapped property and an unwrap method
 * (used to convert back toPy)
 *
 * can override behaviours with hooks
 *
 * hooks.dictHook(pydict) - override the default behaviour from dict to object literal
 * hooks.setHook(pyset) - override the default behaviour from set to Set
 * hooks.unhandledHook(pyobj) - python objects that arent simple (str, None, bool, list, set, tuple, int, float) will return undefined - override this behaveiour here
 *
 * hooks.arrayHook(arr, pyobj) - override the array behaviour resulting from a tuple or list (get the internal array of python objects as the first argument)
 * hooks.numberHook(num, pyobj) - override the number return for float, int
 * hooks.bigintHoot(bigint, pyobj) - override the return of a bigint for large python integers (this might be polyfilled in older browsers)
 * hooks.objectHook(obj, pyobj) - override the behaviour of a javascript object (of type object) that is about to be returned
 * hooks.funcHook(func, pyobj) - override the behvaiour of javascript function that is about to be returned
 */
function toJs(obj, hooks) {
    if (obj === undefined || obj === null) {
        return obj;
    }
    const val = obj.valueOf();
    // for str/bool/int/float/tuple/list this returns the obvious: this.v;
    // can override valueOf for skulpt objects that you want to send back and forth between python/js
    if (val === null) {
        return val;
    }

    const type = typeof val;
    hooks = hooks || {};

    if (type === "string") {
        return hooks.stringHook ? hooks.stringHook(val) : val;
    } else if (type === "symbol") {
        return val;
    } else if (type === "boolean") {
        return val;
    } else if (type === "number") {
        return hooks.numberHook ? hooks.numberHook(val, obj) : val;
        // pass the number and the original obj (float or int (or number))
    } else if (JSBI.__isBigInt(val)) {
        // either it's a native bigint or polyfilled as an array like object
        // pass the bigint (or polyfilled bigint) and the original obj (int) to the hook function
        // or return the the bigint
        return hooks.bigintHook ? hooks.bigintHook(val, obj) : val;
    } else if (Array.isArray(val)) {
        return hooks.arrayHook ? hooks.arrayHook(val, obj) : val.map((x) => toJs(x, hooks));
        // pass the array and the original obj (tuple or list (or Array))
    } else if (val.sk$object) {
        // python objects are either of type object or function
        // so check if they're python objects now
        // these python object didn't override valueOf()
        if (obj instanceof Sk.builtin.dict) {
            return hooks.dictHook ? hooks.dictHook(obj) : toJsHashMap(obj, hooks);
        } else if (obj instanceof Sk.builtin.set) {
            return hooks.setHook ? hooks.setHook(obj) : new Set(toJsArray(obj, hooks));
        } else {
            // a wrap protocol would set $isPyWrapped = true, and an unwrap function to be called in toPy
            return hooks.unhandledHook ? hooks.unhandledHook(obj) : undefined;
        }
        // fall through to unhandled hook - or return undefined
    } else if (type === "object") {
        return hooks.objectHook ? hooks.objectHook(val, obj) : val;
        // might be a Uint8Array or some other js object that was proxied
        // pass this val, obj to the objectHook if defined
        // if no hook function just return the val which is not a python object
    } else if (type === "function") {
        // likely the result of a proxied function
        // if no hook function just return the val which is not a python object
        return hooks.funcHook ? hooks.funcHook(val, obj) : val;
    }

    // we really shouldn't get here - what's left - type symbol?
    Sk.asserts.fail("unhandled type " + type);
}

/** sends complex python objects as opaque wrapped objects */
function remapToJsOrWrap(obj) {
    return toJs(obj, jsHooks);
}

/** @returns a bool based on whether it is python truthy or not. Can also hand js values */
function isTrue(obj) {
    // basically the logic for Sk.misceval.isTrue - here for convenience
    return obj != null && obj.nb$bool ? obj.nb$bool() : obj.sq$length ? obj.sq$length() !== 0 : Boolean(obj);
}

function toJsNumber(obj) {
    return Number(obj);
}
function toJsString(obj) {
    return String(obj);
}

function toJsArray(obj, hooks) {
    return Array.from(obj, (x) => toJs(x, hooks));
}

function toJsHashMap(dict, hooks) {
    const obj = {};
    dict.$items().forEach(([key, val]) => {
        // if non str keys are sent to this function it may behave unexpectedly (but it won't fail)
        obj[key.valueOf()] = toJs(val, hooks);
    });
    return obj;
}

function numberToPy(val) {
    if (Number.isInteger(val)) {
        if (Math.abs(val) < Number.MAX_SAFE_INTEGER) {
            return new Sk.builtin.int_(val);
        }
        return new Sk.builtin.int_(JSBI.BigInt(val));
    }
    return new Sk.builtin.float_(val);
}

const isInteger = /^-?\d+$/;

function toPyNumber(obj) {
    const type = typeof obj;
    if (type === "number") {
        return numberToPy(obj);
    }
    if (type === "string") {
        if (obj.match(isInteger)) {
            return new Sk.builtin.int_(obj);
        }
        return new Sk.builtin.float_(parseFloat(obj));
    }
    if (JSBI.__isBigInt(obj)) {
        // either type is bigint or using the bigint polyfill
        return new Sk.builtin.int_(JSBI.numberIfSafe(obj));
    }
    return new Sk.builtin.float_(Number(obj));
}

function toPyFloat(num) {
    return new Sk.builtin.float_(Number(num));
}

function toPyStr(obj) {
    return new Sk.builtin.str(obj);
}

function toPyList(obj, hooks) {
    return new Sk.builtin.list(Array.from(obj, (x) => toPy(x, hooks)));
}

function toPySet(obj, hooks) {
    return new Sk.builtin.set(Array.from(obj, (x) => toPy(x, hooks)));
}

function toPyTuple(obj, hooks) {
    return new Sk.builtin.tuple(Array.from(obj, (x) => toPy(x, hooks)));
}

function toPyInt(num) {
    if (typeof num === "number") {
        num = Math.trunc(num);
        return Math.abs(num) < Number.MAX_SAFE_INTEGER
            ? new Sk.builtin.int_(num)
            : new Sk.builtin.int_(JSBI.BigInt(num));
    } else if (JSBI.__isBigInt(num)) {
        return new Sk.builtin.int_(JSBI.numberIfSafe(num));
    } else if (typeof num === "string" && num.match(isInteger)) {
        return new Sk.builtin.int_(num);
    } else {
        throw new TypeError("bad type passed to toPyInt() got " + num);
    }
}

function toPyDict(obj, hooks) {
    const ret = new Sk.builtin.dict();
    Object.entries(obj).forEach(([key, val]) => {
        ret.mp$ass_subscript(new Sk.builtin.str(key), toPy(val, hooks));
    });
    return ret;
}

// cache the proxied objects in a weakmap
const _proxied = new WeakMap();

// use proxy if you want to proxy an arbitrary js object
// the only flags currently used is {bound: some_js_object}
function proxy(obj, flags) {
    if (obj === null || obj === undefined) {
        return Sk.builtin.none.none$;
    }
    const type = typeof obj;
    if (type !== "object" && type !== "function") {
        return toPy(obj); // don't proxy strings, numbers, bigints
    }
    flags = flags || {};
    const cached = _proxied.get(obj);
    if (cached) {
        if (flags.bound === cached.$bound) {
            return cached;
        }
        if (!flags.name) {
            flags.name = cached.$name;
        }
    }
    let rv;
    if (type === "function") {
        rv = new JsProxy(obj, flags);
    } else if (Array.isArray(obj)) {
        rv = new JsProxyList(obj);
    } else {
        const constructor = obj.constructor;
        if (constructor === Map) {
            rv = new JsProxyMap(obj);
        } else if (constructor === Set) {
            rv = new JsProxySet(obj);
        } else {
            rv = new JsProxy(obj, flags);
        }
    }
    _proxied.set(obj, rv);
    return rv;
}

const proxyHook = (obj) => proxy(obj);
const dictHook = proxyHook,
    mapHook = proxyHook,
    setHook = proxyHook;

const arrayHook = (obj) => {
    if (Object.isFrozen(obj)) {
        return toPyList(obj, pyHooks);
    }
    return proxy(obj);
};

const unhandledHook = (obj) => String(obj);

const pyHooks = { arrayHook, dictHook, unhandledHook, setHook, mapHook };

// unhandled is likely only Symbols and get a string rather than undefined
const boundHook = (bound, name) => ({
    dictHook,
    funcHook: (obj) => proxy(obj, { bound, name }),
    unhandledHook,
    arrayHook,
    setHook,
    mapHook,
});

const constructorHook = (name) => ({
    dictHook,
    proxyHook: (obj) => proxy(obj, { name }),
    arrayHook,
    setHook,
    mapHook,
});

const unhandledPythonObject = (obj) => {
    const _cached = _proxied.get(obj);
    if (_cached) {
        return _cached;
    }
    const pyWrapped = { v: obj, $isPyWrapped: true, unwrap: () => obj };
    if (obj.tp$call === undefined) {
        _proxied.set(obj, pyWrapped);
        return pyWrapped;
    }
    const pyWrappedCallable = (...args) => {
        args = args.map((x) => toPy(x, pyHooks));
        let ret = Sk.misceval.tryCatch(
            () => Sk.misceval.chain(obj.tp$call(args), (res) => toJs(res, jsHooks)),
            (e) => {
                if (Sk.uncaughtException) {
                    Sk.uncaughtException(e);
                } else {
                    throw e;
                }
            }
        );
        while (ret instanceof Sk.misceval.Suspension) {
            // better to return a promise here then hope the javascript library will handle a suspension
            if (!ret.optional) {
                return Sk.misceval.asyncToPromise(() => ret);
            }
            ret = ret.resume();
        }
        return ret;
    };
    _proxied.set(obj, Object.assign(pyWrappedCallable, pyWrapped));
    return pyWrappedCallable;
};

const jsHooks = {
    unhandledHook: unhandledPythonObject,
    arrayHook: (obj) => {
        return obj[PROXY_SYMBOL] || obj.map((x) => toJs(x, jsHooks));
    },
};

// we customize the dictHook and the funcHook here - we want to keep object literals as proxied objects when remapping to Py
// and we want funcs to be proxied

function setJsProxyAttr(pyName, pyValue) {
    const jsName = pyName.toString();
    if (pyValue === undefined) {
        delete this.js$wrapped[jsName];
    } else {
        this.js$wrapped[jsName] = toJs(pyValue, jsHooks);
    }
}

function proxyDir() {
    const dir = [];
    // just looping over enumerable properties can hide a lot of properties
    // especially in es6 classes
    let obj = this.js$wrapped;

    while (obj != null && obj !== OBJECT_PROTO && obj !== FUNC_PROTO) {
        dir.push(...Object.getOwnPropertyNames(obj));
        obj = Object.getPrototypeOf(obj);
    }
    const pyDir = toJsArray(Sk.misceval.callsimArray(Sk.builtin.type.prototype.__dir__, [this.ob$type]));
    return new toPyList(new Set([...pyDir, ...dir]));
}

const proxyDirMethodDef = {
    __dir__: {
        $meth: proxyDir,
        $flags: { NoArgs: true },
    },
};

const JsProxy = Sk.abstr.buildNativeClass("Proxy", {
    constructor: function JsProxy(obj, flags) {
        if (obj === undefined) {
            throw new Sk.builtin.TypeError("Proxy cannot be called from python");
        }
        this.js$wrapped = obj;
        this.$module = null;
        this.$methods = Object.create(null);
        this.in$repr = false;

        flags || (flags = {});

        // make slot functions lazy
        Object.defineProperties(this, this.memoized$slots);

        // determine the type and name of this proxy
        if (typeof obj === "function") {
            this.is$callable = true;
            this.$bound = flags.bound;
            this.$name = flags.name || obj.name || "(native JS)";
            if (this.$name.length <= 2) {
                this.$name = this.$name + " (native JS)"; // better this than a single letter minified name
            }
        } else {
            this.is$callable = false;
            delete this.is$type; // set in memoized slots for lazy loading;
            this.is$type = false;
            this.$name = flags.name;
        }
    },
    slots: {
        tp$doc: "proxy for a javascript object",
        tp$hash() {
            return Sk.builtin.object.prototype.tp$hash.call(this.js$wrapped);
        },
        tp$getattr(pyName) {
            return this.$lookup(pyName) || Sk.generic.getAttr.call(this, pyName);
        },
        tp$setattr: setJsProxyAttr,
        $r() {
            if (this.is$callable) {
                if (this.is$type || !this.$bound) {
                    return new Sk.builtin.str("<" + this.tp$name + " '" + this.$name + "'>");
                }
                const boundRepr = Sk.misceval.objectRepr(proxy(this.$bound));
                return new Sk.builtin.str("<bound " + this.tp$name + " '" + this.$name + "' of " + boundRepr + ">");
            } else if (this.js$proto === OBJECT_PROTO) {
                if (this.in$repr) {
                    return new Sk.builtin.str("{...}");
                }
                this.in$repr = true;
                const entries = Object.entries(this.js$wrapped).map(([key, val]) => {
                    val = toPy(val, boundHook(this.js$wrapped, key));
                    return "'" + key + "': " + Sk.misceval.objectRepr(val);
                });
                const ret = new Sk.builtin.str("proxyobject({" + entries.join(", ") + "})");
                this.in$repr = false;
                return ret;
            }
            const object = this.tp$name === "proxyobject" ? "object" : "proxyobject";
            return new Sk.builtin.str("<" + this.tp$name + " " + object + ">");
        },
        tp$as_sequence_or_mapping: true,
        mp$subscript(pyItem) {
            // todo should we account for -1 i.e. array like subscripts
            const ret = this.$lookup(pyItem);
            if (ret === undefined) {
                throw new Sk.builtin.LookupError(pyItem);
            }
            return ret;
        },
        mp$ass_subscript(pyItem, value) {
            return this.tp$setattr(pyItem, value);
        },
        sq$contains(item) {
            return toJs(item) in this.js$wrapped;
        },
        ob$eq(other) {
            return this.js$wrapped === other.js$wrapped;
        },
        ob$ne(other) {
            return this.js$wrapped !== other.js$wrapped;
        },
        tp$as_number: true,
        nb$bool() {
            // we could just check .constructor but some libraries delete it!
            if (this.js$proto === OBJECT_PROTO) {
                return Object.keys(this.js$wrapped).length > 0;
            } else if (this.sq$length) {
                return this.sq$length() > 0;
            } else {
                return true;
            }
        },
    },
    methods: {
        ...proxyDirMethodDef,
        __new__: {
            // this is effectively a static method
            $meth(js_proxy, ...args) {
                if (!(js_proxy instanceof JsProxy)) {
                    throw new Sk.builtin.TypeError(
                        "expected a proxy object as the first argument not " + Sk.abstr.typeName(js_proxy)
                    );
                }
                try {
                    // let javascript throw errors if it wants
                    return js_proxy.$new(args);
                } catch (e) {
                    if (e instanceof TypeError && e.message.includes("not a constructor")) {
                        throw new Sk.builtin.TypeError(Sk.misceval.objectRepr(js_proxy) + " is not a constructor");
                    }
                    throw e;
                }
            },
            $flags: { MinArgs: 1 },
        },
        __call__: {
            $meth(args, kwargs) {
                if (typeof this.js$wrapped !== "function") {
                    throw new Sk.builtin.TypeError("'" + this.tp$name + "' object is not callable");
                }
                return this.$call(args, kwargs);
            },
            $flags: { FastCall: true },
        },
        keys: {
            $meth() {
                return new Sk.builtin.list(Object.keys(this.js$wrapped).map((x) => new Sk.builtin.str(x)));
            },
            $flags: { NoArgs: true },
        },
        get: {
            $meth(pyName, _default) {
                return this.$lookup(pyName) || _default || Sk.builtin.none.none$;
            },
            $flags: { MinArgs: 1, MaxArgs: 2 },
        },
    },
    getsets: {
        __class__: {
            $get() {
                return toPy(this.js$wrapped.constructor, pyHooks);
            },
            $set() {
                throw new Sk.builtin.TypeError("not writable");
            },
        },
        __name__: {
            $get() {
                return new Sk.builtin.str(this.$name);
            },
        },
        __module__: {
            $get() {
                return this.$module || Sk.builtin.none.none$;
            },
            $set(v) {
                this.$module = v;
            },
        },
    },
    proto: {
        valueOf() {
            return this.js$wrapped;
        },
        $new(args, kwargs) {
            Sk.abstr.checkNoKwargs("__new__", kwargs);
            return toPy(new this.js$wrapped(...args.map((x) => toJs(x, jsHooks))), constructorHook(this.$name));
        },
        $call(args, kwargs) {
            Sk.abstr.checkNoKwargs("__call__", kwargs);
            return Sk.misceval.chain(
                this.js$wrapped.apply(
                    this.$bound,
                    args.map((x) => toJs(x, jsHooks))
                ),
                (res) => (res instanceof Promise ? Sk.misceval.promiseToSuspension(res) : res),
                (res) => toPy(res, pyHooks)
            );
        },
        $lookup(pyName) {
            const jsName = pyName.toString();
            const attr = this.js$wrapped[jsName];
            if (attr !== undefined) {
                // here we override the funcHook to pass the bound object
                return toPy(attr, boundHook(this.js$wrapped, jsName));
            } else if (jsName in this.js$wrapped) {
                // do we actually have this property?
                return Sk.builtin.none.none$;
            }
        },
        // only get these if we need them
        memoized$slots: {
            js$proto: {
                configurable: true,
                get() {
                    delete this.js$proto;
                    return (this.js$proto = Object.getPrototypeOf(this.js$wrapped));
                },
            },
            tp$iter: {
                configurable: true,
                get() {
                    delete this.tp$iter;
                    if (this.js$wrapped[Symbol.iterator] !== undefined) {
                        return (this.tp$iter = () => {
                            return proxy(this.js$wrapped[Symbol.iterator]());
                        });
                    } else {
                        return (this.tp$iter = () => {
                            // we could set it to undefined but because we have a __getitem__
                            // python tries to use seq_iter which will result in a 0 LookupError, which is confusing
                            throw new Sk.builtin.TypeError(Sk.misceval.objectRepr(this) + " is not iterable");
                        });
                    }
                },
            },
            tp$iternext: {
                configurable: true,
                get() {
                    delete this.tp$iternext;
                    if (this.js$wrapped.next !== undefined) {
                        return (this.tp$iternext = () => {
                            const nxt = this.js$wrapped.next().value;
                            return nxt && toPy(nxt, pyHooks);
                        });
                    }
                },
            },
            sq$length: {
                configurable: true,
                get() {
                    delete this.sq$length;
                    if (!this.is$callable && this.js$wrapped.length !== undefined) {
                        return (this.sq$length = () => this.js$wrapped.length);
                    }
                },
            },
            tp$call: {
                configurable: true,
                get() {
                    delete this.tp$call;
                    if (this.is$callable) {
                        return (this.tp$call = this.is$type ? this.$new : this.$call);
                    }
                },
            },
            tp$name: {
                configurable: true,
                get() {
                    delete this.tp$name;
                    if (!this.is$callable) {
                        const obj = this.js$wrapped;
                        let tp$name =
                            obj[Symbol.toStringTag] ||
                            this.$name ||
                            (obj.constructor && obj.constructor.name) ||
                            "proxyobject";
                        if (tp$name === "Object") {
                            tp$name = this[Symbol.toStringTag];
                            tp$name = "proxyobject";
                        } else if (tp$name.length <= 2) {
                            // we might have a better name in the cache so check there...
                            tp$name = proxy(obj.constructor).$name;
                        }
                        return (this.tp$name = tp$name);
                    } else {
                        return (this.tp$name = this.is$type ? "proxyclass" : this.$bound ? "proxymethod" : "proxyfunction");
                    }
                },
            },
            is$type: {
                configurable: true,
                get() {
                    delete this.is$type;
                    // we already know if we're a function
                    const jsFunc = this.js$wrapped;
                    const proto = jsFunc.prototype;
                    if (proto === undefined) {
                        // Arrow functions and shorthand methods don't get a prototype
                        // neither do native js functions like requestAnimationFrame, JSON.parse
                        // Proxy doesn't get a prototype but must be called with new - it's the only one I know
                        // How you'd use Proxy in python I have no idea
                        return (this.is$type = jsFunc === Sk.global.Proxy);
                    }
                    const maybeConstructor = checkBodyIsMaybeConstructor(jsFunc);
                    if (maybeConstructor === true) {
                        // definitely a constructor and needs new
                        return (this.is$type = true);
                    } else if (maybeConstructor === false) {
                        // Number, Symbol, Boolean, BigInt, String
                        return (this.is$type = false);
                    }
                    const protoLen = Object.getOwnPropertyNames(proto).length;
                    if (protoLen > 1) {
                        // if the function object has a prototype with more than just constructor, intention is to be used as a constructor
                        return (this.is$type = true);
                    }
                    return (this.is$type = Object.getPrototypeOf(proto) !== OBJECT_PROTO);
                    // we could be a subclass with only constructor on the prototype
                    // if our prototype's __proto__ is Object.prototype then we are the most base function
                    // the most likely option is that `this` should be whatever `this.$bound` is, rather than using new
                    // example x is this.$bound and shouldn't be called with new
                    // var x = {foo: function() {this.bar='foo'}}
                    // Sk.misceval.Break is a counter example
                    // better to fail with Sk.misceval.Break() (which may have a type guard) than fail by calling new x.foo()
                },
            },
        },
    },
    flags: {
        sk$acceptable_as_base_class: false,
    },
});

const JsProxyObjectAsDict = Sk.abstr.buildNativeClass("ProxyObject", {
    constructor: function (obj) {
        Sk.builtin.dict.call(this);
        this.js$wrapped = obj;
    },
});

function proxyGetAttr(pyName) {
    return Sk.generic.getAttr.call(this, pyName) || this.$lookup(pyName);
}

function dict$clear() {
    this.js$wrapped.clear();
}
function dict$copy() {
    return Sk.misceval.callsimOrSuspendArray(Sk.builtin.dict, [this]);
}
function get$size() {
    return this.js$wrapped.size;
}
function mp$lookup(k) {
    const jsKey = toJs(k, jsHooks);
    if (this.js$wrapped.has(jsKey)) {
        return this.proxy$getItem(jsKey);
    }
}
function pop$item(k) {
    const jsKey = toJs(k, jsHooks);
    if (this.js$wrapped.has(jsKey)) {
        const rv = this.proxy$getItem(jsKey);
        this.js$wrapped.delete(jsKey);
        return rv;
    }
}

const JsProxyMap = Sk.abstr.buildNativeClass("ProxyMap", {
    base: Sk.builtin.dict,
    constructor: function (obj) {
        Sk.builtin.dict.call(this);
        this.js$wrapped = obj;
    },
    slots: {
        tp$getattr: proxyGetAttr,
        $r() {
            return new Sk.builtin.str(`ProxyMap(${Sk.builtin.dict.prototype.$r.call(this)})`);
        },
    },
    methods: proxyDirMethodDef,
    proto: {
        $lookup: JsProxy.prototype.$lookup,
        proxy$getItem(jsKey) {
            return toPy(this.js$wrapped.get(jsKey), pyHooks);
        },
        mp$lookup,
        dict$setItem(k, v) {
            this.js$wrapped.set(toJs(k, jsHooks), toJs(v, jsHooks));
        },
        dict$clear,
        pop$item,
        dict$copy,
        get$size,
        $items() {
            return [...this.js$wrapped].map(([k, v]) => [toPy(k, pyHooks), toPy(v, pyHooks)]);
        },
        valueOf: JsProxy.prototype.valueOf,
    },
    $flags: {
        sk$acceptable_as_base_class: false,
    },
});

const InternalProxySet = Sk.abstr.buildNativeClass("InternalProxySet", {
    base: Sk.builtin.dict,
    constructor: function (obj) {
        Sk.builtin.dict.call(this);
        this.js$wrapped = obj;
    },
    proto: {
        proxy$getItem(k) {
            return true;
        },
        mp$lookup,
        dict$setItem(k, v) {
            this.js$wrapped.add(toJs(k, jsHooks));
        },
        dict$clear,
        pop$item,
        dict$copy,
        get$size,
        $items() {
            return [...this.js$wrapped].map((k) => [toPy(k, pyHooks), true]);
        },
    },
});

const JsProxySet = Sk.abstr.buildNativeClass("ProxySet", {
    base: Sk.builtin.set,
    constructor: function (obj) {
        Sk.builtin.set.call(this);
        this.v = new InternalProxySet(obj);
        this.js$wrapped = obj;
    },
    slots: {
        tp$getattr: proxyGetAttr,
    },
    methods: proxyDirMethodDef,
    proto: {
        $lookup: JsProxy.prototype.$lookup,
        valueOf: JsProxy.prototype.valueOf,
    },
    $flags: {
        sk$acceptable_as_base_class: false,
    },
});

const ArrayFunction = {
    apply(target, thisArg, argumentsList) {
        const jsArgs = toJsArray(argumentsList, jsHooks);
        return target.apply(thisArg, jsArgs);
    },
};

const arrayMethods = {};
const ArrayProto = Array.prototype;
const PROXY_SYMBOL = Symbol("$proxy");

const arrayHandler = {
    get(target, attr) {
        if (attr === PROXY_SYMBOL) {
            return target;
        }
        const rv = target[attr];
        if (attr in ArrayProto) {
            // internal calls like this.v.pop(); this.v.push(x);
            if (typeof rv === "function") {
                return arrayMethods[attr] || (arrayMethods[attr] = new Proxy(rv, ArrayFunction));
            }
            // this.v.length;
            return rv;
        }
        if (rv === undefined && !(attr in target)) {
            return rv;
        }
        // attributes on the list instance;
        return toPy(rv, pyHooks);
    },
    set(target, attr, value) {
        // for direct access of the array via this.v[x] = y;
        target[attr] = toJs(value, jsHooks);
        return true;
    },
};

const JsProxyList = Sk.abstr.buildNativeClass("ProxyList", {
    base: Sk.builtin.list,
    constructor: function (L) {
        Sk.builtin.list.call(this, L);
        this.js$wrapped = this.v;
        this.v = new Proxy(this.v, arrayHandler);
    },
    slots: {
        tp$getattr: proxyGetAttr,
        tp$setattr: setJsProxyAttr,
        $r() {
            return new Sk.builtin.str("proxylist(" + Sk.builtin.list.prototype.$r.call(this) + ")");
        },
    },
    methods: proxyDirMethodDef,
    proto: {
        $lookup: JsProxy.prototype.$lookup,
    },
});

const is_constructor = /^class|^function[a-zA-Z\d\(\)\{\s]+\[native code\]\s+\}$/;

const getFunctionBody = FUNC_PROTO.toString;
const noNewNeeded = new Set([Number, String, Symbol, Boolean]);
// Some js builtins that shouldn't be called with new
// these are unlikely to be proxied by the user but you never know
if (typeof Sk.global.BigInt !== "undefined") {
    noNewNeeded.add(Sk.global.BigInt);
}

function checkBodyIsMaybeConstructor(obj) {
    const body = getFunctionBody.call(obj);
    const match = body.match(is_constructor);
    if (match === null) {
        return null; // Not a constructor
    } else if (match[0] === "class") {
        return true;
    } else {
        // some native constructors shouldn't have new
        return !noNewNeeded.has(obj);
    }
}

const WrappedSymbol = Sk.abstr.buildNativeClass("ProxySymbol", {
    constructor: function WrappedSymbol(symbol) {
        this.v = symbol;
    },
    slots: {
        $r() {
            return new Sk.builtin.str(this.toString());
        },
    },
    proto: {
        toString() {
            return this.v.toString();
        },
        valueOf() {
            return this.v;
        },
    },
});
