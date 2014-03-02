/*
    __author__: Isaac Dontje Lindell (i@isaacdontjelindell.com)

    Implementation of the Python string module.
 */


var $builtinmodule = function(name) {
    var mod = {};

    mod.ascii_lowercase = Sk.builtin.str('abcdefghijklmnopqrstuvwxyz', Sk.builtin.str);
    mod.ascii_uppercase = Sk.builtin.str('ABCDEFGHIJKLMNOPQRSTUVWXYZ', Sk.builtin.str);
    mod.ascii_letters = Sk.builtin.str('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', Sk.builtin.str);

    mod.digits = Sk.builtin.str('012345679', Sk.builtin.str);
    mod.hexdigits = Sk.builtin.str('0123456789abcdefABCDEF', Sk.builtin.str);
    mod.octdigits = Sk.builtin.str('01234567', Sk.builtin.str);

    mod.punctuation = Sk.builtin.str('!"#$%&\'()*+,-./:;<=>?@[]^_`{|}~', Sk.builtin.str);
    mod.whitespace = Sk.builtin.str('\t\n\x0b\x0c\r ', Sk.builtin.str);

    return mod;
};