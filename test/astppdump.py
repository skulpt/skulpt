import ast
import sys

def astppdump(node):
    def _format(node, indent):
        #print node, len(indent)
        if isinstance(node, ast.AST):
            namelen = " "*(len(node.__class__.__name__)) + " "
            fields = []
            for a,b in ast.iter_fields(node):
                fieldlen = len(a)*" "
                fields.append((a, _format(b, indent+namelen+fieldlen+" ")))
            fieldstr = (",\n"+indent+namelen).join('%s=%s' % (field[0],field[1].lstrip()) for field in fields)
            return indent+node.__class__.__name__ + "(%s)" % fieldstr
        elif isinstance(node, list):
            elems = (',\n').join(_format(x, indent+" ") for x in node)
            return indent+"[%s]" % elems.lstrip()
        elif isinstance(node, long): # L suffix depends on 32/64 python, and skulpt is ~30 because of number precision in js
            return indent+str(node)
        return indent+repr(node)
    if not isinstance(node, ast.AST):
        raise TypeError('expected AST, got %r' % node.__class__.__name__)
    return _format(node, "")


if __name__ == "__main__":
    print astppdump(ast.parse(open(sys.argv[1]).read(), sys.argv[1]))
