import {
    lookupSpecial,
    sequenceGetSlice,
    objectGetItem,
    sequenceDelSlice,
    sequenceSetSlice,
    objectDelItem,
    objectSetItem,
    iter,
} from './abstract';
import { TypeError, ValueError, NameError } from './errors';
import { asnum$ } from './builtin';
import { softspace_ } from './env';
import { int_ } from './types/int';
import { lng } from './types/long';
import { bool } from './bool';
import { checkInt, checkIterable, checkNumber, checkString } from './function/checks';
import { slice } from './slice';
import { set } from './types/set';
import { dict } from './types/dict';
import { list } from './types/list';
import { tuple } from './types/tuple';
import { typeName, type } from './type';
import { str } from './types/str';
import { none } from './types/object';

/*
  Suspension object format:
  {resume: function() {...}, // the continuation - returns either another suspension or the return value
   data: <copied down from innermost level>,
   optional: <if true, can be resumed immediately (eg debug stops)>,
   child: <Suspension, or null if we are the innermost level>,
   $blk: <>, $loc: <>, $gbl: <>, $exc: <>, $err: <>, [$cell: <>],
  }
*/

export class Suspension {
    /**
     *
     * Hi kids lets make a suspension...
     * @constructor
     * @param{function(?)=} resume A function to be called on resume. child is resumed first and its return value is passed to this function.
     * @param{Object=} child A child suspension. 'optional' will be copied from here if supplied.
     * @param{Object=} data Data attached to this suspension. Will be copied from child if not supplied.
     */
    constructor(resume, child, data) {
        this.$isSuspension = true;
        if (resume !== undefined && child !== undefined) {
            this.resume = function() { return resume(child.resume()); };
        }
        this.child = child;
        this.optional = child !== undefined && child.optional;
        if (data === undefined && child !== undefined) {
            this.data = child.data;
        } else {
            this.data = data;
        }
    };
}

/**
 *
 * Well this seems pretty obvious by the name what it should do..
 *
 * @param{Suspension} susp
 * @param{string=} message
 */
export function retryOptionalSuspensionOrThrow(susp, message) {
    while (susp instanceof Suspension) {
        if (!susp.optional) {
            throw new SuspensionError(message || "Cannot call a function that blocks or suspends here");
        }
        susp = susp.resume();
    }
    return susp;
}

/**
 * Check if the given object is valid to use as an index. Only ints, or if the object has an `__index__` method.
 * @param o
 * @returns {boolean}
 */
export function isIndex(o) {
    if (checkInt(o)) {
        return true;
    }
    if (lookupSpecial(o, "__index__")) {
        return true;
    }
    return false;
}

export function asIndex(o) {
    var idxfn, ret;

    if (!isIndex(o)) {
        return undefined;
    }
    if (o === null) {
        return undefined;
    }
    if (o === true) {
        return 1;
    }
    if (o === false) {
        return 0;
    }
    if (typeof o === "number") {
        return o;
    }
    if (o.constructor === int_) {
        return o.v;
    }
    if (o.constructor === lng) {
        return o.tp$index();
    }
    if (o.constructor === bool) {
        return asnum$(o);
    }
    idxfn = lookupSpecial(o, "__index__");
    if (idxfn) {
        ret = callsim(idxfn, o);
        if (!checkInt(ret)) {
            throw new TypeError("__index__ returned non-(int,long) (type " +
                                           typeName(ret) + ")");
        }
        return asnum$(ret);
    }
    goog.asserts.fail("todo asIndex;");
}

/**
 * return u[v:w]
 */
export function applySlice(u, v, w, canSuspend) {
    var ihigh;
    var ilow;
    if (u.sq$slice && isIndex(v) && isIndex(w)) {
        ilow = asIndex(v);
        if (ilow === undefined) {
            ilow = 0;
        }
        ihigh = asIndex(w);
        if (ihigh === undefined) {
            ihigh = 1e100;
        }
        return sequenceGetSlice(u, ilow, ihigh);
    }
    return objectGetItem(u, new slice(v, w, null), canSuspend);
}

/**
 * u[v:w] = x
 */
export function assignSlice(u, v, w, x, canSuspend) {
    var slice;
    var ihigh;
    var ilow;
    if (u.sq$ass_slice && isIndex(v) && isIndex(w)) {
        ilow = asIndex(v) || 0;
        ihigh = asIndex(w) || 1e100;
        if (x === null) {
            sequenceDelSlice(u, ilow, ihigh);
        } else {
            sequenceSetSlice(u, ilow, ihigh, x);
        }
    } else {
        slice = new slice(v, w);
        if (x === null) {
            return objectDelItem(u, slice);
        } else {
            return objectSetItem(u, slice, x, canSuspend);
        }
    }
}

/**
 * Used by min() and max() to get an array from arbitrary input.
 * Note that this does no validation, just coercion.
 */
export function arrayFromArguments(args) {
    // If args is not a single thing return as is
    var it, i;
    var res;
    var arg;
    if (args.length != 1) {
        return args;
    }
    arg = args[0];
    if (arg instanceof set) {
        // this is a set
        arg = arg.tp$iter().$obj;
    } else if (arg instanceof dict) {
        // this is a list
        arg = dict.prototype["keys"].func_code(arg);
    }

    // shouldn't else if here as the above may output lists to arg.
    if (arg instanceof list || arg instanceof tuple) {
        return arg.v;
    } else if (checkIterable(arg)) {
        // handle arbitrary iterable (strings, generators, etc.)
        res = [];
        for (it = iter(arg), i = it.tp$iternext();
             i !== undefined; i = it.tp$iternext()) {
            res.push(i);
        }
        return res;
    }

    throw new TypeError("'" + typeName(arg) + "' object is not iterable");
}

export function print_(x) {
    // this was function print(x)   not sure why...
    var s;

    function isspace(c) {
        return c === "\n" || c === "\t" || c === "\r";
    }

    if (softspace_) {
        if (x !== "\n") {
            Sk.output(" ");
        }
        softspace_ = false;
    }

    s = new Sk.builtin.str(x);

    return chain(Sk.importModule("sys", false, true), function(sys) {
        return apply(sys["$d"]["stdout"]["write"], undefined, undefined, undefined, [sys["$d"]["stdout"], s]);
    }, function () {
        if (s.v.length === 0 || !isspace(s.v[s.v.length - 1]) || s.v[s.v.length - 1] === " ") {
            softspace_ = true;
        }
    });
};

/**
 * @param {string} name
 * @param {Object=} other generally globals
 */
export function loadname(name, other) {
    var bi;
    var v = other[name];
    if (v !== undefined) {
        if (typeof v === "function" && v["$d"] === undefined && v["tp$name"] === undefined) {
            return v();
        }
        return v;
    }

    bi = Sk.builtins[name];
    if (bi !== undefined) {
        return bi;
    }

    throw new NameError("name '" + Sk.unfixReserved(name) + "' is not defined");
}

/**
 *
 * Notes on necessity for 'call()':
 *
 * Classes are callable in python to create an instance of the class. If
 * we're calling "C()" we cannot tell at the call site whether we're
 * calling a standard function, or instantiating a class.
 *
 * JS does not support user-level callables. So, we can't use the normal
 * prototype hierarchy to make the class inherit from a 'class' type
 * where the various tp$getattr, etc. methods would live.
 *
 * Instead, we must copy all the methods from the prototype of our class
 * type onto every instance of the class constructor function object.
 * That way, both "C()" and "C.tp$getattr(...)" can still work. This is
 * of course quite expensive.
 *
 * The alternative would be to indirect all calls (whether classes or
 * regular functions) through something like C.$call(...). In the case
 * of class construction, $call could then call the constructor after
 * munging arguments to pass them on. This would impose a penalty on
 * regular function calls unfortunately, as they would have to do the
 * same thing.
 *
 * Note that the same problem exists for function objects too (a "def"
 * creates a function object that also has properties). It just happens
 * that attributes on classes in python are much more useful and common
 * that the attributes on functions.
 *
 * Also note, that for full python compatibility we have to do the $call
 * method because any python object could have a __call__ method which
 * makes the python object callable too. So, unless we were to make
 * *all* objects simply (function(){...}) and use the dict to create
 * hierarchy, there would be no way to call that python user function. I
 * think I'm prepared to sacrifice __call__ support, or only support it
 * post-ECMA5 or something.
 *
 * Is using (function(){...}) as the only object type too crazy?
 * Probably. Better or worse than having two levels of function
 * invocation for every function call?
 *
 * For a class `C' with instance `inst' we have the following cases:
 *
 * 1. C.attr
 *
 * 2. C.staticmeth()
 *
 * 3. x = C.staticmeth; x()
 *
 * 4. inst = C()
 *
 * 5. inst.attr
 *
 * 6. inst.meth()
 *
 * 7. x = inst.meth; x()
 *
 * 8. inst(), where C defines a __call__
 *
 * Because in general these are accomplished by a helper function
 * (tp$getattr/setattr/slice/ass_slice/etc.) it seems appropriate to add
 * a call that generally just calls through, but sometimes handles the
 * unusual cases. Once ECMA-5 is more broadly supported we can revisit
 * and hopefully optimize.
 *
 * @param {Object} func the thing to call
 * @param {Object=} kwdict **kwargs
 * @param {Object=} varargseq **args
 * @param {Object=} kws keyword args or undef
 * @param {...*} args stuff to pass it
 *
 *
 * TODO I think all the above is out of date.
 */
export function call(func, kwdict, varargseq, kws, args) {
    args = Array.prototype.slice.call(arguments, 4);
    // todo; possibly inline apply to avoid extra stack frame creation
    return apply(func, kwdict, varargseq, kws, args);
}

/**
 * @param {?Object} suspensionHandlers
 * @param {Object} func the thing to call
 * @param {Object=} kwdict **kwargs
 * @param {Object=} varargseq **args
 * @param {Object=} kws keyword args or undef
 * @param {...*} args stuff to pass it
 *
 *
 * TODO I think all the above is out of date.
 */
export function callAsync(suspensionHandlers, func, kwdict, varargseq, kws, args) {
    args = Array.prototype.slice.call(arguments, 5);
    // todo; possibly inline apply to avoid extra stack frame creation
    return applyAsync(suspensionHandlers, func, kwdict, varargseq, kws, args);
}

export function callOrSuspend(func, kwdict, varargseq, kws, args) {
    args = Array.prototype.slice.call(arguments, 4);
    // todo; possibly inline apply to avoid extra stack frame creation
    return applyOrSuspend(func, kwdict, varargseq, kws, args);
}

/**
 * @param {Object} func the thing to call
 * @param {...*} args stuff to pass it
 */
export function callsim(func, args) {
    args = Array.prototype.slice.call(arguments, 1);
    return apply(func, undefined, undefined, undefined, args);
}

/**
 * @param {?Object} suspensionHandlers any custom suspension handlers
 * @param {Object} func the thing to call
 * @param {...*} args stuff to pass it
 */
export function callsimAsync(suspensionHandlers, func, args) {
    args = Array.prototype.slice.call(arguments, 2);
    return applyAsync(suspensionHandlers, func, undefined, undefined, undefined, args);
}


/**
 * @param {Object} func the thing to call
 * @param {...*} args stuff to pass it
 */
export function callsimOrSuspend(func, args) {
    args = Array.prototype.slice.call(arguments, 1);
    return applyOrSuspend(func, undefined, undefined, undefined, args);
}

/**
 * Wrap applyOrSuspend, but throw an error if we suspend
 */
export function apply(func, kwdict, varargseq, kws, args) {
    var r = applyOrSuspend(func, kwdict, varargseq, kws, args);
    if (r instanceof Suspension) {
        return retryOptionalSuspensionOrThrow(r);
    } else {
        return r;
    }
}

/**
 * Wraps anything that can return an Suspension, and returns a
 * JS Promise with the result. Also takes an object map of suspension handlers:
 * pass in {"suspType": function (susp) {} }, and your function will be called
 * with the Suspension object if susp.type=="suspType". The type "*" will match
 * all otherwise unhandled suspensions.
 *
 * A suspension handler should return a Promise yielding the return value of
 * r.resume() - ie, either the final return value of this call or another
 * Suspension. That is, the null suspension handler is:
 *
 *     function handler(susp) {
 *       return new Promise(function(resolve, reject) {
 *         try {
 *           resolve(susp.resume());
 *         } catch(e) {
 *           reject(e);
 *         }
 *       });
 *     }
 *
 * Alternatively, a handler can return null to perform the default action for
 * that suspension type.
 *
 * (Note: do *not* call asyncToPromise() in a suspension handler; this will
 * create a new Promise object for each such suspension that occurs)
 *
 * asyncToPromise() returns a Promise that will be resolved with the final
 * return value, or rejected with an exception if one is thrown.
 *
 * @param{function()} suspendablefn returns either a result or a Suspension
 * @param{Object=} suspHandlers an object map of suspension handlers
 */
export function asyncToPromise(suspendablefn, suspHandlers) {
    return new Promise(function(resolve, reject) {
        try {
            var r = suspendablefn();

            (function handleResponse (r) {
                try {
                    // jsh*nt insists these be defined outside the loop
                    var resume = function() {
                        try {
                            handleResponse(r.resume());
                        } catch (e) {
                            reject(e);
                        }
                    };
                    var resumeWithData = function resolved(x) {
                        try {
                            r.data["result"] = x;
                            resume();
                        } catch(e) {
                            reject(e);
                        }
                    };
                    var resumeWithError = function rejected(e) {
                        try {
                            r.data["error"] = e;
                            resume();
                        } catch(ex) {
                            reject(ex);
                        }
                    };


                    while (r instanceof Suspension) {

                        var handler = suspHandlers && (suspHandlers[r.data["type"]] || suspHandlers["*"]);

                        if (handler) {
                            var handlerPromise = handler(r);
                            if (handlerPromise) {
                                handlerPromise.then(handleResponse, reject);
                                return;
                            }
                        }

                        if (r.data["type"] == "Sk.promise") {
                            r.data["promise"].then(resumeWithData, resumeWithError);
                            return;

                        } else if (r.data["type"] == "Sk.yield") {
                            // Assumes all yields are optional, as Sk.setTimeout might
                            // not be able to yield.
                            //Sk.setTimeout(resume, 0);
                            setImmediate(resume);
                            return;

                        } else if (r.data["type"] == "Sk.delay") {
                            //Sk.setTimeout(resume, 1);
                            setImmediate(resume);
                            return;

                        } else if (r.optional) {
                            // Unhandled optional suspensions just get
                            // resumed immediately, and we go around the loop again.
                            r = r.resume();

                        } else {
                            // Unhandled, non-optional suspension.
                            throw new SuspensionError("Unhandled non-optional suspension of type '"+r.data["type"]+"'");
                        }
                    }

                    resolve(r);
                } catch(e) {
                    reject(e);
                }
            })(r);

        } catch (e) {
            reject(e);
        }
    });
}

export function applyAsync(suspHandlers, func, kwdict, varargseq, kws, args) {
    return asyncToPromise(function() {
        return applyOrSuspend(func, kwdict, varargseq, kws, args);
    }, suspHandlers);
}

/**
 * Chain together a set of functions, each of which might return a value or
 * an Suspension. Each function is called with the return value of
 * the preceding function, but does not see any suspensions. If a function suspends,
 * chain() returns a suspension that will resume the chain once an actual
 * return value is available.
 *
 * The idea is to allow a Promise-like chaining of possibly-suspending steps without
 * repeating boilerplate suspend-and-resume code.
 *
 * For example, imagine we call chain(x, f).
 *  - If x is a value, we return f(x).
 *  - If x is a suspension, we suspend. We will suspend and resume until we get a
 *    return value, and then we will return f(<resumed-value).
 * This can be expanded to an arbitrary number of functions
 * (eg chain(x, f, g), which is equivalent to chain(chain(x, f), g).)
 *
 * @param {*}              initialValue
 * @param {...function(*)} chainedFns
 */
export function chain(initialValue, chainedFns) {
    // We try to minimse overhead when nothing suspends (the common case)
    var i = 1, value = initialValue, j, fs;

    while (true) {
        if (i == arguments.length) {
            return value;
        }
        if (value && value.$isSuspension) { break; } // oops, slow case
        value = arguments[i](value);
        i++;
    }

    // Okay, we've suspended at least once, so we're taking the slow(er) path.

    // Copy our remaining arguments into an array (inline, because passing
    // "arguments" out of a function kills the V8 optimiser).
    // (discussion: https://github.com/skulpt/skulpt/pull/552)
    fs = new Array(arguments.length - i);

    for (j = 0; j < arguments.length - i; j++) {
        fs[j] = arguments[i+j];
    }

    j = 0;

    return (function nextStep(r) {
        while (j < fs.length) {
            if (r instanceof Suspension) {
                return new Suspension(nextStep, r);
            }

            r = fs[j](r);
            j++;
        }

        return r;
    })(value);
}

/**
 * Catch any exceptions thrown by a function, or by resuming any suspension it
 * returns.
 *
 *     var result = tryCatch(asyncFunc, function(err) {
 *       console.log(err);
 *     });
 *
 * Because exceptions are returned asynchronously aswell you can't catch them
 * with a try/catch. That's what this function is for.
 */
export function tryCatch(tryFn, catchFn) {
    var r;

    try {
        r = tryFn();
    } catch(e) {
        return catchFn(e);
    }

    if (r instanceof Suspension) {
        var susp = new Suspension(undefined, r);
        susp.resume = function() { return tryCatch(r.resume, catchFn); };
        return susp;
    } else {
        return r;
    }
}

/**
 * Perform a suspension-aware for-each on an iterator, without
 * blowing up the stack.
 * forFn() is called for each element in the iterator, with two
 * arguments: the current element and the previous return value
 * of forFn() (or initialValue on the first call). In this way,
 * iterFor() can be used as a simple for loop, or alternatively
 * as a 'reduce' operation. The return value of the final call to
 * forFn() will be the return value of iterFor() (after all
 * suspensions are resumed, that is; if the iterator is empty then
 * initialValue will be returned.)
 *
 * The iteration can be terminated early, by returning
 * an instance of Break. If an argument is given to
 * the Break() constructor, that value will be
 * returned from iterFor(). It is therefore possible to use
 * iterFor() on infinite iterators.
 *
 * @param {*} iter
 * @param {function(*,*=)} forFn
 * @param {*=} initialValue
 */
export function iterFor(iter, forFn, initialValue) {
    var prevValue = initialValue;

    var breakOrIterNext = function(r) {
        prevValue = r;
        return (r instanceof Break) ? r : iter.tp$iternext(true);
    };

    return (function nextStep(i) {
        while (i !== undefined) {
            if (i instanceof Suspension) {
                return new Suspension(nextStep, i);
            }

            if (i === Break || i instanceof Break) {
                return i.brValue;
            }

            i = chain(
                forFn(i, prevValue),
                breakOrIterNext
            );
        }
        return prevValue;
    })(iter.tp$iternext(true));
}

export class Break {
    /**
     * A special value to return from an iterFor() function,
     * to abort the iteration. Optionally supply a value for iterFor() to return
     * (defaults to 'undefined')
     *
     * @constructor
     * @param {*=}  brValue
     */
    constructor(brValue) {
        if (!(this instanceof Break)) {
            return new Break(brValue);
        }

        this.brValue = brValue;
    };
}

/**
 * same as call except args is an actual array, rather than
 * varargs.
 */
export function applyOrSuspend(func, kwdict, varargseq, kws, args) {
    var fcall;
    var it, i;

    if (func === null || func instanceof none) {
        throw new TypeError("'" + Sk.abstr.typeName(func) + "' object is not callable");
    }

    if (typeof func === "function" && func.tp$call === undefined) {
        func = new func(func);
    }

    fcall = func.tp$call;
    if (fcall !== undefined) {
        if (varargseq) {
            for (it = varargseq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                args.push(i);
            }
        }

        if (kwdict) {
            for (it = iter(kwdict), i = it.tp$iternext(); i!== undefined; i = it.tp$iternext()) {
                if (!checkString(i)) {
                    throw new TypeError("Function keywords must be strings");
                }
                kws.push(i.v);
                kws.push(objectGetItem(kwdict, i, false));
            }
        }
        return fcall.call(func, args, kws, kwdict);
    }

    // todo; can we push this into a tp$call somewhere so there's
    // not redundant checks everywhere for all of these __x__ ones?
    fcall = func.__call__;
    if (fcall !== undefined) {
        // func is actually the object here because we got __call__
        // from it. todo; should probably use descr_get here
        args.unshift(func);
        return Sk.misceval.apply(fcall, kwdict, varargseq, kws, args);
    }

    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(func) + "' object is not callable");
}

/**
 * Do the boilerplate suspension stuff.
 */
export function promiseToSuspension(promise) {
    var suspension = new Suspension();

    suspension.resume = function() {
        if (suspension.data["error"]) {
            throw suspension.data["error"];
        }

        return suspension.data["result"];
    };

    suspension.data = {
        type: "Sk.promise",
        promise: promise
    };

    return suspension;
}

/**
 * Constructs a class object given a code object representing the body
 * of the class, the name of the class, and the list of bases.
 *
 * There are no "old-style" classes in Skulpt, so use the user-specified
 * metaclass (todo;) if there is one, the type of the 0th base class if
 * there's bases, or otherwise the 'type' type.
 *
 * The func code object is passed a (js) dict for its locals which it
 * stores everything into.
 *
 * The metaclass is then called as metaclass(name, bases, locals) and
 * should return a newly constructed class object.
 *
 */
export function buildClass(globals, func, name, bases, cell) {
    // todo; metaclass
    var klass;
    var meta = type;

    var l_cell = cell === undefined ? {} : cell;
    var locals = {};

    // init the dict for the class
    func(globals, locals, l_cell);
    // ToDo: check if func contains the __meta__ attribute
    // or if the bases contain __meta__
    // new Syntax would be different

    // file's __name__ is class's __module__
    locals.__module__ = globals["__name__"];
    var _name = new str(name);
    var _bases = new tuple(bases);
    var _locals = [];
    var key;

    // build array for python dict
    for (key in locals) {
        if (!locals.hasOwnProperty(key)) {
            //The current property key not a direct property of p
            continue;
        }
        _locals.push(new str(key)); // push key
        _locals.push(locals[key]); // push associated value
    }
    _locals = new dict(_locals);

    klass = callsim(meta, _name, _bases, _locals);
    return klass;
}
