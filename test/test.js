if ((typeof Sk !== 'undefined') && (Sk.inBrowser)) {
    goog.require('goog.dom');
    goog.require('goog.ui.ComboBox');
} else {
    var fs = require('fs');
    var sprintf = require('./sprintf.js');
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
            //console.log("DUMP:"+data);
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
    try { var input = fs.readFileSync(name + ".py", "utf8"); }
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

    var expect = fs.readFileSync(name + ".expect", "utf8");
    var got = '';
    try
    {
        got = dump_tokens(name + ".py", input);
    }
    catch (e)
    {
        got += Sk.misceval.objectRepr(e) + "\n";
    }
    if (expect !== got)
    {
        console.log("FAILED: (" + name + ".py)\n-----");
        console.log(input);
        console.log("-----\nGOT:\n-----");
        console.log(got);
        console.log("-----\nWANTED:\n-----");
        console.log(expect);
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
    try { var input = fs.readFileSync(name + ".py", "utf8"); }
    catch (e) { return; }

    var expect = fs.readFileSync(name + ".expect", "utf8");
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
        console.log("FAILED: (" + name + ".py)\n-----");
        console.log(input);
        console.log("-----\nGOT:\n-----");
        console.log(got);
        console.log("-----\nWANTED:\n-----");
        console.log(expect);
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
    try { var input = fs.readFileSync(name + ".py", "utf8"); }
    catch (e) { return; }

    var expect = 'NO_.TRANS_FILE';
    try { expect = fs.readFileSync(name + ".trans", "utf8"); }
    catch (e) {
	transformdisabled += 1;
	return;
    }
    var cst = Sk.parse(name + ".py", input);
    var got = Sk.astDump(Sk.astFromParse(cst)) + "\n";

    //console.log(got);
    //console.log(Sk.parseTreeDump(cst));

    if (expect !== got)
    {
        console.log("FAILED: (" + name + ".py)\n-----");
        console.log(input);
        console.log("-----\nGOT:\n-----");
        console.log(got);
        console.log("-----\nWANTED:\n-----");
        console.log(expect);
        //console.log("-----\nCST:\n-----");
        //console.log(Sk.parseTestDump(cst));
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
    try { var input = fs.readFileSync(name + ".py", "utf8"); }
    catch (e) { return; }
    //console.log(name);

    var expect = 'NO_.SYMTAB_FILE';
    try { expect = fs.readFileSync(name + ".py.symtab", "utf8"); }
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
        console.log("FAILED: (" + name + ".py)\n-----");
        console.log(input);
        console.log("-----\nGOT:\n-----");
        console.log(got);
        console.log("-----\nWANTED:\n-----");
        console.log(expect);
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
    try { var input = fs.readFileSync(process.cwd() + '/' + name + ".py", "utf8"); }
    catch (e) {
        try { fs.readFileSync(name + ".py.disabled", "utf8"); rundisabled += 1;}
        catch (e) {}
        return;
    }

    AllRunTests.unshift(name);

    var got = '';
    var justpath = name.substr(0, name.lastIndexOf('/'));
    Sk.configure({
        output: function(str) { got += str; },
        sysargv: [ name + '.py' ],
        read: (fname) => { return fs.readFileSync(fname, "utf8"); },
        debugging: debugMode,
        __future__: Sk.python2,
        syspath: [ justpath ]
    });

    var expect = fs.readFileSync(name + ".py.real", "utf8");
    var expectalt;
    try { expectalt = fs.readFileSync(name + ".py.real.alt", "utf8"); }
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
                got = "EXCEPTION: " + e.toString() + "\n";
            }
        });

        var origPromise = promise;
        promise = new Promise(function(resolve) {
            var compareResult = function(module) {
                if (expect !== got && (expectalt === undefined || expectalt !== got))
                {
                    console.log("FAILED: (" + name + ".py)\n-----");
                    console.log(input);
                    console.log("-----\nGOT:\n-----");
                    console.log(got);
                    console.log("-----\nWANTED:\n-----");
                    console.log(expect);
                    console.log("-----\nDIFF:\n-----")
                    console.log("len got: " + got.length + "\n")
                    console.log("len wanted: " + expect.length + "\n")
                    var longest = got.length > expect.length ? got : expect;
                    for (var i in longest) {
                        if (got[i] !== expect[i]){
                            try{
                                console.log("firstdiff at: " + i + " got: " + got[i].charCodeAt(0) + " (" + got.substr(i) + ") expect: " + expect[i].charCodeAt(0) + " (" + expect.substr(i) + ")");
                            } catch (err){
                                break;
                            }
                            break;
                        }
                    }
                    if (module && module.$js)
                    {
                        console.log("-----\nJS:\n-----");
                        // var beaut = Sk.js_beautify(module.$js);
                        // console.log(beaut);
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
    try { var input = fs.readFileSync(name + ".py", "utf8"); }
    catch (e) {
        try { fs.readFileSync(name + ".py.disabled", "utf8"); interactivedisabled += 1;}
        catch (e) {}
        return;
    }

    var expect = fs.readFileSync(name + ".py.real", "utf8");

    var got = '';
    sk$output = function(str) { got += str; }

    var lines = input.split("\n");
    var ic = new Skulpt.InteractiveContext();
    for (var i = 0; i < lines.length; ++i)
    {
        //console.log("LINE:"+lines[i]);
        js = ic.evalLine(lines[i] + "\n");
        //console.log("JS now:'"+js+"'");
        if (js !== false)
        {
            try {
                var ret = eval(js);
                if (ret && ret.$r !== undefined)
                    got += ret.$r().v + "\n";
            }
            catch (e) { got += "EXCEPTION: " + e.name + "\n" }
            //console.log("made new context");
            ic = new Skulpt.InteractiveContext();
        }
    }

    if (expect !== got)
    {
        console.log("FAILED: (" + name + ".py)\n-----");
        console.log(input);
        console.log("-----\nGOT:\n-----");
        console.log(got);
        console.log("-----\nWANTED:\n-----");
        console.log(expect);
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
var testInDebugMode = process.argv.indexOf("--debug-mode") != -1;
function testsMain()
{
    var i, promise = Promise.resolve();
    var starttime, endtime, elapsed;
    
    if (doTestToken) {
        for (i = 0; i <= 100; i += 1)
        {
            testTokenize(sprintf("test/tokenize/t%02d", i));
        }
        console.log(sprintf("tokenize: %d/%d", tokenizepass, tokenizepass + tokenizefail));
    }
    if (doTestParse) {
        for (i = 0; i <= 10; i += 1)
        {
            testParse(sprintf("test/parse/t%02d", i));
        }
        console.log(sprintf("parse: %d/%d", parsepass, parsepass + parsefail));
    }
    if (doTestTrans) {
        for (i = 0; i <= 1000; ++i)
        {
            testTransform(sprintf("test/run/t%02d", i));
        }
        console.log(sprintf("transform: %d/%d (+%d disabled)", transformpass, transformpass + transformfail, transformdisabled));
    }
    if (doTestSymtab) {
        for (i = 0; i <= 1000; ++i)
        {
            testSymtab(sprintf("test/run/t%02d", i));
        }
        console.log(sprintf("symtab: %d/%d (+%d disabled)", symtabpass, symtabpass + symtabfail, symtabdisabled));
    }
    if (doTestRun) {
	starttime = Date.now();
        for (i = 0; i <= 1000; ++i)
        {
            (function(i) {
                promise = promise.then(function(p) {
                    return testRun(sprintf("test/run/t%02d", i), undefined, testInDebugMode);
                });
            })(i);
        }
        promise = promise.then(function() {
	    endtime = Date.now();
            console.log(sprintf("run: %d/%d (+%d disabled)", runpass, runpass + runfail, rundisabled));
	    elapsed = (endtime - starttime) / 1000;
	    console.log("Total run time for all tests: " + elapsed.toString() + "s");
        }, function(e) {
            console.log("Internal error: "+e);
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
            console.log(sprintf("closure: %d/%d", runpass, runpass + runfail));
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
                console.log("running", e.target.getValue());
                testRun(e.target.getValue(), true);
            });
        });
    }
    else
    {
        console.log("closure library: skipped");
    }
    //return;
    //    for (i = 0; i <= 100; ++i)
    //    {
    //        testInteractive(sprintf("test/interactive/t%02d", i));
    //    }
    //    console.log(sprintf("interactive: %d/%d (+%d disabled)", interactivepass, interactivepass + interactivefail, interactivedisabled));
    //console.log('exiting with: ' + tokenizefail + parsefail + transformfail + symtabfail + runfail + interactivefail);
    if (!Sk.inBrowser) {
        promise.then(function(x) {
            console.log("Quitting");

            var exitCode = tokenizefail + parsefail + transformfail + symtabfail + runfail + interactivefail;
            if (exitCode > 0) {
                process.exit(exitCode);
            }

            // Do not quit if success; may prevent other scripts from running after this one
        });
    }
}

if (!Sk.inBrowser)
{
    testsMain();
}
