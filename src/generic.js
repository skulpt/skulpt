Sk.builtin.genericGetAttr = function () {};

Sk.builtin.genericNew = function (builtin) {
    const genericNew = function (args, kwargs) {
        // this is a prototype of an sk$type object.
        debugger;
        if (this === builtin.prototype) {
            return new this.constructor;
        } else {
            let instance = new this.constructor;
            // now we want to apply instance to the builtin basically...
            builtin.call(instance); 
            return instance;
        }
    };
    return genericNew;
};