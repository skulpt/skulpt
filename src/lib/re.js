var $builtinmodule = function (name) {
    var mod = {};

    var validGroups, convert, getFlags, _split, _findall, matchobj, _search, _match, regexobj;

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

    validGroups = ["(?:", "(?=", "(?!"];

    convert = function (pattern) {
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
            }
        }

        newpattern = pattern.replace("/\\/g", "\\\\");
        newpattern = pattern.replace(/([^\\]){,(?![^\[]*\])/g, "$1{0,");

        return newpattern;
    };

    getFlags = function (flags) {
        var jsflags = "g";
        if ((flags & mod.IGNORECASE) == mod.IGNORECASE) {
            jsflags += "i";
        }
        if ((flags & mod.MULTILINE) == mod.MULTILINE) {
            jsflags += "m";
        }
        return jsflags;
    };

    _split = function (pattern, string, maxsplit, flags) {
        var pat, str, captured, jsflags, regex;
        var result, match, index, splits;

        Sk.builtin.pyCheckArgs("split", arguments, 2, 4);
        if (!Sk.builtin.checkString(pattern)) {
            throw new Sk.builtin.TypeError("pattern must be a string");
        }
        if (!Sk.builtin.checkString(string)) {
            throw new Sk.builtin.TypeError("string must be a string");
        }
        if (maxsplit === undefined) {
            maxsplit = 0;
        }
        if (!Sk.builtin.checkNumber(maxsplit)) {
            throw new Sk.builtin.TypeError("maxsplit must be a number");
        }
        if (flags === undefined) {
            flags = 0;
        }
        if (!Sk.builtin.checkNumber(flags)) {
            throw new Sk.builtin.TypeError("flags must be a number");
        }

        maxsplit = Sk.builtin.asnum$(maxsplit);
        pat = Sk.ffi.unwrapo(pattern);
        str = Sk.ffi.unwrapo(string);

        // Convert pat from Python to Javascript regex syntax
        pat = convert(pat);
        //print("Pat: " + pat);
        //print("Str: " + str);

        captured = !(pat.match(/^\(.*\)$/) === null);
        //print("Captured: ", captured);

        jsflags = getFlags(flags);
        //print("Flags: ", jsflags);

        regex = new RegExp(pat, jsflags);

        result = [];
        match;
        index = 0;
        splits = 0;
        while ((match = regex.exec(str)) != null) {
            //print("Matched '" + match[0] + "' at position " + match.index +
            //      "; next search at " + regex.lastIndex);
            if (match.index === regex.lastIndex) {
                // empty match
                break;
            }
            result.push(new Sk.builtin.str(str.substring(index, match.index)));
            if (captured) {
                // Add matching pattern, too
                result.push(new Sk.builtin.str(match[0]));
            }
            index = regex.lastIndex;
            splits += 1;
            if (maxsplit && (splits >= maxsplit)) {
                break;
            }
        }
        result.push(new Sk.builtin.str(str.substring(index)));

        return new Sk.builtin.list(result);
    };

    _split.co_varnames = ["maxsplit", "flags"];
    _split.co_numargs = 4;
    _split.$defaults = [ new Sk.builtin.int_(0), new Sk.builtin.int_(0) ];

    mod.split = Sk.nativejs.func(_split);

    _findall = function (pattern, string, flags) {
        var pat, str, jsflags, regex, result, match;

        Sk.builtin.pyCheckArgs("findall", arguments, 2, 3);
        if (!Sk.builtin.checkString(pattern)) {
            throw new Sk.builtin.TypeError("pattern must be a string");
        }
        if (!Sk.builtin.checkString(string)) {
            throw new Sk.builtin.TypeError("string must be a string");
        }
        if (flags === undefined) {
            flags = 0;
        }
        if (!Sk.builtin.checkNumber(flags)) {
            throw new Sk.builtin.TypeError("flags must be a number");
        }

        pat = Sk.ffi.unwrapo(pattern);
        str = Sk.ffi.unwrapo(string);

        // Convert pat from Python to Javascript regex syntax
        pat = convert(pat);
        //print("Pat: " + pat);
        //print("Str: " + str);

        jsflags = getFlags(flags);
        //print("Flags: ", jsflags);

        regex = new RegExp(pat, jsflags);

        if (pat.match(/\$/)) {
            var newline_at_end = new RegExp(/\n$/);
            if (str.match(newline_at_end)) {
                str = str.slice(0, -1);
            }
        }

        result = [];
        match;
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
                result.push(new Sk.builtin.tuple(groups));
            }
            if (match.index === regex.lastIndex) {
                regex.lastIndex += 1;
            }
        }

        return new Sk.builtin.list(result);
    };

    mod.findall = Sk.nativejs.func(_findall);


    matchobj = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, thematch, pattern, string) {
            self.thematch = thematch;
            self.re = pattern;
            self.string = string;
        });

        $loc.groups = new Sk.builtin.func(function (self, def) {
            var _groups = self.thematch.v.slice(1);

            if (def == undefined) {
                def = Sk.builtin.none.none$;
            }

            // Return none for empty group matches
            for (var i in _groups) {
                if (_groups[i].v == '') {
                    _groups[i] = def;
                }
            }

            return new Sk.builtin.tuple(_groups)
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
            return self.thematch.v[grpnum];
        });

    };

    mod.MatchObject = Sk.misceval.buildClass(mod, matchobj, "MatchObject", []);

    // Internal function to return a Python list of strings
    // From a JS regular expression string
    mod._findre = function (res, string) {
        res = res.replace(/([^\\]){,(?![^\[]*\])/g, "$1{0,");

        var matches, sitem;
        var re = eval(res);
        var patt = new RegExp("\n$");

        if (string.v.match(patt)) {
            matches = string.v.slice(0, -1).match(re);
        }
        else {
            matches = string.v.match(re);
        }
        retval = new Sk.builtin.list();
        if (matches == null) {
            return retval;
        }
        for (var i = 0; i < matches.length; ++i) {
            sitem = new Sk.builtin.str(matches[i]);
            retval.v.push(sitem);
        }
        return retval;
    };


    // Internal search, shared between search function and RegexObject.search method
    _search = function (pattern, string, flags) {
        var mob, res;

        Sk.builtin.pyCheckArgs("search", arguments, 2, 3);
        if (!Sk.builtin.checkString(pattern)) {
            throw new Sk.builtin.TypeError("pattern must be a string");
        }
        if (!Sk.builtin.checkString(string)) {
            throw new Sk.builtin.TypeError("string must be a string");
        }
        if (flags === undefined) {
            flags = 0;
        }
        if (!Sk.builtin.checkNumber(flags)) {
            throw new Sk.builtin.TypeError("flags must be a number");
        }
        res = "/" + pattern.v.replace(/\//g, "\\/") + "/";
        lst = mod._findre(res, string);
        if (Sk.ffi.remapToJs(lst) == "") {
            return Sk.builtin.none.none$;
        }
        mob = Sk.misceval.callsim(mod.MatchObject, lst, pattern, string);
        return mob;
    };

    mod.search = new Sk.builtin.func(_search);

    _match = function (pattern, string, flags) {
        var mob, res;
        Sk.builtin.pyCheckArgs("match", arguments, 2, 3);
        if (!Sk.builtin.checkString(pattern)) {
            throw new Sk.builtin.TypeError("pattern must be a string");
        }
        if (!Sk.builtin.checkString(string)) {
            throw new Sk.builtin.TypeError("string must be a string");
        }
        if (flags === undefined) {
            flags = 0;
        }
        if (!Sk.builtin.checkNumber(flags)) {
            throw new Sk.builtin.TypeError("flags must be a number");
        }
        res = "/^" + pattern.v.replace(/\//g, "\\/") + "/";
        lst = mod._findre(res, string);
        if (lst.v.length < 1) {
            return Sk.builtin.none.none$;
        }
        mob = Sk.misceval.callsim(mod.MatchObject, lst, pattern, string);
        return mob;
    };

    mod.match = new Sk.builtin.func(_match);

    regexobj = function ($gbl, $loc) {
        var _re_split, _re_findall, _repr;

        $loc.__init__ = new Sk.builtin.func(function (self, pattern, flags) {
            self.re = pattern;
            if (flags === undefined) {
                self.flags = 0;
            }
            else {
                self.flags = flags;
            }
        });

        _repr = new Sk.builtin.func( function (self) {
            var ret = "re.compile('" + self.re.v + "')";
            return Sk.ffi.remapToPy(ret.substring(0,212));
        });

        $loc.__str__ = _repr;

        $loc.__repr__ = _repr;

        $loc.search = new Sk.builtin.func(function (self, string, pos, endpos) {
            Sk.builtin.pyCheckArgs("search", arguments, 2, 4);

            // Todo: handle pos, endpos
            // complexity: ^

            return _search(self.re, string, self.flags);
        });

        // Todo: pos, endpos argument handling

        $loc.match = new Sk.builtin.func(function (self, string, pos, endpos) {
            Sk.builtin.pyCheckArgs("match", arguments, 2, 4);

            // Todo: handle pos, endpos
            // complexity: ^

            return _match(self.re, string, self.flags);
        });

        // Todo: pos, endpos argument handling

        _re_split = function (self, string, maxsplit) {
            Sk.builtin.pyCheckArgs("split", arguments, 2, 3);

            // Todo: handle pos, endpos
            // complexity: ^

            if (maxsplit === undefined) {
                maxsplit = 0;
            }
            if (!Sk.builtin.checkInt(maxsplit)) {
                throw new Sk.builtin.TypeError("maxsplit must be an integer");
            }

            return _split(self.re, string, maxsplit, self.flags);
        };

        _re_split.co_varnames = ["maxsplit"];
        _re_split.co_numargs = 2;
        _re_split.$defaults = [ new Sk.builtin.int_(0) ];

        $loc.split = new Sk.builtin.func(_re_split);

        _re_findall = function (self, string, pos, endpos) {
            Sk.builtin.pyCheckArgs("findall", arguments, 2, 3);

            // Todo: handle pos, endpos
            // complexity: ^

            return _findall(self.re, string, self.flags);
        };

        // Todo: pos, endpos argument handling

        $loc.findall = new Sk.builtin.func(_re_findall);

    };

    mod.RegexObject = Sk.misceval.buildClass(mod, regexobj, "RegexObject", []);

    mod.compile = new Sk.builtin.func(function (pattern, flags) {
        var rob;
        Sk.builtin.pyCheckArgs("compile", arguments, 1, 2);
        if (!Sk.builtin.checkString(pattern)) {
            throw new Sk.builtin.TypeError("pattern must be a string");
        }
        if (flags === undefined) {
            flags = 0;
        }
        if (!Sk.builtin.checkNumber(flags)) {
            throw new Sk.builtin.TypeError("flags must be a number");
        }
        rob = Sk.misceval.callsim(mod.RegexObject, pattern, flags);
        return rob;
    });

    // No need to purge since we don't cache
    mod.purge = new Sk.builtin.func(function () {});

    return mod;
};
