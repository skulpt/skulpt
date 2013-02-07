var $builtinmodule = function(name)
{
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

    var convert = function(pattern) {
        var newpattern;
        var match;
        var i;

        // Look for disallowed constructs
        match = pattern.match(/\(\?./g);
        if (match) {
            for (i=0; i<match.length; i++) {
                if (validGroups.indexOf(match[i]) == -1) {
                    throw new Sk.builtin.ValueError("Disallowed group in pattern: '"
                                                    + match[i] + "'");
                };
            };
        };

        newpattern = pattern.replace('/\\/g', '\\\\');
        
        return newpattern;
    };

    var getFlags = function(flags) {
        var jsflags = "g";
        if ((flags & mod.IGNORECASE) == mod.IGNORECASE) {
            jsflags += "i";
        };
        if ((flags & mod.MULTILINE) == mod.MULTILINE) {
            jsflags += "m";
        }; 
        return jsflags;
    };

    mod.split = new Sk.builtin.func(function(pattern, string, maxsplit, flags) {
        Sk.builtin.pyCheckArgs("split", arguments, 2, 4);
        if (!Sk.builtin.checkString(pattern)) {
            throw new Sk.builtin.TypeError("pattern must be a string");
        };
        if (!Sk.builtin.checkString(string)) {
            throw new Sk.builtin.TypeError("string must be a string");
        };
        if (maxsplit === undefined) {
            maxsplit = 0;
        };
        if (!Sk.builtin.checkNumber(maxsplit)) {
            throw new Sk.builtin.TypeError("maxsplit must be a number");
        };
        if (flags === undefined) {
            flags = 0;
        };
        if (!Sk.builtin.checkNumber(flags)) {
            throw new Sk.builtin.TypeError("flags must be a number");
        };

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
            };
            result.push(new Sk.builtin.str(str.substring(index, match.index)));
            if (captured) {
                // Add matching pattern, too
                result.push(new Sk.builtin.str(match[0]));
            };
            index = regex.lastIndex;
            splits += 1;
            if (maxsplit && (splits >= maxsplit)) {
                break;
            };
        };
        result.push(new Sk.builtin.str(str.substring(index)));

        return new Sk.builtin.list(result);
    });

    mod.findall = new Sk.builtin.func(function(pattern, string, flags) {
        Sk.builtin.pyCheckArgs("split", arguments, 2, 4);
        if (!Sk.builtin.checkString(pattern)) {
            throw new Sk.builtin.TypeError("pattern must be a string");
        };
        if (!Sk.builtin.checkString(string)) {
            throw new Sk.builtin.TypeError("string must be a string");
        };
        if (flags === undefined) {
            flags = 0;
        };
        if (!Sk.builtin.checkNumber(flags)) {
            throw new Sk.builtin.TypeError("flags must be a number");
        };

        var pat = Sk.ffi.unwrapo(pattern);
        var str = Sk.ffi.unwrapo(string);
        
        // Convert pat from Python to Javascript regex syntax
        pat = convert(pat);
        //print("Pat: " + pat);
        //print("Str: " + str);

        var jsflags = getFlags(flags);
        //print("Flags: ", jsflags);

        var regex = new RegExp(pat, jsflags);

        var result = [];
        var match;
        while ((match = regex.exec(str)) != null) {
            //print("Matched '" + match[0] + "' at position " + match.index + 
            //      "; next search at " + regex.lastIndex);
            if (match.index === regex.lastIndex) {
                // empty match
                break;
            };
            // print("match: " + JSON.stringify(match));
            if (match.length <= 2) {
                result.push(new Sk.builtin.str(match[0]));
            } else {
                var groups = [];
                for (var i=1; i<match.length; i++) {
                    groups.push(new Sk.builtin.str(match[i]));  
                };
                result.push(new Sk.builtin.tuple(groups));
            };
        };

        return new Sk.builtin.list(result);
    });

    return mod;
};