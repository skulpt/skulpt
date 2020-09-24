var $builtinmodule = function (name) {
    var mod = {__name__: new Sk.builtin.str("re")};

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

        Sk.builtin.pyCheckArgsLen("split", arguments.length, 2, 4);
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

    _split.co_varnames = ["pattern", "string", "maxsplit", "flags"];
    _split.$defaults = [ new Sk.builtin.int_(0), new Sk.builtin.int_(0) ];

    mod.split = new Sk.builtin.func(_split);

    _findall = function (pattern, string, flags) {
        var pat, str, jsflags, regex, result, match;

        Sk.builtin.pyCheckArgsLen("findall", arguments.length, 2, 3);
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

    _findall.co_varnames = ["pattern", "string", "flags"];
    _findall.$defaults = [ new Sk.builtin.int_(0) ];

    mod.findall = new Sk.builtin.func(_findall);


    matchobj = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, thematch, pattern, string) {
            self.thematch = thematch;
            self.re = pattern;
            self.string = string;
            return Sk.builtin.none.none$;
        });

        $loc.groups = new Sk.builtin.func(function (self) {
            var _groups = self.thematch.v.slice(1);

            return new Sk.builtin.tuple(_groups);
        });

        $loc.group = new Sk.builtin.func(function (self, grpnum) {
            if (grpnum === undefined) {
                grpnum = 0;
            } else {
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

        var matches, sitem, retval;
        var re = eval(res);
        var patt = new RegExp("\n$");
        var str = Sk.ffi.remapToJs(string);

        if (str.match(patt)) {
            matches = str.slice(0, -1).match(re);
        } else {
            matches = str.match(re);
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

        Sk.builtin.pyCheckArgsLen("search", arguments.length, 2, 3);
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
        if (lst.v.length < 1) {
            return Sk.builtin.none.none$;
        }
        mob = Sk.misceval.callsimArray(mod.MatchObject, [lst, pattern, string]);
        return mob;
    };

    _search.co_varnames = ["pattern", "string", "flags"];
    _search.$defaults = [ new Sk.builtin.int_(0) ];

    mod.search = new Sk.builtin.func(_search);

    _match = function (pattern, string, flags) {
        var mob, res;
        Sk.builtin.pyCheckArgsLen("match", arguments.length, 2, 3);
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
        pat = Sk.ffi.remapToJs(pattern);
        res = "/^" + pat.replace(/\//g, "\\/") + "/";
        lst = mod._findre(res, string);
        if (Sk.ffi.remapToJs(lst).length < 1) {
            return Sk.builtin.none.none$;
        }
        mob = Sk.misceval.callsimArray(mod.MatchObject, [lst, pattern, string]);
        return mob;
    };

    _match.co_varnames = ["pattern", "string", "flags"];
    _match.$defaults = [ new Sk.builtin.int_(0) ];

    mod.match = new Sk.builtin.func(_match);

    regexobj = function ($gbl, $loc) {
        var _slice, _re_search, _re_match, _re_split, _re_findall, _repr;

        $loc.__init__ = new Sk.builtin.func(function (self, pattern, flags) {
            self.re = pattern;
            if (flags === undefined) {
                self.flags = 0;
            } else {
                self.flags = flags;
            }
            return Sk.builtin.none.none$;
        });

        _repr = new Sk.builtin.func( function (self) {
            var ret = "re.compile('" + Sk.ffi.remapToJs(self.re) + "')";
            return Sk.ffi.remapToPy(ret.substring(0,212));
        });

        $loc.__str__ = _repr;

        $loc.__repr__ = _repr;

        // Given a string, start, and end position, return sliced string
        _slice = function(string, pos, endpos) {
            // Per docs, ^ should match index after newlines.
            // this matches the first
            var str = Sk.ffi.remapToJs(string);
            var start = pos == undefined ? 0 : Sk.ffi.remapToJs(pos);
            var end = endpos == undefined ? str.length : Sk.ffi.remapToJs(endpos);

            if (start == "^") {
                start = str.indexOf("\n") + 1;
            }
            if (end === null) {
                end = str.length;
            }
            return Sk.ffi.remapToPy(str.substring(start, end));

        };

        _re_search = function (self, string, pos, endpos) {
            Sk.builtin.pyCheckArgsLen("search", arguments.length, 2, 4);

            var str = _slice(string, pos, endpos);

            return _search(self.re, str, self.flags);
        };

        _re_search.co_varnames = ["self", "string", "pos", "endpos"];
        _re_search.$defaults = [ new Sk.builtin.int_(0), Sk.builtin.none.none$ ];

        $loc.search = new Sk.builtin.func(_re_search);

        _re_match = function (self, string, pos, endpos) {
            Sk.builtin.pyCheckArgsLen("match", arguments.length, 2, 4);

            var str = _slice(string, pos, endpos);
            // var str = string;

            return _match(self.re, str, self.flags);
        };

        _re_match.co_varnames = ["self", "string", "pos", "endpos"];
        _re_match.$defaults = [ new Sk.builtin.int_(0), Sk.builtin.none.none$ ];

        $loc.match = new Sk.builtin.func(_re_match);

        _re_split = function (self, string, maxsplit) {
            Sk.builtin.pyCheckArgsLen("split", arguments.length, 2, 3);

            if (maxsplit === undefined) {
                maxsplit = 0;
            }
            if (!Sk.builtin.checkInt(maxsplit)) {
                throw new Sk.builtin.TypeError("maxsplit must be an integer");
            }

            return _split(self.re, string, maxsplit, self.flags);
        };

        _re_split.co_varnames = ["self", "string", "maxsplit"];
        _re_split.$defaults = [ new Sk.builtin.int_(0) ];

        $loc.split = new Sk.builtin.func(_re_split);

        _re_findall = function (self, string, pos, endpos) {
            Sk.builtin.pyCheckArgsLen("findall", arguments.length, 2, 4);

            var str = _slice(string, pos, endpos);

            return _findall(self.re, str, self.flags);
        };

        _re_findall.co_varnames = ["self", "string", "pos", "endpos"];
        _re_findall.$defaults = [ new Sk.builtin.int_(0), Sk.builtin.none.none$ ];

        $loc.findall = new Sk.builtin.func(_re_findall);

    };

    mod.RegexObject = Sk.misceval.buildClass(mod, regexobj, "RegexObject", []);
    mod.compile = new Sk.builtin.func(function (pattern, flags) {
        var rob;
        Sk.builtin.pyCheckArgsLen("compile", arguments.length, 1, 2);
        if (!Sk.builtin.checkString(pattern)) {
            throw new Sk.builtin.TypeError("pattern must be a string");
        }
        if (flags === undefined) {
            flags = 0;
        }
        if (!Sk.builtin.checkNumber(flags)) {
            throw new Sk.builtin.TypeError("flags must be a number");
        }
        rob = Sk.misceval.callsimArray(mod.RegexObject, [pattern, flags]);
        return rob;
    });

    // No need to purge since we don't cache
    mod.purge = new Sk.builtin.func(function () {});

    return mod;
};
