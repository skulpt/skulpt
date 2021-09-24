/*
 *  __author__: Isaac Dontje Lindell (i@isaacdontjelindell.com)
 *
 *  Implementation of the Python string module.
 */


var $builtinmodule = function (name) {
    var mod = {};

    mod.ascii_lowercase = new Sk.builtin.str('abcdefghijklmnopqrstuvwxyz');
    mod.ascii_uppercase = new Sk.builtin.str('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    mod.ascii_letters = new Sk.builtin.str(mod.ascii_lowercase.v + mod.ascii_uppercase.v);

    mod.lowercase = new Sk.builtin.str('abcdefghijklmnopqrstuvwxyz');
    mod.uppercase = new Sk.builtin.str('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    mod.letters = new Sk.builtin.str(mod.lowercase.v + mod.uppercase.v);

    mod.digits = new Sk.builtin.str('0123456789');
    mod.hexdigits = new Sk.builtin.str('0123456789abcdefABCDEF');
    mod.octdigits = new Sk.builtin.str('01234567');

    mod.punctuation = new Sk.builtin.str('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~');
    mod.whitespace = new Sk.builtin.str('\t\n\x0b\x0c\r ');

    /* Note: The docs for string.printable say that it's the concatenation of string.digits,
     * string.letters, string.punctuation, and string.whitespace. The CPython interpreter
     * outputs the whitespace characters in one order when string.whitespace is used, and a
     * slightly different order when string.printable is used. I've elected to follow the
     * behavior of CPython here rather than the spec. */
    mod.printable = new Sk.builtin.str(mod.digits.v + mod.letters.v + mod.punctuation.v + " \t\n\r\x0b\x0c");


    mod.split = new Sk.builtin.func(function (...args) {
        return Sk.misceval.callsimArray(Sk.builtin.str.prototype['split'], args);
    });

    /* Return a copy of word with only its first character capitalized. */
    mod.capitalize = new Sk.builtin.func(function (word) {
        return Sk.misceval.callsimArray(Sk.builtin.str.prototype['capitalize'], [word]);
    });

    /* Concatenate a list or tuple of words with intervening occurrences
     * of sep. The default value for sep is a single space character. */
    mod.join = new Sk.builtin.func(function (words, sep) {
        if (sep === undefined) {
            sep = new Sk.builtin.str(' ');
        }
        return Sk.misceval.callsimArray(Sk.builtin.str.prototype['join'], [sep, words]);
    });


    /* Split the argument into words using split(), capitalize each word
     * using capitalize(), and join the capitalized words using join().
     * Note that this replaces runs of whitespace characters by a single
     * space, and removes leading and trailing whitespace. */
    mod.capwords = new Sk.builtin.func(function (s, sep) {
        Sk.builtin.pyCheckArgsLen('capwords', arguments.length, 1, 2);
        if (!Sk.builtin.checkString(s)) {
            throw new Sk.builtin.TypeError("s must be a string");
        }
        if (sep === undefined) {
            sep = new Sk.builtin.str(' ');
        }
        if (!Sk.builtin.checkString(sep)) {
            throw new Sk.builtin.TypeError("sep must be a string");
        }

        var words = Sk.misceval.callsimArray(mod.split, [s, sep]).v;
        var capWords = [];
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            var cap = Sk.misceval.callsimArray(mod.capitalize, [word]);
            capWords.push(cap);
        }

        return Sk.misceval.callsimArray(mod.join, [new Sk.builtin.list(capWords), sep]);
    });


    return mod;
};
