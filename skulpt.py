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

def debugbrowser():
    tmpl = """
<!DOCTYPE HTML>
<html>
    <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" >
        <title>Skulpt test</title>
        <style>
            .type { font-size:14px; font-weight:bold; font-family:arial; background-color:#f7f7f7; text-align:center }
        </style>
        <script src="../../dist/skulpt.js" type="text/javascript"></script>
        <script src="../../dist/skulpt-stdlib.js" type="text/javascript"></script>
        <script src="vfs.js" type="text/javascript"></script>
        <script src="../../test/test.js" type="text/javascript"></script>
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

    with open("support/tmp/test.html", "w") as f:
        print >>f, tmpl

    if sys.platform == "win32":
        os.system("start support/tmp/test.html")
    elif sys.platform == "darwin":
        os.system("open support/tmp/test.html")
    else:
        os.system("xdg-open support/tmp/test.html")

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

    regenasttests    Regen abstract symbol table tests
    regenruntests    Regenerate runtime unit tests
    regensymtabtests Regenerate symbol table tests
    regentests       Regenerate all of the above

    help             Display help information about Skulpt
    host [PORT]      Start a simple HTTP server for testing. Default port: 20710
    upload           Run appcfg.py to upload doc to live GAE site
    doctest          Run the GAE development server for doc testing
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

    print "cmd:", cmd
        
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
    elif cmd == "regenasttests":
        regenasttests()
    elif cmd == "regenruntests":
        regenruntests()
    elif cmd == "upload":
        upload()
    elif cmd == "doctest":
        doctest()
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
    else:
        print usageString(os.path.basename(sys.argv[0]))
        sys.exit(2)

if __name__ == "__main__":
    main()
