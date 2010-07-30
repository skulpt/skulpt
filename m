#!/usr/bin/env python

from subprocess import Popen, PIPE
import os
import sys
import glob
import py_compile
import symtable

# order is important!
Files = [
        'support/closure-library/closure/goog/base.js',
        'src/env.js',
        'src/uneval.js', # this is only here for unit tests
        'src/errors.js',
        'src/list.js',
        'src/type.js',
        'src/object.js',
        'src/function.js',
        'src/str.js',
        'src/tuple.js',
        'src/dict.js',
        'src/long.js',
        'src/slice.js',
        'src/module.js',
        'src/generator.js',
        'src/file.js',
        'src/modules/sys.js',

        'src/tokenize.js',
        'gen/parse_tables.js',
        'src/parser.js',
        'gen/ast.js',
        'src/transformer.js',
        #'src/symtable.js',
        #'src/compiler.js',
        #'src/entry.js',
        #('src/footer.js', 'dist'),
        #('test/footer_test.js', 'test'),

        'gen/ast_debug.js', # this is only here for unit tests
        ]

TestFiles = [
        'test/sprintf.js',
        "test/json2.js",
        "test/test.js"
        ]
DebugFiles = TestFiles[:-1]

def isClean():
    out, err = Popen("hg status", shell=True, stdout=PIPE).communicate()
    return out == ""

def getTip():
    out, err = Popen("hg tip", shell=True, stdout=PIPE).communicate()
    return out.split("\n")[0].split(":")[2].strip()

def getFileList(type):
    ret = []
    for f in Files:
        if isinstance(f, tuple):
            if f[1] == type:
                ret.append(f[0])
        else:
            ret.append(f)
    return ret

jsengine = "support/d8/d8 --trace_exception"
#jsengine = "rhino"

def test():
    """runs the unit tests."""
    os.system("%s test/no_new_globals.js %s %s test/no_new_globals_at_end.js" % (
        jsengine,
        ' '.join(getFileList('test')),
        ' '.join(TestFiles)))

def compileUsingSkc1(fn):
    f = open(fn, 'rb')
    js = skc1.compilePyc(f.read())
    ret = """
var mainmodDict = {'__name__': '__main__'};
var moduleBody = %s;
moduleBody(mainmodDict);
""" % js
    return ret


def buildBrowserTests():
    """combine all the tests data into something we can run from a browser
    page (so that it can be tested in the various crappy engines)

    we want to use the same code that the command line version of the tests
    uses so we stub the d8 functions to push to the browser."""

    print "todo; browser tests not building right now"
    return

    outfn = "doc/static/browser-test.js"
    out = open(outfn, "w")

    print >>out, """
window.addEvent('domready', function() {
"""

    # build a silly virtual file system to support 'read'
    print ". Slurping test data"
    print >>out, "VFSData = {"
    all = []
    for pat in ("test/tokenize/*", "test/parse/*", "test/run/*", "test/interactive/*"):
        for file in glob.glob(pat):
            data = open(file, "rb").read()
            all.append("'%s': '%s'" % (file, data.encode("hex")))
    print >>out, ",\n".join(all)
    print >>out, "};"

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

    for f in ["test/browser-detect.js"] + getFileList('test') + TestFiles:
        print >>out, open(f).read()

    print >>out, """
});
"""
    out.close()
    print ". Built %s" % outfn


def dist():
    """builds a 'shippable' version of Skulpt.
    
    this is all combined into one file, tests run, jslint'd, compressed.
    """

    if not isClean():
        print "WARNING: working directory not clean (according to 'hg status')"
        #raise SystemExit()

    label = getTip()

    print ". Nuking old dist/"
    os.system("rm -rf dist/")
    if not os.path.exists("dist"): os.mkdir("dist")

    print ". Writing combined version..."
    combined = ''
    linemap = open("dist/linemap.txt", "w")
    curline = 1
    for file in getFileList('dist'):
        curfiledata = open(file).read()
        combined += curfiledata
        print >>linemap, "%d:%s" % (curline, file)
        curline += len(curfiledata.split("\n")) - 1
    linemap.close()

    # make combined version
    uncompfn = "dist/skulpt-uncomp.js"
    compfn = "dist/skulpt.js"
    open(uncompfn, "w").write(combined)

    buildBrowserTests()

    """
    # run jslint on uncompressed
    print ". Running JSLint on uncompressed..."
    ret = os.system("python support/jslint/wrapper.py %s dist/linemap.txt" % uncompfn)
    os.unlink("dist/linemap.txt")
    if ret != 0:
        print "JSLint complained."
        raise SystemExit()
    """

    # run tests on uncompressed
    print ". Running tests on uncompressed..."
    ret = os.system("%s %s %s" % (jsengine, uncompfn, ' '.join(TestFiles)))
    if ret != 0:
        print "Tests failed on uncompressed version."
        raise SystemExit()

    # compress
    print ". Compressing..."
    ret = os.system("java -jar support/closure-compiler/compiler.jar  --compilation_level ADVANCED_OPTIMIZATIONS --js %s --js_output_file %s" % (uncompfn, compfn)) 
    # --jscomp_error accessControls --jscomp_error checkRegExp --jscomp_error checkTypes --jscomp_error checkVars --jscomp_error deprecated --jscomp_error fileoverviewTags --jscomp_error invalidCasts --jscomp_error missingProperties --jscomp_error nonStandardJsDocs --jscomp_error strictModuleDepCheck --jscomp_error undefinedVars --jscomp_error unknownDefines --jscomp_error visibility
    if ret != 0:
        print "Couldn't run closure-compiler."
        raise SystemExit()

    # run tests on compressed
    print ". Running tests on compressed..."
    ret = os.system("%s %s %s" % (jsengine, compfn, ' '.join(TestFiles)))
    if ret != 0:
        print "Tests failed on compressed version."
        raise SystemExit()

    ret = os.system("cp %s dist/tmp.js" % compfn)
    if ret != 0:
        print "Couldn't copy for gzip test."
        raise SystemExit()

    ret = os.system("gzip dist/tmp.js")
    if ret != 0:
        print "Couldn't gzip to get final size."
        raise SystemExit()

    size = os.path.getsize("dist/tmp.js.gz")
    os.unlink("dist/tmp.js.gz")

    # update doc copy
    """
    ret = os.system("cp %s doc/static/skulpt.js" % compfn)
    ret |= os.system("cp %s doc/static/skulpt-uncomp.js" % uncompfn)
    if ret != 0:
        print "Couldn't copy to docs dir."
        raise SystemExit()
        """

    # all good!
    print ". Wrote %s and %s (and copied to doc/static)." % (uncompfn, compfn)
    print ". gzip of compressed: %d bytes" % size

def regenparser():
    """regenerate the parser/ast source code"""
    if not os.path.exists("gen"): os.mkdir("gen")
    os.chdir("src/pgen")
    os.system("python main.py ../../gen/parse_tables.js")
    os.system("python astgen.py ../../gen/ast.js ../../gen/ast_debug.js")
    os.chdir("../..")
    # sanity check that they at least parse
    os.system(jsengine + " support/closure-library/closure/goog/base.js src/env.js src/tokenize.js gen/parse_tables.js gen/ast.js gen/ast_debug.js")

def regenruntests():
    """regenerate the test data by running the tests on real python"""
    for f in glob.glob("test/run/*.py"):
        os.system("python %s > %s.real 2>&1" % (f, f))
        forcename = f + ".real.force"
        if os.path.exists(forcename):
            os.system("cp %s %s.real" % (forcename, f))
    for f in glob.glob("test/interactive/*.py"):
        p = Popen("python -i > %s.real 2>/dev/null" % f, shell=True, stdin=PIPE)
        p.communicate(open(f).read() + "\004")
        forcename = f + ".real.force"
        if os.path.exists(forcename):
            os.system("cp %s %s.real" % (forcename, f))


def upload():
    """uploads doc to GAE (stub app for static hosting, mostly)"""
    print "you probably don't want to do that right now"
    return
    ret = os.system("python2.5 support/tmp/google_appengine/appcfg.py update doc")
    if ret != 0:
        print "Couldn't upload."
        raise SystemExit()

def debug(fn):
    """pretty print the compilation of fn, and then start a debug console with
    the environment loaded."""
    if not os.path.exists(fn):
        print "%s doesn't exist" % fn
        raise SystemExit()
    py_compile.compile(fn)
    open("support/tmp/dump.js", "w").write(compileUsingSkc1(fn+"c"))
    os.system("cat support/tmp/dump.js")
    os.system("%s --shell %s %s support/tmp/dump.js" % (
        jsengine,
        ' '.join(getFileList('test')),
        ' '.join(DebugFiles)))

def run(fn):
    if not os.path.exists(fn):
        print "%s doesn't exist" % fn
        raise SystemExit()
    f = open("support/tmp/run.js", "w")
    f.write("""
var input = read('%s');
eval(Skulpt.compileStr('%s', input));
    """ % (fn, fn))
    f.close()
    os.system("%s %s test/footer_test.js support/tmp/run.js" %
            jsengine,
            ' '.join(getFileList('test')))

def runopt(fn):
    if not os.path.exists(fn):
        print "%s doesn't exist" % fn
        raise SystemExit()
    f = open("support/tmp/run.js", "w")
    f.write("""
var input = read('%s');
eval(Skulpt.compileStr('%s', input));
    """ % (fn, fn))
    f.close()
    os.system(jsengine + " --nodebugger dist/skulpt.js support/tmp/run.js")

def parse(fn):
    if not os.path.exists(fn):
        print "%s doesn't exist" % fn
        raise SystemExit()
    f = open("support/tmp/parse.js", "w")
    f.write("""
var input = read('%s');
var cst = Skulpt._parse('%s', input);
print(astDump(Skulpt._transform(cst)));
    """ % (fn, fn))
    f.close()
    os.system("%s %s test/footer_test.js %s support/tmp/parse.js" % (
        jsengine,
        ' '.join(getFileList('test')),
        ' '.join(DebugFiles)))

def symtab(fn):
    if not os.path.exists(fn):
        print "%s doesn't exist" % fn
        raise SystemExit()
    text = open(fn).read()
    print text
    print "--------------------"
    mod = symtable.symtable(text, os.path.split(fn)[1], "exec")
    def getidents(obj, indent=""):
        ret = ""
        ret += """%sSym_type: %s
%sSym_name: %s
%sSym_lineno: %s
%sSym_nested: %s
%sSym_haschildren: %s
%sSym_has_import_star: %s
""" % (
        indent, obj.get_type(),
        indent, obj.get_name(),
        indent, obj.get_lineno(),
        indent, obj.is_nested(),
        indent, obj.has_children(),
        indent, obj.has_import_star())
        if obj.get_type() == "function":
            ret += "%sFunc_params: %s\n%sFunc_locals: %s\n%sFunc_globals: %s\n%sFunc_frees:%s\n" % (
                    indent, obj.get_parameters(),
                    indent, obj.get_locals(),
                    indent, obj.get_globals(),
                    indent, obj.get_frees())
        elif obj.get_type() == "class":
            ret += "%sClass_methods: %s\n" % (
                    indent, obj.get_methods())
        ret += "%s-- Identifiers --:\n" % indent
        for ident in obj.get_identifiers():
            info = obj.lookup(ident)
            ret += "%sname: %s\n  %sreferenced: %s\n  %simported: %s\n  %sparam: %s\n  %sglobal: %s\n  %sdecl_global: %s\n  %slocal: %s\n  %sfree: %s\n  %sassigned: %s\n  %sis_ns: %s\n  %snss: [\n%s\n%s  ]\n" % (
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
                    indent, ','.join([getidents(x, indent + "    ") for x in info.get_namespaces()]),
                    indent
                    )
        return ret
    print getidents(mod)

def nrt():
    """open a new run test"""
    for i in range(100000):
        fn = "test/run/t%02d.py" % i
        disfn = fn + ".disabled"
        if not os.path.exists(fn) and not os.path.exists(disfn):
            os.system("vim " + fn)
            print "don't forget to ./m regenruntests"
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




if __name__ == "__main__":
    os.system("clear")
    def usage():
        print "usage: m {test|dist|regenparser|regenruntests|upload|debug|nrt|run|runopt|parse|vmwareregr|symtab}"
        sys.exit(1)
    if len(sys.argv) < 2:
        cmd = "test"
    else:
        cmd = sys.argv[1]
    if cmd == "test":
        test()
    elif cmd == "dist":
        dist()
    elif cmd == "symtab":
        symtab(sys.argv[2])
    elif cmd == "debug":
        debug(sys.argv[2])
    elif cmd == "run":
        run(sys.argv[2])
    elif cmd == "runopt":
        runopt(sys.argv[2])
    elif cmd == "parse":
        parse(sys.argv[2])
    elif cmd == "vmwareregr":
        parse(sys.argv[2])
    elif cmd == "regenparser":
        regenparser()
    elif cmd == "regenruntests":
        regenruntests()
    elif cmd == "upload":
        upload()
    elif cmd == "nrt":
        nrt()
    else:
        usage()
