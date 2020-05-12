Sk.builtin.genericGetAttr = function () {};

Sk.builtin.genericNew = function () {
    // this is a prototype of an sk$type object
    if (this.hasOwnProperty("tp$new")) {
        return new this.constructor;
    } else {
        const instance = new this.constructor;
        Object.setPrototypeOf(instance, this);
        return instance;
    }
};