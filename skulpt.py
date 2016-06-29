#!/usr/bin/env python2.7

#
#   Note:  python2.6 is specified because that is what the skulpt parser
#          used as a reference.  This is only important when you are doing
#          things like regenerating tests and/or regenerating symtabs
#          If you do not have python 2.6 and you ARE NOT creating new tests
#          then all should be well for you to use 2.7 or whatever you have around

from optparse import OptionParser
from subprocess import Popen, PIPE
import subprocess
import os
import sys
import glob
import py_compile
import symtable
import shutil
import re
import pprint
import json
import shutil
import time

# Assume that the GitPython module is available until proven otherwise.
GIT_MODULE_AVAILABLE = True
try:
    from git import *
except:
    GIT_MODULE_AVAILABLE = False

def bowerFileName():
    file = open(".bowerrc")
    data = json.load(file)
    fileName = data["json"]
    file.close()
    return fileName

def bowerProperty(name):
    file = open(bowerFileName())
    data = json.load(file)
    value = data[name]
    file.close()
    return value

# Symbolic constants for the project structure.
DIST_DIR        = 'dist'
TEST_DIR        = 'test'
RUN_DIR         = 'support/tmp'

# Symbolic constants for the naming of distribution files.
STANDARD_NAMING = True
PRODUCT_NAME    = bowerProperty("name")
OUTFILE_REG     = "{0}.js".format(PRODUCT_NAME) if STANDARD_NAMING else "skulpt-uncomp.js"
OUTFILE_MIN     = "{0}.min.js".format(PRODUCT_NAME) if STANDARD_NAMING else "skulpt.js"
OUTFILE_LIB     = "{0}-stdlib.js".format(PRODUCT_NAME) if STANDARD_NAMING else "builtin.js"
OUTFILE_MAP     = "{0}-linemap.txt".format(PRODUCT_NAME) if STANDARD_NAMING else "linemap.txt"
OUTFILE_DEBUGGER = "debugger.js"

# Symbolic constants for file types.
FILE_TYPE_DIST = 'dist'
FILE_TYPE_TEST = 'test'

# Order is important!
Files = [
        'support/closure-library/closure/goog/base.js',
        'support/closure-library/closure/goog/deps.js',
        ('support/closure-library/closure/goog/string/string.js',   FILE_TYPE_DIST),
        ('support/closure-library/closure/goog/debug/error.js',     FILE_TYPE_DIST),
        ('support/closure-library/closure/goog/asserts/asserts.js', FILE_TYPE_DIST),
        ('support/es6-promise-polyfill/promise-1.0.0.hacked.js',    FILE_TYPE_DIST),
        'src/env.js',
        'src/type.js',
        'src/abstract.js',
        'src/object.js',
        'src/function.js',
        'src/builtin.js',
        'src/fromcodepoint.js',   # should become unnecessary, eventually
        'src/errors.js',
        'src/native.js',
        'src/method.js',
        'src/misceval.js',
        'src/seqtype.js',
        'src/list.js',
        'src/str.js',
        'src/formatting.js',
        'src/tuple.js',
        'src/dict.js',
        'src/numtype.js',
        'src/biginteger.js',
        'src/int.js',
        'src/bool.js',
        'src/float.js',
        'src/number.js',
        'src/long.js',
        'src/complex.js',
        'src/slice.js',
        'src/set.js',
        'src/print.js',
        'src/module.js',
        'src/structseq.js',
        'src/generator.js',
        'src/file.js',
        'src/ffi.js',
        'src/iterator.js',
        'src/enumerate.js',
        'src/tokenize.js',
        'gen/parse_tables.js',
        'src/parser.js',
        'gen/astnodes.js',
        'src/ast.js',
        'src/symtable.js',
        'src/compile.js',
        'src/import.js',
        'src/timsort.js',
        'src/sorted.js',
        'src/builtindict.js',
        'src/constants.js',
        ("support/jsbeautify/beautify.js", FILE_TYPE_TEST),
        ]

ExtLibs = [
        'support/time-helpers/strftime-min.js',
        'support/time-helpers/strptime.min.js'
]

TestFiles = [
        'support/closure-library/closure/goog/base.js',
        'support/closure-library/closure/goog/deps.js',
        'support/closure-library/closure/goog/math/math.js',
        'support/closure-library/closure/goog/math/coordinate.js',
        'support/closure-library/closure/goog/math/vec2.js',
        'support/closure-library/closure/goog/json/json.js',
        'support/jsbeautify/beautify.js',
        "{0}/namedtests.js".format(TEST_DIR),
        "{0}/sprintf.js".format(TEST_DIR),
        "{0}/json2.js".format(TEST_DIR),
        "{0}/test.js".format(TEST_DIR)
        ]

def buildNamedTestsFile():
    testFiles = ['test/run/'+f.replace(".py","") for f in os.listdir('test/run') if re.match(r"test_.*\.py$",f)]
    nt = open("{0}/namedtests.js".format(TEST_DIR),'w')
    nt.write("namedtfiles = [")
    for f in testFiles:
        nt.write("'%s',\n" % f)
    nt.write("];")
    nt.close()

def isClean():
    repo = Repo(".")
    return not repo.is_dirty()

def getTip():
    repo = Repo(".")
    return repo.head.commit.hexsha


def getFileList(type, include_ext_libs=True):
    ret = list(ExtLibs) if include_ext_libs else []
    for f in Files:
        if isinstance(f, tuple):
            if f[1] == type:
                ret.append(f[0])
        else:
            if "*" in f:
                for g in glob.glob(f):
                    ret.append(f)
            else:
                ret.append(f)
    return ret

def is64bit():
    return sys.maxsize > 2**32

if sys.platform == "win32":
    winbase = ".\\support\\d8\\x32"
    if not os.path.exists(winbase):
        winbase = ".\\support\\d8"
    os.environ["D8_PATH"] = winbase
    jsengine = winbase + "\\d8.exe --debugger --harmony"

    nul = "nul"
    crlfprog = os.path.join(os.path.split(sys.executable)[0], "Tools/Scripts/crlf.py")
elif sys.platform == "darwin":
    os.environ["D8_PATH"] = "./support/d8/mac"
    jsengine = "./support/d8/mac/d8 --debugger"
    nul = "/dev/null"
    crlfprog = None
elif sys.platform == "linux2":
    if is64bit():
        os.environ["D8_PATH"] = "support/d8/x64"
        jsengine = "support/d8/x64/d8 --debugger --harmony_promises"
    else:
        os.environ["D8_PATH"] = "support/d8/x32"
        jsengine = "support/d8/x32/d8 --debugger --harmony_promises"
    nul = "/dev/null"
    crlfprog = None
else:
    # You're on your own...
    os.environ["D8_PATH"] = "support/d8/x32"
    jsengine = "support/d8/x32/d8 --debugger --harmony_promises"
    nul = "/dev/null"
    crlfprog = None

if os.environ.get("CI",False):
    os.environ["D8_PATH"] = "support/d8/x64"
    jsengine = "support/d8/x64/d8 --harmony_promises"
    nul = "/dev/null"

#jsengine = "rhino"

def test(debug_mode=False):
    """runs the unit tests."""
    if debug_mode:
        debugon = "--debug-mode"
    else:
        debugon = ""
    buildNamedTestsFile()
    ret1 = os.system("{0} {1} {2} -- {3}".format(jsengine, ' '.join(getFileList(FILE_TYPE_TEST)), ' '.join(TestFiles), debugon))
    ret2 = 0
    ret3 = 0
    ret4 = 0
    if ret1 == 0:
        print "Running jshint"
        base_dirs = ["src", "debugger"]
        for base_dir in base_dirs:
            if sys.platform == "win32":
                jshintcmd = "{0} {1}".format("jshint", ' '.join(f for f in glob.glob(base_dir + "/*.js")))
                jscscmd = "{0} {1} --reporter=inline".format("jscs", ' '.join(f for f in glob.glob(base_dir + "/*.js")))
            else:
                jshintcmd = "jshint " + base_dir + "/*.js"
                jscscmd = "jscs " + base_dir + "/*.js --reporter=inline"
        ret2 = os.system(jshintcmd)
        print "Running JSCS"
        ret3 = os.system(jscscmd)
        #ret3 = os.system(jscscmd)
        print "Now running new unit tests"
        ret4 = rununits()
    return ret1 | ret2 | ret3 | ret4

def parse_time_args(argv):
    usageString = """

{program} time [filename.py] [iter=1]
    Computes the average runtime of a Python file (or test suite, if none specified)
    over iter number of trials.
    """.format(program=argv[0])

    fn = ""
    iter = 0

    if len(sys.argv) > 4:
        print usageString
        sys.exit(2)

    for arg in argv[2:]:
        if arg.isdigit():
            if iter:
                print usageString
                sys.exit(2)
            else:
                iter = int(arg)
                if iter <= 0:
                    print "Number of trials must be 1 or greater."
                    sys.exit(2)
        elif ".py" in arg:
            if fn:
                print usageString
                sys.exit(2)
            else:
                fn = arg
        else:
            print usageString
            sys.exit(2)

    iter = iter if iter else 1
    time_suite(iter=iter, fn=fn)

def time_suite(iter=1, fn=""):
    jsprofengine = jsengine.replace('--debugger', '--prof --log-internal-timer-events')

    if not os.path.exists("support/tmp"):
        os.mkdir("support/tmp")
    f = open("support/tmp/run.js", "w")

    additional_files = ""

    # Profile single file
    if fn:
        if not os.path.exists(fn):
            print "%s doesn't exist" % fn
            raise SystemExit()

        modname = os.path.splitext(os.path.basename(fn))[0]
        f.write("""
    var input = read('%s');
    print("-----");
    print(input);
    print("-----");
    Sk.configure({syspath:["%s"], read:read, python3:false, debugging:false});
    Sk.misceval.asyncToPromise(function() {
        return Sk.importMain("%s", true, true);
    }).then(function () {
        print("-----");
    }, function(e) {
        print("UNCAUGHT EXCEPTION: " + e);
        print(e.stack);
    });
        """ % (fn, os.path.split(fn)[0], modname))

    # Profile test suite
    else:
        # Prepare named tests
        buildNamedTestsFile()

        # Prepare unit tests
        testFiles = ['test/unit/'+fn for fn in os.listdir('test/unit') if '.py' in fn]
        if not os.path.exists("support/tmp"):
            os.mkdir("support/tmp")

        f.write("var input;\n")

        for fn in testFiles:
            modname = os.path.splitext(os.path.basename(fn))[0]
            p3on = 'false'
            f.write("""
    input = read('%s');
    print('%s');
    Sk.configure({syspath:["%s"], read:read, python3:%s});
    Sk.importMain("%s", false);
            """ % (fn, fn, os.path.split(fn)[0], p3on, modname))

        fn = "test suite"
        additional_files = ' '.join(TestFiles)

    f.close()

    print "Timing %s...\n" % fn

    times = []

    # Run profile
    for i in range(iter):
        if iter > 1:
            print "Iteration %d of %d..." % (i + 1, iter)
        startTime = time.time()
        p = Popen("{0} {1} {2} support/tmp/run.js".format(jsprofengine,
                  ' '.join(getFileList(FILE_TYPE_TEST)),
                  additional_files),
                  shell=True, stdout=PIPE, stderr=PIPE)

        outs, errs = p.communicate()

        if p.returncode != 0:
            print "\n\nWARNING: Scripts returned with error code. Timing data may be inaccurate.\n\n"

        endTime = time.time()
        times.append(endTime - startTime)

    avg = sum(times) / len(times)

    if iter > 1:
        print "\nAverage time over %s iterations: %s seconds" % (iter, avg)
    else:
        print "%s seconds" % avg

def parse_profile_args(argv):
    usageString = """

{program} profile [filename.py] [output]
    Runs profile on Python file (or test suite, if none specified)
    and outputs processed results to output file (or stdout if none specified)
    """.format(program=argv[0])

    fn = ""
    out = ""
    numArgs = len(sys.argv)

    if len(sys.argv) > 4:
        print usageString
        sys.exit(2)

    for arg in argv[2:]:
        if ".py" in arg:
            if fn:
                print usageString
                sys.exit(2)
            else:
                fn = arg
        else:
            if out:
                print usageString
                sys.exit(2)
            else:
                out = arg

    profile(fn=fn, output=out)

def profile(fn="", process=True, output=""):
    """
    Runs v8 profiler, which outputs tick information to v8.log Use
    https://v8.googlecode.com/svn/branches/bleeding_edge/tools/profviz/profviz.html
    to analyze log.
    """
    jsprofengine = jsengine.replace('--debugger', '--prof --log-internal-timer-events')

    if not os.path.exists("support/tmp"):
        os.mkdir("support/tmp")
    f = open("support/tmp/run.js", "w")

    additional_files = ""

    # Profile single file
    if fn:
        if not os.path.exists(fn):
            print "%s doesn't exist" % fn
            raise SystemExit()

        modname = os.path.splitext(os.path.basename(fn))[0]
        f.write("""
    var input = read('%s');
    print("-----");
    print(input);
    print("-----");
    Sk.configure({syspath:["%s"], read:read, python3:false, debugging:false});
    Sk.misceval.asyncToPromise(function() {
        return Sk.importMain("%s", true, true);
    }).then(function () {
        print("-----");
    }, function(e) {
        print("UNCAUGHT EXCEPTION: " + e);
        print(e.stack);
    });
        """ % (fn, os.path.split(fn)[0], modname))

    # Profile test suite
    else:
        # Prepare named tests
        buildNamedTestsFile()

        # Prepare unit tests
        testFiles = ['test/unit/'+fn for fn in os.listdir('test/unit') if '.py' in fn]
        if not os.path.exists("support/tmp"):
            os.mkdir("support/tmp")

        f.write("var input;\n")

        for fn in testFiles:
            modname = os.path.splitext(os.path.basename(fn))[0]
            p3on = 'false'
            f.write("""
    input = read('%s');
    print('%s');
    Sk.configure({syspath:["%s"], read:read, python3:%s});
    Sk.importMain("%s", false);
            """ % (fn, fn, os.path.split(fn)[0], p3on, modname))

            fn = "test suite"
            additional_files = ' '.join(TestFiles)

    f.close()

    # Run profile
    print("Running profile on %s..." % fn)
    startTime = time.time()
    p = Popen("{0} {1} {2} support/tmp/run.js".format(jsprofengine,
              ' '.join(getFileList(FILE_TYPE_TEST)),
              additional_files),
              shell=True, stdout=PIPE, stderr=PIPE)

    outs, errs = p.communicate()

    if p.returncode != 0:
        print "\n\nWARNING: Scripts returned with error code. Timing data may be inaccurate.\n\n"

    endTime = time.time()

    if errs:
        print errs

    print "\n\nRunning time: ", (endTime - startTime), " seconds\n\n"

    # Process and display results
    if process:
        if output:
            out_msg = " and saving in %s" % output
            output = " > " + output
        else:
            out_msg = ""

        print "Processing profile using d8 processor%s..." % out_msg
        if sys.platform == "win32":
            os.system(".\\support\\d8\\tools\\windows-tick-processor.bat v8.log {0}".format(output))
        elif sys.platform == "darwin":
            os.system("./support/d8/tools/mac-tick-processor {0}".format(output))
        elif sys.platform == "linux2":
            os.system("./support/d8/tools/linux-tick-processor v8.log {0}".format(output))
        else:
            print """d8 processor is unsupported on this platform.
    Try using https://v8.googlecode.com/svn/branches/bleeding_edge/tools/profviz/profviz.html."""

def debugbrowser():
    tmpl = """
<!DOCTYPE HTML>
<html>
    <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" >
        <title>Skulpt test</title>
        <link rel="stylesheet" href="../closure-library/closure/goog/demos/css/demo.css">
        <link rel="stylesheet" href="../closure-library/closure/goog/css/menu.css">
        <link rel="stylesheet" href="../closure-library/closure/goog/css/menuitem.css">
        <link rel="stylesheet" href="../closure-library/closure/goog/css/menuseparator.css">
        <link rel="stylesheet" href="../closure-library/closure/goog/css/combobox.css">
        <style>
            .type { font-size:14px; font-weight:bold; font-family:arial; background-color:#f7f7f7; text-align:center }
        </style>

%s
    </head>

    <body onload="testsMain()">
        <canvas id="__webglhelpercanvas" style="border: none;" width="500" height="500"></canvas>
        <table>
        <tr>
            <td>
                <div id="one-test" class="use-arrow"></div>
            </td>
        </tr>
        <tr>
            <td>
            <pre id="output"></pre>
            </td>
            <td>
            <span id="canv"></span>
            </td>
        </tr>
    </body>
</html>
"""
    if not os.path.exists("support/tmp"):
        os.mkdir("support/tmp")
    buildVFS()
    scripts = []
    for f in getFileList(FILE_TYPE_TEST) + ["{0}/browser-stubs.js".format(TEST_DIR), "support/tmp/vfs.js" ] + TestFiles:
        scripts.append('<script type="text/javascript" src="%s"></script>' %
                os.path.join('../..', f))

    with open("support/tmp/test.html", "w") as f:
        print >>f, tmpl % '\n'.join(scripts)

    if sys.platform == "win32":
        os.system("start support/tmp/test.html")
    elif sys.platform == "darwin":
        os.system("open support/tmp/test.html")
    else:
        os.system("gnome-open support/tmp/test.html")

def buildVFS():
    """ build a silly virtual file system to support 'read'"""
    print ". Slurping test data"
    with open("support/tmp/vfs.js", "w") as out:
        print >>out, "VFSData = {"
        all = []
        for root in (TEST_DIR, "src/builtin", "src/lib"):
            for dirpath, dirnames, filenames in os.walk(root):
                for filename in filenames:
                    f = os.path.join(dirpath, filename)
                    if ".svn" in f: continue
                    if ".swp" in f: continue
                    if ".pyc" in f: continue
                    data = open(f, "rb").read()
                    data = data.replace("\r\n", "\n")
                    all.append("'%s': '%s'" % (f.replace("\\", "/"), data.encode("hex")))
        print >>out, ",\n".join(all)
        print >>out, "};"
        print >>out, """

function readFromVFS(fn)
{
    var hexToStr = function(str)
    {
        var ret = "";
        for (var i = 0; i < str.length; i += 2)
            ret += unescape("%" + str.substr(i, 2));
        return ret;
    }
    if (VFSData[fn] === undefined) throw "file not found: " + fn;
    return hexToStr(VFSData[fn]);
}
"""

def buildBrowserTests():
    """combine all the tests data into something we can run from a browser
    page (so that it can be tested in the various crappy engines)

    we want to use the same code that the command line version of the tests
    uses so we stub the d8 functions to push to the browser."""

    outfn = "doc/static/browser-test.js"
    out = open(outfn, "w")

    print >>out, """
window.addevent('onload', function(){
"""

    # stub the d8 functions we use
    print >>out, """
function read(fn)
{
    var hexToStr = function(str)
    {
        var ret = "";
        for (var i = 0; i < str.length; i += 2)
            ret += unescape("%%" + str.substr(i, 2));
        return ret;
    }
    if (VFSData[fn] === undefined) throw "file not found: " + fn;
    return hexToStr(VFSData[fn]);
}
var SkulptTestRunOutput = '';
function print()
{
    var out = document.getElementById("output");
    for (var i = 0; i < arguments.length; ++i)
    {
        out.innerHTML += arguments[i];
        SkulptTestRunOutput += arguments[i];
        out.innerHTML += " ";
        SkulptTestRunOutput += " ";
    }
    out.innerHTML += "<br/>"
    SkulptTestRunOutput += "\\n";
}

function quit(rc)
{
    var out = document.getElementById("output");
    if (rc === 0)
    {
        out.innerHTML += "<font color='green'>OK</font>";
    }
    else
    {
        out.innerHTML += "<font color='red'>FAILED</font>";
    }
    out.innerHTML += "<br/>Saving results...";
    var sendData = JSON.encode({
        browsername: BrowserDetect.browser,
        browserversion: BrowserDetect.version,
        browseros: BrowserDetect.OS,
        version: '%s',
        rc: rc,
        results: SkulptTestRunOutput
    });
    var results = new Request.JSON({
        url: '/testresults',
        method: 'post',
        onSuccess: function() { out.innerHTML += "<br/>Results saved."; },
        onFailure: function() { out.innerHTML += "<br/>Couldn't save results."; }
    });
    results.send(sendData);
}
""" % getTip()

    for f in ["{0}/browser-detect.js".format(TEST_DIR)] + getFileList(FILE_TYPE_TEST) + TestFiles:
        print >>out, open(f).read()

    print >>out, """
});
"""
    out.close()
    print ". Built %s" % outfn


def getBuiltinsAsJson(options):
    ret = {}
    ret['files'] = {}
    for root in ["src/builtin", "src/lib"]:
        for dirpath, dirnames, filenames in os.walk(root):
            for filename in filenames:
                f = os.path.join(dirpath, filename)
                ext = os.path.splitext(f)[1]
                if ext == ".py" or ext == ".js":
                    if options.verbose:
                        print "reading", f
                    f = f.replace("\\", "/")
                    ret['files'][f] = open(f).read()
    return "Sk.builtinFiles=" + json.dumps(ret)

def dist(options):
    """builds a 'shippable' version of Skulpt.

    this is all combined into one file, tests run, jslint'd, compressed.
    """
    if GIT_MODULE_AVAILABLE:
        if not isClean():
            print "WARNING: working directory not clean (according to 'git status')"
        else:
            print "Working directory is clean (according to 'git status')"
    else:
        print "+----------------------------------------------------------------------------+"
        print "GitPython is not installed for Python 2.6"
        print "The 'dist' command will not work without it.  Get it using pip or easy_install"
        print "or see:  http://packages.python.org/GitPython/0.3.1/intro.html#getting-started"
        print "+----------------------------------------------------------------------------+"

    if options.verbose:
        print ". Removing distribution directory, '{0}/'.".format(DIST_DIR)

    shutil.rmtree(DIST_DIR, ignore_errors=True)
    if not os.path.exists(DIST_DIR): os.mkdir(DIST_DIR)

    if options.uncompressed:
        make_skulpt_js(options,DIST_DIR)

    # Make the compressed distribution.
    compfn = os.path.join(DIST_DIR, OUTFILE_MIN)
    builtinfn = os.path.join(DIST_DIR, OUTFILE_LIB)
    debuggerfn = os.path.join(DIST_DIR, OUTFILE_DEBUGGER)

    # Run tests on uncompressed.
    if options.verbose:
        print ". Running tests on uncompressed..."

    ret = test()

    if ret != 0:
        print "Tests failed on uncompressed version."
        sys.exit(1);

    # compress
    uncompfiles = ' '.join(['--js ' + x for x in getFileList(FILE_TYPE_DIST, include_ext_libs=False)])

    if options.verbose:
        print ". Compressing..."

    ret = os.system("java -jar support/closure-compiler/compiler.jar --define goog.DEBUG=false --output_wrapper \"(function(){%%output%%}());\" --compilation_level SIMPLE_OPTIMIZATIONS --jscomp_error accessControls --jscomp_error checkRegExp --jscomp_error checkTypes --jscomp_error checkVars --jscomp_error deprecated --jscomp_off fileoverviewTags --jscomp_error invalidCasts --jscomp_error missingProperties --jscomp_error nonStandardJsDocs --jscomp_error strictModuleDepCheck --jscomp_error undefinedVars --jscomp_error unknownDefines --jscomp_error visibility %s --externs support/es6-promise-polyfill/externs.js --js_output_file tmp.js" % (uncompfiles))
    # to disable asserts
    # --define goog.DEBUG=false
    #
    # to make a file that for ff plugin, not sure of format
    # --create_source_map <distribution-dir>/srcmap.txt
    #
    # --jscomp_error accessControls --jscomp_error checkRegExp --jscomp_error checkTypes --jscomp_error checkVars --jscomp_error deprecated --jscomp_error fileoverviewTags --jscomp_error invalidCasts --jscomp_error missingProperties --jscomp_error nonStandardJsDocs --jscomp_error strictModuleDepCheck --jscomp_error undefinedVars --jscomp_error unknownDefines --jscomp_error visibility
    #
    if ret != 0:
        print "closure-compiler failed."
        sys.exit(1)

    # Copy the debugger file to the output dir


    if options.verbose:
        print ". Bundling external libraries..."

    bundle = ""
    for fn in ExtLibs + ["tmp.js"]:
        with open(fn, "r") as f:
            bundle += f.read()

    with open(compfn, "w") as f:
        f.write(bundle)

    print ". Wrote bundled file"


    # Run tests on compressed.
    if options.verbose:
        print ". Running tests on compressed..."
    buildNamedTestsFile()
    ret = os.system("{0} {1} {2}".format(jsengine, compfn, ' '.join(TestFiles)))
    if ret != 0:
        print "Tests failed on compressed version."
        sys.exit(1)
    ret = rununits(opt=True)
    if ret != 0:
        print "Tests failed on compressed unit tests"
        sys.exit(1)

    doc()

    try:
        shutil.copy(compfn, os.path.join(DIST_DIR, "tmp.js"))
        shutil.copy("debugger/debugger.js", DIST_DIR)
    except Exception as e:
        print "Couldn't copy debugger to output folder: %s" % e.message
        sys.exit(1)

    path_list = os.environ.get('PATH','').split(':')
    has_gzip = False
    for p in path_list:
        has_gzip = os.access(os.path.join(p,"gzip"), os.X_OK)
        if has_gzip:
            break

    if has_gzip:
        ret = os.system("gzip -9 {0}/tmp.js".format(DIST_DIR))
        if ret != 0:
            print "Couldn't gzip to get final size."
            has_gzip = False
            os.unlink("{0}/tmp.js".format(DIST_DIR))

        size = os.path.getsize("{0}/tmp.js.gz".format(DIST_DIR))
        os.unlink("{0}/tmp.js.gz".format(DIST_DIR))
    else:
        os.unlink("{0}/tmp.js".format(DIST_DIR))
        print "No gzip executable, can't get final size"

    with open(builtinfn, "w") as f:
        f.write(getBuiltinsAsJson(options))
        if options.verbose:
            print ". Wrote {0}".format(builtinfn)

    # Update documentation folder copies of the distribution.
    try:
        shutil.copy(compfn,    os.path.join("doc", "static", OUTFILE_MIN))
        shutil.copy(builtinfn, os.path.join("doc", "static", OUTFILE_LIB))
        shutil.copy(debuggerfn, os.path.join("doc", "static", "debugger", OUTFILE_DEBUGGER))
    except:
        print "Couldn't copy to docs dir."
        sys.exit(1)
    if options.verbose:
        print ". Updated doc dir"

    # All good!
    if options.verbose:
        print ". Wrote {0}.".format(compfn)
        if has_gzip:
            print ". gzip of compressed: %d bytes" % size


def make_skulpt_js(options,dest):
    if options.verbose:
        print ". Writing combined version..."
    combined = ''
    linemap = open(os.path.join(dest, OUTFILE_MAP), "w")
    curline = 1
    for file in getFileList(FILE_TYPE_DIST):
        curfiledata = open(file).read()
        combined += curfiledata
        print >> linemap, "%d:%s" % (curline, file)
        curline += len(curfiledata.split("\n")) - 1
    linemap.close()
    uncompfn = os.path.join(dest, OUTFILE_REG)
    open(uncompfn, "w").write(combined)
    # Prevent accidental editing of the uncompressed distribution file.
    if sys.platform != "win32":
        os.chmod(os.path.join(dest, OUTFILE_REG), 0o444)

def run_in_browser(fn, options):
    shutil.rmtree(RUN_DIR, ignore_errors=True)
    if not os.path.exists(RUN_DIR): os.mkdir(RUN_DIR)
    docbi(options,RUN_DIR)
    scripts = []
    for f in getFileList(FILE_TYPE_TEST):
        scripts.append('<script type="text/javascript" src="%s"></script>' %
                os.path.join('../..', f))
    scripts = "\n".join(scripts)

    with open (fn,'r') as runfile:
        prog = runfile.read()

    with open('support/run_template.html') as tpfile:
        page = tpfile.read()
        page = page % dict(code=prog,scripts=scripts)

    with open("{0}/run.html".format(RUN_DIR),"w") as htmlfile:
        htmlfile.write(page)

    if sys.platform == "darwin":
        os.system("open {0}/run.html".format(RUN_DIR))
    elif sys.platform == "linux2":
        os.system("xdg-open {0}/run.html".format(RUN_DIR))
    elif sys.platform == "win32":
        os.system("start {0}/run.html".format(RUN_DIR))
    else:
        print("open or refresh {0}/run.html in your browser to test/debug".format(RUN_DIR))

def regenparser():
    """regenerate the parser/ast source code"""
    if not os.path.exists("gen"): os.mkdir("gen")
    os.chdir("src/pgen/parser")
    os.system("python main.py ../../../gen/parse_tables.js")
    os.chdir("../ast")
    os.system("python asdl_js.py Python.asdl ../../../gen/astnodes.js")
    os.chdir("../../..")
    # sanity check that they at least parse
    #os.system(jsengine + " support/closure-library/closure/goog/base.js src/env.js src/tokenize.js gen/parse_tables.js gen/astnodes.js")

def regenasttests(togen="{0}/run/*.py".format(TEST_DIR)):
    """regenerate the ast test files by running our helper script via real python"""
    for f in glob.glob(togen):
        transname = f.replace(".py", ".trans")
        os.system("python {0}/astppdump.py {1} > {2}".format(TEST_DIR, f, transname))
        forcename = f.replace(".py", ".trans.force")
        if os.path.exists(forcename):
            shutil.copy(forcename, transname)
        if crlfprog:
            os.system("python {0} {1}".format(crlfprog, transname))


def regenruntests(togen="{0}/run/*.py".format(TEST_DIR)):
    """regenerate the test data by running the tests on real python"""
    for f in glob.glob(togen):
        os.system("python {0} > {1}.real 2>&1".format(f, f))
        forcename = f + ".real.force"
        if os.path.exists(forcename):
            shutil.copy(forcename, "%s.real" % f)
        if crlfprog:
            os.system("python %s %s.real" % (crlfprog, f))
    for f in glob.glob("{0}/interactive/*.py".format(TEST_DIR)):
        p = Popen("python -i > %s.real 2>%s" % (f, nul), shell=True, stdin=PIPE)
        p.communicate(open(f).read() + "\004")
        forcename = f + ".real.force"
        if os.path.exists(forcename):
            shutil.copy(forcename, "%s.real" % f)
        if crlfprog:
            os.system("python %s %s.real" % (crlfprog, f))

def doc():
    print "Building Documentation in docs/ProgMan"
    ret = os.system("jsdoc -c jsdoc.json HACKING.md")
    if ret != 0:
        print "Build of docs failed.  Is jsdoc installed?"


def symtabdump(fn):
    if not os.path.exists(fn):
        print "%s doesn't exist" % fn
        raise SystemExit()
    text = open(fn).read()
    mod = symtable.symtable(text, os.path.split(fn)[1], "exec")
    def getidents(obj, indent=""):
        ret = ""
        ret += """%sSym_type: %s
%sSym_name: %s
%sSym_lineno: %s
%sSym_nested: %s
%sSym_haschildren: %s
""" % (
        indent, obj.get_type(),
        indent, obj.get_name(),
        indent, obj.get_lineno(),
        indent, obj.is_nested(),
        indent, obj.has_children())
        if obj.get_type() == "function":
            ret += "%sFunc_params: %s\n%sFunc_locals: %s\n%sFunc_globals: %s\n%sFunc_frees: %s\n" % (
                    indent, sorted(obj.get_parameters()),
                    indent, sorted(obj.get_locals()),
                    indent, sorted(obj.get_globals()),
                    indent, sorted(obj.get_frees()))
        elif obj.get_type() == "class":
            ret += "%sClass_methods: %s\n" % (
                    indent, sorted(obj.get_methods()))
        ret += "%s-- Identifiers --\n" % indent
        for ident in sorted(obj.get_identifiers()):
            info = obj.lookup(ident)
            ret += "%sname: %s\n  %sis_referenced: %s\n  %sis_imported: %s\n  %sis_parameter: %s\n  %sis_global: %s\n  %sis_declared_global: %s\n  %sis_local: %s\n  %sis_free: %s\n  %sis_assigned: %s\n  %sis_namespace: %s\n  %snamespaces: [\n%s  %s]\n" % (
                    indent, info.get_name(),
                    indent, info.is_referenced(),
                    indent, info.is_imported(),
                    indent, info.is_parameter(),
                    indent, info.is_global(),
                    indent, info.is_declared_global(),
                    indent, info.is_local(),
                    indent, info.is_free(),
                    indent, info.is_assigned(),
                    indent, info.is_namespace(),
                    indent, '\n'.join([getidents(x, indent + "    ") for x in info.get_namespaces()]),
                    indent
                    )
        return ret
    return getidents(mod)

def regensymtabtests(togen="{0}/run/*.py".format(TEST_DIR)):
    """regenerate the test data by running the symtab dump via real python"""
    for fn in glob.glob(togen):
        outfn = "%s.symtab" % fn
        f = open(outfn, "wb")
        f.write(symtabdump(fn))
        f.close()

def upload():
    """uploads doc to GAE (stub app for static hosting, mostly)"""
    ret = os.system("python2.6 ~/Desktop/3rdparty/google_appengine/appcfg.py update doc")
    if ret != 0:
        print "Couldn't upload."
        raise SystemExit()

def doctest():
    ret = os.system("python2.6 ~/Desktop/3rdparty/google_appengine/dev_appserver.py -p 20710 doc")

def docbi(options,dest="doc/static"):
    builtinfn = "{0}/{1}".format(dest,OUTFILE_LIB)
    with open(builtinfn, "w") as f:
        f.write(getBuiltinsAsJson(options))
        if options.verbose:
            print ". Wrote {fileName}".format(fileName=builtinfn)

def run(fn, shell="", opt=False, p3=False, debug_mode=False, dumpJS='true'):
    if not os.path.exists(fn):
        print "%s doesn't exist" % fn
        raise SystemExit()
    if not os.path.exists("support/tmp"):
        os.mkdir("support/tmp")
    f = open("support/tmp/run.js", "w")
    modname = os.path.splitext(os.path.basename(fn))[0]
    if p3:
        p3on = 'true'
    else:
        p3on = 'false'
    if debug_mode:
        debugon = 'true'
    else:
        debugon = 'false'
    f.write("""
var input = read('%s');
print("-----");
print(input);
print("-----");
Sk.configure({syspath:["%s"], read:read, python3:%s, debugging:%s});
Sk.misceval.asyncToPromise(function() {
    return Sk.importMain("%s", %s, true);
}).then(function () {
    print("-----");
}, function(e) {
    print("UNCAUGHT EXCEPTION: " + e);
    print(e.stack);
});
    """ % (fn, os.path.split(fn)[0], p3on, debugon, modname, dumpJS))
    f.close()
    if opt:
        os.system("{0} {1}/{2} support/tmp/run.js".format(jsengine, DIST_DIR, OUTFILE_MIN))
    else:
        os.system("{0} {1} {2} support/tmp/run.js".format(jsengine, shell, ' '.join(getFileList(FILE_TYPE_TEST))))

def runopt(fn):
    run(fn, "", True)

def run3(fn):
    run(fn,p3=True)

def rundebug(fn):
    run(fn,debug_mode=True)

def shell(fn):
    run(fn, "--shell")


def rununits(opt=False, p3=False):
    testFiles = ['test/unit/'+f for f in os.listdir('test/unit') if '.py' in f]
    jstestengine = jsengine.replace('--debugger', '')
    passTot = 0
    failTot = 0
    for fn in testFiles:
        if not os.path.exists("support/tmp"):
            os.mkdir("support/tmp")
        f = open("support/tmp/run.js", "w")
        modname = os.path.splitext(os.path.basename(fn))[0]
        if p3:
            p3on = 'true'
        else:
            p3on = 'false'
        f.write("""
var input = read('%s');
print('%s');
Sk.configure({syspath:["%s"], read:read, python3:%s});
Sk.misceval.asyncToPromise(function() {
    return Sk.importMain("%s", false, true);
}).then(function () {}, function(e) {
    print("UNCAUGHT EXCEPTION: " + e);
    print(e.stack);
    quit(1);
});
        """ % (fn, fn, os.path.split(fn)[0], p3on, modname))
        f.close()
        if opt:
            p = Popen("{0} {1}/{2} support/tmp/run.js".format(jstestengine, DIST_DIR,
                                                           OUTFILE_MIN),shell=True,
                      stdout=PIPE, stderr=PIPE)
        else:
            p = Popen("{0} {1} support/tmp/run.js".format(jstestengine,  ' '.join(
                getFileList(FILE_TYPE_TEST))), shell=True, stdout=PIPE, stderr=PIPE)

        outs, errs = p.communicate()

        if p.returncode != 0:
            failTot += 1
            print "{} exited with error code {}".format(fn,p.returncode)

        print outs
        if errs:
            print errs
        outlines = outs.split('\n')
        for ol in outlines:
            g = re.match(r'Ran.*passed:\s+(\d+)\s+failed:\s+(\d+)',ol)
            if g:
                passTot += int(g.group(1))
                failTot += int(g.group(2))

    print "Summary"
    print "Passed: %5d Failed %5d" % (passTot, failTot)

    if failTot != 0:
        return -1
    else:
        return 0


def repl():
    os.system("{0} {1} repl/repl.js".format(jsengine, ' '.join(getFileList(FILE_TYPE_TEST))))

def nrt(newTest):
    """open a new run test"""
    fn = "{0}/run/test_{1}.py".format(TEST_DIR,newTest)
    disfn = fn + ".disabled"
    if not os.path.exists(fn) and not os.path.exists(disfn):
        if 'EDITOR' in os.environ:
            editor = os.environ['EDITOR']
        else:
            editor = 'vim'
        os.system(editor + ' ' + fn)
        if os.path.exists(fn):
            print "Generating tests for %s" % fn
            regensymtabtests(fn)
            regenasttests(fn)
            regenruntests(fn)
        else:
            print "Test test_%s.py already exists." % newTest
            print "run ./m regentests test_%s.py" % newTest

def vmwareregr(names):
    """todo; not working yet.

    run unit tests via vmware on a bunch of browsers"""

    xp = "/data/VMs/xpsp3/xpsp3.vmx"
    ubu = "/data/VMs/ubu910/ubu910.vmx"
    # apparently osx isn't very vmware-able. stupid.

    class Browser:
        def __init__(self, name, vmx, guestloc):
            self.name = name
            self.vmx = vmx
            self.guestloc = guestloc

    browsers = [
            Browser("ie7-win", xp, "C:\\Program Files\\Internet Explorer\\iexplore.exe"),
            Browser("ie8-win", xp, "C:\\Program Files\\Internet Explorer\\iexplore.exe"),
            Browser("chrome3-win", xp, "C:\\Documents and Settings\\Administrator\\Local Settings\\Application Data\\Google\\Chrome\\Application\\chrome.exe"),
            Browser("chrome4-win", xp, "C:\\Documents and Settings\\Administrator\\Local Settings\\Application Data\\Google\\Chrome\\Application\\chrome.exe"),
            Browser("ff3-win", xp, "C:\\Program Files\\Mozilla Firefox\\firefox.exe"),
            Browser("ff35-win", xp, "C:\\Program Files\\Mozilla Firefox\\firefox.exe"),
            #Browser("safari3-win", xp,
            #Browser("safari4-win", xp,
            #"ff3-osx": osx,
            #"ff35-osx": osx,
            #"safari3-osx": osx,
            #"safari4-osx": osx,
            #"ff3-ubu": ubu,
            #"chromed-ubu": ubu,
            ]

def regengooglocs():
    """scans the closure library and builds an import-everything file to be
    used during dev. """

    # from calcdeps.py
    prov_regex = re.compile('goog\.provide\s*\(\s*[\'\"]([^\)]+)[\'\"]\s*\)')

    # walk whole tree, find all the 'provide's in a file, and note the location
    root = "support/closure-library/closure"
    modToFile = {}
    for dirpath, dirnames, filenames in os.walk(root):
        for filename in filenames:
            f = os.path.join(dirpath, filename)
            if ".svn" in f: continue
            if os.path.splitext(f)[1] == ".js":
                contents = open(f).read()
                for prov in prov_regex.findall(contents):
                    modToFile[prov] = f.lstrip(root)

    with open("gen/debug_import_all_closure.js", "w") as glf:
        keys = modToFile.keys()
        keys.sort()
        for m in keys:
            if "demos." in m: continue
            if not m.startswith("goog."): continue
            print >>glf, "goog.require('%s');" % m

import SimpleHTTPServer
import urlparse
class HttpHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    """allow grabbing any file for testing, and support /import
    which grabs all builtin and lib modules in a json request.

    see notes on import for why we can't just grab one at a time.

    on real hosting, we'll just prebuild/gzip the stdlib into somewhere on
    upload. this is more convenient during dev on localhost though.

    """
    def do_GET(self):
        prefix = "/import"
        if self.path == prefix:
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(getBuiltinsAsJson(None))
        else:
            SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

def host(PORT = 20710):
    """simple http host from root of dir for testing"""
    import SocketServer
    httpd = SocketServer.TCPServer(("", PORT), HttpHandler)
    print "serving at port", PORT
    httpd.serve_forever()

def usageString(program):
    return '''

    {program} <command> [<options>] [script.py]

Commands:

    run              Run a Python file using Skulpt
    brun             Run a Python file using Skulpt but in your browser
    test             Run all test cases
    rununits         Run only the new-style unit tests
    dist             Build core and library distribution files
    docbi            Build library distribution file only and copy to doc/static
    profile [fn] [out] Profile Skulpt using d8 and show processed results
    time [iter]      Average runtime of the test suite over [iter] iterations.

    regenparser      Regenerate parser tests
    regenasttests    Regen abstract symbol table tests
    regenruntests    Regenerate runtime unit tests
    regensymtabtests Regenerate symbol table tests
    regentests       Regenerate all of the above

    help             Display help information about Skulpt
    host [PORT]      Start a simple HTTP server for testing. Default port: 20710
    upload           Run appcfg.py to upload doc to live GAE site
    doctest          Run the GAE development server for doc testing
    nrt              Generate a file for a new test case
    runopt           Run a Python file optimized
    browser          Run all tests in the browser
    shell            Run a Python program but keep a shell open (like python -i)
    vfs              Build a virtual file system to support Skulpt read tests

    debugbrowser     Debug in the browser -- open your javascript console

Options:

    -q, --quiet        Only output important information
    -s, --silent       Do not output anything, besides errors
    -u, --uncompressed Makes uncompressed core distribution file for debugging
    -v, --verbose      Make output more verbose [default]
    --version          Returns the version string in Bower configuration file.
'''.format(program=program)

def main():
    parser = OptionParser(usageString("%prog"), version="%prog {0}".format(bowerProperty("version")))
    parser.add_option("-q", "--quiet",        action="store_false", dest="verbose")
    parser.add_option("-s", "--silent",       action="store_true",  dest="silent",       default=False)
    parser.add_option("-u", "--uncompressed", action="store_true",  dest="uncompressed", default=False)
    parser.add_option("-v", "--verbose",
        action="store_true",
        dest="verbose",
        default=False,
        help="Make output more verbose [default]")
    (options, args) = parser.parse_args()

    # This is rather aggressive. Do we really want it?
    if options.verbose:
        if sys.platform == 'win32':
            os.system("cls")
        else:
            os.system("clear")

    if len(sys.argv) < 2:
        cmd = "help"
    else:
        cmd = sys.argv[1]

    if cmd == "test":
        test()
    elif cmd == "testdebug":
        test(True)
    elif cmd == "dist":
        dist(options)
    elif cmd == "regengooglocs":
        regengooglocs()
    elif cmd == "regentests":
        if len(sys.argv) > 2:
            togen = "{0}/run/".format(TEST_DIR) + sys.argv[2]
        else:
            togen = "{0}/run/*.py".format(TEST_DIR)
        print "generating tests for ", togen
        regensymtabtests(togen)
        regenasttests(togen)
        regenruntests(togen)
    elif cmd == "regensymtabtests":
        regensymtabtests()
    elif cmd == "run":
        run(sys.argv[2])
    elif cmd == "brun":
        run_in_browser(sys.argv[2],options)
    elif cmd == 'rununits':
        rununits()
    elif cmd == "runopt":
        runopt(sys.argv[2])
    elif cmd == "run3":
        run3(sys.argv[2])
    elif cmd == "rundebug":
        rundebug(sys.argv[2])
    elif cmd == "vmwareregr":
        vmwareregr()
    elif cmd == "regenparser":
        regenparser()
    elif cmd == "regenasttests":
        regenasttests()
    elif cmd == "regenruntests":
        regenruntests()
    elif cmd == "upload":
        upload()
    elif cmd == "doctest":
        doctest()
    elif cmd == "docbi":
        docbi(options)
    elif cmd == "doc":
        doc()
    elif cmd == "nrt":
        print "Warning: nrt is deprectated."
        print "It is preferred that you enhance one of the unit tests in test/unit"
        print "Or, create a new unit test file in test/unit using the template in test/unit_tmpl.py"
        if len(sys.argv) < 3:
            print "Need a name for the new test"
            print usageString(os.path.basename(sys.argv[0]))
            sys.exit(2)
        nrt(sys.argv[2])
    elif cmd == "browser":
        buildBrowserTests()
    elif cmd == "debugbrowser":
        debugbrowser()
    elif cmd == "vfs":
        buildVFS()
    elif cmd == "host":
        if len(sys.argv) < 3:
            host()
        else:
            try:
                host(int(sys.argv[2]))
            except ValueError:
                print "Port must be an integer"
                sys.exit(2)
    elif cmd == "shell":
        shell(sys.argv[2]);
    elif cmd == "repl":
        repl()
    elif cmd == "profile":
        parse_profile_args(sys.argv)
    elif cmd == "time":
        parse_time_args(sys.argv)
    else:
        print usageString(os.path.basename(sys.argv[0]))
        sys.exit(2)

if __name__ == "__main__":
    main()
