var tokenizefail = 0;
var tokenizepass = 0;

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

    var tokenizer = new Skulpt.Tokenizer(fn, printer);
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

    if (input[input.length - 1] !== "\n")
    {
        throw "input wasn't nl term";
    }
    input = input.substring(0, input.length - 1);
    if (input[input.length - 1] === "\r")
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
        ret += Skulpt._parseTables.number2symbol[n.type] + "\n";
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
        got = parseTestDump(Skulpt._parse(name + ".py", input));
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
    var cst = Skulpt._parse(name + ".py", input);
    var got = astDump(Skulpt._transform(cst)) + "\n";


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

    var expect = read(name + ".py.real");
    var js = Skulpt.compileStr(name + ".py", input);
    try {
        eval(js);
    }
    catch (e) { got = "EXCEPTION: " + e.toString() + "\n"; }
    if (expect !== got)
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
            catch (e) { got += "EXCEPTION: " + e.message + "\n" + e.stack + "\n"; }
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
        if ((i > 112 && i < 144) || i >= 149) continue;
        testTransform(sprintf("test/run/t%02d", i));
    }
    print(sprintf("transform: %d/%d", transformpass, transformpass + transformfail));

    for (i = 0; i <= 200; ++i)
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
