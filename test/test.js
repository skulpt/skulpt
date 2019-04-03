if (Sk.inBrowser)
{
    goog.require('goog.dom');
    goog.require('goog.ui.ComboBox');
}

var tokenizefail = 0;
var tokenizepass = 0;


function dump_tokens(fn, input)
{
    var uneval = function(t)
    {
        return new Sk.builtins['repr'](new Sk.builtins['str'](t)).v;
    };
    var ret = '',
        lines = input.split("\n"),
        curIndex = 0,
        printer = function (type, token, st, en, line)
        {
            var srow = st[0],
                scol = st[1],
                erow = en[0],
                ecol = en[1];
            var data = sprintf("%-12.12s %-13.13s (%d, %d) (%d, %d)", Sk.Tokenizer.tokenNames[type], uneval(token), srow, scol, erow, ecol);
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
        got += Sk.builtins['str'](e).v + "\n";
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
        got = Sk.parseTreeDump(Sk.parse(name + ".py", input));
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
var transformdisabled = 0;

function testTransform(name)
{
    try { var input = read(name + ".py"); }
    catch (e) { return; }

    var expect = 'NO_.TRANS_FILE';
    try { expect = read(name + ".trans"); }
    catch (e) {
	transformdisabled += 1;
	return;
    }
    var cst = Sk.parse(name + ".py", input);
    var got = Sk.astDump(Sk.astFromParse(cst)) + "\n";

    //print(got);
    //print(Sk.parseTreeDump(cst));

    if (expect !== got)
    {
        print("FAILED: (" + name + ".py)\n-----");
        print(input);
        print("-----\nGOT:\n-----");
        print(got);
        print("-----\nWANTED:\n-----");
        print(expect);
        //print("-----\nCST:\n-----");
        //print(Sk.parseTestDump(cst));
        transformfail += 1;
    }
    else
    {
        transformpass += 1;
    }
}

var symtabpass = 0;
var symtabfail = 0;
var symtabdisabled = 0;
function testSymtab(name)
{
    try { var input = read(name + ".py"); }
    catch (e) { return; }
    //print(name);

    var expect = 'NO_.SYMTAB_FILE';
    try { expect = read(name + ".py.symtab"); }
    catch (e) {
        symtabdisabled += 1;
	return;
    }
    var cst = Sk.parse(name + ".py", input);
    var ast = Sk.astFromParse(cst);
    var st = Sk.symboltable(ast, name + ".py");
    var got = Sk.dumpSymtab(st);

    if (expect !== got)
    {
        print("FAILED: (" + name + ".py)\n-----");
        print(input);
        print("-----\nGOT:\n-----");
        print(got);
        print("-----\nWANTED:\n-----");
        print(expect);
        symtabfail += 1;
    }
    else
    {
        symtabpass += 1;
    }
}

var AllRunTests = [];
var runpass = 0;
var runfail = 0;
var rundisabled = 0;
function testRun(name, nocatch, debugMode)
{
    try { var input = read(name + ".py"); }
    catch (e) {
        try { read(name + ".py.disabled"); rundisabled += 1;}
        catch (e) {}
        return;
    }

    AllRunTests.unshift(name);

    var got = '';
    var justpath = name.substr(0, name.lastIndexOf('/'));
    Sk.configure({
        output: function(str) { got += str; },
        sysargv: [ name + '.py' ],
        read: read,
        debugging: debugMode,
        syspath: [ justpath ]
    });

    var expect = read(name + ".py.real");
    var expectalt;
    try { expectalt = read(name + ".py.real.alt"); }
    catch (e) {}

    var justname = name.substr(name.lastIndexOf('/') + 1);
    var promise = Sk.misceval.asyncToPromise(function() {
        return Sk.importMain(justname, false, true);
    });

    if (!nocatch)
    {
        promise = promise.then(null, function(e) {
            if (e instanceof Sk.builtin.SystemExit) {
                // SystemExit isn't a failing exception, so treat it specially
                got += e.toString() + "\n";
            }
            else if (e.name !== undefined)
            {
                // js exception, currently happens for del'd objects. shouldn't
                // really though.
                got = "EXCEPTION: " + e.name + "\n";
            }
            else
            {
                got = "EXCEPTION: " + Sk.builtins['str'](e).v + "\n";
            }
        });

        var origPromise = promise;
        promise = new Promise(function(resolve) {
            var compareResult = function(module) {
                if (expect !== got && (expectalt === undefined || expectalt !== got))
                {
                    print("FAILED: (" + name + ".py)\n-----");
                    print(input);
                    print("-----\nGOT:\n-----");
                    print(got);
                    print("-----\nWANTED:\n-----");
                    print(expect);
                    print("-----\nDIFF:\n-----")
                    print("len got: " + got.length + "\n")
                    print("len wanted: " + expect.length + "\n")
                    var longest = got.length > expect.length ? got : expect;
                    for (var i in longest) {
                        if (got[i] !== expect[i]){
                            try{
                                print("firstdiff at: " + i + " got: " + got[i].charCodeAt(0) + " (" + got.substr(i) + ") expect: " + expect[i].charCodeAt(0) + " (" + expect.substr(i) + ")");
                            } catch (err){
                                break;
                            }
                            break;
                        }
                    }
                    if (module && module.$js)
                    {
                        print("-----\nJS:\n-----");
                        var beaut = js_beautify(module.$js);
                        print(beaut);
                    }
                    runfail += 1;
                    //throw "dying on first run fail";
                }
                else
                {
                    runpass += 1;
                }
                resolve();
            };
            // Whatever happens, we resolve our promise successfully
            origPromise.then(compareResult, compareResult);
        });
    }
    return promise;
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
                if (ret && ret.tp$repr !== undefined)
                    got += ret.tp$repr().v + "\n";
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
var doTestToken = false
var doTestParse = false
var doTestTrans = false
var doTestSymtab = false
var doTestRun = true
var testInDebugMode = arguments.indexOf("--debug-mode") != -1;
function testsMain()
{
    var i, promise = Promise.resolve();

    if (doTestToken) {
        for (i = 0; i <= 100; i += 1)
        {
            testTokenize(sprintf("test/tokenize/t%02d", i));
        }
        print(sprintf("tokenize: %d/%d", tokenizepass, tokenizepass + tokenizefail));
    }
    if (doTestParse) {
        for (i = 0; i <= 10; i += 1)
        {
            testParse(sprintf("test/parse/t%02d", i));
        }
        print(sprintf("parse: %d/%d", parsepass, parsepass + parsefail));
    }
    if (doTestTrans) {
        for (i = 0; i <= 1000; ++i)
        {
            testTransform(sprintf("test/run/t%02d", i));
        }
        print(sprintf("transform: %d/%d (+%d disabled)", transformpass, transformpass + transformfail, transformdisabled));
    }
    if (doTestSymtab) {
        for (i = 0; i <= 1000; ++i)
        {
            testSymtab(sprintf("test/run/t%02d", i));
        }
        print(sprintf("symtab: %d/%d (+%d disabled)", symtabpass, symtabpass + symtabfail, symtabdisabled));
    }
    if (doTestRun) {
        for (i = 0; i <= 1000; ++i)
        {
            (function(i) {
                promise = promise.then(function(p) {
                    return testRun(sprintf("test/run/t%02d", i), undefined, testInDebugMode);
                });
            })(i);
        }
        for (i = 0; i < namedtfiles.length; i++ ) {
            (function(i) {
                promise = promise.then(function(p) {
                    return testRun(namedtfiles[i],undefined,testInDebugMode);
                });
            })(i);
        }
        promise = promise.then(function() {
            print(sprintf("run: %d/%d (+%d disabled)", runpass, runpass + runfail, rundisabled));
        }, function(e) {
            print("Internal error: "+e);
        });
    }
    if (Sk.inBrowser)
    {
        var origrunfail = runfail;
        runpass = runfail = rundisabled = 0;
        for (i = 0; i <= 20; ++i)
        {
            (function(i) {
                promise = promise.then(function() {
                    testRun(sprintf("test/closure/t%02d", i));
                });
            })(i);
        }
        promise = promise.then(function() {
            print(sprintf("closure: %d/%d", runpass, runpass + runfail));
            runfail += origrunfail; // for exit code

            // make a combobox of all tests so we can run just one
            var el = goog.dom.getElement('one-test');
            var cb = new goog.ui.ComboBox();
            cb.setUseDropdownArrow(true);
            cb.setDefaultText('Run one test...');
            for (var i = 0; i < AllRunTests.length; ++i)
            {
                cb.addItem(new goog.ui.ComboBoxItem(AllRunTests[i]));
            }
            cb.render(el);
            goog.events.listen(cb, 'change', function(e) {
                goog.dom.setTextContent(goog.dom.getElement('output'), "");
                print("running", e.target.getValue());
                testRun(e.target.getValue(), true);
            });
        });
    }
    else
    {
        print("closure: skipped");
    }
    //return;
    //    for (i = 0; i <= 100; ++i)
    //    {
    //        testInteractive(sprintf("test/interactive/t%02d", i));
    //    }
    //    print(sprintf("interactive: %d/%d (+%d disabled)", interactivepass, interactivepass + interactivefail, interactivedisabled));
    //print('exiting with: ' + tokenizefail + parsefail + transformfail + symtabfail + runfail + interactivefail);
    if (!Sk.inBrowser) {
        promise.then(function(x) {
            print("Quitting");

            var exitCode = tokenizefail + parsefail + transformfail + symtabfail + runfail + interactivefail;
            if (exitCode > 0) {
                quit(exitCode);
            }

            // Do not quit if success; may prevent other scripts from running after this one
        });
    }
}

if (!Sk.inBrowser)
{
    testsMain();
}
