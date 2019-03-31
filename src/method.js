import { object, none } from './types/object';
import { pyCheckArgs } from './function/checks';
import { TypeError } from './errors';
import { typeName, setUpInheritance } from './type';
import { str } from './types/str';
import { issubclass } from './builtin';
import { remapToJs } from './ffi';
import { objectRepr } from './misceval';
debugger;

export class method extends object {
    /**
     * @constructor
     *
     * @param {func|method} func
     * @param {Object} self
     * @param {type|none} klass
     * @param {boolean=} builtin
     *
     * co_varnames and co_name come from generated code, must access as dict.
     */
    constructor(func, self, klass) {
        // if (!(this instanceof Sk.builtin.method)) {
        //     pyCheckArgs("method", arguments, 3, 3);
        //     if (!Sk.builtin.checkCallable(func)) {
        //         throw new TypeError("First argument must be callable");
        //     }
        //     if (self.ob$type === undefined) {
        //         throw new TypeError("Second argument must be object of known type");
        //     }
        //     return new Sk.builtin.method(func, self, klass);
        // }
        this.im_func = func;
        this.im_self = self || none.none$;
        this.im_class = klass || none.none$;
        this.im_builtin = builtin;
        this["$d"] = {
            im_func: func,
            im_self: self,
            im_class: klass
        };

        tp$name = "method";
    }

    tp$descr_get(obj, objtype) {
        goog.asserts.assert(obj !== undefined && objtype !== undefined);
        return new method(this, obj, objtype, this.im_builtin);
    }

    static pythonFunctions = ["__get__"];

    __get__(self, instance, owner) {
        pyCheckArgs("__get__", arguments, 1, 2, false, true);
        if (instance === none.none$ && owner === none.none$) {
            throw new TypeError("__get__(None, None) is invalid");
        }

        // if the owner is specified it needs to be a a subclass of im_self
        if (owner && owner !== none.none$) {
            if (issubclass(owner, self.im_class)) {
                return self.tp$descr_get(instance, owner);
            }

            // if it's not we're not bound
            return self;
        }

        // use the original type to get a bound object
        return self.tp$descr_get(instance, none.none$);
    }

    tp$call(args, kw) {
        // goog.asserts.assert(this.im_func instanceof Sk.builtin.func);

        // 'args' and 'kw' get mucked around with heavily in applyOrSuspend();
        // changing it here is OK.
        if (this.im_self !== none.none$) {
            args.unshift(this.im_self);
        }

        // if there is no first argument or
        // if the first argument is not a subclass of the class this method belongs to we throw an error
        // unless it's a builtin method, because they shouldn't have been __get__ and left in this unbound
        // state.
        if (this.im_self === none.none$) {
            var getMessage = (function (reason) {
                return "unbound method " + this.tp$name + "() must be called with " + typeName(this.im_class) + " instance as first argument (got " + reason + " instead)";
            }).bind(this);

            if (args.length > 0) {
                if (this.im_class != none.none$ && !issubclass(args[0].ob$type, this.im_class) && !this.im_builtin) {
                    throw new TypeError(getMessage(typeName(args[0].ob$type) + " instance"));
                }
            } else {
                throw new TypeError(getMessage("nothing"));
            }
        }

        // A method call is just a call to this.im_func with 'self' on the beginning of the args.
        // Do the necessary.
        return this.im_func.tp$call(args, kw);
    }

    $r() {
        if (this.im_builtin) {
            return new str("<built-in method " + this.tp$name + " of type object>");
        }

        if (this.im_self === none.none$) {
            return new str("<unbound method " + typeName(this.im_class) + "." + this.tp$name + ">");
        }

        var owner = this.im_class !== none.none$ ? typeName(this.im_class) : "?";
        return new str("<bound method " + owner  + "." + this.tp$name + " of " + remapToJs(objectRepr(this.im_self)) + ">");
    }
}

setUpInheritance("instancemethod", method, object);
