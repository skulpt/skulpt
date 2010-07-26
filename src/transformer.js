// Heavily based on Python-2.6's Lib/compiler/transformer.py, by various
// contributors: Greg Stein, Bill Tutt, Jeremy Hylton, Mark Hammond, Sylvan
// Thenault, and probably others.

// utilty to transform parse trees into ast trees that are more amenable to
// compilation. this is quite verbose, but pretty simple code that takes the
// parse tree that's quite low-level and munges it into something that's a bit
// easier to compile. For the most part it's simply flattening, and wrapping
// in named types (from ast.js).

(function() {

var TOK = Sk.Tokenizer;
var AST = Sk.Ast;

function Transformer(grammar)
{
    this.grammar = grammar;
    this.sym = grammar.symbol2number;
    this.assign_types = [
        this.sym.test,
        this.sym.or_test,
        this.sym.and_test,
        this.sym.not_test,
        this.sym.comparison,
        this.sym.expr,
        this.sym.xor_expr,
        this.sym.and_expr,
        this.sym.shift_expr,
        this.sym.arith_expr,
        this.sym.term,
        this.sym.factor
    ];
    this.cmp_types = {};
    this.cmp_types[TOK.T_LESS] = '<';
    this.cmp_types[TOK.T_GREATER] = '>';
    this.cmp_types[TOK.T_EQEQUAL] = '==';
    this.cmp_types[TOK.T_EQUAL] = '=';
    this.cmp_types[TOK.T_LESSEQUAL] = '<=';
    this.cmp_types[TOK.T_GREATEREQUAL] = '>=';
    this.cmp_types[TOK.T_NOTEQUAL] = '!=';

    return this;
}

Sk.transform = function transform(cst)
{
    var t = new Transformer(Sk.ParseTables);
    return t.compile_node(cst);
}

Transformer.prototype.compile_node = function(node)
{
    var n = node.type;

    if (n === this.sym.single_input)
        return this.single_input(node.children);
    if (n === this.sym.file_input)
        return this.file_input(node.children);

    print("unexpected node type: " + n + ", " + this.grammar.number2symbol[n]);
    throw new SyntaxError("unexpected node type: " + n);
};

Transformer.prototype.dispatch = function(node)
{
    var fn = this[this.grammar.number2symbol[node.type]];
    //print("dispatch: "+this.grammar.number2symbol[node.type]);
    if (!fn) throw ("don't have handler for: " + this.grammar.number2symbol[node.type]);
    var ret;
    if (node.type < 256)
        ret = fn.call(this, node.value);
    else
        ret = fn.call(this, node.children);
    //print(JSON.stringify(node, null, 2));
    //print(JSON.stringify(ret, null, 2));
    if (!ret) throw "assert: handler for '" + this.grammar.number2symbol[node.type] + "' returned undefined";
    return ret;
};

Transformer.prototype.file_input = function(nodelist)
{
    var doc = this.get_docstring(nodelist, this.sym.file_input);
    var stmts = [];
    for (var i = (doc) ? 1 : 0; i < nodelist.length; ++i)
    {
        var node = nodelist[i];
        if (node.type !== TOK.T_ENDMARKER && node.type !== TOK.T_NEWLINE)
            this.com_append_stmt(stmts, node);
    }
    return new AST.Module(doc, new AST.Stmt(stmts));
};

Transformer.prototype.single_input = function(node)
{
    // NEWLINE | simple_stmt | compound_stmt NEWLINE
    var n = node[0].type;
    if (n !== TOK.T_NEWLINE)
    {
        return new Interactive(this.dispatch(node[0]));
    }
    return new Pass();
};

Transformer.prototype.com_append_stmt = function(stmts, node)
{
    var result = this.dispatch(node);
    if (result instanceof AST.Stmt)
    {
        for (var i = 0; i < result.nodes.length; ++i)
            stmts.push(result.nodes[i]);
    }
    else
    {
        stmts.push(result);
    }
};

Transformer.prototype.com_list_constructor = function(nodelist)
{
    // listmaker: test ( list_for | (',' test)* [','] )
    //print("com_list_constructor:"+JSON.stringify(nodelist));
    var values = [];
    for (var i = 0; i < nodelist.children.length; ++i)
    {
        if (nodelist.children[i].type === this.sym.comp_for)
        {
            if (nodelist.children.length - i !== 1) throw "assert";
            return this.com_list_comprehension(values[0], nodelist.children[i]);
        }
        else if (nodelist.children[i].type === TOK.T_COMMA)
        {
            continue;
        }
        //print(JSON.stringify(nodelist.children[i]));
        values.push(this.dispatch(nodelist.children[i]));
    }
    return new AST.List(values, values[0].lineno);
};

Transformer.prototype.com_list_comprehension = function(expr, node)
{
    // comp_iter: comp_for | comp_if
    // comp_for: 'for' exprlist 'in' testlist [comp_iter]
    // comp_if: 'if' test [comp_iter]

    // todo; should raise SyntaxError for assignment

    //print("com_list_comprehension.expr:"+JSON.stringify(expr));
    //print("com_list_comprehension.node:"+JSON.stringify(node));
    var lineno = node.children[0].context;
    var fors = [];
    while (node)
    {
        //print(JSON.stringify(node));
        var t = node.children[0].value;
        if (t === "for")
        {
            var assignNode = this.com_assign(node.children[1], AST.OP_ASSIGN);
            var listNode = this.dispatch(node.children[3]);
            var newfor = new AST.ListCompFor(assignNode, listNode, []);
            newfor.lineno = node.children[0].context;
            fors.push(newfor);
            if (node.children.length === 4)
                node = null;
            else
                node = this.com_comp_iter(node.children[4]);
        }
        else if (t === "if")
        {
            var test = this.dispatch(node.children[1]);
            var newif = new AST.ListCompIf(test, node.children[0].context);
            newfor.ifs.push(newif);
            if (node.children.length === 2)
                node = null;
            else
                node = this.com_comp_iter(node.children[2]);
        }
        else
        {
            throw new SyntaxError("unexpected list comprehension element: " + node, lineno + ", " + lineno);
        }
    }
    return new AST.ListComp(expr, fors, lineno);
};

Transformer.prototype.com_comp_iter = function(node)
{
    if (node.type !== this.sym.comp_iter) throw "assert";
    return node.children[0];
};


Transformer.prototype.com_dictmaker = function(nodelist)
{
    // dictmaker: test ':' test (',' test ':' value)* [',']
    var items = [];
    for (var i = 0; i < nodelist.children.length; i += 4)
    {
        items.push(this.dispatch(nodelist.children[i]));
        items.push(this.dispatch(nodelist.children[i+2]));
    }
    return new AST.Dict(items, items[0].lineno);
};

// Compile 'NODE (OP NODE)*' into (type, [ node1, ..., nodeN ]).
Transformer.prototype.com_binary = function(Constructor, nodelist)
{
    var l = nodelist.length;
    if (l === 1)
        return this.dispatch(nodelist[0]);
    var items = [];
    for (var i = 0; i < l; i += 2)
    {
        items.push(this.dispatch(nodelist[i]));
    }
    return new Constructor(items); // todo; lineno=extractLineNo(nodelist))
};

Transformer.prototype.com_apply_trailer = function(primaryNode, nodelist)
{
    //print(JSON.stringify(primaryNode));
    //print(JSON.stringify(nodelist));
    var t = nodelist.children[0].type;
    if (t === TOK.T_LPAR)
        return this.com_call_function(primaryNode, nodelist.children[1]);
    if (t === TOK.T_DOT)
        return this.com_select_member(primaryNode, nodelist.children[1]);
    if (t === TOK.T_LSQB)
        return this.com_subscriptlist(primaryNode, nodelist.children[1], AST.OP_APPLY);

    throw 'unknown node type: ' + t;
};

Transformer.prototype.com_select_member = function(primaryNode, nodelist)
{
    if (nodelist.type !== TOK.T_NAME)
        throw new SyntaxError("member must be a name");
    return new AST.Getattr(primaryNode, nodelist.value, nodelist.context);
};


Transformer.prototype.com_arglist = function(nodelist)
{
    //print("com_arglist:"+JSON.stringify(nodelist));
    // varargslist:
    //     (fpdef ['=' test] ',')* ('*' NAME [',' '**' NAME] | '**' NAME)
    //   | fpdef ['=' test] (',' fpdef ['=' test])* [',']
    // fpdef: NAME | '(' fplist ')'
    // fplist: fpdef (',' fpdef)* [',']
    var names = [];
    var defaults = [];
    var haveSomeDefaults = false;
    var varargs = false;
    var varkeywords = false;

    //print("len:"+nodelist.length);
    var i = 0;
    while (i < nodelist.length)
    {
        var node = nodelist[i];
        if (node.type === TOK.T_STAR || node.type === TOK.T_DOUBLESTAR)
        {
            if (node.type === TOK.T_STAR)
            {
                node = nodelist[i + 1];
                if (node.type === TOK.T_NAME)
                {
                    names.push(node[1]);
                    varargs = true;
                    i += 3;
                }
            }

            if (i < nodelist.length)
            {
                // should be DOUBLESTAR
                var t = nodelist[i].type;
                if (t === TOK.T_DOUBLESTAR)
                {
                    node = nodelist[i+1];
                }
                else
                {
                    throw new ValueError("unxpected token: " + this.grammar.number2symbol[t]);
                }
                names.push(node[1]);
                varkeywords = true;
            }

            break;
        }

        // fpdef: NAME | '(' fplist ')'
        names.push(this.com_fpdef(node));
        //print("names:"+JSON.stringify(names));

        i = i + 1;
        if (i < nodelist.length && nodelist[i].type === TOK.T_EQUAL)
        {
            defaults.push(this.dispatch(nodelist[i + 1]));
            i = i + 2;
            haveSomeDefaults = true;
        }
        else
        {
            // we have already seen an argument with default, but here
            // came one without
            if (haveSomeDefaults)
            {
                throw new SyntaxError("non-default argument follows default argument");
            }
            defaults.push(undefined);
        }

        // skip the comma
        i += 1;
    }

    return [names, defaults, varargs, varkeywords];
};

Transformer.prototype.com_fpdef = function(node)
{
    // fpdef: NAME | '(' fplist ')'
    //print("com_fpdef:"+JSON.stringify(node));
    if (node.children[0].type === TOK.T_LPAR)
        return this.com_fplist(node.children[1]);
    return node.children[0].value;
};


Transformer.prototype.com_fplist = function(node)
{
    // fplist: fpdef (',' fpdef)* [',']
    //print("com_fplist:"+JSON.stringify(node));
    if (node.length === 2)
        return this.com_fpdef(node[1]);
    var list = [];
    for (var i = 1; i < node.length; i += 2)
    {
        list.push(this.com_fpdef(node[i]));
    }
    return list;
};

Transformer.prototype.com_call_function = function(primaryNode, nodelist)
{
    //print(JSON.stringify(nodelist, null, 2));
    if (nodelist.type === TOK.T_RPAR)
    {
        return new AST.CallFunc(primaryNode, [], null, null);//, lineno=extractLineNo(nodelist))
    }
    var args = [];
    var kw = false;
    var star_node = null;
    var dstar_node = null;
    var len_nodelist = nodelist.children.length;
    var i = 0;
    while (i < len_nodelist)
    {
        var node = nodelist.children[i];
        //print("node.type:"+node.type);
        if (node.type === TOK.T_STAR)
        {
            if (star_node)
                throw new SyntaxError("already have the varargs identifier");
            star_node = this.dispatch(nodelist.children[i + 1]);
            i += 3;
            continue;
        }
        else if (node.type === TOK.T_DOUBLESTAR)
        {
            if (dstar_node)
                throw new SyntaxError("already have the kwargs identifier");
            dstar_node = this.dispatch(nodelist.children[i + 1]);
            i += 3;
            continue;
        }

        // positional or named parameters
        //print("weeEEee", JSON.stringify(node));
        var ret = this.com_argument(node, kw, star_node);
        kw = ret[0];
        var result = ret[1];

        /*
        if (len_nodelist !== 2 && result instanceof GenExpr
                && node.children.length === 2 && node.children[1].type === this.sym.comp_for)
            // allow f(x for x in y), but reject f(x for x in y, 1)
            // should use f((x for x in y), 1) instead of f(x for x in y, 1)
            throw new SyntaxError("generator expression needs parenthesis");
            */

        args.push(result);
        i += 2;
    }

    return new AST.CallFunc(primaryNode, args, star_node, dstar_node);//, lineno=extractLineNo(nodelist))
};

Transformer.prototype.com_argument = function(nodelist, kw, star_node)
{
    //print(nodelist.children.length, "-- \n -- ", JSON.stringify(nodelist));
    if (nodelist.children.length === 2 && nodelist.children[1].type === this.sym.comp_for)
    {
        var test = this.dispatch(nodelist.children[0]);
        return [false, this.com_generator_expression(test, nodelist.children[1])];
    }
    if (nodelist.children.length === 1)
    {
        if (kw)
            throw new SyntaxError("non-keyword arg after keyword arg");
        if (star_node)
            throw new SyntaxError("only named arguments may follow *expression");
        return [false, this.dispatch(nodelist.children[0])];
    }
    var result = this.dispatch(nodelist.children[2]);
    var n = nodelist.children[0];
    //print(JSON2.stringify(n));
    while (n.type !== TOK.T_NAME && n.children !== null)
        n = n.children[0];
    if (n.type !== TOK.T_NAME)
        throw new SyntaxError("keyword can't be an expression (" + n.type + ")");
    var node = new Keyword(n.value, result, n.context);
    return [true, node];
};

function contains(a, obj)
{
    var i = a.length;
    while (i--)
    {
        if (a[i] === obj)
        {
            return true;
        }
    }
    return false;
}

Transformer.prototype.com_assign = function(node, assigning)
{
    // return a node suitable for use as an "lvalue"
    // loop to avoid trivial recursion
    while (true)
    {
        //print(JSON.stringify(node));
        var t = node.type;
        //print("0-----:" + this.grammar.number2symbol[t]);
        if (t === this.sym.exprlist
                || t === this.sym.testlist
                || t === this.sym.testlist_safe
                || t === this.sym.testlist_gexp)
        {
            if (node.children.length > 1)
                return this.com_assign_tuple(node, assigning);
            node = node.children[0];
        }
        else if (contains(this.assign_types, t))
        {
            //print("assign_types:"+JSON.stringify(node));
            if (node.children.length > 1)
                throw new SyntaxError("can't assign to operator");
            node = node.children[0];
        }
        else if (t === this.sym.power)
        {
            if (node.children[0].type !== this.sym.atom)
                throw new SyntaxError("can't assign to operator");
            if (node.children.length > 1)
            {
                var primary = this.dispatch(node.children[0]);
                for (var i = 1; i < node.children.length - 1; ++i)
                {
                    var ch = node.children[i];
                    if (ch.type === TOK.T_DOUBLESTAR)
                        throw new SyntaxError("can't assign to operator");
                    primary = this.com_apply_trailer(primary, ch);
                }
                return this.com_assign_trailer(primary, node.children[node.children.length - 1], assigning);

            }
            node = node.children[0];
        }
        else if (t === this.sym.atom)
        {
            t = node.children[0].type;
            if (t === TOK.T_LPAR)
            {
                node = node.children[1];
                if (node.type === TOK.T_RPAR)
                    throw new SyntaxError("can't assign to ()");
            }
            else if (t === TOK.T_LSQB)
            {
                node = node.children[1];
                if (node.type === TOK.T_RSQB)
                    throw new SyntaxError("can't assign to []");
                return this.com_assign_list(node, assigning);
            }
            else if (t === TOK.T_NAME)
            {
                //print(JSON.stringify(node));
                return new AST.AssName(node.children[0].value, assigning, node.context);
            }
            else
            {
                throw new SyntaxError("can't assign to literal");
            }
        }
        else
        {
            throw new SyntaxError("bad assignment (" + this.grammar.number2symbol[t] + ")");
        }
    }
};

Transformer.prototype.com_assign_trailer = function(primary, node, assigning)
{
    //print("com_assign_trailer:"+JSON.stringify(node));
    var t = node.children[0].type;
    if (t === TOK.T_DOT)
        return this.com_assign_attr(primary, node.children[1], assigning);
    if (t === TOK.T_LSQB)
        return this.com_subscriptlist(primary, node.children[1], assigning);
    if (t === TOK.T_LPAR)
        throw new SyntaxError("can't assign to function call");
    throw new SyntaxError("unknown trailer type: " + this.grammar.number2symbol[t]);
};

Transformer.prototype.com_assign_attr = function(primary, nodelist, assigning)
{
    return new AST.AssAttr(primary, nodelist.value, assigning, nodelist.context);
};

Transformer.prototype.com_subscriptlist = function(primary, nodelist, assigning)
{
    // subscriptlist: subscript (',' subscript)* [',']
    // subscript: test | [test] ':' [test] [sliceop]
    // sliceop: ':' [test]
    var subscripts = [];
    for (var i = 0; i < nodelist.children.length; i += 2)
    {
        subscripts.push(this.com_subscript(nodelist.children[i]));
    }
    return new AST.Subscript(primary, assigning, subscripts); //, lineno=extractLineNo(nodelist))
};

Transformer.prototype.com_subscript = function(node)
{
    // subscript: test | [test] ':' [test] [sliceop]
    // sliceop: ':' [test]
    //print("com_subscript:"+JSON.stringify(node));
    if (node.children.length > 1 || node.children[0].type === TOK.T_COLON)
        return this.com_sliceobj(node);
    return this.dispatch(node.children[0]);
};

Transformer.prototype.com_sliceobj = function(node)
{
    var items = [];
    var i;

    //print("----------- com_sliceobj:"+JSON.stringify(node));
    //print("----------- com_sliceobj_length:"+node.children.length);

    // lower
    if (node.children[0].type === TOK.T_COLON)
    {
        items.push(null);
        i = 1;
    }
    else
    {
        items.push(this.dispatch(node.children[0]));
        if (node.children[1].type !== TOK.T_COLON) throw new SyntaxError("expecting colon");
        i = 2;
    }

    // upper
    if (i < node.children.length && node.children[i].type === this.sym.test)
    {
        items.push(this.dispatch(node.children[i]));
        i += 1;
    }
    else
    {
        items.push(null);
    }

    //print("slice:",i,node.children.length, node.children[i].type);
    // stride
    if (i < node.children.length
            && node.children[i].type === this.sym.sliceop)
    {
        var so = node.children[i];
        if (so.children[0].type !== TOK.T_COLON) throw "assert";
        items.push(this.dispatch(so.children[1]));
    }

    return new AST.Sliceobj(items); // todo; , lineno=extractLineNo(node))
};

Transformer.prototype.com_augassign = function(node)
{
    // Names, slices, and attributes are the only allowable nodes.
    var l = this.dispatch(node);
    if (l instanceof AST.Name
            || l instanceof AST.Slice
            || l instanceof AST.Subscript
            || l instanceof AST.Getattr)
    {
        return l;
    }
    throw new SyntaxError("can't assign to " + l.nodeName);
};

Transformer.prototype.com_augassign_op = function(node)
{
    if (node.type !== this.sym.augassign) throw "assert";
    return node.children[0];
};


Transformer.prototype.com_assign_tuple = function(node, assigning)
{
    var assigns = [];
    for (var i = 0; i < node.children.length; i += 2)
        assigns.push(this.com_assign(node.children[i], assigning));
    return new AST.AssTuple(assigns); // todo; , lineno=extractLineNo(node))
};

Transformer.prototype.get_docstring = function(node, n)
{
    // todo;
    return null;
};


//
//
// transformers for all the node types
// nonterms get a list of children, terms get the value
//
//
Transformer.prototype.stmt =
Transformer.prototype.small_stmt =
Transformer.prototype.flow_stmt = 
Transformer.prototype.compound_stmt = function(nodelist)
{
    var result = this.dispatch(nodelist[0]);
    if (result instanceof AST.Stmt) return result;
    return new AST.Stmt([result]);
};

Transformer.prototype.simple_stmt = function(nodelist)
{
    // small_stmt (';' small_stmt)* [';'] NEWLINE
    var stmts = [];
    for (var i = 0; i < nodelist.length; i += 2)
    {
        this.com_append_stmt(stmts, nodelist[i]);
    }
    return new AST.Stmt(stmts);
};

Transformer.prototype.expr_stmt = function(nodelist)
{
    // augassign testlist | testlist ('=' testlist)*
    var en = nodelist[nodelist.length - 1];
    var exprNode = this.dispatch(en);
    if (nodelist.length === 1)
        return new AST.Discard(exprNode, exprNode.lineno);
    if (nodelist[1].type === TOK.T_EQUAL)
    {
        var nodesl = [];
        for (var i = 0; i < nodelist.length - 2; i += 2)
        {
            nodesl.push(this.com_assign(nodelist[i], AST.OP_ASSIGN));
        }
        return new AST.Assign(nodesl, exprNode, nodelist[1].context);
    }
    else
    {
        var lval = this.com_augassign(nodelist[0]);
        var op = this.com_augassign_op(nodelist[1]);
        //print("lval:"+JSON.stringify(lval));
        //print("op:"+JSON.stringify(op));
        return new AST.AugAssign(lval, op.value, exprNode, op.context);
    }
};

Transformer.prototype.funcdef = function(nodelist)
{
    //                    -6   -5    -4         -3  -2    -1
    // funcdef: [decorators] 'def' NAME parameters ':' suite
    // parameters: '(' [varargslist] ')'

    var decorators = null;
    if (nodelist.length === 6)
    {
        if (nodelist[0].type !== this.sym.decorators) throw "assert";
        decorators = this.decorators(nodelist[0].children); // ?
    }
    else
    {
        if (nodelist.length !== 5) throw "assert";
    }

    var lineno = nodelist[nodelist.length - 4].context;
    var name = nodelist[nodelist.length - 4].value;
    var args = nodelist[nodelist.length - 3].children[1];
    //print(JSON.stringify(nodelist[nodelist.length - 3].children));
    //print((nodelist[nodelist.length - 3].children.length));

    var names = [];
    var defaults = [];
    var varargs = false;
    var varkeywords = false;
    if (args.type === this.sym.varargslist)
    {
        var ret = this.com_arglist(args.children);
        names = ret[0];
        defaults = ret[1];
        varargs = ret[2];
        varkeywords = ret[3];
    }
    var doc = this.get_docstring(nodelist[nodelist.length - 1]);

    // code for function
    var code = this.dispatch(nodelist[nodelist.length - 1]);

    if (doc)
    {
        if (!code instanceof AST.Stmt) throw "assert";
        if (!code.nodes[0] instanceof AST.Discard) throw "assert";
        code.nodes.shift();
    }
    return new AST.Function_(decorators, name, names, defaults, varargs, varkeywords, doc, code, lineno);
};

Transformer.prototype.lambdef = function(nodelist)
{
    // lambdef: 'lambda' [varargslist] ':' test

    var names = [];
    var defaults = [];
    var flags = 0;
    if (nodelist.children[1].type === this.sym.varargslist)
    {
        var ret = this.com_arglist(nodelist.children[1].children);
        names = ret[0];
        defaults = ret[1];
        flags = ret[2];
    }

    var code = this.dispatch(nodelist.children[nodelist.children.length - 1]);
    return new Lambda(names, defaults, flags, null, code, nodelist.context);
};

Transformer.prototype.com_bases = function(node)
{
    var bases = [];
    for (var i = 0; i < node.children.length; i += 2)
    {
        bases.push(this.dispatch(node.children[i]));
    }
    return bases;
};

Transformer.prototype.classdef = function(nodelist)
{
    // classdef: 'class' NAME ['(' [testlist] ')'] ':' suite
    //print(JSON.stringify(nodelist, null, 2));
    var name = nodelist[1].value;
    var bases;
    if (nodelist[2].type === TOK.T_COLON ||
            nodelist[3].type === TOK.T_RPAR)
    {
        bases = [];
    }
    else
    {
        bases = this.com_bases(nodelist[3]);
    }

    // code for class
    var code = this.dispatch(nodelist[nodelist.length - 1]);

    return new AST.Class_(name, bases, null, code, /*decorators*/ null);
};


Transformer.prototype.print_stmt = function(nodelist)
{
    // print ([ test (',' test)* [','] ] | '>>' test [ (',' test)+ [','] ])
    var items = [];
    var start, dest;
    if (nodelist.length !== 1 && nodelist[1].type === TOK.T_RIGHTSHIFT)
    {
        if (!(nodelist.length === 3 || nodelist[3].type === TOK.T_COMMA)) throw "assert";
        dest = this.dispatch(nodelist[2]);
        start = 4;
    }
    else
    {
        start = 1;
        dest = null;
    }
    for (var i = start; i < nodelist.length; i += 2)
    {
        items.push(this.dispatch(nodelist[i]));
    }
    if (nodelist[nodelist.length - 1].type === TOK.T_COMMA)
        return new AST.Print(items, dest, false, nodelist[0].context);
    return new AST.Print(items, dest, true, nodelist[0].context);
};

Transformer.prototype.if_stmt = function(nodelist)
{
    // if: test ':' suite ('elif' test ':' suite)* ['else' ':' suite]
    var tests = [];
    for (var i = 0; i < nodelist.length - 3; i += 4)
    {
        var testNode = this.dispatch(nodelist[i + 1]);
        var suiteNode = this.dispatch(nodelist[i + 3]);
        tests.push(testNode);
        tests.push(suiteNode);
    }

    var elseNode = null;
    if (nodelist.length % 4 === 3)
        elseNode = this.dispatch(nodelist[nodelist.length - 1]);
    return new AST.If_(tests, elseNode, nodelist[0].context);
};

Transformer.prototype.while_stmt = function(nodelist)
{
    // 'while' test ':' suite ['else' ':' suite]

    var testNode = this.dispatch(nodelist[1]);
    var bodyNode = this.dispatch(nodelist[3]);

    var elseNode = null;
    if (nodelist.length > 4)
        elseNode = this.dispatch(nodelist[6]);

    return new AST.While_(testNode, bodyNode, elseNode, nodelist[0].context);
};

Transformer.prototype.for_stmt = function(nodelist)
{
    // 'for' exprlist 'in' exprlist ':' suite ['else' ':' suite]

    var assignNode = this.dispatch(nodelist[1], AST.OP_ASSIGN);
    var listNode = this.dispatch(nodelist[3]);
    var bodyNode = this.dispatch(nodelist[5]);

    var elseNode = null;
    if (nodelist.length > 8)
        elseNode = this.dispatch(nodelist[8]);

    return new AST.For_(assignNode, listNode, bodyNode, elseNode, nodelist[0].context);
};

Transformer.prototype.del_stmt = function(nodelist)
{
    return this.com_assign(nodelist[1], AST.OP_DELETE);
};

Transformer.prototype.pass_stmt = function(nodelist)
{
    return new AST.Pass(nodelist[0].context);
};

Transformer.prototype.com_dotted_name = function(node)
{
    var name = "";
    for (var i = 0; i < node.length; ++i)
    {
        if (node[i].type === TOK.T_NAME) name += node[i].value + ".";
    }
    return name.substr(0, name.length - 1);
};

Transformer.prototype.com_dotted_as_name = function(node)
{
    //print(JSON2.stringify(node, null, 2));
    if (node.type !== this.sym.dotted_as_name) throw "assert";
    var dot = this.com_dotted_name(node.children[0].children);
    if (node.children.length === 1)
    {
        return [dot, null];
    }
    if (node.children[2].value !== 'as') throw "assert";
    if (node.children[3].type !== TOK.T_NAME) throw "assert";
    return [dot, node.children[3].value];
};

Transformer.prototype.com_dotted_as_names = function(node)
{
    if (node.type !== this.sym.dotted_as_names) throw "assert";
    var names = [];
    //print("node.children.length", node.children.length);
    for (var i = 0; i < node.children.length; i += 2)
    {
        names.push(this.com_dotted_as_name(node.children[i]));
    }
    return names;
};

/*
    def com_import_as_name(self, node):
        assert node[0] == symbol.import_as_name
        node = node[1:]
        assert node[0][0] == token.NAME
        if len(node) == 1:
            return node[0][1], None
        assert node[1][1] == 'as', node
        assert node[2][0] == token.NAME
        return node[0][1], node[2][1]

    def com_import_as_names(self, node):
        assert node[0] == symbol.import_as_names
        node = node[1:]
        //names = [self.com_import_as_name(node[0])]
        for i in range(2, len(node), 2):
            names.append(self.com_import_as_name(node[i]))
        return names
*/
Transformer.prototype.import_stmt = function(nodelist)
{
    // import_stmt: import_name | import_from
    if (nodelist.length !== 1) throw "assert";
    return this.dispatch(nodelist[0]);
};

Transformer.prototype.import_name = function(nodelist)
{
    // import_name: 'import' dotted_as_names
    return new Import_(this.com_dotted_as_names(nodelist[1]), nodelist.context);
};

Transformer.prototype.import_from = function(nodelist)
{
    throw "todo;";
/*
    def import_from(self, nodelist):
        # import_from: 'from' ('.'* dotted_name | '.') 'import' ('*' |
        #    '(' import_as_names ')' | import_as_names)
        assert nodelist[0][1] == 'from'
        idx = 1
        while nodelist[idx][1] == '.':
            idx += 1
        level = idx - 1
        if nodelist[idx][0] == symbol.dotted_name:
            fromname = self.com_dotted_name(nodelist[idx])
            idx += 1
        else:
            fromname = ""
        assert nodelist[idx][1] == 'import'
        if nodelist[idx + 1][0] == token.STAR:
            return From(fromname, [('*', None)], level,
                        lineno=nodelist[0][2])
        else:
            node = nodelist[idx + 1 + (nodelist[idx + 1][0] == token.LPAR)]
            return From(fromname, self.com_import_as_names(node), level,
                        lineno=nodelist[0][2])
*/
};


Transformer.prototype.global_stmt = function(nodelist)
{
    // global: NAME (',' NAME)*
    var names = [];
    for (var i = 1; i < nodelist.length; i += 2)
    {
        names.push(nodelist[i].value);
    }
    return new AST.Global(names, nodelist[0].context);
};

Transformer.prototype.break_stmt = function(nodelist)
{
    return new AST.Break_(nodelist[0].context);
};

Transformer.prototype.continue_stmt = function(nodelist)
{
    return new AST.Continue_(nodelist[0].context);
};

Transformer.prototype.assert_stmt = function(nodelist)
{
    return new AST.Assert(this.dispatch(nodelist[1]), nodelist[0].context);
};

Transformer.prototype.return_stmt = function(nodelist)
{
    // return: [testlist]
    if (nodelist.length < 2)
        return new AST.Return_(null, nodelist[0].context);
    return new AST.Return_(this.dispatch(nodelist[1]), nodelist[0].context);
};

Transformer.prototype.yield_stmt = function(nodelist)
{
    var expr = this.dispatch(nodelist[0]);
    return new AST.Discard(expr, expr.context);
};

Transformer.prototype.yield_expr = function(nodelist)
{
    var value;
    //print("yield_expr:"+JSON.stringify(nodelist));
    if (nodelist.length > 1)
        value = this.dispatch(nodelist[1]);
    else
        value = new Const_(null);
    return new AST.Yield_(value, nodelist.context);
};

/*
    def try_stmt(self, nodelist):
        return self.com_try_except_finally(nodelist)

    def with_stmt(self, nodelist):
        return self.com_with(nodelist)

    def with_var(self, nodelist):
        return self.com_with_var(nodelist)
*/

Transformer.prototype.suite = function(nodelist)
{
    // simple_stmt | NEWLINE INDENT NEWLINE* (stmt NEWLINE*)+ DEDENT
    if (nodelist.length === 1)
        return this.dispatch(nodelist[0]);

    var stmts = [];
    for (var i = 0; i < nodelist.length; ++i)
    {
        var node = nodelist[i];
        if (node.type === this.sym.stmt)
            this.com_append_stmt(stmts, node);
    }
    return new AST.Stmt(stmts);
};

Transformer.prototype.testlist_gexp = function(nodelist)
{
    //print("testlist_gexp:"+JSON.stringify(nodelist));
    //print("nodelist.length", nodelist.length);
    //print("nodelist[1].type", nodelist[1].type);
    if (nodelist.length === 2 && nodelist[1].type === this.sym.comp_for)
    {
        var test = this.dispatch(nodelist[0]);
        return this.com_generator_expression(test, nodelist[1]);
    }
    return this.testlist(nodelist);
};

Transformer.prototype.test = function(nodelist)
{
    // or_test ['if' or_test 'else' test] | lambdef
    if (nodelist.length === 1 && nodelist[0].type === this.sym.lambdef)
        return this.lambdef(nodelist[0]);
    var then = this.dispatch(nodelist[0]);
    if (nodelist.length > 1)
    {
        if (nodelist.length !== 5) throw "assert";
        if (nodelist[1].value !== "if") throw "assert";
        if (nodelist[3].value !== "if") throw "else";
        var test = this.dispatch(nodelist[2]);
        var else_ = this.dispatch(nodelist[4]);
        return new IfExp(test, then, else_, nodelist[1].context);
    }
    return then;
};

Transformer.prototype.com_generator_expression = function(expr, node)
{
    // comp_iter: comp_for | comp_if
    // comp_for: 'for' exprlist 'in' testlist_safe [comp_iter]
    // comp_if: 'if' old_test [comp_iter]
    var fors = [];
    //print("com_generator_expression:"+JSON.stringify(node));
    var lineno = node.context;
    while (node)
    {
        var t = node.children[0].value;
        if (t === "for")
        {
            var assignNode = this.com_assign(node.children[1], AST.OP_ASSIGN);
            var genNode = this.dispatch(node.children[3]);
            var newfor = new AST.GenExprFor(assignNode, genNode, [], lineno);
            fors.push(newfor);
            if (node.children.length === 4)
                node = null;
            else
                node = this.com_gen_iter(node.children[4]);
            //print(JSON2.stringify(node))
        }
        else if (t === "if")
        {
            var test = this.dispatch(node.children[1]);
            var newif = new AST.GenExprIf(test, lineno);
            newfor.ifs.push(newif);
            if (node.children.length === 2)
                node = null;
            else
                node = this.com_gen_iter(node.chidlren[2]);
        }
        else
        {
            throw new SyntaxError("unexpected generator expression element");
        }
    }
    fors[0].is_outmost = true;
    return new AST.GenExpr(new AST.GenExprInner(expr, fors), lineno);
};

Transformer.prototype.com_gen_iter = function(node)
{
    if (node.type !== this.sym.comp_iter) throw "assert";
    return node.children[0];
};

Transformer.prototype.or_test =
Transformer.prototype.old_test = function(nodelist)
{
    // and_test ('or' and_test)* | lambdef
    if (nodelist.length === 1 && nodelist[0].type === this.sym.lambdef)
        return this.lambdef(nodelist[0]);
    return this.com_binary(AST.Or, nodelist);
};


Transformer.prototype.and_test = function(nodelist)
{
    // not_test ('and' not_test)*
    return this.com_binary(AST.And, nodelist);
};

Transformer.prototype.not_test = function(nodelist)
{
    // 'not' not_test | comparison
    var result = this.dispatch(nodelist[nodelist.length - 1]);
    if (nodelist.length === 2)
    {
        return new AST.Not(result, nodelist.context);
    }
    return result;
};

Transformer.prototype.comparison = function(nodelist)
{
    // comparison: expr (comp_op expr)*
    var node = this.dispatch(nodelist[0]);
    if (nodelist.length === 1) return node;

    var results = [];
    for (var i = 2; i < nodelist.length; i += 2)
    {
        var nl = nodelist[i - 1];

        // comp_op: '<' | '>' | '=' | '>=' | '<=' | '<>' | '!=' | '=='
        //          | 'in' | 'not' 'in' | 'is' | 'is' 'not'
        var n = nl.children[0];
        var type;
        //print(JSON.stringify(nl));
        if (n.type === TOK.T_NAME)
        {
            type = n.value;
            if (nl.children.length === 2)
            {
                if (type === "not") type = "not in";
                else type = "is not";
            }
        }
        else
        {
            type = this.cmp_types[n.type];
        }

        var lineno = nl.children[0].context;
        results.push(type);
        results.push(this.dispatch(nodelist[i]));
    }

    // we need a special "compare" node so that we can distinguish
    //   3 < x < 5   from    (3 < x) < 5
    // the two have very different semantics and results (note that the
    // latter form is always true)

    //print(JSON.stringify(results));
    return new AST.Compare(node, results, lineno);
};

Transformer.prototype.expr = function(nodelist)
{
    // xor_expr ('|' xor_expr)*
    return this.com_binary(AST.Bitor, nodelist);
};

Transformer.prototype.xor_expr = function(nodelist)
{
    // xor_expr ('^' xor_expr)*
    return this.com_binary(AST.Bitxor, nodelist);
};

Transformer.prototype.and_expr = function(nodelist)
{
    // xor_expr ('&' xor_expr)*
    return this.com_binary(AST.Bitand, nodelist);
};

Transformer.prototype.shift_expr = function(nodelist)
{
    // shift_expr ('<<'|'>>' shift_expr)*
    var node = this.dispatch(nodelist[0]);
    for (var i = 2; i < nodelist.length; i += 2)
    {
        var right = this.dispatch(nodelist[i]);
        if (nodelist[i - 1].type === TOK.T_LEFTSHIFT)
            node = new AST.LeftShift(node, right, nodelist[1].context);
        else if (nodelist[i - 1].type === TOK.T_RIGHTSHIFT)
            node = new AST.RightShift(node, right, nodelist[1].context);
        else
            throw new SyntaxError("unexpected token: " + this.grammar.number2symbol[nodelist[i-1].type]);
    }
    return node;
};

Transformer.prototype.arith_expr = function(nodelist)
{
    var node = this.dispatch(nodelist[0]);
    for (var i = 2; i < nodelist.length; i += 2)
    {
        var right = this.dispatch(nodelist[i]);
        if (nodelist[i-1].type === TOK.T_PLUS)
            node = new AST.Add(node, right, nodelist[1].context);
        else if (nodelist[i-1].type === TOK.T_MINUS)
            node = new AST.Sub(node, right, nodelist[1].context);
        else
            throw new SyntaxError("unexpected token: " + this.grammar.number2symbol[nodelist[i-1].type]);
    }
    return node;
};

Transformer.prototype.term = function(nodelist)
{
    var node = this.dispatch(nodelist[0]);
    for (var i = 2; i < nodelist.length; i += 2)
    {
        var right = this.dispatch(nodelist[i]);
        var t = nodelist[i - 1].type;
        if (t === TOK.T_STAR) node = new AST.Mul(node, right);
        else if (t === TOK.T_SLASH) node = new AST.Div(node, right);
        else if (t === TOK.T_PERCENT) node = new AST.Mod(node, right);
        else if (t === TOK.T_DOUBLESLASH) node = new AST.FloorDiv(node, right);
        else throw new SyntaxError("unexpected token: " + this.grammar.number2symbol[t]);
        node.lineno = nodelist[1].context;
    }
    return node;
};

Transformer.prototype.factor = function(nodelist)
{
    //print("factor");
    var elt = nodelist[0];
    var t = elt.type;
    var node = this.dispatch(nodelist[nodelist.length - 1]);
    // need to handle (unary op)constant here...
    if (t === TOK.T_PLUS)
        node = new AST.UnaryAdd(node, elt.context);
    else if (t === TOK.T_MINUS)
        node = new AST.UnarySub(node, elt.context);
    else if (t === TOK.T_TILDE)
        node = new AST.Invert(node, elt.context);
    return node;
};

Transformer.prototype.power = function(nodelist)
{
    // power: atom trailer* ('**' factor)*
    var node = this.dispatch(nodelist[0]);
    for (var i = 1; i < nodelist.length; ++i)
    {
        var elt = nodelist[i];
        if (elt.type === TOK.T_DOUBLESTAR)
        {
            return new AST.Power(node, this.dispatch(nodelist[i+1]), elt.context);
        }
        node = this.com_apply_trailer(node, elt);
    }

    return node;
};

Transformer.prototype.testlist =
Transformer.prototype.testlist_safe =
Transformer.prototype.testlist1 =
Transformer.prototype.exprlist =
function(nodelist)
{
    // testlist: expr (',' expr)* [',']
    // testlist_safe: test [(',' test)+ [',']]
    // exprlist: expr (',' expr)* [',']
    return this.com_binary(AST.Tuple, nodelist);
};

Transformer.prototype.atom = function(nodelist)
{
    var t = nodelist[0].type;
    return this[t].call(this, nodelist);
};

Transformer.prototype[TOK.T_LPAR] = function(nodelist)
{
    if (nodelist[1].type === TOK.T_RPAR)
        return new AST.Tuple([], nodelist[0].context);
    return this.dispatch(nodelist[1]);
};

Transformer.prototype[TOK.T_LSQB] = function(nodelist)
{
    if (nodelist[1].type === TOK.T_RSQB)
        return new AST.List([], nodelist[0].context);
    return this.com_list_constructor(nodelist[1]);
};

Transformer.prototype[TOK.T_LBRACE] = function(nodelist)
{
    if (nodelist[1].type === TOK.T_RBRACE)
        return new AST.Dict([], nodelist[0].context);
    return this.com_dictmaker(nodelist[1]);
};

Transformer.prototype[TOK.T_BACKQUOTE] = function(nodelist)
{
    return new AST.Backquote(this.com_node(nodelist[1]));
};

Transformer.prototype[TOK.T_NUMBER] = function(nodelist)
{
    var v = nodelist[0].value;
    var k;
    if (v.charAt(v.length - 1) === "l" || v.charAt(v.length - 1) === "L")
    {
        k = Sk.builtin.long.threshold$.fromJsStr$(v.substring(0, v.length - 1));
    }
    else
    {
        k = eval(nodelist[0].value);
        if ((k > Sk.builtin.long.threshold$ || k < -Sk.builtin.long.threshold$)
                && Math.floor(k) === k) // todo; what to do with floats?
        {
            k = Long$.fromJsStr$(nodelist[0].value);
        }
    }
    return new AST.Const_(k, nodelist[0].context);
};

Transformer.prototype[TOK.T_STRING] = function(nodelist)
{
    return new AST.Const_(nodelist[0].value, nodelist[0].context);
};

Transformer.prototype[TOK.T_NAME] = function(nodelist)
{
    return new AST.Name(nodelist[0].value, nodelist[0].context);
};

}());
