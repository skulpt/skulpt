/*
 *  __author__: Isaac Dontje Lindell (i@isaacdontjelindell.com)
 *
 *  Implementation of the Python string module.
 */


var $builtinmodule = function(name) {
    var mod = {};

    mod.ascii_lowercase = Sk.builtin.str('abcdefghijklmnopqrstuvwxyz');
    mod.ascii_uppercase = Sk.builtin.str('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    mod.ascii_letters = Sk.builtin.str(mod.ascii_lowercase.v + mod.ascii_uppercase.v);

    mod.lowercase = Sk.builtin.str('abcdefghijklmnopqrstuvwxyz');
    mod.uppercase = Sk.builtin.str('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    mod.letters = Sk.builtin.str(mod.lowercase.v + mod.uppercase.v);

    mod.digits = Sk.builtin.str('012345679', Sk.builtin.str);
    mod.hexdigits = Sk.builtin.str('0123456789abcdefABCDEF');
    mod.octdigits = Sk.builtin.str('01234567');

    mod.punctuation = Sk.builtin.str('!"#$%&\'()*+,-./:;<=>?@[]^_`{|}~');
    mod.whitespace = Sk.builtin.str('\t\n\x0b\x0c\r ');

    mod.printable = Sk.builtin.str(mod.digits.v + mod.letters.v + mod.punctuation.v + mod.whitespace.v);


    mod.split = new Sk.builtin.func(function(s, sep, maxsplit) {
        return Sk.misceval.callsim(Sk.builtin.str.prototype['split'], s, sep, maxsplit);
    });

    /* Return a copy of word with only its first character capitalized. */
    mod.capitalize = new Sk.builtin.func(function(word) {
        return Sk.misceval.callsim(Sk.builtin.str.prototype['capitalize'], word);
    });

    /* Concatenate a list or tuple of words with intervening occurrences
     * of sep. The default value for sep is a single space character. */
    mod.join = new Sk.builtin.func(function(words, sep) {
        return Sk.misceval.callsim(Sk.builtin.str.prototype['join'], sep, words);
    });


    /* Split the argument into words using split(), capitalize each word
     * using capitalize(), and join the capitalized words using join().
     * Note that this replaces runs of whitespace characters by a single
     * space, and removes leading and trailing whitespace. */
    mod.capwords = new Sk.builtin.func(function(s, sep) {
        Sk.builtin.pyCheckArgs('capwords', arguments, 1, 2);
        if (!Sk.builtin.checkString(s)) {
            throw new Sk.builtin.TypeError("s must be a string");
        }
        if (sep === undefined) {
            sep = Sk.builtin.str(' ');
        }
        if(!Sk.builtin.checkString(sep)) {
            throw new Sk.builtin.TypeError("sep must be a string");
        }

        var words = Sk.misceval.callsim(mod.split, s);
        var capWords = [];
        for (var i=0; i<words.v.length; i++) {
            var word = Sk.builtin.list.prototype['list_subscript_'].call(words, i);
            var cap = Sk.misceval.callsim(mod.capitalize, word);
            capWords.push(cap);
        }

        return Sk.misceval.callsim(mod.join, Sk.builtin.list(capWords), sep);
    });


    return mod;
};