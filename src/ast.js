//
// This is pretty much a straight port of ast.c from CPython 2.6.5.
//
// The previous version was easier to work with and more JS-ish, but having a
// somewhat different ast structure than cpython makes testing more difficult.
//
// This way, we can use a dump from the ast module on any arbitrary python
// code and know that we're the same up to ast level, at least.
//

var SYM = Sk.ParseTables.sym;
var TOK = Sk.Tokenizer;

/** @constructor */
function Compiling(encoding, filename)
{
    this.c_encoding = encoding;
    this.c_filename = filename;
}

/**
 * @nosideeffects
 * @return {number}
 */
function NCH(n) { goog.asserts.assert(n !== undefined); return n.children.length; }

/**
 * @nosideeffects
 */
function CHILD(n, i) { goog.asserts.assert(n !== undefined); goog.asserts.assert(i !== undefined); return n.children[i]; }

function REQ(n, type) { goog.asserts.assert(n.type === type, "node wasn't expected type"); }

/** @return {number} */
function numStmts(n)
{
    switch (n.type)
    {
        case SYM.single_input:
            if (CHILD(n, 0).type === TOK.T_NEWLINE)
                return 0;
            else
                return numStmts(CHILD(n, 0));
        case SYM.file_input:
            var cnt = 0;
            for (var i = 0; i < NCH(n); ++i)
            {
                var ch = CHILD(n, i);
                if (ch.type === SYM.stmt)
                    cnt += numStmts(ch);
            }
            return cnt;
        case SYM.stmt:
            return numStmts(CHILD(n, 0));
        case SYM.compound_stmt:
            return 1;
        case SYM.simple_stmt:
            return Math.floor(NCH(n) / 2); // div 2 is to remove count of ;s
        case SYM.suite:
            if (NCH(n) === 1)
                return numStmts(CHILD(n, 0));
            else
            {
                 var cnt = 0;
                 for (var i = 2; i < NCH(n) - 1; ++i)
                     cnt += numStmts(CHILD(n, i));
                 return cnt;
            }
        default:
            goog.asserts.fail("Non-statement found");
    }
    /** @unreachable */
    return 0;
}

function parsestr(c, s)
{
    var quote = s.substr(0, 1);

    // todo; the string we get here still has the " or u""", or etc. Currently, we use JS strings raw.
    // need to decode u'', b'', r'', etc. as well as backslash escapes

    // todo; hack! just remove single quotes for now
    return s.substr(1, s.length - 2);
}

function parsestrplus(c, n)
{
    REQ(CHILD(n, 0), TOK.T_STRING);
    var ret = "";
    for (var i = 0; i < NCH(n); ++i)
    {
        ret += parsestr(c, CHILD(n, i).value);
    }
    return ret;
}

function astForAtom(c, n)
{
    /* atom: '(' [yield_expr|testlist_gexp] ')' | '[' [listmaker] ']'
       | '{' [dictmaker] '}' | '`' testlist '`' | NAME | NUMBER | STRING+
    */
    var ch = CHILD(n, 0);
    switch (ch.type)
    {
        case TOK.T_NAME:
            // All names start in Load context, but may be changed later
            return new Name(ch.value, expr_context.Load, n.lineno, n.col_offset);
        case TOK.T_STRING:
            return new Str(parsestrplus(c, n), n.lineno, n.col_offset);
        case TOK.T_NUMBER:
            return new Num(ch.value, n.lineno, n.col_offset);
        case TOK.LPAR: // various uses for parens
            ch = CHILD(n, 1);
            if (ch.type === TOK.RPAR)
                return new Tuple(null, expr_context.Load, n.lineno, n.col_offset);
            if (ch.type === SYM.yield_expr)
                return astForExpr(c, ch);
            if (NCH(ch) > 1 && CHILD(ch, 1).type === SYM.gen_for)
                return astForGenexp(c, ch);
            return astForTestlistGexp(c, ch);
        case TOK.LSQB: // list or listcomp
            ch = CHILD(n, 1);
            if (ch.type === RSQB)
                return new List(null, expr_context.Load, n.lineno, n.col_offset);
            REQ(ch, SYM.listmaker);
            if (NCH(ch) === 1 || CHILD(ch, 1).type === TOK.T_COMMA)
                return new List(seqForTestlist(c, ch), expr_context.Load, n.lineno, n.col_offset);
            else
                return astForListcomp(c, ch);
        case TOK.LBRACE:
            /* dictmaker: test ':' test (',' test ':' test)* [','] */
            ch = CHILD(n, 1);
            var size = Math.floor((NCH(ch) + 1) / 4); // + 1 for no trailing comma case
            var keys = [];
            var values = [];
            for (var i = 0; i < NCH(ch); i += 4)
            {
                keys[i / 4] = astForExpr(c, CHILD(ch, i));
                values[i / 4] = astForExpr(c, CHILD(ch, i + 2));
            }
            return new Dict(keys, values, n.lineno, n.col_offset);
        case TOK.T_BACKQUOTE:
            throw new SyntaxError("backquote not supported, use repr()");
        default:
            goog.asserts.fail("unhandled atom", ch.type);
    }
}

function astForPower(c, n)
{
    /* power: atom trailer* ('**' factor)*
     */
    REQ(n, SYM.power);
    var e = astForAtom(c, CHILD(n, 0));
    if (NCH(n) === 1) return e;
    for (var i = 1; i < NCH(n); ++i)
    {
        var ch = CHILD(n, i);
        if (ch.type !== SYM.trailer)
            break;
        var tmp = astForTrailer(c, ch, e);
        tmp.lineno = e.lineno;
        tmp.col_offset = e.col_offset;
        e = tmp;
    }
    if (CHILD(n, NCH(n) - 1).type === SYM.factor)
    {
        var f = astForExpr(c, CHILD(n, NCH(n) - 1));
        e = new BinOp(e, binop.Pow, f, n.lineno, n.col_offset);
    }
    return e;
}

function astForExpr(c, n)
{
    /* handle the full range of simple expressions
       test: or_test ['if' or_test 'else' test] | lambdef
       or_test: and_test ('or' and_test)* 
       and_test: not_test ('and' not_test)*
       not_test: 'not' not_test | comparison
       comparison: expr (comp_op expr)*
       expr: xor_expr ('|' xor_expr)*
       xor_expr: and_expr ('^' and_expr)*
       and_expr: shift_expr ('&' shift_expr)*
       shift_expr: arith_expr (('<<'|'>>') arith_expr)*
       arith_expr: term (('+'|'-') term)*
       term: factor (('*'|'/'|'%'|'//') factor)*
       factor: ('+'|'-'|'~') factor | power
       power: atom trailer* ('**' factor)*

       As well as modified versions that exist for backward compatibility,
       to explicitly allow:
       [ x for x in lambda: 0, lambda: 1 ]
       (which would be ambiguous without these extra rules)
       
       old_test: or_test | old_lambdef
       old_lambdef: 'lambda' [vararglist] ':' old_test

    */

    LOOP: while (true) {
        switch (n.type)
        {
            case SYM.test:
            case SYM.old_test:
                if (CHILD(n, 0).type === SYM.lambdef || CHILD(n, 0).type === SYM.old_lambdef)
                    return astForLambdef(c, CHILD(n, 0));
                else if (NCH(n) > 1)
                    return astForIfexpr(c, n);
                // fallthrough
            case SYM.or_test:
            case SYM.and_test:
                if (NCH(n) === 1)
                {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                var seq = [];
                for (var i = 0; i < NCH(n); i += 2)
                    seq[i / 2] = astForExpr(c, CHILD(n, i));
                if (CHILD(n, 1).value === "and")
                    return new BoolOp(boolop.And, seq, n.lineno, n.col_offset);
                goog.asserts.assert(CHILD(n, 1).value === "or");
                return new BoolOp(boolop.Or, seq, n.lineno, n.col_offset);
            case SYM.not_test:
                if (NCH(n) === 1)
                {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                else
                {
                    return new UnaryOp(unaryop.Not, astForExpr(c, CHILD(n, 1)), n.lineno, n.col_offset);
                }
            case SYM.comparison:
                if (NCH(n) === 1)
                {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                else
                {
                    var ops = [];
                    var cmps = [];
                    for (var i = 1; i < NCH(n); i += 2)
                    {
                        ops[i / 2] = astForCompOp(c, CHILD(n, i));
                        cmps[i / 2] = astForExpr(c, CHILD(n, i + 1));
                    }
                    return new Compare(astForExpr(c, CHILD(n, 0)), ops, cmps, n.lineno, n.col_offset);
                }
            case SYM.expr:
            case SYM.xor_expr:
            case SYM.and_expr:
            case SYM.shift_expr:
            case SYM.arith_expr:
            case SYM.term:
                if (NCH(n) === 1)
                {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                return astForBinop(c, n);
            case SYM.yield_expr:
                var exp = null;
                if (NCH(n) === 2)
                {
                    exp = astForTestlist(c, CHILD(n, 1))
                }
                return new Yield(exp, n.lineno, n.col_offset);
            case SYM.factor:
                if (NCH(n) === 1)
                {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                return astForFactor(c, n);
            case SYM.power:
                return astForPower(c, n);
            default:
                goog.asserts.fail("unhandled expr", "n.type: %d", n.type);
        }
    break; }
}

function astForPrintStmt(c, n)
{
    /* print_stmt: 'print' ( [ test (',' test)* [','] ]
                             | '>>' test [ (',' test)+ [','] ] )
     */
    var start = 1;
    var dest = null;
    REQ(n, SYM.print_stmt);
    if (NCH(n) >= 2 && CHILD(n, 1).type === TOK.T_RIGHTSHIFT)
    {
        dest = astForExpr(c, CHILD(n, 2));
        start = 4;
    }
    var seq = [];
    for (var i = start, j = 0; i < NCH(n); i += 2, ++j)
    {
        seq[j] = astForExpr(c, CHILD(n, i));
    }
    var nl = (CHILD(n, NCH(n) - 1)).type === TOK.T_COMMA ? false : true;
    return new Print(dest, seq, nl, n.lineno, n.col_offset);
}

function astForStmt(c, n)
{
    if (n.type === SYM.stmt)
    {
        goog.asserts.assert(NCH(n) === 1);
        n = CHILD(n, 0);
    }
    if (n.type === SYM.simple_stmt)
    {
        goog.asserts.assert(numStmts(n) === 1);
        n = CHILD(n, 0);
    }
    if (n.type === SYM.small_stmt)
    {
        REQ(n, SYM.small_stmt);
        n = CHILD(n, 0);
        /* small_stmt: expr_stmt | print_stmt  | del_stmt | pass_stmt
                     | flow_stmt | import_stmt | global_stmt | exec_stmt
                     | assert_stmt
        */
        switch (n.type)
        {
            case SYM.expr_stmt: return astForExprStmt(c, n);
            case SYM.print_stmt: return astForPrintStmt(c, n);
            case SYM.del_stmt: return astForDelStmt(c, n);
            case SYM.pass_stmt: return new Pass(n.lineno, n.col_offset);
            case SYM.flow_stmt: return astForFlowStmt(c, n);
            case SYM.import_stmt: return astForImportStmt(c, n);
            case SYM.global_stmt: return astForGlobalStmt(c, n);
            case SYM.exec_stmt: return astForExecStmt(c, n);
            case SYM.assert_stmt: return astForAssertStmt(c, n);
            default: goog.asserts.fail("unhandled small_stmt");
        }
    }
    else
    {
        /* compound_stmt: if_stmt | while_stmt | for_stmt | try_stmt
                        | funcdef | classdef | decorated
        */
        var ch = CHILD(n, 0);
        REQ(n, SYM.compound_stmt);
        switch (ch.type)
        {
            case SYM.if_stmt: return astForIfStmt(c, ch);
            case SYM.while_stmt: return astForWhileStmt(c, ch);
            case SYM.for_stmt: return astForForStmt(c, ch);
            case SYM.try_stmt: return astForTryStmt(c, ch);
            case SYM.with_stmt: return astForWith1Stmt(c, ch);
            case SYM.funcdef: return astForFuncdef(c, ch, null);
            case SYM.classdef: return astForClassdef(c, ch, null);
            case SYM.decorated: return astForDecorated(c, ch);
            default: goog.asserts.assert("unhandled compound_stmt");
        }
    }
}

Sk.astFromParse = function(n, filename)
{
    var c = new Compiling("utf-8", filename);

    var stmts = [];
    var ch;
    var k = 0;
    switch (n.type)
    {
        case SYM.file_input:
            for (var i = 0; i < NCH(n) - 1; ++i)
            {
                var ch = CHILD(n, i);
                if (n.type === TOK.T_NEWLINE)
                    continue;
                REQ(ch, SYM.stmt);
                var num = numStmts(ch);
                if (num === 1)
                {
                    stmts[k++] = astForStmt(c, ch);
                }
                else
                {
                    ch = CHILD(ch, 0);
                    REQ(ch, SYM.simple_stmt);
                    for (var j = 0; j < num; ++j)
                    {
                        stmts[k++] = astForStmt(c, CHILD(ch, j * 2));
                    }
                }
            }
            return new Module(stmts);
        case SYM.eval_input:
            goog.asserts.fail("todo;");
        case SYM.single_input:
            goog.asserts.fail("todo;");
        default:
            goog.asserts.fail("todo;");
    }
};

Sk.astDump = function(node)
{
    var spaces = function(n) // todo; blurgh
    {
        var ret = "";
        for (var i = 0; i < n; ++i)
            ret += " ";
        return ret;
    }

    var _format = function(node, indent)
    {
        if (node === null)
        {
            return indent+"None";
        }
        else if (node.constructor._astname !== undefined)
        {
            var nctor = node.constructor;
            var namelen = spaces(nctor._astname.length + 1);
            var fields = [];
            for (var i = 0; i < nctor._fields.length; i += 2) // iter_fields
            {
                var a = nctor._fields[i]; // field name
                var b = nctor._fields[i + 1](node); // field getter func
                var fieldlen = spaces(a.length + 1);
                fields.push([a, _format(b, indent + namelen + fieldlen)]);
            }
            var attrs = [];
            for (var i = 0; i < fields.length; ++i)
            {
                var field = fields[i];
                attrs.push(field[0] + "=" + field[1].replace(/^\s+/, ''));
            }
            var fieldstr = attrs.join(',\n' + indent + namelen);
            return indent + nctor._astname + "(" + fieldstr + ")";
        }
        else if (goog.isArrayLike(node))
        {
            var elems = [];
            for (var i = 0; i < node.length; ++i)
            {
                var x = node[i];
                elems.push(_format(x, indent + " "));
            }
            var elemsstr = elems.join(',\n');
            return indent + "[" + elemsstr.replace(/^\s+/, '') + "]";
        }
        else
        {
            var ret;
            if (typeof node === "string") ret = "'" + node + "'";
            else if (node === true) ret = "True";
            else if (node === false) ret = "False";
            else ret = "" + node;
            return indent + ret;
        }
    };

    return _format(node, "");
};

goog.exportSymbol("Sk.astFromParse", Sk.astFromParse);
