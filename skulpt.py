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
from itertools import chain

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

TestFiles = [
        "{0}/sprintf.js".format(TEST_DIR),
        "{0}/test.js".format(TEST_DIR)
        ]



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

def time_suite(iter=1, fn="", p3=False):
    jsprofengine = jsengine.replace('--debugger', '--prof --log-internal-timer-events')

    if not os.path.exists("support/tmp"):
        os.mkdir("support/tmp")
    f = open("support/tmp/run.js", "w")

    if p3:
        p3on = 'Sk.python3'
    else:
        p3on = 'Sk.python2'

    # Profile single file
    if fn:
        if not os.path.exists(fn):
            print "%s doesn't exist" % fn
            raise SystemExit()

        modname = os.path.splitext(os.path.basename(fn))[0]

        f.write("""
const fs = require('fs');
require("../../src/main.js");

Sk.configure({syspath:["%s"], read:(fname)=>{return fs.readFileSync(fname, "utf8");}, output:(args)=>{process.stdout.write(args);}, __future__:%s, debugging:false});
Sk.misceval.asyncToPromise(function() {
    return Sk.importMain("%s", false, true);
}).then(function () {
    console.log("-----");
}, function(e) {
    console.log("UNCAUGHT EXCEPTION: " + e);
    console.log(e.stack);
});
    """ % (os.path.split(fn)[0], p3on, modname))

    # Profile test suite
    else:
        # Prepare unit tests
        if p3:
            testDir = 'test/unit3'
        else:
            testDir = 'test/unit'
        testFiles = [testDir + '/' + fn for fn in os.listdir(testDir) if '.py' in fn]

        f.write("""
const fs = require('fs');
require("../../src/main.js");
Sk.configure({syspath:["test/unit/"], read:(fname)=>{return fs.readFileSync(fname, "utf8");}, output:(args)=>{process.stdout.write(args);}, __future__:%s, debugging:false});
""" % p3on)

        for fn in testFiles:
            modname = os.path.splitext(os.path.basename(fn))[0]
            f.write("""
Sk.importMain("%s", false);
            """ % modname)

        fn = "test suite"

    f.close()

    print "Timing %s...\n" % fn

    times = []

    # Run profile
    for i in range(iter):
        if iter > 1:
            print "Iteration %d of %d..." % (i + 1, iter)
        startTime = time.time()
        p = Popen("{0} {1}".format(jsprofengine, os.path.join("support", "tmp", "run.js")),
                  shell=True, stdout=PIPE, stderr=PIPE)

        outs, errs = p.communicate()

        if p.returncode != 0:
            print "\n\nWARNING: Scripts returned with error code. Timing data may be inaccurate.\n\n"
            print errs

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

def profile(fn="", process=True, output="", p3=False):
    """
    Runs v8 profiler, which outputs tick information to v8.log Use
    https://v8.googlecode.com/svn/branches/bleeding_edge/tools/profviz/profviz.html
    to analyze log.
    """
    jsprofengine = jsengine + ' --prof --no-logfile-per-isolate --log-internal-timer-events'
    print jsprofengine

    if not os.path.exists("support/tmp"):
        os.mkdir("support/tmp")
    f = open("support/tmp/run.js", "w")

    if p3:
        p3on = 'Sk.python3'
    else:
        p3on = 'Sk.python2'

    # Profile single file
    if fn:
        if not os.path.exists(fn):
            print "%s doesn't exist" % fn
            raise SystemExit()

        modname = os.path.splitext(os.path.basename(fn))[0]

        f.write("""
const fs = require('fs');
require("../../src/main.js");

Sk.configure({syspath:["%s"], read:(fname)=>{return fs.readFileSync(fname, "utf8");}, output:(args)=>{process.stdout.write(args);}, __future__:%s, debugging:false});
Sk.misceval.asyncToPromise(function() {
    return Sk.importMain("%s", false, true);
}).then(function () {
    console.log("-----");
}, function(e) {
    console.log("UNCAUGHT EXCEPTION: " + e);
    console.log(e.stack);
});
    """ % (os.path.split(fn)[0], p3on, modname))

    # Profile test suite
    else:
        # Prepare unit tests
        if p3:
            testDir = "test/unit3"
        else:
            testDir = "test/unit"
        testFiles = [testDir + "/" + fn for fn in os.listdir(testDir) if '.py' in fn]

        f.write("""
const fs = require('fs');
require("../../src/main.js");
Sk.configure({syspath:["%s"], read:(fname)=>{return fs.readFileSync(fname, "utf8");}, output:(args)=>{process.stdout.write(args);}, __future__:%s, debugging:false});
""" % (testDir + '/', p3on))

        for fn in testFiles:
            modname = os.path.splitext(os.path.basename(fn))[0]
            f.write("""
Sk.importMain("%s", false);
""" % (modname))

            fn = "test suite"

    f.close()

    # Run profile
    print("Running profile on %s..." % fn)
    startTime = time.time()
    p = Popen("{0} {1}".format(jsprofengine, os.path.join("support", "tmp", "run.js")),
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
        # Currently does not actually save to output file
        if output:
            out_msg = " and saving in %s" % output
            output = " > " + output
        else:
            out_msg = ""

        print "Processing profile using node%s..." % out_msg
        os.system("{0} --prof-process v8.log".format(jsengine))

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
    # for f in getFileList(FILE_TYPE_TEST) + ["{0}/browser-stubs.js".format(TEST_DIR), "support/tmp/vfs.js" ] + TestFiles:
    #     scripts.append('<script type="text/javascript" src="%s"></script>' %
    #             os.path.join('../..', f))

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

    # for f in ["{0}/browser-detect.js".format(TEST_DIR)] + getFileList(FILE_TYPE_TEST) + TestFiles:
    #     print >>out, open(f).read()

    print >>out, """
});
"""
    out.close()
    print ". Built %s" % outfn


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

    brun             Run a Python file using Skulpt but in your browser
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
    browser          Run all tests in the browser
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
    parser.add_option("-d", "--disabletests", action="store_true", dest="disabletests", default=False)
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

    with open("src/internalpython.js", "w") as f:
        f.write(getInternalCodeAsJson() + ";")

    if cmd == "regentests":
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
    elif cmd == "profile":
        parse_profile_args(sys.argv)
    elif cmd == "time":
        parse_time_args(sys.argv)
    else:
        print usageString(os.path.basename(sys.argv[0]))
        sys.exit(2)

if __name__ == "__main__":
    main()
