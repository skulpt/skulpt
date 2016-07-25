/**
 * Internal SenseHat Module for reading and writing values from
 * JavaScript World to the Python World. This modules set ups
 * the commmunication and allows to read and write pixels. If the
 * "Sk.sense_hat_emit" config is present, we emit events when
 * values are changed: Python -> JavaScript
 */
var $builtinmodule = function (name) {
    var mod = {};

     mod.ismethod = new Sk.builtin.func(function (obj) {
        if (obj && obj.im_self && obj.im_func) {
            return Sk.builtin.bool.true$
        } else {
            return Sk.builtin.bool.false$
        }
    });

    mod.isfunction = new Sk.builtin.func(function (obj) {
        if (obj && obj.func_code) {
            return Sk.builtin.bool.true$
        } else {
            return Sk.builtin.bool.false$
        }
    });

    mod.isbuiltin = new Sk.builtin.func(function (obj) {
        // Get the name of the obj

        console.info(obj);
        //Sk.builtin
    });

    mod.getcallargs = new Sk.builtin.func(function (obj) {
        consle.info(obj, arguments);
    });

    return mod;
};