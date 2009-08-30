#!/usr/bin/env python

from subprocess import Popen, PIPE
import os
import sys
import glob

# order is important!
Files = [
        'src/errors.js',
        'src/env.js',
        'src/type.js',
        'src/str.js',
        'src/list.js',
        'src/tuple.js',
        'src/dict.js',
        'src/long.js',
        'src/slice.js',
        ('src/header.js', 'dist'),
        'src/tokenize.js',
        'gen/parse_tables.js',
        'src/parser.js',
        'gen/ast.js',
        'src/transformer.js',
        'src/compiler.js',
        'src/entry.js',
        ('src/footer.js', 'dist'),
        ('test/footer_test.js', 'test'),
        ]

TestFiles = [
        'test/sprintf.js',
        'test/tokname.js',
        'gen/ast_debug.js',
        "test/json2.js",
        "test/uneval.js",
        "test/test.js"
        ]

DebugFiles = [
        'test/sprintf.js',
        'test/tokname.js',
        'gen/ast_debug.js',
        "test/json2.js",
        "test/uneval.js",
        ]

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


def test():
    """runs the unit tests."""

    os.system("support/d8/d8 --trace_exception %s test/footer_test.js %s" % (
        ' '.join(getFileList('test')),
        ' '.join(TestFiles)))

def dist():
    """builds a 'shippable' version of Skulpt.
    
    this is all combined into one file, tests run, jslint'd, yui compressed.
    output to build/Skulpt-<tip>.js where <tip> is the changeset that 'hg tip'
    reports. """

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

    # run jslint on uncompressed
    print ". Running JSLint on uncompressed..."
    ret = os.system("python support/jslint/wrapper.py %s dist/linemap.txt" % uncompfn)
    os.unlink("dist/linemap.txt")
    if ret != 0:
        print "JSLint complained."
        raise SystemExit()

    # run tests on uncompressed
    print ". Running tests on uncompressed..."
    ret = os.system("support/d8/d8 --trace_exception %s %s" % (uncompfn, ' '.join(TestFiles)))
    if ret != 0:
        print "Tests failed on uncompressed version."
        raise SystemExit()

    # yui compress
    print ". Compressing using yui..."
    ret = os.system("java -jar support/yui/yuicompressor-2.4.2.jar %s -o %s" % (uncompfn, compfn))
    if ret != 0:
        print "Couldn't run yui."
        raise SystemExit()

    # run tests on compressed
    print ". Running tests on compressed..."
    ret = os.system("support/d8/d8 --trace_exception %s %s" % (compfn, ' '.join(TestFiles)))
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
    ret = os.system("cp %s doc/static/skulpt.js" % compfn)
    if ret != 0:
        print "Couldn't copy to docs dir."
        raise SystemExit()

    # all good!
    print ". Wrote %s and %s (and copied %s to doc/static)." % (uncompfn, compfn, compfn)
    print ". gzip of compressed: %d bytes" % size

def parser():
    """regenerate the parser/ast source code"""
    if not os.path.exists("gen"): os.mkdir("gen")
    os.chdir("src/pgen")
    os.system("python main.py ../../gen/parse_tables.js")
    os.system("python astgen.py ../../gen/ast.js ../../gen/ast_debug.js")
    os.chdir("../..")
    # sanity check that they at least parse
    os.system("support/d8/d8 src/tokenize.js gen/parse_tables.js gen/ast.js gen/ast_debug.js")

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
    f = open("support/tmp/compiledump.js", "w")
    f.write("""
var input = read('%s');
print(Skulpt.compileStr('%s', input));
    """ % (fn, fn))
    f.close()
    os.system("support/d8/d8 --trace_exception %s test/footer_test.js support/tmp/compiledump.js > support/tmp/dump.js" % (
        ' '.join(getFileList('test'))))
    os.system("support/js-beautify/bin/beautify_js support/tmp/dump.js")
    os.system("support/d8/d8 --shell --trace_exception %s test/footer_test.js %s support/tmp/dump.js" % (
        ' '.join(getFileList('test')),
        ' '.join(DebugFiles)))

def nrt():
    """open a new run test"""
    for i in range(100000):
        fn = "test/run/t%02d.py" % i
        disfn = fn + ".disabled"
        if not os.path.exists(fn) and not os.path.exists(disfn):
            os.system("vim " + fn)
            print "don't forget to ./m regenruntests"
            break

if __name__ == "__main__":
    os.system("clear")
    def usage():
        print "usage: build {test|dist|parser|regenruntests|upload|debug|nrt}"
        sys.exit(1)
    if len(sys.argv) < 2:
        cmd = "test"
    else:
        cmd = sys.argv[1]
    if cmd == "test":
        test()
    elif cmd == "dist":
        dist()
    elif cmd == "debug":
        debug(sys.argv[2])
    elif cmd == "parser":
        parser()
    elif cmd == "regenruntests":
        regenruntests()
    elif cmd == "upload":
        upload()
    elif cmd == "nrt":
        nrt()
    else:
        usage()
