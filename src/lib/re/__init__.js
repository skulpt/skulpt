var $builtinmodule = function(name)
{
    var mod = {};

    var matchobj = function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self,thematch, pattern, string) {
            self.thematch = thematch;
	    self.re = pattern;
	    self.string = string;
        });

	$loc.groups = new Sk.builtin.func(function(self) {
	    return new Sk.builtin.tuple(self.thematch.v.slice(1))
	});

	$loc.group = new Sk.builtin.func(function(self,grpnum) {
	    if(grpnum >= self.thematch.v.length) {
		throw new Sk.builtin.IndexError("Index out of range: " + grpnum);
		}
	    return self.thematch.v[grpnum]
	});

    }

    mod.MatchObject = Sk.misceval.buildClass(mod, matchobj, 'MatchObject', []);

    // Internal function to return a Python list of strings 
    // From a JS regular expression string
    mod._findre = function(res, string) {
        var re = eval(res);
        var matches = string.v.match(re);
        retval = new Sk.builtin.list();
        if ( matches == null ) return retval;
        for (var i = 0; i < matches.length; ++i) {
            var sitem = new Sk.builtin.str(matches[i]);
            retval.v.push(sitem);
        }
        return retval;
    }
    
    mod.findall = new Sk.builtin.func(function(pattern, string, flags) {
        var res = "/"+pattern.v.replace("/","\\/")+"/g";
        var re = eval(res);
        var matches = string.v.match(re);
        retval = new Sk.builtin.list();
        if ( matches == null ) return retval;
        for (var i = 0; i < matches.length; ++i) {
            var sitem = new Sk.builtin.str(matches[i]);
            retval.v.push(sitem);
        }
        return retval;
    });

    mod.search = new Sk.builtin.func(function(pattern, string, flags) {
        var res = "/"+pattern.v.replace("/","\\/")+"/";
        lst = mod._findre(res,string);
        if ( lst.v.length < 1 ) return null;
        var mob = Sk.misceval.callsim(mod.MatchObject, lst, pattern, string);
        return mob;
    });

    mod.match = new Sk.builtin.func(function(pattern, string, flags) {
        var res = "/^"+pattern.v.replace("/","\\/")+"/";
        lst = mod._findre(res,string);
        if ( lst.v.length < 1 ) return null;
        var mob = Sk.misceval.callsim(mod.MatchObject, lst, pattern, string);
        return mob;
    });

    return mod;
}
