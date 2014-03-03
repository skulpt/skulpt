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

    mod.split = new Sk.builtin.func(function(s, sep, maxsplit) {
        return Sk.misceval.callsim(Sk.builtin.str.prototype['split'], s, sep, maxsplit);
    });

    /*
     * string.capwords(s)
     *    Split the argument into words using split(), capitalize
     *    each word using capitalize(), and join the capitalized
     *    words using join(). Note that this replaces runs of
     *    whitespace characters by a single space, and removes
     *    leading and trailing whitespace.
    */
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
            var cap = Sk.misceval.callsim(Sk.builtin.str.prototype['capitalize'], word);
            capWords.push(cap);
        }

        return Sk.misceval.callsim(Sk.builtin.str.prototype['join'], sep, Sk.builtin.list(capWords));

    });



    return mod;
};