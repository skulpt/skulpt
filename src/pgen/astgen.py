"""Generate ast module from specification

This script generates the ast module from a simple specification,
which makes it easy to accomodate changes in the grammar.  This
approach would be quite reasonable if the grammar changed often.
Instead, it is rather complex to generate the appropriate code.  And
the Node interface has changed more often than the grammar.
"""

import fileinput
import re
import sys
from StringIO import StringIO

SPEC = "ast.txt"
COMMA = ", "

def load_boilerplate(file):
    f = open(file)
    buf = f.read()
    f.close()
    i = buf.find('### ''PROLOGUE')
    pro = buf[i+12:].strip()
    return pro, ''

def strip_default(arg):
    """Return the argname from an 'arg = default' string"""
    i = arg.find('=')
    if i == -1:
        return arg
    t = arg[:i].strip()
    return t

P_NODE = 1
P_OTHER = 2
P_NESTED = 3
P_NONE = 4

class NodeInfo:
    """Each instance describes a specific AST node"""
    def __init__(self, name, args):
        self.name = name
        self.args = args.strip()
        self.argnames = self.get_argnames()
        self.argprops = self.get_argprops()
        self.nargs = len(self.argnames)
        self.init = []

    def get_argnames(self):
        if '(' in self.args:
            i = self.args.find('(')
            j = self.args.rfind(')')
            args = self.args[i+1:j]
        else:
            args = self.args
        return [strip_default(arg.strip())
                for arg in args.split(',') if arg]

    def get_argprops(self):
        """Each argument can have a property like '*' or '!'

        XXX This method modifies the argnames in place!
        """
        d = {}
        hardest_arg = P_NODE
        for i in range(len(self.argnames)):
            arg = self.argnames[i]
            if arg.endswith('*'):
                arg = self.argnames[i] = arg[:-1]
                d[arg] = P_OTHER
                hardest_arg = max(hardest_arg, P_OTHER)
            elif arg.endswith('!'):
                arg = self.argnames[i] = arg[:-1]
                d[arg] = P_NESTED
                hardest_arg = max(hardest_arg, P_NESTED)
            elif arg.endswith('&'):
                arg = self.argnames[i] = arg[:-1]
                d[arg] = P_NONE
                hardest_arg = max(hardest_arg, P_NONE)
            else:
                d[arg] = P_NODE
        self.hardest_arg = hardest_arg

        if hardest_arg > P_NODE:
            self.args = self.args.replace('*', '')
            self.args = self.args.replace('!', '')
            self.args = self.args.replace('&', '')

        return d

    def gen_source(self):
        buf = StringIO()
        self._gen_init(buf)
        print >> buf
        self._gen_walkChildren(buf)
        print >> buf
        bufAux = StringIO()
        self._gen_repr(bufAux)
        buf.seek(0, 0)
        bufAux.seek(0, 0)
        return buf.read(), bufAux.read()

    def _gen_init(self, buf):
        print >> buf, "// --------------------------------------------------------"
        if self.args:
            print >> buf, "function %s(%s, lineno)\n{" % (self.name, self.args)
        else:
            print >> buf, "function %s(lineno)\n{" % self.name
        print >>buf, "    this.nodeName = \"%s\";" % self.name
        if self.argnames:
            for name in self.argnames:
                print >> buf, "    this.%s = %s;" % (name, name)
        print >> buf, "    this.lineno = lineno;"
        # Copy the lines in self.init, indented four spaces.  The rstrip()
        # business is to get rid of the four spaces if line happens to be
        # empty, so that reindent.py is happy with the output.
        for line in self.init:
            print >> buf, line.rstrip()
        print >> buf, "}"

    def _gen_walkChildren(self, buf):
        print >> buf, "%s.prototype.walkChildren = function(handler, args)\n{" % self.name
        if len(self.argnames) == 0:
            print >> buf, "    return;"
        else:
            print >>buf, "    var ret;"
            if self.hardest_arg < P_NESTED:
                for c in self.argnames:
                    print >>buf, "    ret = handler.visit(this.%s, args);" % c
                    print >>buf, "    if (ret !== undefined) this.%s = ret;" % c
            else:
                for name in self.argnames:
                    if self.argprops[name] == P_NESTED:
                        print >> buf, "    for (var i_%(name)s = 0; i_%(name)s < this.%(name)s.length; i_%(name)s += 1)\n    {" % {'name':name}
                        print >> buf, "        ret = handler.visit(this.%(name)s[i_%(name)s], args);" % {'name': name}
                        print >> buf, "        if (ret !== undefined) this.%(name)s[i_%(name)s] = ret;\n    }" % {'name': name}
                    else:
                        print >> buf, "    ret = handler.visit(this.%s, args);" % name
                        print >> buf, "    if (ret !== undefined) this.%s = ret;" % name
        print >> buf, "};"

    def _gen_repr(self, buf):
        # can't use actual type, or extend prototype because it's inside the
        # non-debug no-symbol-leaking big function
        print >> buf, "if (node.nodeName === '%s') {" % self.name
        if self.argnames:
            fmts = []
            for name in self.argnames:
                fmts.append(name + "=%s")
            fmt = COMMA.join(fmts)
            vals = ["astDump(node.%s)" % name for name in self.argnames]
            vals = COMMA.join(vals)
            print >> buf, '    return sprintf("%s(%s)", %s);' % \
                  (self.name, fmt, vals)
        else:
            print >> buf, '    return "%s()";' % self.name
        print >> buf, "}"

rx_init = re.compile('init\((.*)\):')

def parse_spec(file):
    classes = {}
    cur = None
    for line in fileinput.input(file):
        if line.strip().startswith('#'):
            continue
        mo = rx_init.search(line)
        if mo is None:
            if cur is None:
                # a normal entry
                try:
                    name, args = line.split(':')
                except ValueError:
                    continue
                classes[name] = NodeInfo(name, args)
                cur = None
            else:
                # some code for the __init__ method
                cur.init.append(line)
        else:
            # some extra code for a Node's __init__ method
            name = mo.group(1)
            cur = classes[name]
    return sorted(classes.values(), key=lambda n: n.name)

def main():
    prologue, epilogue = load_boilerplate(sys.argv[0])
    mainf = open(sys.argv[1], "w")
    auxf = open(sys.argv[2], "w")
    print >>mainf, prologue
    print >>mainf
    print >>auxf, """// This file is automatically generated by pgen/astgen.py

function astDump(node)
{
    if (node === null) return "null";
    if (typeof node === "string") return node;
    if (typeof node === "boolean") return node;
    if (typeof node === "number") return node;
    if (Object.prototype.toString.apply(node) === '[object Array]')
    {
        var ret = '';
        for (var i = 0; i < node.length; ++i)
        {
            ret += astDump(node[i]);
            if (i != node.length - 1) ret += ",";
        }
        return ret;
    }

"""
    classes = parse_spec(SPEC)
    for info in classes:
        a,b = info.gen_source()
        print >>mainf, a
        print >>auxf, b
    print >>mainf, epilogue
    print >>auxf, "}\n"
    mainf.close()
    auxf.close()


if __name__ == "__main__":
    main()
    sys.exit(0)

"""
### PROLOGUE
// abstract syntax node definitions
// 
// This file is automatically generated by pgen/astgen.py

var OP_ASSIGN = 'OP_ASSIGN';
var OP_DELETE = 'OP_DELETE';
var OP_APPLY = 'OP_APPLY';

var SC_LOCAL = 1;
var SC_GLOBAL = 2;
var SC_FREE = 3;
var SC_CELL = 4;
var SC_UNKNOWN = 5;

var CO_OPTIMIZED = 0x0001;
var CO_NEWLOCALS = 0x0002;
var CO_VARARGS = 0x0004;
var CO_VARKEYWORDS = 0x0008;
var CO_NESTED = 0x0010;
var CO_GENERATOR = 0x0020;
var CO_GENERATOR_ALLOWED = 0;
var CO_FUTURE_DIVISION = 0x2000;
var CO_FUTURE_ABSIMPORT = 0x4000;
var CO_FUTURE_WITH_STATEMENT = 0x8000;
var CO_FUTURE_PRINT_FUNCTION = 0x10000;

function flatten(seq)
{
    var l = [];
    for (var i = 0; i < seq.length; ++i)
    {
        if (seq[i].length)
        {
            var subf = flatten(seq[i]);
            for (var j = 0; j < subf.length; ++j)
            {
                l.push(subf[j]);
            }
        }
        else
        {
            l.push(seq[i]);
        }
    }
    return l;
}

//"""
