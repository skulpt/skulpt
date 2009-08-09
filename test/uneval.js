// taken from bloxsom.v8
// tweaked slightly for method of string expansion (to match rhino's)

/*
 * $Id: uneval.js,v 0.2 2008/06/13 17:47:18 dankogai Exp dankogai $
 */

var protos = [];
var char2esc = {'\t':'t','\n':'n','\v':'v','\f':'f','\r':'\r',    
                '\"':'\"','\\':'\\'};
var escapeChar = function(c){
    if (c in char2esc) return '\\' + char2esc[c];
    var ord = c.charCodeAt(0);
    return ord < 0x20   ? '\\x0' + ord.toString(16)
        :  ord < 0x7F   ? '\\'   + c
        :  ord < 0x100  ? '\\x'  + ord.toString(16)
        :  ord < 0x1000 ? '\\u0' + ord.toString(16)
                        : '\\u'  + ord.toString(16)
};
var uneval_asis = function(o){ return o.toString() };
/* predefine objects where typeof(o) != 'object' */
var name2uneval = {
    'boolean':uneval_asis,
    'number': uneval_asis,
    'string': function(o){
        return '\"'
            + o.toString().replace(/[\x00-\x1F\"\\\u007F-\uFFFF]/g, escapeChar)
            + '\"'
    },
    'undefined': function(o){ return 'undefined' },
    'function':uneval_asis
};

var uneval_default = function(o, np){
    var src = []; // a-ha!
    for (var p in o){
        if (!o.hasOwnProperty(p)) continue;
        src[src.length] = uneval(p)  + ':' + uneval(o[p], 1);
    }
    // parens needed to make eval() happy
    return np ? '{' + src.toString() + '}' : '({' + src.toString() + '})';
};

uneval_set = function(proto, name, func){
    protos[protos.length] = [ proto, name ];
    name2uneval[name] = func || uneval_default;
};

uneval_set(Array, 'array', function(o){
    var src = [];
    for (var i = 0, l = o.length; i < l; i++)
        src[i] = uneval(o[i]);
    return '[' + String(src) + ']';
});
uneval_set(RegExp, 'regexp', uneval_asis);
uneval_set(Date, 'date', function(o){
    return '(new Date(' + o.valueOf() + '))';
});

var typeName = function(o){
    // if (o === null) return 'null';
    var t = typeof o;
    if (t != 'object') return t;
    // we have to lenear-search. sigh.
    for (var i = 0, l = protos.length; i < l; i++){
        if (o instanceof  protos[i][0]) return protos[i][1];
    }
    return 'object';
};

uneval = function(o, np){
    // if (o.toSource) return o.toSource();
    if (o === undefined) return 'undefined';
    if (o === null) return 'null';
    var func = name2uneval[typeName(o)] || uneval_default;
    return func(o, np);
}
