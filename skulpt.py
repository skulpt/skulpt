#!/usr/bin/env python2.6

#
#   Note:  python2.6 is specified because that is what the skulpt parser
#          used as a reference.  This is only important when you are doing
#          things like regenerating tests and/or regenerating symtabs
#          If you do not have python 2.6 and you ARE NOT creating new tests
#          then all should be well for you to use 2.7 or whatever you have around

from optparse import OptionParser
from subprocess import Popen, PIPE
import os
import sys
import glob
import py_compile
import symtable
import shutil
import re
import pprint
import json

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

# Symbolic constants for the naming of distribution files.
STANDARD_NAMING = True
PRODUCT_NAME    = bowerProperty("name")
OUTFILE_REG     = "{0}.js".format(PRODUCT_NAME) if STANDARD_NAMING else "skulpt-uncomp.js"
OUTFILE_MIN     = "{0}.min.js".format(PRODUCT_NAME) if STANDARD_NAMING else "skulpt.js"
OUTFILE_LIB     = "{0}-stdlib.js".format(PRODUCT_NAME) if STANDARD_NAMING else "builtin.js"
OUTFILE_MAP     = "{0}-linemap.txt".format(PRODUCT_NAME) if STANDARD_NAMING else "linemap.txt"

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
        'src/env.js',
        'src/builtin.js',
        'src/errors.js',
        'src/type.js',
        'src/object.js',
        'src/bool.js',
        'src/function.js',
        'src/native.js',
        'src/method.js',
        'src/misceval.js',
        'src/abstract.js',
        'src/mergesort.js',
        'src/list.js',
        'src/str.js',
        'src/tuple.js',
        'src/dict.js',
        'src/biginteger.js',
        'src/number.js',
        'src/long.js',
        'src/int.js',
        'src/float.js',
        'src/slice.js',
        'src/set.js',
        'src/module.js',
        'src/generator.js',
        'src/file.js',
        'src/ffi.js',
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
        'src/builtindict.js',
        ("support/jsbeautify/beautify.js", FILE_TYPE_TEST),
        ]

TestFiles = [
        'support/closure-library/closure/goog/base.js',
        'support/closure-library/closure/goog/deps.js',
        'support/closure-library/closure/goog/math/math.js',
        'support/closure-library/closure/goog/math/coordinate.js',
        'support/closure-library/closure/goog/math/vec2.js',
        'support/closure-library/closure/goog/json/json.js',
        'support/jsbeautify/beautify.js',
        "{0}/sprintf.js".format(TEST_DIR),
        "{0}/json2.js".format(TEST_DIR),
        "{0}/test.js".format(TEST_DIR)
        ]

def isClean():
    repo = Repo(".")
    return not repo.is_dirty()

def getTip():
    repo = Repo(".")
    return repo.head.commit.hexsha


def getFileList(type):
    ret = []
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
    jsengine = ".\\support\\d8\\d8.exe --trace_exception --debugger"
    nul = "nul"
    crlfprog = os.path.join(os.path.split(sys.executable)[0], "Tools/Scripts/crlf.py")
elif sys.platform == "darwin":
    jsengine = "./support/d8/d8m --trace_exception --debugger"
    nul = "/dev/null"
    crlfprog = None
elif sys.platform == "linux2":
    if is64bit():
        jsengine = "support/d8/d8x64 --trace_exception --debugger"
    else:
        jsengine = "support/d8/d8 --trace_exception --debugger"
    nul = "/dev/null"
    crlfprog = None
else:
    # You're on your own...
    jsengine = "support/d8/d8 --trace_exception --debugger"
    nul = "/dev/null"
    crlfprog = None

if os.environ.get("CI",False):
    jsengine = "support/d8/d8x64 --trace_exception"
    nul = "/dev/null"

#jsengine = "rhino"

def test():
    """runs the unit tests."""
    return os.system("{0} {1} {2}".format(jsengine, ' '.join(getFileList(FILE_TYPE_TEST)), ' '.join(TestFiles)))

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

    os.system("rm -rf {0}/".format(DIST_DIR))
    if not os.path.exists(DIST_DIR): os.mkdir(DIST_DIR)

    if options.uncompressed:
        if options.verbose:
            print ". Writing combined version..."
        combined = ''
        linemap = open("{0}/{1}".format(DIST_DIR, OUTFILE_MAP), "w")
        curline = 1
        for file in getFileList(FILE_TYPE_DIST):
            curfiledata = open(file).read()
            combined += curfiledata
            print >>linemap, "%d:%s" % (curline, file)
            curline += len(curfiledata.split("\n")) - 1
        linemap.close()
        uncompfn = "{0}/{1}".format(DIST_DIR, OUTFILE_REG)
        open(uncompfn, "w").write(combined)
        # Prevent accidental editing of the uncompressed distribution file. 
        os.system("chmod 444 {0}/{1}".format(DIST_DIR, OUTFILE_REG))


    # Make the compressed distribution.
    compfn = "{0}/{1}".format(DIST_DIR, OUTFILE_MIN)
    builtinfn = "{0}/{1}".format(DIST_DIR, OUTFILE_LIB)

    # Run tests on uncompressed.
    if options.verbose:
        print ". Running tests on uncompressed..."

    ret = test()
    if ret != 0:
        print "Tests failed on uncompressed version."
        sys.exit(1);

    # compress
    uncompfiles = ' '.join(['--js ' + x for x in getFileList(FILE_TYPE_DIST)])

    if options.verbose:
        print ". Compressing..."

    ret = os.system("java -jar support/closure-compiler/compiler.jar --define goog.DEBUG=false --output_wrapper \"(function(){%%output%%}());\" --compilation_level SIMPLE_OPTIMIZATIONS --jscomp_error accessControls --jscomp_error checkRegExp --jscomp_error checkTypes --jscomp_error checkVars --jscomp_error deprecated --jscomp_off fileoverviewTags --jscomp_error invalidCasts --jscomp_error missingProperties --jscomp_error nonStandardJsDocs --jscomp_error strictModuleDepCheck --jscomp_error undefinedVars --jscomp_error unknownDefines --jscomp_error visibility %s --js_output_file %s" % (uncompfiles, compfn))
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

    # Run tests on compressed.
    if options.verbose:
        print ". Running tests on compressed..."
    ret = os.system("{0} {1} {2}".format(jsengine, compfn, ' '.join(TestFiles)))
    if ret != 0:
        print "Tests failed on compressed version."
        sys.exit(1)

    ret = os.system("cp {0} {1}/tmp.js".format(compfn, DIST_DIR))
    if ret != 0:
        print "Couldn't copy for gzip test."
        sys.exit(1)

    ret = os.system("gzip -9 {0}/tmp.js".format(DIST_DIR))
    if ret != 0:
        print "Couldn't gzip to get final size."
        sys.exit(1)

    size = os.path.getsize("{0}/tmp.js.gz".format(DIST_DIR))
    os.unlink("{0}/tmp.js.gz".format(DIST_DIR))

    with open(builtinfn, "w") as f:
        f.write(getBuiltinsAsJson(options))
        if options.verbose:
            print ". Wrote {0}".format(builtinfn)

    # Update documentation folder copies of the distribution.
    ret  = os.system("cp {0} doc/static/{1}".format(compfn,    OUTFILE_MIN))
    ret |= os.system("cp {0} doc/static/{1}".format(builtinfn, OUTFILE_LIB))
    if ret != 0:
        print "Couldn't copy to docs dir."
        sys.exit(1)
    if options.verbose:
        print ". Updated doc dir"

    # All good!
    if options.verbose:
        print ". Wrote {0}.".format(compfn)
        print ". gzip of compressed: %d bytes" % size

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

def docbi(options):
    builtinfn = "doc/static/{0}".format(OUTFILE_LIB)
    with open(builtinfn, "w") as f:
        f.write(getBuiltinsAsJson(options))
        if options.verbose:
            print ". Wrote {fileName}".format(fileName=builtinfn)

def run(fn, shell="", opt=False, p3=False):
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
    f.write("""
var input = read('%s');
print("-----");
print(input);
print("-----");
Sk.configure({syspath:["%s"], read:read, python3:%s});
Sk.importMain("%s", true);
print("-----");
    """ % (fn, os.path.split(fn)[0], p3on, modname))
    f.close()
    if opt:
        os.system("{0} {1}/{2} support/tmp/run.js".format(jsengine, DIST_DIR, OUTFILE_MIN))
    else:
        os.system("{0} {1} {2} support/tmp/run.js".format(jsengine, shell, ' '.join(getFileList(FILE_TYPE_TEST))))

def runopt(fn):
    run(fn, "", True)

def run3(fn):
    run(fn,p3=True)

def shell(fn):
    run(fn, "--shell")


def repl():
    os.system("{0} {1}/{2} repl/repl.js".format(jsengine, DIST_DIR, OUTFILE_MIN))

def nrt():
    """open a new run test"""
    for i in range(100000):
        fn = "{0}/run/t%02d.py".format(TEST_DIR) % i
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
                print "run ./m regentests t%02d.py" % i
            break

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

def host():
    """simple http host from root of dir for testing"""
    import SocketServer
    PORT = 20710
    httpd = SocketServer.TCPServer(("", PORT), HttpHandler)
    print "serving at port", PORT
    httpd.serve_forever()

def usageString(program):
    return '''

    {program} <command> [<options>] [script.py]

Commands:

    run              Run a Python file using Skulpt
    test             Run all test cases
    dist             Build core and library distribution files
    docbi            Build library distribution file only and copy to doc/static

    regenparser      Regenerate parser tests
    regenasttests    Regen abstract symbol table tests
    regenruntests    Regenerate runtime unit tests
    regensymtabtests Regenerate symbol table tests
    regentests       Regenerate all of the above

    help             Display help information about Skulpt
    host             Start a simple HTTP server for testing
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
        default=True,
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
    elif cmd == "runopt":
        runopt(sys.argv[2])
    elif cmd == "run3":
        run3(sys.argv[2])
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
    elif cmd == "nrt":
        nrt()
    elif cmd == "browser":
        buildBrowserTests()
    elif cmd == "debugbrowser":
        debugbrowser()
    elif cmd == "vfs":
        buildVFS()
    elif cmd == "host":
        host()
    elif cmd == "shell":
        shell(sys.argv[2]);
    elif cmd == "repl":
        repl()
    else:
        print usageString(os.path.basename(sys.argv[0]))
        sys.exit(2)

if __name__ == "__main__":
    main()
