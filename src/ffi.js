Sk.ffi = Sk.ffi || {};

/**
 * AssertionError
 * @typedef {!Sk.builtin.AssertionError}
 */
Sk.ffi.AssertionError
goog.exportSymbol("Sk.ffi.AssertionError", Sk.ffi.AssertionError);
/**
 * Returns a new AssertionError.
 * @param {string} message The message string.
 * @return {Sk.ffi.AssertionError} The AssertionError.
 */
Sk.ffi.assertionError = function(message) {return new Sk.builtin.AssertionError(message);};
goog.exportSymbol("Sk.ffi.assertionError", Sk.ffi.assertionError);

/**
 * AttributeError
 * @typedef {!Sk.builtin.AttributeError}
 */
Sk.ffi.AttributeError
goog.exportSymbol("Sk.ffi.AttributeError", Sk.ffi.AttributeError);
/**
 * Returns a new AttributeError.
 * @param {string} message The message string.
 * @return {Sk.ffi.AttributeError}
 */
Sk.ffi.attributeError = function(message) {return new Sk.builtin.AttributeError(message);};
goog.exportSymbol("Sk.ffi.attributeError", Sk.ffi.attributeError);

/**
 * @typedef {!Sk.builtin.TypeError}
 */
Sk.ffi.TypeError
goog.exportSymbol("Sk.ffi.TypeError", Sk.ffi.TypeError);
/**
 * Returns a new TypeError.
 * @param {string} message The message string.
 * @return {Sk.ffi.TypeError} The TypeError.
 */
Sk.ffi.typeError = function(message) {return new Sk.builtin.TypeError(message);};
goog.exportSymbol("Sk.ffi.typeError", Sk.ffi.typeError);

/**
 * Enumeration for JavaScript types.
 *
 * These are string constants for comparing with the result of the typeof operator.
 *
 * @enum {string}
 */
Sk.ffi.JsType = {
    'UNDEFINED':  'undefined',
    'OBJECT':     'object',
    'STRING':     'string',
    'NUMBER':     'number',
    'BOOLEAN':    'boolean',
    'FUNCTION':   'function'
};

/**
 * Enumeration for Python bool values.
 *
 * @enum {!Object}
 */
Sk.ffi.bool = {True: Sk.builtin.bool.true$, False: Sk.builtin.bool.false$};
goog.exportSymbol("Sk.ffi.bool", Sk.ffi.bool);

/**
 * Singleton Python None value.
 *
 * @enum {!Object}
 */
Sk.ffi.none = {None: Sk.builtin.none.none$};
goog.exportSymbol("Sk.ffi.none", Sk.ffi.none);

/**
 * Converts a JavaScript boolean or null to the internal Python bool representation.
 *
 * @param {?boolean} valueJs
 * @param {boolean=} defaultJs
 * @return {Sk.ffi.bool|Sk.ffi.none|undefined}
 */
Sk.ffi.booleanToPy = function(valueJs, defaultJs)
{
    var t = typeof valueJs;
    if (t === Sk.ffi.JsType.BOOLEAN)
    {
        return valueJs ? Sk.ffi.bool.True : Sk.ffi.bool.False;
    }
    else if (t === Sk.ffi.JsType.OBJECT && valueJs === null)
    {
        return Sk.ffi.none.None;
    }
    else if (t === Sk.ffi.JsType.UNDEFINED)
    {
        var d = typeof defaultJs;
        if (d === Sk.ffi.JsType.BOOLEAN)
        {
            return Sk.ffi.booleanToPy(Boolean(defaultJs));
        }
        else if (d === Sk.ffi.JsType.UNDEFINED)
        {
            return undefined;
        }
        else if (d === Sk.ffi.JsType.OBJECT && defaultJs === null)
        {
            return Sk.ffi.none.None;
        }
        else
        {
            throw Sk.ffi.err.
                argument("defaultJs").
                inFunction("Sk.ffi.booleanToPy").
                mustHaveType([Sk.ffi.JsType.BOOLEAN, 'null', Sk.ffi.JsType.UNDEFINED].join(" or "));
        }
    }
    else
    {
        throw Sk.ffi.err.
            argument("valueJs").
            inFunction("Sk.ffi.booleanToPy").
            mustHaveType([Sk.ffi.JsType.BOOLEAN, 'null', Sk.ffi.JsType.UNDEFINED].join(" or "));
    }
};
goog.exportSymbol("Sk.ffi.booleanToPy", Sk.ffi.booleanToPy);

/**
 * Converts a JavaScript number or null to the internal Python float representation.
 *
 * @param {?number} valueJs
 * @param {number=} defaultJs
 * @return {Object|Sk.ffi.none|undefined}
 */
Sk.ffi.numberToPy = function(valueJs, defaultJs)
{
    var t = typeof valueJs;
    if (t === Sk.ffi.JsType.NUMBER)
    {
        return new Sk.builtin.nmber(valueJs, Sk.builtin.nmber.float$);
    }
    else if (t === Sk.ffi.JsType.OBJECT && valueJs === null)
    {
        return Sk.ffi.none.None;
    }
    else if (t === Sk.ffi.JsType.UNDEFINED)
    {
        var d = typeof defaultJs;
        if (d === Sk.ffi.JsType.NUMBER)
        {
            return Sk.ffi.numberToPy(Number(defaultJs));
        }
        else if (d === Sk.ffi.JsType.UNDEFINED)
        {
            return undefined;
        }
        else if (d === Sk.ffi.JsType.OBJECT && defaultJs === null)
        {
            return Sk.ffi.none.None;
        }
        else
        {
            throw Sk.ffi.err.
                argument("defaultJs").
                inFunction("Sk.ffi.numberToPy").
                mustHaveType([Sk.ffi.JsType.NUMBER, 'null', Sk.ffi.JsType.UNDEFINED].join(" or "));
        }
    }
    else
    {
        throw Sk.ffi.err.
            argument("valueJs").
            inFunction("Sk.ffi.numberToPy").
            mustHaveType([Sk.ffi.JsType.NUMBER, 'null', Sk.ffi.JsType.UNDEFINED].join(" or "));
    }
};
goog.exportSymbol("Sk.ffi.numberToPy", Sk.ffi.numberToPy);

/**
 * Converts a JavaScript number or null to the internal Python int representation.
 *
 * @param {?number} valueJs
 * @param {number=} defaultJs
 * @return {Object|Sk.ffi.none|undefined}
 */
Sk.ffi.numberToIntPy = function(valueJs, defaultJs)
{
    var t = typeof valueJs;
    if (t === Sk.ffi.JsType.NUMBER)
    {
        return new Sk.builtin.nmber(valueJs, Sk.builtin.nmber.int$);
    }
    else if (t === Sk.ffi.JsType.OBJECT && valueJs === null)
    {
        return Sk.ffi.none.None;
    }
    else if (t === Sk.ffi.JsType.UNDEFINED)
    {
        var d = typeof defaultJs;
        if (d === Sk.ffi.JsType.NUMBER)
        {
            return Sk.ffi.numberToIntPy(Number(defaultJs));
        }
        else if (d === Sk.ffi.JsType.UNDEFINED)
        {
            return undefined;
        }
        else if (d === Sk.ffi.JsType.OBJECT && defaultJs === null)
        {
            return Sk.ffi.none.None;
        }
        else
        {
            throw Sk.ffi.err.
                argument("defaultJs").
                inFunction("Sk.ffi.numberToIntPy").
                mustHaveType([Sk.ffi.JsType.NUMBER, 'null', Sk.ffi.JsType.UNDEFINED].join(" or "));
        }
    }
    else
    {
        throw Sk.ffi.err.
            argument("valueJs").
            inFunction("Sk.ffi.numberToIntPy").
            mustHaveType([Sk.ffi.JsType.NUMBER, 'null', Sk.ffi.JsType.UNDEFINED].join(" or "));
    }
};
goog.exportSymbol("Sk.ffi.numberToIntPy", Sk.ffi.numberToIntPy);

/**
 * Converts a JavaScript string or null to the internal Python string representation.
 *
 * @param {?string} valueJs
 * @param {string=} defaultJs
 */
Sk.ffi.stringToPy = function(valueJs, defaultJs)
{
    var t = typeof valueJs;
    if (t === Sk.ffi.JsType.STRING)
    {
        if (valueJs.length > 0)
        {
            return new Sk.builtin.str(valueJs);
        }
        else
        {
            return Sk.builtin.str.$emptystr;
        }
    }
    else if (t === Sk.ffi.JsType.OBJECT && valueJs === null)
    {
        return Sk.ffi.none.None;
    }
    else if (t === Sk.ffi.JsType.UNDEFINED)
    {
        var d = typeof defaultJs;
        if (d === Sk.ffi.JsType.STRING)
        {
            return Sk.ffi.stringToPy(defaultJs.toString());
        }
        else if (d === Sk.ffi.JsType.UNDEFINED)
        {
            return undefined;
        }
        else if (d === Sk.ffi.JsType.OBJECT && defaultJs === null)
        {
            return Sk.ffi.none.None;
        }
        else
        {
            throw Sk.ffi.err.
                argument("defaultJs").
                inFunction("Sk.ffi.stringToPy").
                mustHaveType([Sk.ffi.JsType.STRING, Sk.ffi.JsType.UNDEFINED, 'null'].join(" or "));
        }
    }
    else
    {
        throw Sk.ffi.err.
            argument("valueJs").
            inFunction("Sk.ffi.stringToPy").
            mustHaveType([Sk.ffi.JsType.STRING, 'null', Sk.ffi.JsType.UNDEFINED].join(" or "));
    }
};
goog.exportSymbol("Sk.ffi.stringToPy", Sk.ffi.stringToPy);

/**
 * Wraps a JavaScript class 
 * Usage:
 *
 * valuePy = Sk.ffi.referenceToPy(valueJs, "Classname", custom);
 *
 * - This form is useful when calling a constructor to wrap a JavaScript object.
 *
 * or
 *
 * Sk.ffi.referenceToPy(valueJs, "Classname", custom, selfPy);
 *
 * - This form is useful in initialization functions.
 *
 * @param {Object|string|number|boolean} valueJs
 * @param {string} tp$name
 * @param {Object=} custom Custom metadata that the caller wishes to retain.
 * @param {Object=} targetPy An optional destination for mapping reference types.
 */
Sk.ffi.referenceToPy = function(valueJs, tp$name, custom, targetPy)
{
    var t = typeof valueJs;
    if (t === Sk.ffi.JsType.OBJECT || t === Sk.ffi.JsType.FUNCTION)
    {
        if (typeof tp$name === Sk.ffi.JsType.STRING)
        {
            if (targetPy) {
                targetPy.v = valueJs;
                targetPy.tp$name = tp$name;
                targetPy.custom = custom;
            }
            else {
                return {"v": valueJs, "tp$name": tp$name, "custom": custom};
            }
        }
        else
        {
            throw Sk.ffi.assertionError("9fad4b9e-4845-4a06-9bce-0aa7c68e1f03");
        }
    }
    else
    {
        throw Sk.ffi.assertionError("306f31df-f0a9-40a0-895b-d01308df8d6e typeof valueJs => " + t);
    }
};
goog.exportSymbol("Sk.ffi.referenceToPy", Sk.ffi.referenceToPy);

/**
 * Constructs a Python function.
 *
 * @param {function()} code The implementation of the function.
 */
Sk.ffi.functionPy = function(code)
{
    return new Sk.builtin.func(code);
};
goog.exportSymbol("Sk.ffi.functionPy", Sk.ffi.functionPy);

/**
 * Constructs a Python list.
 *
 * @param {Array.<Object>=} valuesPy A JavaScript array of Python values.
 */
Sk.ffi.listPy = function(valuesPy)
{
    return new Sk.builtin.list(valuesPy);
}
goog.exportSymbol("Sk.ffi.listPy", Sk.ffi.listPy);

/**
 * Constructs a Python tuple.
 *
 * @param {Array.<Object>|Object} valuesPy A JavaScript array of Python values.
 */
Sk.ffi.tuplePy = function(valuesPy)
{
    return new Sk.builtin.tuple(valuesPy);
}
goog.exportSymbol("Sk.ffi.tuplePy", Sk.ffi.tuplePy);

/**
 * Wraps a JavaScript Object instance.
 * 
 * Usage:
 *
 * valuePy = Sk.ffi.remapToPy(valueJs, className);
 *
 * @param {Object|string|number|boolean} valueJs The JavaScript value that must be represented in Python.
 * @param {string=} className The name of the class when wrapping a JavaScript object.
 * @param {Object=} custom Custom metadata that the caller wishes to retain.
 */
Sk.ffi.remapToPy = function(valueJs, className, custom)
{
    var t = typeof valueJs;
    if (t === Sk.ffi.JsType.OBJECT) {
        if (Object.prototype.toString.call(valueJs) === "[object Array]")
        {
            var valuesPy = [];
            for (var i = 0; i < valueJs.length; ++i) {
                valuesPy.push(Sk.ffi.remapToPy(valueJs[i]));
            }
            return Sk.ffi.listPy(valuesPy);
        }
        else if (typeof className === Sk.ffi.JsType.STRING)
        {
            return Sk.ffi.referenceToPy(valueJs, className.toString(), custom);
        }
        else if (t === Sk.ffi.JsType.OBJECT && valueJs === null)
        {
            return Sk.ffi.none.None;
        }
        else
        {
            var kvsPy = [];
            for (var k in valueJs)
            {
                kvsPy.push(Sk.ffi.remapToPy(k));
                kvsPy.push(Sk.ffi.remapToPy(valueJs[k]));
            }
            return new Sk.builtin.dict(kvsPy);
        }
    }
    else if (t === Sk.ffi.JsType.STRING)
    {
        return Sk.ffi.stringToPy(String(valueJs));
    }
    else if (t === Sk.ffi.JsType.NUMBER)
    {
        return Sk.ffi.numberToPy(Number(valueJs));
    }
    else if (t === Sk.ffi.JsType.BOOLEAN)
    {
        return Sk.ffi.booleanToPy(valueJs ? true : false);
    }
    else
    {
        goog.asserts.fail("unhandled remapToPy type " + t);
    }
};
goog.exportSymbol("Sk.ffi.remapToPy", Sk.ffi.remapToPy);

/**
 * @nosideeffects
 * @param {Object} valuePy
 * @return {boolean}
 */
Sk.ffi.isBoolean = function(valuePy) {return Sk.ffi.getType(valuePy) === Sk.ffi.PyType.BOOL;};
goog.exportSymbol("Sk.ffi.isBoolean", Sk.ffi.isBoolean);

Sk.ffi.isDictionary = function(valuePy) { return Sk.ffi.getType(valuePy) === Sk.ffi.PyType.DICTIONARY; };
goog.exportSymbol("Sk.ffi.isDictionary", Sk.ffi.isDictionary);

Sk.ffi.isFunction = function(valuePy) { return Sk.ffi.getType(valuePy) === Sk.ffi.PyType.FUNCTION; };
goog.exportSymbol("Sk.ffi.isFunction", Sk.ffi.isFunction);

Sk.ffi.isInt = function(valuePy) { return Sk.ffi.getType(valuePy) === Sk.ffi.PyType.INT; };
goog.exportSymbol("Sk.ffi.isInt", Sk.ffi.isInt);

Sk.ffi.isNone = function(valuePy) { return Sk.ffi.getType(valuePy) === Sk.ffi.PyType.NONE; };
goog.exportSymbol("Sk.ffi.isNone", Sk.ffi.isNone);

Sk.ffi.isNumber = function(valuePy) { return Sk.builtin.checkNumber(valuePy); };
goog.exportSymbol("Sk.ffi.isNumber", Sk.ffi.isNumber);

Sk.ffi.isObjectRef = function(valuePy) { return Sk.ffi.getType(valuePy) === Sk.ffi.PyType.OBJREF; };
goog.exportSymbol("Sk.ffi.isObjectRef", Sk.ffi.isObjectRef);

Sk.ffi.isFunctionRef = function(valuePy) { return Sk.ffi.getType(valuePy) === Sk.ffi.PyType.FUNREF; };
goog.exportSymbol("Sk.ffi.isFunctionRef", Sk.ffi.isFunctionRef);

Sk.ffi.isReference = function(valuePy) { return Sk.ffi.isObjectRef(valuePy) || Sk.ffi.isFunctionRef(valuePy); };
goog.exportSymbol("Sk.ffi.isReference", Sk.ffi.isReference);

Sk.ffi.isString = function(valuePy) { return Sk.builtin.checkString(valuePy); };
goog.exportSymbol("Sk.ffi.isString", Sk.ffi.isString);

Sk.ffi.isUndefined = function(valuePy) { return Sk.ffi.getType(valuePy) === Sk.ffi.PyType.UNDEFINED; };
goog.exportSymbol("Sk.ffi.isUndefined", Sk.ffi.isUndefined);

/**
 * Convenience function for asserting the number of arguments to a function.
 *
 * Returns the number of arguments if within the specified bounds.
 *
 * Use this function whenever there is no self argument.
 *
 * @param {string} name the name of the attribute
 * @param {{length: number}} args the args passed to the attribute
 * @param {number} minargs the minimum number of allowable arguments
 * @param {number=} maxargs optional maximum number of allowable
 * arguments (default: Infinity)
 * @param {boolean=} kwargs optional true if kwargs, false otherwise
 * (default: false)
 * @param {boolean=} free optional true if free vars, false otherwise
 * (default: false)
 * @return {number} The number of arguments.
 */
Sk.ffi.checkFunctionArgs = function(name, args, minargs, maxargs, kwargs, free)
{
    var nargs = args.length;
    var msg = "";

    if (maxargs === undefined) { maxargs = Infinity; }
    if (kwargs) { nargs -= 1; }
    if (free) { nargs -= 1; }
    if (nargs < minargs || nargs > maxargs)
    {
        if (minargs === maxargs)
        {
            msg = name + "() takes exactly " + minargs + " arguments";
        }
        else if (nargs < minargs)
        {
            msg = name + "() takes at least " + minargs + " arguments";
        }
        else
        {
            msg = name + "() takes at most " + maxargs + " arguments";
        }
        msg += " (" + nargs + " given)";
        throw Sk.ffi.assertionError(msg);
    }
    else
    {
        return nargs;
    }
};
goog.exportSymbol("Sk.ffi.checkFunctionArgs", Sk.ffi.checkFunctionArgs);

/**
 * Convenience function for asserting the number of arguments to a method (callable attribute).
 *
 * Returns the number of arguments if within the specified bounds.
 *
 * Use this function whenever you want to ignore the first (self) argument.
 *
 * @param {string} name the name of the attribute
 * @param {{length: number}} args the args passed to the attribute
 * @param {number} minargs the minimum number of allowable arguments
 * @param {number=} maxargs optional maximum number of allowable
 * arguments (default: Infinity)
 * @param {boolean=} kwargs optional true if kwargs, false otherwise
 * (default: false)
 * @param {boolean=} free optional true if free vars, false otherwise
 * (default: false)
 * @return {number} The number of arguments.
 */
Sk.ffi.checkMethodArgs = function(name, args, minargs, maxargs, kwargs, free)
{
    return Sk.ffi.checkFunctionArgs(name, Array.prototype.slice.call(args, 1), minargs, maxargs, kwargs, free);
};
goog.exportSymbol("Sk.ffi.checkMethodArgs", Sk.ffi.checkMethodArgs);

/**
 * @typedef {(string|!Array.<string>|Sk.ffi.PyType)}
 */
Sk.ffi.ExpectedType

/**
 * @typedef {function(Sk.ffi.ExpectedType): Sk.ffi.TypeError}
 */
Sk.ffi.FunctionReturningTypeError

/**
 * Convenience function for asserting the type of an argument.
 *
 * @param {string} name The argument name.
 * @param {Sk.ffi.ExpectedType} expectedType A string representation of the expected type or types.
 * @param {boolean} condition The condition that must be true for the check to pass.
 */
Sk.ffi.checkArgType = function(name, expectedType, condition)
{
    if (!condition)
    {
        throw Sk.ffi.err.argument(name).mustHaveType(expectedType);
    }
};
goog.exportSymbol("Sk.ffi.checkArgType", Sk.ffi.checkArgType);

/**
 * Enumeration for internal Python types.
 *
 * @enum {number}
 */
Sk.ffi.PyType = {
    'UNDEFINED':  0,
    'DICTIONARY': 1,
    'LIST':       2,
    'TUPLE':      3,
    'BOOL':       4,
    'FLOAT':      5,
    'INT':        6,
    'LONG':       7,
    'STRING':     8,
    'OBJREF':     9,
    'FUNREF':    10,
    'NONE':      11,
    'FUNCTION':  12
};



/**
 * Computes the internal Python representation type for the provided value.
 *
 * @return {Sk.ffi.PyType} The Python type enumeration value.
 */
Sk.ffi.getType = function(valuePy)
{
    if (typeof valuePy === Sk.ffi.JsType.UNDEFINED)
    {
        return Sk.ffi.PyType.UNDEFINED;
    }
    else if (valuePy instanceof Sk.builtin.dict)
    {
        return Sk.ffi.PyType.DICTIONARY;
    }
    else if (valuePy instanceof Sk.builtin.list)
    {
        return Sk.ffi.PyType.LIST;
    }
    else if (valuePy instanceof Sk.builtin.tuple)
    {
        return Sk.ffi.PyType.TUPLE;
    }
    else if (valuePy instanceof Sk.builtin.nmber)
    {
        if (valuePy.skType === Sk.builtin.nmber.float$)
        {
            return Sk.ffi.PyType.FLOAT;
        }
        else if (valuePy.skType === Sk.builtin.nmber.int$)
        {
            return Sk.ffi.PyType.INT;
        }
        else
        {
            throw Sk.ffi.assertionError("typeofPy(" + valuePy + ") (Sk.builtin.nmber) skType=" + valuePy.skType);
        }
    }
    else if (valuePy instanceof Sk.builtin.lng)
    {
        return Sk.ffi.PyType.LONG;
    }
    else if (valuePy === Sk.builtin.bool.true$)
    {
        return Sk.ffi.PyType.BOOL;
    }
    else if (valuePy === Sk.builtin.bool.false$)
    {
        return Sk.ffi.PyType.BOOL;
    }
    else if (valuePy === Sk.ffi.none.None)
    {
        return Sk.ffi.PyType.NONE;
    }
    else
    {
        var x = typeof valuePy.v;
        if (x !== Sk.ffi.JsType.UNDEFINED)
        {
            if (x === Sk.ffi.JsType.STRING)
            {
                return Sk.ffi.PyType.STRING;
            }
            else if (x === Sk.ffi.JsType.OBJECT)
            {
                if (valuePy.tp$name)
                {
                    return Sk.ffi.PyType.OBJREF;
                }
                else
                {
                    throw Sk.ffi.assertionError("0a459acc-9540-466b-ba1a-333f8215b61e");
                }
            }
            else if (x === Sk.ffi.JsType.FUNCTION)
            {
                return Sk.ffi.PyType.FUNREF;
            }
            else
            {
                throw Sk.ffi.assertionError("bb971bb0-3751-49bb-ac24-8dab8a4bcd29 (x:'" + x + "')");
            }
        }
        else
        {
            // TODO: It works, but why are there two ways of doing it?
            return Sk.ffi.PyType.FUNCTION;
        }
    }
};
goog.exportSymbol("Sk.ffi.getType", Sk.ffi.getType);

Sk.ffi.typeName = function(valuePy)
{
    switch(Sk.ffi.getType(valuePy))
    {
        case Sk.ffi.PyType.OBJREF:
        case Sk.ffi.PyType.BOOL:
        case Sk.ffi.PyType.FLOAT:
        case Sk.ffi.PyType.INT:
        case Sk.ffi.PyType.STRING:
        {
            return Sk.abstr.typeName(valuePy);
        }
        default:
        {
            throw Sk.ffi.assertionError("0d35490f-ac78-45d7-ac5e-af6ef09278b1, Sk.ffi.getType(valuePy) => " + Sk.ffi.getType(valuePy));
        }
    }
};
goog.exportSymbol("Sk.ffi.typeName", Sk.ffi.typeName);

/**
 * Converts the internal Python string representation to a JavaScript string.
 *
 * Usage:
 *
 * valueJs = Sk.ffi.booleanToJs(valuePy, "foo must be a <type 'bool'>");
 *
 * @param {Object} valuePy
 * @param {string=} message
 */
Sk.ffi.booleanToJs = function(valuePy, message)
{
    if (valuePy === Sk.builtin.bool.true$)
    {
        return true;
    }
    else if (valuePy === Sk.builtin.bool.false$)
    {
        return false;
    }
    else
    {
        if (typeof message === Sk.ffi.JsType.STRING)
        {
            throw Sk.ffi.typeError(String(message));
        }
        else
        {
            throw Sk.ffi.err.attribute("value").mustHaveType(Sk.ffi.PyType.BOOL);
        }
    }
};
goog.exportSymbol("Sk.ffi.booleanToJs", Sk.ffi.booleanToJs);

/**
 * @param {string=} message Optional customizable assertion message.
 *
 * @return {number}
 */
Sk.ffi.numberToJs = function(valuePy, message)
{
    if (valuePy instanceof Sk.builtin.nmber)
    {
        return Sk.builtin.asnum$(valuePy);
    }
    else
    {
        if (typeof message === Sk.ffi.JsType.STRING)
        {
            throw Sk.ffi.typeError(String(message));
        }
        else
        {
            throw Sk.ffi.err.attribute("value").mustHaveType([Sk.ffi.PyType.FLOAT, Sk.ffi.PyType.INT, Sk.ffi.PyType.LONG]);
        }
    }
};
goog.exportSymbol("Sk.ffi.numberToJs", Sk.ffi.numberToJs);

/**
 * Usage:
 *
 * valueJs = Sk.ffi.remapToJs(valuePy);
 *
 * @param {Object} valuePy The Python value to be mapped.
 * @param {Object=} defaultJs The optional default JavaScript value to use when the type of the value is undefined.
 */
Sk.ffi.remapToJs = function(valuePy, defaultJs)
{
    Sk.ffi.checkFunctionArgs("Sk.ffi.remapToJs", arguments, 1, 2);
    switch(Sk.ffi.getType(valuePy))
    {
        case Sk.ffi.PyType.STRING:
        {
            return valuePy.v;
        }
        case Sk.ffi.PyType.DICTIONARY:
        {
            var ret = {};
            for (var iter = valuePy.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext())
            {
                var v = valuePy.mp$subscript(k);
                if (v === undefined) {
                    v = null;
                }
                var kAsJs = Sk.ffi.remapToJs(k);
                ret[kAsJs] = Sk.ffi.remapToJs(v);
            }
            return ret;
        }
        case Sk.ffi.PyType.LIST:
        {
            var ret = [];
            for (var i = 0; i < valuePy.v.length; ++i)
            {
                ret.push(Sk.ffi.remapToJs(valuePy.v[i]));
            }
            return ret;
        }
        case Sk.ffi.PyType.TUPLE:
        {
            var ret = [];
            for (var i = 0; i < valuePy.v.length; ++i)
            {
                ret.push(Sk.ffi.remapToJs(valuePy.v[i]));
            }
            return ret;
        }
        case Sk.ffi.PyType.BOOL:
        {
            if (valuePy === Sk.builtin.bool.true$)
            {
                return true;
            }
            else if (valuePy === Sk.builtin.bool.false$)
            {
                return false;
            }
            else
            {
                throw Sk.ffi.assertionError("5fd1f529-f9b2-4d0c-9775-36e782973986");
            }
        }
        case Sk.ffi.PyType.FLOAT:
        case Sk.ffi.PyType.INT:
        case Sk.ffi.PyType.LONG:
        {
            return Sk.builtin.asnum$(valuePy);
        }
        case Sk.ffi.PyType.OBJREF:
        {
            // TODO: This is being exercised, but we should assert the tp$name.
            // I think the pattern here suggests that we have a Sk.builtin.something
            return valuePy.v;
        }
        case Sk.ffi.PyType.FUNREF:
        {
            return valuePy.v;
        }
        case Sk.ffi.PyType.UNDEFINED:
        {
            return defaultJs;
        }
        case Sk.ffi.PyType.NONE:
        {
            return null;
        }
        case Sk.ffi.PyType.FUNCTION: {
            return function() {
                var argsPy = Array.prototype.slice.call(arguments, 0).map(function(argJs) {return Sk.ffi.remapToPy(argJs);});
                return Sk.ffi.remapToJs(Sk.misceval.apply(valuePy, undefined, undefined, undefined, argsPy));
            };
        }
        default:
        {
            throw Sk.ffi.assertionError("20be4da2-63e8-4fff-9359-7ab46eba4702 " + Sk.ffi.getType(valuePy));
        }
    }
};
goog.exportSymbol("Sk.ffi.remapToJs", Sk.ffi.remapToJs);

Sk.ffi.buildClass = function(globals, func, name, bases)
{
    return Sk.misceval.buildClass(globals, func, name, bases);
};
goog.exportSymbol("Sk.ffi.buildClass", Sk.ffi.buildClass);

/**
 * 
 * @param {Object} func the thing to call
 * @param {...*} args stuff to pass it
 */
Sk.ffi.callsim = function(func, args)
{
    var args = Array.prototype.slice.call(arguments, 1);
    return Sk.misceval.apply(func, undefined, undefined, undefined, args);
};
goog.exportSymbol("Sk.ffi.callsim", Sk.ffi.callsim);

/**
 * Convenience function for implementing callable attributes.
 */
Sk.ffi.callableToPy = function(mod, targetJs, nameJs, functionJs)
{
    return Sk.ffi.callsim(Sk.ffi.buildClass(mod, function($gbl, $loc)
    {
      $loc.__init__ = Sk.ffi.functionPy(function(selfPy)
      {
        // Tucking away the reference is not critical. Other approaches are possible.
        // Would be nice to have a default implementation that maps the arguments.
        if (targetJs[nameJs]) {
            Sk.ffi.referenceToPy(targetJs[nameJs], nameJs, undefined, selfPy);
        }
        else {
            throw Sk.ffi.assertionError("c308ee41-f856-41a4-9aef-abd302b6a5aa nameJs => " + nameJs);
        }
      });
      $loc.__call__ = Sk.ffi.functionPy(functionJs);
      $loc.__str__ = Sk.ffi.functionPy(function(self)
      {
        return Sk.ffi.stringToPy(nameJs);
      });
      $loc.__repr__ = Sk.ffi.functionPy(function(self)
      {
        return Sk.ffi.stringToPy(nameJs);
      });
    }, nameJs, []));
};
goog.exportSymbol("Sk.ffi.callableToPy", Sk.ffi.callableToPy);

/**
 *
 */
Sk.ffi.gattr = function(objectPy, name)
{
    return Sk.abstr.gattr(objectPy, name);
}
goog.exportSymbol("Sk.ffi.gattr", Sk.ffi.gattr);

/**
 * @param {...*} args
 * @return {!Sk.builtin.IndexError}
 */
Sk.ffi.indexError = function(args)
{
    return new Sk.builtin.IndexError(args);
};
goog.exportSymbol("Sk.ffi.indexError", Sk.ffi.indexError);

/**
 * @param {...*} args
 * @return {!Sk.builtin.ValueError}
 */
Sk.ffi.valueError = function(args)
{
    return new Sk.builtin.ValueError(args);
};
goog.exportSymbol("Sk.ffi.valueError", Sk.ffi.valueError);

/**
 * Fluid API for building messages.
 *
 * @type
 * {
 *   {
 *     argument: function (string): {
 *       inFunction: function (string): {
 *         mustHaveType: function ((!Array.<string>|Sk.ffi.PyType|string)): Sk.ffi.TypeError
 *       },
 *       mustHaveType: function ((!Array.<string>|Sk.ffi.PyType|string)): Sk.ffi.TypeError
 *     },
 *     attribute: function (string): {
 *       isNotGetableOnType: function (string): Sk.ffi.AttributeError,
 *       isNotSetableOnType: function (string): Sk.ffi.AttributeError
 *     }
 *   }
 * }
 */
Sk.ffi.err =
{
    /**
     * @param {string} name The name of the attribute.
     * @return
     * {
     *   {
     *     isNotGetableOnType: function(string): Sk.ffi.AttributeError,
     *     isNotSetableOnType: function(string): Sk.ffi.AttributeError
     *   }
     * }
     */
    attribute: function(name) {
        return {
            /**
             * @param {string} targetType The name of the type.
             * @return {Sk.ffi.AttributeError}
             */
            isNotGetableOnType: function(targetType) {
                return Sk.ffi.attributeError(name + " is not an attribute of " + targetType);
            },
            /**
             * @param {string} targetType The name of the type.
             * @return {Sk.ffi.AttributeError}
             */
            isNotSetableOnType: function(targetType) {
                return Sk.ffi.attributeError(name + " is not an attribute of " + targetType);
            }
        };
    },
    /**
     * @param {string} name The name of the argument.
     * @return
     * {
     *   {
     *     inFunction: function(string):{
     *       mustHaveType: function(Sk.ffi.ExpectedType): Sk.ffi.TypeError
     *     },
     *     mustHaveType: function(Sk.ffi.ExpectedType): Sk.ffi.TypeError
     *   }
     * }
     */
    argument: function(name) {
        return {
            /**
             * @param {string} functionName The name of the function.
             * @return {{mustHaveType: Sk.ffi.FunctionReturningTypeError}}
             */
            inFunction: function(functionName) {
                return {
                    /**
                     * @param {Sk.ffi.ExpectedType} expectedType The name of the type.
                     * @return {Sk.ffi.TypeError}
                     */
                    mustHaveType: function(expectedType) {
                        return Sk.ffi.typeError("Expecting argument '" + name + "' in function '" + functionName + "' to have type '" + expectedType + "'.");
                    }
                };
            },
            /**
             * @param {Sk.ffi.ExpectedType} expectedType The name of the type.
             * @return {Sk.ffi.TypeError}
             */
            mustHaveType: function(expectedType) {
                return Sk.ffi.typeError(name + " must be a " + expectedType);
            }
        };
    }
}
goog.exportSymbol("Sk.ffi.message", Sk.ffi.message);

/**
 * @deprecated Use Sk.ffi.remapToJs
 */
Sk.ffi.callback = function(functionPy) { return Sk.ffi.remapToJs(functionPy); };
goog.exportSymbol("Sk.ffi.callback", Sk.ffi.callback);

/**
 * @deprecated Use Sk.ffi.referenceToPy (carefully).
 */
Sk.ffi.stdwrap = function(type, towrap)
{
    var inst = new type();
    inst['v'] = towrap;
    return inst;
};
goog.exportSymbol("Sk.ffi.stdwrap", Sk.ffi.stdwrap);

/**
 * @deprecated Use Sk.ffi.remapToPy
 */
Sk.ffi.basicwrap = function(obj) { return Sk.ffi.remapToPy(obj); };
goog.exportSymbol("Sk.ffi.basicwrap", Sk.ffi.basicwrap);

/**
 * @deprecated Use Sk.ffi.remapToJs
 */
Sk.ffi.unwrapo = function(obj) { return Sk.ffi.remapToJs(obj); };
goog.exportSymbol("Sk.ffi.unwrapo", Sk.ffi.unwrapo);

/**
 * @deprecated Use Sk.ffi.remapToJs
 */
Sk.ffi.unwrapn = function(obj) { return Sk.ffi.remapToJs(obj); };
goog.exportSymbol("Sk.ffi.unwrapn", Sk.ffi.unwrapn);
