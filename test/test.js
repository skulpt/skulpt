(function() {
var tokenizefail = 0;
var tokenizepass = 0;

//////////////
// BEGINNING OF UNEVAL.JS
//////////////
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

var uneval_set = function(proto, name, func){
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

var uneval = function(o, np){
    // if (o.toSource) return o.toSource();
    if (o === undefined) return 'undefined';
    if (o === null) return 'null';
    var func = name2uneval[typeName(o)] || uneval_default;
    return func(o, np);
}

//////////////
// END OF UNEVAL.JS
//////////////

var tok_name = {
    0: 'T_ENDMARKER', 1: 'T_NAME', 2: 'T_NUMBER', 3: 'T_STRING', 4: 'T_NEWLINE',
    5: 'T_INDENT', 6: 'T_DEDENT', 7: 'T_LPAR', 8: 'T_RPAR', 9: 'T_LSQB',
    10: 'T_RSQB', 11: 'T_COLON', 12: 'T_COMMA', 13: 'T_SEMI', 14: 'T_PLUS',
    15: 'T_MINUS', 16: 'T_STAR', 17: 'T_SLASH', 18: 'T_VBAR', 19: 'T_AMPER',
    20: 'T_LESS', 21: 'T_GREATER', 22: 'T_EQUAL', 23: 'T_DOT', 24: 'T_PERCENT',
    25: 'T_BACKQUOTE', 26: 'T_LBRACE', 27: 'T_RBRACE', 28: 'T_EQEQUAL', 29: 'T_NOTEQUAL',
    30: 'T_LESSEQUAL', 31: 'T_GREATEREQUAL', 32: 'T_TILDE', 33: 'T_CIRCUMFLEX', 34: 'T_LEFTSHIFT',
    35: 'T_RIGHTSHIFT', 36: 'T_DOUBLESTAR', 37: 'T_PLUSEQUAL', 38: 'T_MINEQUAL', 39: 'T_STAREQUAL',
    40: 'T_SLASHEQUAL', 41: 'T_PERCENTEQUAL', 42: 'T_AMPEREQUAL', 43: 'T_VBAREQUAL', 44: 'T_CIRCUMFLEXEQUAL',
    45: 'T_LEFTSHIFTEQUAL', 46: 'T_RIGHTSHIFTEQUAL', 47: 'T_DOUBLESTAREQUAL', 48: 'T_DOUBLESLASH', 49: 'T_DOUBLESLASHEQUAL',
    50: 'T_AT', 51: 'T_OP', 52: 'T_COMMENT', 53: 'T_NL', 54: 'T_RARROW',
    55: 'T_ERRORTOKEN', 56: 'T_N_TOKENS',
    256: 'T_NT_OFFSET'
};

function dump_tokens(fn, input)
{
    var ret = '',
        lines = input.split("\n"),
        curIndex = 0,
        printer = function (type, token, st, en, line)
        {
            var srow = st[0],
                scol = st[1],
                erow = en[0],
                ecol = en[1];
            var data = sprintf("%-12.12s %-13.13s (%d, %d) (%d, %d)", tok_name[type], uneval(token), srow, scol, erow, ecol);
            //print("DUMP:"+data);
            ret += data;
            ret += "\n";
        };

    var tokenizer = new Sk.Tokenizer(fn, false, printer);
    var done = false;
    for (var i = 0; i < lines.length && !done; ++i)
    {
        done = tokenizer.generateTokens(lines[i] + ((i === lines.length - 1) ? "" : "\n"));
    }
    if (!done) tokenizer.generateTokens();
    return ret;
}

function testTokenize(name)
{
    try { var input = read(name + ".py"); }
    catch (e) { return; }

    if (input.charAt(input.length - 1) !== "\n")
    {
        throw "input wasn't nl term";
    }
    input = input.substring(0, input.length - 1);
    if (input.charAt(input.length - 1) === "\r")
    {
        input = input.substring(0, input.length - 1);
    }

    var expect = read(name + ".expect");
    var got = '';
    try
    {
        got = dump_tokens(name + ".py", input);
    }
    catch (e)
    {
        got += e.toString();
    }
    if (expect !== got)
    {
        print("FAILED: (" + name + ".py)\n-----");
        print(input);
        print("-----\nGOT:\n-----");
        print(got);
        print("-----\nWANTED:\n-----");
        print(expect);
        tokenizefail += 1;
    }
    else
    {
        tokenizepass += 1;
    }
}

function parseTestDump(n, indent)
{
    //return JSON.stringify(n, null, 2);
    indent = indent || "";
    var ret = "";
    ret += indent;
    if (n.type >= 256) // non-term
    {
        ret += Sk.ParseTables.number2symbol[n.type] + "\n";
        for (var i = 0; i < n.children.length; ++i)
        {
            ret += parseTestDump(n.children[i], indent + "  ");
        }
    }
    else
    {
        ret += tok_name[n.type] + ": " + uneval(n.value) + "\n";
    }
    return ret;
}

var parsefail = 0;
var parsepass = 0;

function testParse(name)
{
    try { var input = read(name + ".py"); }
    catch (e) { return; }

    var expect = read(name + ".expect");
    var got;
    try
    {
        got = parseTestDump(Sk.parse(name + ".py", input));
    }
    catch (e)
    {
       got = "EXCEPTION\n";
       got += e.constructor.name + "\n";
       got += JSON.stringify(e) + "\n";
    }
    if (expect !== got)
    {
        print("FAILED: (" + name + ".py)\n-----");
        print(input);
        print("-----\nGOT:\n-----");
        print(got);
        print("-----\nWANTED:\n-----");
        print(expect);
        parsefail += 1;
    }
    else
    {
        parsepass += 1;
    }
}

var transformpass = 0;
var transformfail = 0;

function testTransform(name)
{
    try { var input = read(name + ".py"); }
    catch (e) { return; }

    var expect = 'NO_.TRANS_FILE';
    try { expect = read(name + ".trans"); }
    catch (e) {}
    var cst = Sk.parse(name + ".py", input);
    var got = Sk.astDump(Sk.transform(cst)) + "\n";


    if (expect !== got)
    {
        print("FAILED: (" + name + ".py)\n-----");
        print(input);
        print("-----\nGOT:\n-----");
        print(got);
        print("-----\nWANTED:\n-----");
        print(expect);
        //print("-----\nCST:\n-----");
        //print(parseTestDump(cst));
        transformfail += 1;
    }
    else
    {
        transformpass += 1;
    }
}

var runpass = 0;
var runfail = 0;
var rundisabled = 0;
function testRun(name)
{
    try { var input = read(name + ".py"); }
    catch (e) { 
        try { read(name + ".py.disabled"); rundisabled += 1;}
        catch (e) {}
        return;
    }

    var got = '';
    sk$output = function(str) { got += str; }
    sk$sysargv = [ name + '.py' ];

    var expect = read(name + ".py.real");
    var expectalt;
    try { expectalt = read(name + ".py.real.alt"); }
    catch (e) {}
    var js = Skulpt.compileStr(name + ".py", input);
    try {
        eval(js);
    }
    catch (e)
    {
        got = "EXCEPTION: " + e.name + "\n";
    }
    if (expect !== got && (expectalt !== undefined || expectalt !== got))
    {
        print("FAILED: (" + name + ".py)\n-----");
        print(input);
        print("-----\nGOT:\n-----");
        print(got);
        print("-----\nWANTED:\n-----");
        print(expect);
        print("-----\nJS:\n-----");
        print(js);
        runfail += 1;
        //throw "dying on first run fail";
    }
    else
    {
        runpass += 1;
    }
}

var interactivepass = 0;
var interactivefail = 0;
var interactivedisabled = 0;
function testInteractive(name)
{
    try { var input = read(name + ".py"); }
    catch (e) {
        try { read(name + ".py.disabled"); interactivedisabled += 1;}
        catch (e) {}
        return;
    }

    var expect = read(name + ".py.real");

    var got = '';
    sk$output = function(str) { got += str; }

    var lines = input.split("\n");
    var ic = new Skulpt.InteractiveContext();
    for (var i = 0; i < lines.length; ++i)
    {
        //print("LINE:"+lines[i]);
        js = ic.evalLine(lines[i] + "\n");
        //print("JS now:'"+js+"'");
        if (js !== false)
        {
            try {
                var ret = eval(js);
                if (ret && ret.__repr__ !== undefined)
                    got += ret.__repr__().v + "\n";
            }
            catch (e) { got += "EXCEPTION: " + e.name + "\n" }
            //print("made new context");
            ic = new Skulpt.InteractiveContext();
        }
    }

    if (expect !== got)
    {
        print("FAILED: (" + name + ".py)\n-----");
        print(input);
        print("-----\nGOT:\n-----");
        print(got);
        print("-----\nWANTED:\n-----");
        print(expect);
        interactivefail += 1;
    }
    else
    {
        interactivepass += 1;
    }
}

function main()
{
    var i;

    for (i = 0; i <= 100; i += 1)
    {
        testTokenize(sprintf("test/tokenize/t%02d", i));
    }
    print(sprintf("tokenize: %d/%d", tokenizepass, tokenizepass + tokenizefail));

    for (i = 0; i <= 10; i += 1)
    {
        testParse(sprintf("test/parse/t%02d", i));
    }
    print(sprintf("parse: %d/%d", parsepass, parsepass + parsefail));

    for (i = 0; i <= 200; ++i)
    {
        // todo; worth maintaining all the .trans files?
        if ((i > 112 && i < 144) || i >= 149 && i !== 194) continue;
        testTransform(sprintf("test/run/t%02d", i));
    }
    print(sprintf("transform: %d/%d", transformpass, transformpass + transformfail));

return;
    for (i = 0; i <= 300; ++i)
    {
        testRun(sprintf("test/run/t%02d", i));
    }
    print(sprintf("run: %d/%d (+%d disabled)", runpass, runpass + runfail, rundisabled));

    for (i = 0; i <= 100; ++i)
    {
        testInteractive(sprintf("test/interactive/t%02d", i));
    }
    print(sprintf("interactive: %d/%d (+%d disabled)", interactivepass, interactivepass + interactivefail, interactivedisabled));

    quit(tokenizefail + parsefail + transformfail + runfail + interactivefail);
}

main();

}());
