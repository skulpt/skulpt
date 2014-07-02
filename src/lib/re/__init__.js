var $builtinmodule = function (name) {
    var mod = {};

    // Constants (mostly unsupported)
    mod.I = 2;
    mod.IGNORECASE = 2;
    // mod.L = 4;
    // mod.LOCALE = 4;
    mod.M = 8;
    mod.MULTILINE = 8;
    // mod.S = 16;
    // mod.DOTALL = 16;
    // mod.U = 32;
    // mod.UNICODE = 32;
    // mod.X = 64;
    // mod.VERBOSE = 64;

    var validGroups = ["(?:", "(?=", "(?!"];

    var convert = function (pattern) {
        var newpattern;
        var match;
        var i;

        // Look for disallowed constructs
        match = pattern.match(/\(\?./g);
        if (match) {
            for (i = 0; i < match.length; i++) {
                if (validGroups.indexOf(match[i]) == -1) {
                    throw new Sk.builtin.ValueError("Disallowed group in pattern: '"
                        + match[i] + "'");
                }
                ;
            }
            ;
        }
        ;

        newpattern = pattern.replace('/\\/g', '\\\\');
        newpattern = pattern.replace(/([^\\]){,(?![^\[]*\])/g, '$1{0,');

        return newpattern;
    };

    var getFlags = function (flags) {
        var jsflags = "g";
        if ((flags & mod.IGNORECASE) == mod.IGNORECASE) {
            jsflags += "i";
        }
        ;
        if ((flags & mod.MULTILINE) == mod.MULTILINE) {
            jsflags += "m";
        }
        ;
        return jsflags;
    };

    mod.split = Sk.nativejs.func(function split (pattern, string, maxsplit, flags) {
        Sk.builtin.pyCheckArgs("split", arguments, 2, 4);
        if (!Sk.builtin.checkString(pattern)) {
            throw new Sk.builtin.TypeError("pattern must be a string");
        }
        ;
        if (!Sk.builtin.checkString(string)) {
            throw new Sk.builtin.TypeError("string must be a string");
        }
        ;
        if (maxsplit === undefined) {
            maxsplit = 0;
        }
        ;
        if (!Sk.builtin.checkNumber(maxsplit)) {
            throw new Sk.builtin.TypeError("maxsplit must be a number");
        }
        ;
        if (flags === undefined) {
            flags = 0;
        }
        ;
        if (!Sk.builtin.checkNumber(flags)) {
            throw new Sk.builtin.TypeError("flags must be a number");
        }
        ;

        maxsplit = Sk.builtin.asnum$(maxsplit);
        var pat = Sk.ffi.unwrapo(pattern);
        var str = Sk.ffi.unwrapo(string);

        // Convert pat from Python to Javascript regex syntax
        pat = convert(pat);
        //print("Pat: " + pat);
        //print("Str: " + str);

        var captured = !(pat.match(/^\(.*\)$/) === null);
        //print("Captured: ", captured);

        var jsflags = getFlags(flags);
        //print("Flags: ", jsflags);

        var regex = new RegExp(pat, jsflags);

        var result = [];
        var match;
        var index = 0;
        var splits = 0;
        while ((match = regex.exec(str)) != null) {
            //print("Matched '" + match[0] + "' at position " + match.index + 
            //      "; next search at " + regex.lastIndex);
            if (match.index === regex.lastIndex) {
                // empty match
                break;
            }
            ;
            result.push(new Sk.builtin.str(str.substring(index, match.index)));
            if (captured) {
                // Add matching pattern, too
                result.push(new Sk.builtin.str(match[0]));
            }
            ;
            index = regex.lastIndex;
            splits += 1;
            if (maxsplit && (splits >= maxsplit)) {
                break;
            }
            ;
        }
        ;
        result.push(new Sk.builtin.str(str.substring(index)));

        return new Sk.builtin.list(result);
    });

    mod.findall = Sk.nativejs.func(function findall (pattern, string, flags) {
        Sk.builtin.pyCheckArgs("findall", arguments, 2, 3);
        if (!Sk.builtin.checkString(pattern)) {
            throw new Sk.builtin.TypeError("pattern must be a string");
        }
        ;
        if (!Sk.builtin.checkString(string)) {
            throw new Sk.builtin.TypeError("string must be a string");
        }
        ;
        if (flags === undefined) {
            flags = 0;
        }
        ;
        if (!Sk.builtin.checkNumber(flags)) {
            throw new Sk.builtin.TypeError("flags must be a number");
        }
        ;

        var pat = Sk.ffi.unwrapo(pattern);
        var str = Sk.ffi.unwrapo(string);

        // Convert pat from Python to Javascript regex syntax
        pat = convert(pat);
        //print("Pat: " + pat);
        //print("Str: " + str);

        var jsflags = getFlags(flags);
        //print("Flags: ", jsflags);

        var regex = new RegExp(pat, jsflags);

        if (pat.match(/\$/)) {
            var newline_at_end = new RegExp(/\n$/);
            if (str.match(newline_at_end)) {
                str = str.slice(0, -1);
            }
        }

        var result = [];
        var match;
        while ((match = regex.exec(str)) != null) {
            //print("Matched '" + match[0] + "' at position " + match.index + 
            //      "; next search at " + regex.lastIndex);
            // print("match: " + JSON.stringify(match));
            if (match.length < 2) {
                result.push(new Sk.builtin.str(match[0]));
            } else if (match.length == 2) {
                result.push(new Sk.builtin.str(match[1]));
            } else {
                var groups = [];
                for (var i = 1; i < match.length; i++) {
                    groups.push(new Sk.builtin.str(match[i]));
                }
                ;
                result.push(new Sk.builtin.tuple(groups));
            }
            ;
            if (match.index === regex.lastIndex) {
                regex.lastIndex += 1;
            }
            ;
        }
        ;

        return new Sk.builtin.list(result);
    });


    var matchobj = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, thematch, pattern, string) {
            self.thematch = thematch;
            self.re = pattern;
            self.string = string;
        });

        $loc.groups = new Sk.builtin.func(function (self) {
            return new Sk.builtin.tuple(self.thematch.v.slice(1))
        });

        $loc.group = new Sk.builtin.func(function (self, grpnum) {
            if (grpnum === undefined) {
                grpnum = 0;
            }
            else {
                grpnum = Sk.builtin.asnum$(grpnum);
            }
            if (grpnum >= self.thematch.v.length) {
                throw new Sk.builtin.IndexError("Index out of range: " + grpnum);
            }
            return self.thematch.v[grpnum]
        });

    }

    mod.MatchObject = Sk.misceval.buildClass(mod, matchobj, 'MatchObject', []);

    // Internal function to return a Python list of strings 
    // From a JS regular expression string
    mod._findre = function (res, string) {
        res = res.replace(/([^\\]){,(?![^\[]*\])/g, '$1{0,');
        var re = eval(res);
        var patt = new RegExp('\n$');
        if (string.v.match(patt)) {
            var matches = string.v.slice(0, -1).match(re);
        }
        else {
            var matches = string.v.match(re);
        }
        retval = new Sk.builtin.list();
        if (matches == null) {
            return retval;
        }
        for (var i = 0; i < matches.length; ++i) {
            var sitem = new Sk.builtin.str(matches[i]);
            retval.v.push(sitem);
        }
        return retval;
    }

    mod.search = new Sk.builtin.func(function (pattern, string, flags) {
        Sk.builtin.pyCheckArgs('search', arguments, 2, 3);
        if (!Sk.builtin.checkString(pattern)) {
            throw new Sk.builtin.TypeError("pattern must be a string");
        }
        ;
        if (!Sk.builtin.checkString(string)) {
            throw new Sk.builtin.TypeError("string must be a string");
        }
        ;
        if (flags === undefined) {
            flags = 0;
        }
        ;
        if (!Sk.builtin.checkNumber(flags)) {
            throw new Sk.builtin.TypeError("flags must be a number");
        }
        ;
        var res = "/" + pattern.v.replace(/\//g, "\\/") + "/";
        lst = mod._findre(res, string);
        if (lst.v.length < 1) {
            return Sk.builtin.none.none$;
        }
        var mob = Sk.misceval.callsim(mod.MatchObject, lst, pattern, string);
        return mob;
    });

    mod.match = new Sk.builtin.func(function (pattern, string, flags) {
        Sk.builtin.pyCheckArgs('match', arguments, 2, 3);
        if (!Sk.builtin.checkString(pattern)) {
            throw new Sk.builtin.TypeError("pattern must be a string");
        }
        ;
        if (!Sk.builtin.checkString(string)) {
            throw new Sk.builtin.TypeError("string must be a string");
        }
        ;
        if (flags === undefined) {
            flags = 0;
        }
        ;
        if (!Sk.builtin.checkNumber(flags)) {
            throw new Sk.builtin.TypeError("flags must be a number");
        }
        ;
        var res = "/^" + pattern.v.replace(/\//g, "\\/") + "/";
        lst = mod._findre(res, string);
        if (lst.v.length < 1) {
            return Sk.builtin.none.none$;
        }
        var mob = Sk.misceval.callsim(mod.MatchObject, lst, pattern, string);
        return mob;
    });

    return mod;
}
