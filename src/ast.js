//
// This is pretty much a straight port of ast.c from CPython 3.7.3
// (with a few leftovers from 2.6.5).
//
// The previous version was easier to work with and more JS-ish, but having a
// somewhat different ast structure than cpython makes testing more difficult.
//
// This way, we can use a dump from the ast module on any arbitrary python
// code and know that we're the same up to ast level, at least.
//

var SYM = Sk.ParseTables.sym;
var TOK = Sk.token.tokens;
var COMP_GENEXP = 0;
var COMP_LISTCOMP = 1;
var COMP_SETCOMP = 2;
var NULL = null;
var _slice_kind = { 
    Slice_kind: 1,
    ExtSlice_kind: 2, 
    Index_kind: 3
};

var _expr_kind = {
    BoolOp_kind: 1, NamedExpr_kind: 2, BinOp_kind: 3, UnaryOp_kind: 4,
    Lambda_kind: 5, IfExp_kind: 6, Dict_kind: 7, Set_kind: 8,
    ListComp_kind: 9, SetComp_kind: 10, DictComp_kind: 11,
    GeneratorExp_kind: 12, Await_kind: 13, Yield_kind: 14,
    YieldFrom_kind: 15, Compare_kind: 16, Call_kind: 17,
    FormattedValue_kind: 18, JoinedStr_kind: 19, Constant_kind: 20,
    Attribute_kind: 21, Subscript_kind: 22, Starred_kind: 23,
    Name_kind: 24, List_kind: 25, Tuple_kind: 26 };

/** @constructor */
function Compiling (encoding, filename, c_flags) {
    this.c_encoding = encoding;
    this.c_filename = filename;
    this.c_flags = c_flags || 0;
}

/**
 * @return {number}
 */
function NCH (n) {
    Sk.asserts.assert(n !== undefined, "node must be defined");
    if (n.children === null) {
        return 0;
    }
    return n.children.length;
}

function CHILD (n, i) {
    Sk.asserts.assert(n !== undefined, "node must be defined");
    Sk.asserts.assert(i !== undefined, "index of child must be specified");
    return n.children[i];
}

function REQ (n, type) {
    Sk.asserts.assert(n.type === type, "node wasn't expected type");
}

function TYPE(n) {
    return n.type;
}

function LINENO(n) {
    return n.lineno;
}

function STR(ch) {
    return ch.value;
}

function ast_error(c, n, msg) {
    throw new Sk.builtin.SyntaxError(msg, c.c_filename, n.lineno);
}

function strobj (s) {
    Sk.asserts.assert(typeof s === "string", "expecting string, got " + (typeof s));
    return new Sk.builtin.str(s);
}

/** @return {number} */
function numStmts (n) {
    var ch;
    var i;
    var cnt;
    switch (n.type) {
        case SYM.single_input:
            if (CHILD(n, 0).type === TOK.T_NEWLINE) {
                return 0;
            }
            else {
                return numStmts(CHILD(n, 0));
            }
        case SYM.file_input:
            cnt = 0;
            for (i = 0; i < NCH(n); ++i) {
                ch = CHILD(n, i);
                if (ch.type === SYM.stmt) {
                    cnt += numStmts(ch);
                }
            }
            return cnt;
        case SYM.stmt:
            return numStmts(CHILD(n, 0));
        case SYM.compound_stmt:
            return 1;
        case SYM.simple_stmt:
            return Math.floor(NCH(n) / 2); // div 2 is to remove count of ;s
        case SYM.suite:
            if (NCH(n) === 1) {
                return numStmts(CHILD(n, 0));
            }
            else {
                cnt = 0;
                for (i = 2; i < NCH(n) - 1; ++i) {
                    cnt += numStmts(CHILD(n, i));
                }
                return cnt;
            }
            break;
        default:
            Sk.asserts.fail("Non-statement found");
    }
    return 0;
}

function forbiddenCheck (c, n, x, lineno) {
    if (x instanceof Sk.builtin.str) {
        x = x.v;
    }
    if (x === "None") {
        throw new Sk.builtin.SyntaxError("assignment to None", c.c_filename, lineno);
    }
    if (x === "True" || x === "False") {
        throw new Sk.builtin.SyntaxError("assignment to True or False is forbidden", c.c_filename, lineno);
    }
}

/**
 * Set the context ctx for e, recursively traversing e.
 *
 * Only sets context for expr kinds that can appear in assignment context as
 * per the asdl file.
 */
function setContext (c, e, ctx, n) {
    var i;
    var exprName;
    var s;
    Sk.asserts.assert(ctx !== Sk.astnodes.AugStore && ctx !== Sk.astnodes.AugLoad, "context not AugStore or AugLoad");
    s = null;
    exprName = null;

    switch (e.constructor) {
        case Sk.astnodes.Attribute:
        case Sk.astnodes.Name:
            if (ctx === Sk.astnodes.Store) {
                forbiddenCheck(c, n, e.attr, n.lineno);
            }
            e.ctx = ctx;
            break;
        case Sk.astnodes.Starred:
            e.ctx = ctx;
            setContext(c, e.value, ctx, n);
            break;
        case Sk.astnodes.Subscript:
            e.ctx = ctx;
            break;
        case Sk.astnodes.List:
            e.ctx = ctx;
            s = e.elts;
            break;
        case Sk.astnodes.Tuple:
            if (e.elts.length === 0) {
                throw new Sk.builtin.SyntaxError("can't assign to ()", c.c_filename, n.lineno);
            }
            e.ctx = ctx;
            s = e.elts;
            break;
        case Sk.astnodes.Lambda:
            exprName = "lambda";
            break;
        case Sk.astnodes.Call:
            exprName = "function call";
            break;
        case Sk.astnodes.BoolOp:
        case Sk.astnodes.BinOp:
        case Sk.astnodes.UnaryOp:
            exprName = "operator";
            break;
        case Sk.astnodes.GeneratorExp:
            exprName = "generator expression";
            break;
        case Sk.astnodes.Yield:
            exprName = "yield expression";
            break;
        case Sk.astnodes.ListComp:
            exprName = "list comprehension";
            break;
        case Sk.astnodes.SetComp:
            exprName = "set comprehension";
            break;
        case Sk.astnodes.DictComp:
            exprName = "dict comprehension";
            break;
        case Sk.astnodes.Dict:
        case Sk.astnodes.Set:
        case Sk.astnodes.Num:
        case Sk.astnodes.Str:
            exprName = "literal";
            break;
        case Sk.astnodes.NameConstant:
            exprName = "True, False or None";
            break;
        case Sk.astnodes.Compare:
            exprName = "comparison";
            break;
        case Sk.astnodes.Repr:
            exprName = "repr";
            break;
        case Sk.astnodes.IfExp:
            exprName = "conditional expression";
            break;
        default:
            Sk.asserts.fail("unhandled expression in assignment");
    }
    if (exprName) {
        throw new Sk.builtin.SyntaxError("can't " + (ctx === Sk.astnodes.Store ? "assign to" : "delete") + " " + exprName, c.c_filename, n.lineno);
    }

    if (s) {
        for (i = 0; i < s.length; ++i) {
            setContext(c, s[i], ctx, n);
        }
    }
}

var operatorMap = {};
(function () {
    operatorMap[TOK.T_VBAR] = Sk.astnodes.BitOr;
    operatorMap[TOK.T_CIRCUMFLEX] = Sk.astnodes.BitXor;
    operatorMap[TOK.T_AMPER] = Sk.astnodes.BitAnd;
    operatorMap[TOK.T_LEFTSHIFT] = Sk.astnodes.LShift;
    operatorMap[TOK.T_RIGHTSHIFT] = Sk.astnodes.RShift;
    operatorMap[TOK.T_PLUS] = Sk.astnodes.Add;
    operatorMap[TOK.T_MINUS] = Sk.astnodes.Sub;
    operatorMap[TOK.T_STAR] = Sk.astnodes.Mult;
    operatorMap[TOK.T_SLASH] = Sk.astnodes.Div;
    operatorMap[TOK.T_DOUBLESLASH] = Sk.astnodes.FloorDiv;
    operatorMap[TOK.T_PERCENT] = Sk.astnodes.Mod;
}());

Sk.setupOperators = function (py3) {
    if (py3) {
        operatorMap[TOK.T_AT] = Sk.astnodes.MatMult;
    } else {
        if (operatorMap[TOK.T_AT]) {
            delete operatorMap[TOK.T_AT];
        }
    }
}
Sk.exportSymbol("Sk.setupOperators", Sk.setupOperators);

function getOperator (n) {
    if (operatorMap[n.type] === undefined) {
        throw new Sk.builtin.SyntaxError("invalid syntax", n.type, n.lineno);
    }
    return operatorMap[n.type];
}

function new_identifier(n, c) {
    if (n.value) {
        return new Sk.builtin.str(n.value);
    }

    return new Sk.builtin.str(n);
}

function astForCompOp (c, n) {
    /* comp_op: '<'|'>'|'=='|'>='|'<='|'!='|'in'|'not' 'in'|'is'
     |'is' 'not'
     */
    REQ(n, SYM.comp_op);
    if (NCH(n) === 1) {
        n = CHILD(n, 0);
        switch (n.type) {
            case TOK.T_LESS:
                return Sk.astnodes.Lt;
            case TOK.T_GREATER:
                return Sk.astnodes.Gt;
            case TOK.T_EQEQUAL:
                return Sk.astnodes.Eq;
            case TOK.T_LESSEQUAL:
                return Sk.astnodes.LtE;
            case TOK.T_GREATEREQUAL:
                return Sk.astnodes.GtE;
            case TOK.T_NOTEQUAL:
                return Sk.astnodes.NotEq;
            case TOK.T_NAME:
                if (n.value === "in") {
                    return Sk.astnodes.In;
                }
                if (n.value === "is") {
                    return Sk.astnodes.Is;
                }
        }
    }
    else if (NCH(n) === 2) {
        if (CHILD(n, 0).type === TOK.T_NAME) {
            if (CHILD(n, 1).value === "in") {
                return Sk.astnodes.NotIn;
            }
            if (CHILD(n, 0).value === "is") {
                return Sk.astnodes.IsNot;
            }
        }
    }
    Sk.asserts.fail("invalid comp_op");
}

function copy_location(e, n)
{
    if (e) {
        e.lineno = LINENO(n);
        e.col_offset = n.col_offset;
        e.end_lineno = n.end_lineno;
        e.end_col_offset = n.end_col_offset;
    }
    return e;
}

function seq_for_testlist (c, n) {
    /* testlist: test (',' test)* [',']
       testlist_star_expr: test|star_expr (',' test|star_expr)* [',']
    */
    var i;
    var seq = [];
    Sk.asserts.assert(n.type === SYM.testlist ||
        n.type === SYM.testlist_star_expr ||
        n.type === SYM.listmaker ||
        n.type === SYM.testlist_comp ||
        n.type === SYM.testlist_safe ||
        n.type === SYM.testlist1, "node type must be listlike");
    for (i = 0; i < NCH(n); i += 2) {
        Sk.asserts.assert(CHILD(n, i).type === SYM.test || CHILD(n, i).type === SYM.old_test || CHILD(n, i).type === SYM.star_expr);
        seq[i / 2] = ast_for_expr(c, CHILD(n, i));
    }
    return seq;
}

function astForSuite (c, n) {
    /* suite: simple_stmt | NEWLINE INDENT stmt+ DEDENT */
    var j;
    var num;
    var i;
    var end;
    var ch;
    var pos;
    var seq;
    REQ(n, SYM.suite);
    seq = [];
    pos = 0;
    if (CHILD(n, 0).type === SYM.simple_stmt) {
        n = CHILD(n, 0);
        /* simple_stmt always ends with an NEWLINE and may have a trailing
         * SEMI. */
        end = NCH(n) - 1;
        if (CHILD(n, end - 1).type === TOK.T_SEMI) {
            end -= 1;
        }
        for (i = 0; i < end; i += 2) // by 2 to skip ;
        {
            seq[pos++] = astForStmt(c, CHILD(n, i));
        }
    }
    else {
        for (i = 2; i < NCH(n) - 1; ++i) {
            ch = CHILD(n, i);
            REQ(ch, SYM.stmt);
            num = numStmts(ch);
            if (num === 1) {
                // small_stmt or compound_stmt w/ only 1 child
                seq[pos++] = astForStmt(c, ch);
            }
            else {
                ch = CHILD(ch, 0);
                REQ(ch, SYM.simple_stmt);
                for (j = 0; j < NCH(ch); j += 2) {
                    if (NCH(CHILD(ch, j)) === 0) {
                        Sk.asserts.assert(j + 1 === NCH(ch));
                        break;
                    }
                    seq[pos++] = astForStmt(c, CHILD(ch, j));
                }
            }
        }
    }
    Sk.asserts.assert(pos === numStmts(n));
    return seq;
}

function astForExceptClause (c, exc, body) {
    /* except_clause: 'except' [test [(',' | 'as') test]] */
    var e;
    REQ(exc, SYM.except_clause);
    REQ(body, SYM.suite);
    if (NCH(exc) === 1) {
        return new Sk.astnodes.ExceptHandler(null, null, astForSuite(c, body), exc.lineno, exc.col_offset);
    }
    else if (NCH(exc) === 2) {
        return new Sk.astnodes.ExceptHandler(ast_for_expr(c, CHILD(exc, 1)), null, astForSuite(c, body), exc.lineno, exc.col_offset);
    }
    else if (NCH(exc) === 4) {
        if (Sk.__future__.python3 && CHILD(exc, 2).value == ",") {
            ast_error(c, exc, "Old-style 'except' clauses are not supported in Python 3");
        }

        var expression = ast_for_expr(c, CHILD(exc, 1));
        e = ast_for_expr(c, CHILD(exc, 3));
        setContext(c, e, Sk.astnodes.Store, CHILD(exc, 3));
        return new Sk.astnodes.ExceptHandler(ast_for_expr(c, CHILD(exc, 1)), e, astForSuite(c, body), exc.lineno, exc.col_offset);
    }
    Sk.asserts.fail("wrong number of children for except clause");
}

function astForTryStmt (c, n) {
    var exceptSt;
    var i;
    var handlers = [];
    var nc = NCH(n);
    var nexcept = (nc - 3) / 3;
    var body, orelse = [],
        finally_ = null;

    REQ(n, SYM.try_stmt);
    body = astForSuite(c, CHILD(n, 2));
    if (CHILD(n, nc - 3).type === TOK.T_NAME) {
        if (CHILD(n, nc - 3).value === "finally") {
            if (nc >= 9 && CHILD(n, nc - 6).type === TOK.T_NAME) {
                /* we can assume it's an "else",
                 because nc >= 9 for try-else-finally and
                 it would otherwise have a type of except_clause */
                orelse = astForSuite(c, CHILD(n, nc - 4));
                nexcept--;
            }

            finally_ = astForSuite(c, CHILD(n, nc - 1));
            nexcept--;
        }
        else {
            /* we can assume it's an "else",
             otherwise it would have a type of except_clause */
            orelse = astForSuite(c, CHILD(n, nc - 1));
            nexcept--;
        }
    }
    else if (CHILD(n, nc - 3).type !== SYM.except_clause) {
        throw new Sk.builtin.SyntaxError("malformed 'try' statement", c.c_filename, n.lineno);
    }

    if (nexcept > 0) {
        /* process except statements to create a try ... except */
        for (i = 0; i < nexcept; i++) {
            handlers[i] = astForExceptClause(c, CHILD(n, 3 + i * 3), CHILD(n, 5 + i * 3));
        }
    }

    Sk.asserts.assert(!!finally_ || handlers.length != 0);
    return new Sk.astnodes.Try(body, handlers, orelse, finally_, n.lineno, n.col_offset);
}

function astForDottedName (c, n) {
    var i;
    var e;
    var id;
    var col_offset;
    var lineno;
    REQ(n, SYM.dotted_name);
    lineno = n.lineno;
    col_offset = n.col_offset;
    id = strobj(CHILD(n, 0).value);
    e = new Sk.astnodes.Name(id, Sk.astnodes.Load, lineno, col_offset);
    for (i = 2; i < NCH(n); i += 2) {
        id = strobj(CHILD(n, i).value);
        e = new Sk.astnodes.Attribute(e, id, Sk.astnodes.Load, lineno, col_offset);
    }
    return e;
}

function astForDecorator (c, n) {
    /* decorator: '@' dotted_name [ '(' [arglist] ')' ] NEWLINE */
    var nameExpr;
    REQ(n, SYM.decorator);
    REQ(CHILD(n, 0), TOK.T_AT);
    REQ(CHILD(n, NCH(n) - 1), TOK.T_NEWLINE);
    nameExpr = astForDottedName(c, CHILD(n, 1));
    if (NCH(n) === 3) // no args
    {
        return nameExpr;
    }
    else if (NCH(n) === 5) // call with no args
    {
        return new Sk.astnodes.Call(nameExpr, [], [], null, null, n.lineno, n.col_offset);
    }
    else {
        return ast_for_call(c, CHILD(n, 3), nameExpr);
    }
}

function astForDecorators (c, n) {
    var i;
    var decoratorSeq;
    REQ(n, SYM.decorators);
    decoratorSeq = [];
    for (i = 0; i < NCH(n); ++i) {
        decoratorSeq[i] = astForDecorator(c, CHILD(n, i));
    }
    return decoratorSeq;
}

function ast_for_decorated (c, n) {
    /* decorated: decorators (classdef | funcdef | async_funcdef) */
    var thing = null;
    var decorator_seq = null;

    REQ(n, SYM.decorated);

    decorator_seq = astForDecorators(c, CHILD(n, 0));
    Sk.asserts.assert(TYPE(CHILD(n, 1)) == SYM.funcdef ||
            TYPE(CHILD(n, 1)) == SYM.async_funcdef ||
            TYPE(CHILD(n, 1)) == SYM.classdef);

    if (TYPE(CHILD(n, 1)) == SYM.funcdef) {
        thing = ast_for_funcdef(c, CHILD(n, 1), decorator_seq);
    } else if (TYPE(CHILD(n, 1)) == SYM.classdef) {
        thing = astForClassdef(c, CHILD(n, 1), decorator_seq);
    } else if (TYPE(CHILD(n, 1)) == SYM.async_funcdef) {
        thing = ast_for_async_funcdef(c, CHILD(n, 1), decorator_seq);
    }
    /* we count the decorators in when talking about the class' or
        * function's line number */
    if (thing) {
        thing.lineno = LINENO(n);
        thing.col_offset = n.col_offset;
    }
    return thing;
}

/* with_item: test ['as' expr] */
function ast_for_with_item (c, n) {
    var context_expr, optional_vars;
    REQ(n, SYM.with_item);
    context_expr = ast_for_expr(c, CHILD(n, 0));
    if (NCH(n) == 3) {
        optional_vars = ast_for_expr(c, CHILD(n, 2));
        setContext(c, optional_vars, Sk.astnodes.Store, n);
    }

    return new Sk.astnodes.withitem(context_expr, optional_vars);
}

/* with_stmt: 'with' with_item (',' with_item)* ':' suite */
function ast_for_with_stmt(c, n0, is_async) {
    const n = is_async ? CHILD(n0, 1) : n0;
    var i
    var items = [], body;

    REQ(n, SYM.with_stmt);

    for (i = 1; i < NCH(n) - 2; i += 2) {
        var item = ast_for_with_item(c, CHILD(n, i));
        items[(i - 1) / 2] = item;
    }

    body = astForSuite(c, CHILD(n, NCH(n) - 1));

    if (is_async) {
        return new Sk.astnodes.AsyncWith(items, body, LINENO(n0), n0.col_offset);
    } else {
        return new Sk.astnodes.With(items, body, LINENO(n), n.col_offset);
    }
}

function astForExecStmt (c, n) {
    var expr1, globals = null, locals = null;
    var nchildren = NCH(n);
    Sk.asserts.assert(nchildren === 2 || nchildren === 4 || nchildren === 6);

    /* exec_stmt: 'exec' expr ['in' test [',' test]] */
    REQ(n, SYM.exec_stmt);
    expr1 = ast_for_expr(c, CHILD(n, 1));
    if (nchildren >= 4) {
        globals = ast_for_expr(c, CHILD(n, 3));
    }
    if (nchildren === 6) {
        locals = ast_for_expr(c, CHILD(n, 5));
    }
    return new Sk.astnodes.Exec(expr1, globals, locals, n.lineno, n.col_offset);
}

function astForIfStmt (c, n) {
    /* if_stmt: 'if' test ':' suite ('elif' test ':' suite)*
     ['else' ':' suite]
     */
    var off;
    var i;
    var orelse;
    var hasElse;
    var nElif;
    var decider;
    var s;
    REQ(n, SYM.if_stmt);
    if (NCH(n) === 4) {
        return new Sk.astnodes.If(
            ast_for_expr(c, CHILD(n, 1)),
            astForSuite(c, CHILD(n, 3)),
            [], n.lineno, n.col_offset);
    }

    s = CHILD(n, 4).value;
    decider = s.charAt(2); // elSe or elIf
    if (decider === "s") {
        return new Sk.astnodes.If(
            ast_for_expr(c, CHILD(n, 1)),
            astForSuite(c, CHILD(n, 3)),
            astForSuite(c, CHILD(n, 6)),
            n.lineno, n.col_offset);
    }
    else if (decider === "i") {
        nElif = NCH(n) - 4;
        hasElse = false;
        orelse = [];

        /* must reference the child nElif+1 since 'else' token is third, not
         * fourth child from the end. */
        if (CHILD(n, nElif + 1).type === TOK.T_NAME &&
            CHILD(n, nElif + 1).value.charAt(2) === "s") {
            hasElse = true;
            nElif -= 3;
        }
        nElif /= 4;

        if (hasElse) {
            orelse = [
                new Sk.astnodes.If(
                    ast_for_expr(c, CHILD(n, NCH(n) - 6)),
                    astForSuite(c, CHILD(n, NCH(n) - 4)),
                    astForSuite(c, CHILD(n, NCH(n) - 1)),
                    CHILD(n, NCH(n) - 6).lineno,
                    CHILD(n, NCH(n) - 6).col_offset)];
            nElif--;
        }

        for (i = 0; i < nElif; ++i) {
            off = 5 + (nElif - i - 1) * 4;
            orelse = [
                new Sk.astnodes.If(
                    ast_for_expr(c, CHILD(n, off)),
                    astForSuite(c, CHILD(n, off + 2)),
                    orelse,
                    CHILD(n, off).lineno,
                    CHILD(n, off).col_offset)];
        }
        return new Sk.astnodes.If(
            ast_for_expr(c, CHILD(n, 1)),
            astForSuite(c, CHILD(n, 3)),
            orelse, n.lineno, n.col_offset);
    }

    Sk.asserts.fail("unexpected token in 'if' statement");
}

function ast_for_exprlist (c, n, context) {
    var e;
    var i;
    var seq;
    REQ(n, SYM.exprlist);
    seq = [];
    for (i = 0; i < NCH(n); i += 2) {
        e = ast_for_expr(c, CHILD(n, i));
        seq[i / 2] = e;
        if (context) {
            setContext(c, e, context, CHILD(n, i));
        }
    }
    return seq;
}

function astForDelStmt (c, n) {
    /* del_stmt: 'del' exprlist */
    REQ(n, SYM.del_stmt);
    return new Sk.astnodes.Delete(ast_for_exprlist(c, CHILD(n, 1), Sk.astnodes.Del), n.lineno, n.col_offset);
}

function astForGlobalStmt (c, n) {
    /* global_stmt: 'global' NAME (',' NAME)* */
    var i;
    var s = [];
    REQ(n, SYM.global_stmt);
    for (i = 1; i < NCH(n); i += 2) {
        s[(i - 1) / 2] = strobj(CHILD(n, i).value);
    }
    return new Sk.astnodes.Global(s, n.lineno, n.col_offset);
}

function astForAssertStmt (c, n) {
    /* assert_stmt: 'assert' test [',' test] */
    REQ(n, SYM.assert_stmt);
    if (NCH(n) === 2) {
        return new Sk.astnodes.Assert(ast_for_expr(c, CHILD(n, 1)), null, n.lineno, n.col_offset);
    }
    else if (NCH(n) === 4) {
        return new Sk.astnodes.Assert(ast_for_expr(c, CHILD(n, 1)), ast_for_expr(c, CHILD(n, 3)), n.lineno, n.col_offset);
    }
    Sk.asserts.fail("improper number of parts to assert stmt");
}

function aliasForImportName (c, n) {
    /*
     import_as_name: NAME ['as' NAME]
     dotted_as_name: dotted_name ['as' NAME]
     dotted_name: NAME ('.' NAME)*
     */

    var i;
    var a;
    var name;
    var str;
    loop: while (true) {
        switch (n.type) {
            case SYM.import_as_name:
                str = null;
                name = strobj(CHILD(n, 0).value);
                if (NCH(n) === 3) {
                    str = CHILD(n, 2).value;
                }
                return new Sk.astnodes.alias(name, str == null ? null : strobj(str));
            case SYM.dotted_as_name:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue loop;
                }
                else {
                    a = aliasForImportName(c, CHILD(n, 0));
                    Sk.asserts.assert(!a.asname);
                    a.asname = strobj(CHILD(n, 2).value);
                    return a;
                }
                break;
            case SYM.dotted_name:
                if (NCH(n) === 1) {
                    return new Sk.astnodes.alias(strobj(CHILD(n, 0).value), null);
                }
                else {
                    // create a string of the form a.b.c
                    str = "";
                    for (i = 0; i < NCH(n); i += 2) {
                        str += CHILD(n, i).value + ".";
                    }
                    return new Sk.astnodes.alias(strobj(str.substr(0, str.length - 1)), null);
                }
                break;
            case TOK.T_STAR:
                return new Sk.astnodes.alias(strobj("*"), null);
            default:
                throw new Sk.builtin.SyntaxError("unexpected import name", c.c_filename, n.lineno);
        }
        break;
    }
}

function astForImportStmt (c, n) {
    /*
     import_stmt: import_name | import_from
     import_name: 'import' dotted_as_names
     import_from: 'from' ('.'* dotted_name | '.') 'import'
     ('*' | '(' import_as_names ')' | import_as_names)
     */
    var modname;
    var idx;
    var nchildren;
    var ndots;
    var mod;
    var i;
    var aliases;
    var col_offset;
    var lineno;
    REQ(n, SYM.import_stmt);
    lineno = n.lineno;
    col_offset = n.col_offset;
    n = CHILD(n, 0);
    if (n.type === SYM.import_name) {
        n = CHILD(n, 1);
        REQ(n, SYM.dotted_as_names);
        aliases = [];
        for (i = 0; i < NCH(n); i += 2) {
            aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
        }
        return new Sk.astnodes.Import(aliases, lineno, col_offset);
    }
    else if (n.type === SYM.import_from) {
        mod = null;
        ndots = 0;

        for (idx = 1; idx < NCH(n); ++idx) {
            if (CHILD(n, idx).type === SYM.dotted_name) {
                mod = aliasForImportName(c, CHILD(n, idx));
                idx++;
                break;
            }
            else if (CHILD(n, idx).type === TOK.T_DOT) {
                ndots++;
            }
            else if (CHILD(n, idx).type === TOK.T_ELLIPSIS) {
                ndots += 3;
            }
            else {
                break;
            }
        }
        ++idx; // skip the import keyword
        switch (CHILD(n, idx).type) {
            case TOK.T_STAR:
                // from ... import
                n = CHILD(n, idx);
                nchildren = 1;
                break;
            case TOK.T_LPAR:
                // from ... import (x, y, z)
                n = CHILD(n, idx + 1);
                nchildren = NCH(n);
                break;
            case SYM.import_as_names:
                // from ... import x, y, z
                n = CHILD(n, idx);
                nchildren = NCH(n);
                if (nchildren % 2 === 0) {
                    throw new Sk.builtin.SyntaxError("trailing comma not allowed without surrounding parentheses", c.c_filename, n.lineno);
                }
                break;
            default:
                throw new Sk.builtin.SyntaxError("Unexpected node-type in from-import", c.c_filename, n.lineno);
        }
        aliases = [];
        if (n.type === TOK.T_STAR) {
            aliases[0] = aliasForImportName(c, n);
        }
        else {
            for (i = 0; i < NCH(n); i += 2) {
                aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
            }
        }
        modname = mod ? mod.name.v : "";
        return new Sk.astnodes.ImportFrom(strobj(modname), aliases, ndots, lineno, col_offset);
    }
    throw new Sk.builtin.SyntaxError("unknown import statement", c.c_filename, n.lineno);
}

function ast_for_testlistComp(c, n) {
    /* testlist_comp: test ( comp_for | (',' test)* [','] ) */
    /* argument: test [comp_for] */
    Sk.asserts.assert(n.type === SYM.testlist_comp || n.type === SYM.argument);
    if (NCH(n) > 1 && CHILD(n, 1).type === SYM.comp_for) {
        return ast_for_gen_expr(c, n);
    }
    return ast_for_testlist(c, n);
}
function ast_for_genexp(c, n)
{
    Sk.asserts.assert(TYPE(n) == SYM.testlist_comp || TYPE(n) == SYM.argument);
    return ast_for_itercomp(c, n, COMP_GENEXP);
}

function  ast_for_listcomp(c, n) {
    Sk.asserts.assert(TYPE(n) == (SYM.testlist_comp));
    return ast_for_itercomp(c, n, COMP_LISTCOMP);
}

function astForFactor (c, n) {
    /* some random peephole thing that cpy does */
    var expression;
    var pnum;
    var patom;
    var ppower;
    var pfactor;
    if (CHILD(n, 0).type === TOK.T_MINUS && NCH(n) === 2) {
        pfactor = CHILD(n, 1);
        if (pfactor.type === SYM.factor && NCH(pfactor) === 1) {
            ppower = CHILD(pfactor, 0);
            if (ppower.type === SYM.power && NCH(ppower) === 1) {
                patom = CHILD(ppower, 0);
                if (patom.type === SYM.atom) {
                    pnum = CHILD(patom, 0);
                    if (pnum.type === TOK.T_NUMBER) {
                        pnum.value = "-" + pnum.value;
                        return ast_for_atom(c, patom);
                    }
                }
            }
        }
    }

    expression = ast_for_expr(c, CHILD(n, 1));
    switch (CHILD(n, 0).type) {
        case TOK.T_PLUS:
            return new Sk.astnodes.UnaryOp(Sk.astnodes.UAdd, expression, n.lineno, n.col_offset);
        case TOK.T_MINUS:
            return new Sk.astnodes.UnaryOp(Sk.astnodes.USub, expression, n.lineno, n.col_offset);
        case TOK.T_TILDE:
            return new Sk.astnodes.UnaryOp(Sk.astnodes.Invert, expression, n.lineno, n.col_offset);
    }

    Sk.asserts.fail("unhandled factor");
}

function astForForStmt (c, n) {
    /* for_stmt: 'for' exprlist 'in' testlist ':' suite ['else' ':' suite] */
    var target;
    var _target;
    var nodeTarget;
    var seq = [];
    REQ(n, SYM.for_stmt);
    if (NCH(n) === 9) {
        seq = astForSuite(c, CHILD(n, 8));
    }
    nodeTarget = CHILD(n, 1);
    _target = ast_for_exprlist(c, nodeTarget, Sk.astnodes.Store);
    if (NCH(nodeTarget) === 1) {
        target = _target[0];
    }
    else {
        target = new Sk.astnodes.Tuple(_target, Sk.astnodes.Store, n.lineno, n.col_offset);
    }

    return new Sk.astnodes.For(target,
        ast_for_testlist(c, CHILD(n, 3)),
        astForSuite(c, CHILD(n, 5)),
        seq, n.lineno, n.col_offset);
}

function ast_for_call(c, n, func, allowgen)
{
    /*
      arglist: argument (',' argument)*  [',']
      argument: ( test [comp_for] | '*' test | test '=' test | '**' test )
    */

    var i, nargs, nkeywords;
    var ndoublestars;
    var args;
    var keywords;

    REQ(n, SYM.arglist);

    nargs = 0;
    nkeywords = 0;
    for (i = 0; i < NCH(n); i++) {
        var ch = CHILD(n, i);
        if (TYPE(ch) == SYM.argument) {
            if (NCH(ch) == 1) {
                nargs++;
            } else if (TYPE(CHILD(ch, 1)) == SYM.comp_for) {
                nargs++;
                if (!allowgen) {
                    ast_error(c, ch, "invalid syntax");
                }
                if (NCH(n) > 1) {
                    ast_error(c, ch, "Generator expression must be parenthesized");
                }
            } else if (TYPE(CHILD(ch, 0)) == TOK.T_STAR) {
                nargs++;
            } else {
                /* TYPE(CHILD(ch, 0)) == DOUBLESTAR or keyword argument */
                nkeywords++;
            }
        }
    }

    args = []
    keywords = []

    nargs = 0;  /* positional arguments + iterable argument unpackings */
    nkeywords = 0;  /* keyword arguments + keyword argument unpackings */
    ndoublestars = 0;  /* just keyword argument unpackings */
    for (i = 0; i < NCH(n); i++) {
        ch = CHILD(n, i);
        if (TYPE(ch) == SYM.argument) {
            var e;
            var chch = CHILD(ch, 0);
            if (NCH(ch) == 1) {
                /* a positional argument */
                if (nkeywords) {
                    if (ndoublestars) {
                        ast_error(c, chch,
                                "positional argument follows " +
                                "keyword argument unpacking");
                    } else {
                        ast_error(c, chch,
                                "positional argument follows " +
                                "keyword argument");
                    }
                }
                e = ast_for_expr(c, chch);
                if (!e) {
                    return NULL;
                }
                args[nargs++] = e;
            } else if (TYPE(chch) == TOK.T_STAR) {
                /* an iterable argument unpacking */
                var starred;
                if (ndoublestars) {
                    ast_error(c, chch,
                            "iterable argument unpacking follows " +
                            "keyword argument unpacking");
                    return NULL;
                }
                e = ast_for_expr(c, CHILD(ch, 1));
                if (!e) {
                    return NULL;
                }
                starred = new Sk.astnodes.Starred(e, Sk.astnodes.Load, LINENO(chch),
                        chch.col_offset);
                args[nargs++] = starred;
            } else if (TYPE(chch) == TOK.T_DOUBLESTAR) {
                /* a keyword argument unpacking */
                var kw;
                i++;
                e = ast_for_expr(c, CHILD(ch, 1));
                if (!e) {
                    return NULL;
                }
                kw = new Sk.astnodes.keyword(NULL, e);
                keywords[nkeywords++] = kw;
                ndoublestars++;
            } else if (TYPE(CHILD(ch, 1)) == SYM.comp_for) {
                /* the lone generator expression */
                e = ast_for_genexp(c, ch);
                if (!e) {
                    return NULL;
                }
                args[nargs++] = e;
            } else {
                /* a keyword argument */
                var kw;
                var key, tmp;
                var k;

                /* chch is test, but must be an identifier? */
                e = ast_for_expr(c, chch);
                if (!e) {
                    return NULL;
                }
                /* f(lambda x: x[0] = 3) ends up getting parsed with
                 * LHS test = lambda x: x[0], and RHS test = 3.
                 * SF bug 132313 points out that complaining about a keyword
                 * then is very confusing.
                 */
                if (e.constructor === Sk.astnodes.Lambda) {
                    ast_error(c, chch,
                            "lambda cannot contain assignment");
                    return NULL;
                }
                else if (e.constructor !== Sk.astnodes.Name) {
                    ast_error(c, chch,
                            "keyword can't be an expression");
                    return NULL;
                }
                else if (forbiddenCheck(c, e.id, ch, 1)) {
                    return NULL;
                }
                key = e.id;
                for (k = 0; k < nkeywords; k++) {
                    tmp = keywords[k].arg;
                    if (tmp && tmp === key) {
                        ast_error(c, chch,
                                "keyword argument repeated");
                        return NULL;
                    }
                }
                e = ast_for_expr(c, CHILD(ch, 2));
                if (!e)
                    return NULL;
                kw = new Sk.astnodes.keyword(key, e);
                keywords[nkeywords++] = kw;
            }
        }
    }

    return new Sk.astnodes.Call(func, args, keywords, func.lineno, func.col_offset);
}

function ast_for_trailer(c, n, left_expr) {
    /* trailer: '(' [arglist] ')' | '[' subscriptlist ']' | '.' NAME
       subscriptlist: subscript (',' subscript)* [',']
       subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
     */
    REQ(n, SYM.trailer);
    if (TYPE(CHILD(n, 0)) == TOK.T_LPAR) {
        if (NCH(n) == 2)
            return new Sk.astnodes.Call(left_expr, NULL, NULL, LINENO(n),
                        n.col_offset);
        else
            return ast_for_call(c, CHILD(n, 1), left_expr, true);
    }
    else if (TYPE(CHILD(n, 0)) == TOK.T_DOT) {
        var attr_id = new_identifier(CHILD(n, 1));
        if (!attr_id)
            return NULL;
        return new Sk.astnodes.Attribute(left_expr, attr_id, Sk.astnodes.Load,
                         LINENO(n), n.col_offset);
    }
    else {
        REQ(CHILD(n, 0), TOK.T_LSQB);
        REQ(CHILD(n, 2), TOK.T_RSQB);
        n = CHILD(n, 1);
        if (NCH(n) == 1) {
            var slc = astForSlice(c, CHILD(n, 0));
            if (!slc) {
                return NULL;
            }
            return new Sk.astnodes.Subscript(left_expr, slc, Sk.astnodes.Load, LINENO(n), n.col_offset);
        }
        else {
            /* The grammar is ambiguous here. The ambiguity is resolved
               by treating the sequence as a tuple literal if there are
               no slice features.
            */
            var j;
            var slc;
            var e;
            var simple = 1;
            var slices = [], elts;

            for (j = 0; j < NCH(n); j += 2) {
                slc = astForSlice(c, CHILD(n, j));
                if (!slc) {
                    return NULL;
                }
                if (slc.kind != _slice_kind.Index_kind) {
                    simple = 0;
                }
                slices[j / 2] = slc;
            }
            if (!simple) {
                return new Sk.astnodes.Subscript(left_expr, new Sk.astnodes.ExtSlice(slices),
                                Sk.astnodes.Load, LINENO(n), n.col_offset);
            }
            /* extract Index values and put them in a Tuple */
            elts = [];
            for (j = 0; j < slices.length; ++j) {
                // @meredydd any idea how we reach this?
                slc = slices[j];
                Sk.asserts.assert(slc.kind == _slice_kind.Index_kind  && slc.v.Index.value);
                elts[j] = slc.v.Index.value;
            }
            e = new Sk.astnodes.Tuple(elts, Sk.astnodes.Load, LINENO(n), n.col_offset);

            return new Sk.astnodes.Subscript(left_expr, new Sk.astnodes.Index(e),
                             Sk.astnodes.Load, LINENO(n), n.col_offset);
        }
    }
}

function ast_for_flow_stmt(c, n)
{
    /*
      flow_stmt: break_stmt | continue_stmt | return_stmt | raise_stmt
                 | yield_stmt
      break_stmt: 'break'
      continue_stmt: 'continue'
      return_stmt: 'return' [testlist]
      yield_stmt: yield_expr
      yield_expr: 'yield' testlist | 'yield' 'from' test
      raise_stmt: 'raise' [test [',' test [',' test]]]
    */
    var ch;

    REQ(n, SYM.flow_stmt);
    ch = CHILD(n, 0);
    switch (TYPE(ch)) {
        case SYM.break_stmt:
            return new Sk.astnodes.Break(LINENO(n), n.col_offset,
                         n.end_lineno, n.end_col_offset);
        case SYM.continue_stmt:
            return new Sk.astnodes.Continue(LINENO(n), n.col_offset,
                            n.end_lineno, n.end_col_offset);
        case SYM.yield_stmt: { /* will reduce to yield_expr */
            var exp = ast_for_expr(c, CHILD(ch, 0));
            if (!exp) {
                return null;
            }
            return new Sk.astnodes.Expr(exp, LINENO(n), n.col_offset,
                        n.end_lineno, n.end_col_offset);
        }
        case SYM.return_stmt:
            if (NCH(ch) == 1)
                return new Sk.astnodes.Return(null, LINENO(n), n.col_offset,
                              n.end_lineno, n.end_col_offset);
            else {
                var expression = ast_for_testlist(c, CHILD(ch, 1));
                if (!expression) {
                    return null;
                }
                return new Sk.astnodes.Return(expression, LINENO(n), n.col_offset,
                              n.end_lineno, n.end_col_offset);
            }
        case SYM.raise_stmt:
            // This is tricky and Skulpt-specific, because we need to handle
            // both Python 3-style and Python 2-style 'raise' statements
            if (NCH(ch) == 1)
                return new Sk.astnodes.Raise(null, null, null, null, LINENO(n), n.col_offset,
                             n.end_lineno, n.end_col_offset);
            else if (NCH(ch) >= 2) {
                var cause = null;
                var expression = ast_for_expr(c, CHILD(ch, 1));
                var inst = null, tback = null;

                // raise [expression] from [cause]
                if (NCH(ch) == 4 && CHILD(ch, 2).value == 'from') {
                    if (!Sk.__future__.python3) {
                        ast_error(c, CHILD(ch, 2), "raise ... from ... is not available in Python 2");
                    }
                    cause = ast_for_expr(c, CHILD(ch, 3));
                } else if (NCH(ch) >= 4 && CHILD(ch, 2).value == ',') {
                    if (Sk.__future__.python3) {
                        ast_error(c, n, "Old raise syntax is not available in Python 3")
                    }
                    // raise [exception_type], [instantiation value] [, [traceback]]
                    // NB traceback isn't implemented in Skulpt yet
                    inst = ast_for_expr(c, CHILD(ch, 3));

                    if (NCH(ch) == 6) {
                        tback = ast_for_expr(c, CHILD(ch, 5));
                    }
                }
                return new Sk.astnodes.Raise(expression, cause, inst, tback, LINENO(n), n.col_offset,
                             n.end_lineno, n.end_col_offset);
            }
            /* fall through */
        default:
            Sk.asserts.fail("unexpected flow_stmt: ", TYPE(ch));
            return null;
    }
}

function astForArg(c, n)
{
    var name;
    var annotation = null;
    var ch;

    Sk.asserts.assert(n.type === SYM.tfpdef || n.type === SYM.vfpdef);
    ch = CHILD(n, 0);
    forbiddenCheck(c, ch, ch.value, ch.lineno);
    name = strobj(ch.value);

    if (NCH(n) == 3 && CHILD(n, 1).type === TOK.T_COLON) {
        annotation = ast_for_expr(c, CHILD(n, 2));
    }

    return new Sk.astnodes.arg(name, annotation, n.lineno, n.col_offset);
}

/* returns -1 if failed to handle keyword only arguments
   returns new position to keep processing if successful
               (',' tfpdef ['=' test])*
                     ^^^
   start pointing here
 */
function handleKeywordonlyArgs(c, n, start, kwonlyargs, kwdefaults)
{
    var argname;
    var ch;
    var expression;
    var annotation;
    var arg;
    var i = start;
    var j = 0; /* index for kwdefaults and kwonlyargs */

    if (!kwonlyargs) {
        ast_error(c, CHILD(n, start), "named arguments must follow bare *");
    }
    Sk.asserts.assert(kwdefaults);
    while (i < NCH(n)) {
        ch = CHILD(n, i);
        switch (ch.type) {
            case SYM.vfpdef:
            case SYM.tfpdef:
                if (i + 1 < NCH(n) && CHILD(n, i + 1).type == TOK.T_EQUAL) {
                    kwdefaults[j] = ast_for_expr(c, CHILD(n, i + 2));
                    i += 2; /* '=' and test */
                }
                else { /* setting NULL if no default value exists */
                    kwdefaults[j] = null;
                }
                if (NCH(ch) == 3) {
                    /* ch is NAME ':' test */
                    annotation = ast_for_expr(c, CHILD(ch, 2));
                }
                else {
                    annotation = null;
                }
                ch = CHILD(ch, 0);
                forbiddenCheck(c, ch, ch.value, ch.lineno);
                argname = strobj(ch.value);
                kwonlyargs[j++] = new Sk.astnodes.arg(argname, annotation, ch.lineno, ch.col_offset);
                i += 2; /* the name and the comma */
                break;
            case TOK.T_DOUBLESTAR:
                return i;
            default:
                ast_error(c, ch, "unexpected node");
        }
    }
    return i;
}

function astForArguments (c, n) {
    var k;
    var j;
    var i;
    var foundDefault;
    var posargs = [];
    var posdefaults = [];
    var kwonlyargs = [];
    var kwdefaults = [];
    var vararg = null;
    var kwarg = null;
    var ch = null;

    /* This function handles both typedargslist (function definition)
       and varargslist (lambda definition).

       parameters: '(' [typedargslist] ')'
       typedargslist: (tfpdef ['=' test] (',' tfpdef ['=' test])* [',' [
               '*' [tfpdef] (',' tfpdef ['=' test])* [',' ['**' tfpdef [',']]]
             | '**' tfpdef [',']]]
         | '*' [tfpdef] (',' tfpdef ['=' test])* [',' ['**' tfpdef [',']]]
         | '**' tfpdef [','])
       tfpdef: NAME [':' test]
       varargslist: (vfpdef ['=' test] (',' vfpdef ['=' test])* [',' [
               '*' [vfpdef] (',' vfpdef ['=' test])* [',' ['**' vfpdef [',']]]
             | '**' vfpdef [',']]]
         | '*' [vfpdef] (',' vfpdef ['=' test])* [',' ['**' vfpdef [',']]]
         | '**' vfpdef [',']
       )
       vfpdef: NAME

    */
    if (n.type === SYM.parameters) {
        if (NCH(n) === 2) // () as arglist
        {
            return new Sk.astnodes.arguments_([], null, [], [], null, []);
        }
        n = CHILD(n, 1);
    }
    Sk.asserts.assert(n.type === SYM.varargslist ||
                        n.type === SYM.typedargslist);


    // Skulpt note: the "counting numbers of args" section
    // from ast.c is omitted because JS arrays autoexpand

    /* tfpdef: NAME [':' test]
       vfpdef: NAME
    */
    i = 0;
    j = 0;  /* index for defaults */
    k = 0;  /* index for args */
    while (i < NCH(n)) {
        ch = CHILD(n, i);
        switch (ch.type) {
            case SYM.tfpdef:
            case SYM.vfpdef:
                /* XXX Need to worry about checking if TYPE(CHILD(n, i+1)) is
                   anything other than EQUAL or a comma? */
                /* XXX Should NCH(n) check be made a separate check? */
                if (i + 1 < NCH(n) && CHILD(n, i + 1).type == TOK.T_EQUAL) {
                    posdefaults[j++] = ast_for_expr(c, CHILD(n, i + 2));
                    i += 2;
                    foundDefault = 1;
                }
                else if (foundDefault) {
                    throw new Sk.builtin.SyntaxError("non-default argument follows default argument", c.c_filename, n.lineno);
                }
                posargs[k++] = astForArg(c, ch);
                i += 2; /* the name and the comma */
                break;
            case TOK.T_STAR:
                if (i+1 >= NCH(n) ||
                    (i+2 == NCH(n) && CHILD(n, i+1).type == TOK.T_COMMA)) {
                    throw new Sk.builtin.SyntaxError("named arguments must follow bare *", c.c_filename, n.lineno);
                }
                ch = CHILD(n, i+1);  /* tfpdef or COMMA */
                if (ch.type == TOK.T_COMMA) {
                    i += 2; /* now follows keyword only arguments */
                    i = handleKeywordonlyArgs(c, n, i,
                                                  kwonlyargs, kwdefaults);
                }
                else {
                    vararg = astForArg(c, ch);

                    i += 3;
                    if (i < NCH(n) && (CHILD(n, i).type == SYM.tfpdef
                                    || CHILD(n, i).type == SYM.vfpdef)) {
                        i = handleKeywordonlyArgs(c, n, i,
                                                      kwonlyargs, kwdefaults);
                    }
                }
                break;
            case TOK.T_DOUBLESTAR:
                ch = CHILD(n, i+1);  /* tfpdef */
                Sk.asserts.assert(ch.type == SYM.tfpdef || ch.type == SYM.vfpdef);
                kwarg = astForArg(c, ch);
                i += 3;
                break;
            default:
                Sk.asserts.fail("unexpected node in varargslist");
                return;
        }
    }
    return new Sk.astnodes.arguments_(posargs, vararg, kwonlyargs, kwdefaults, kwarg, posdefaults);
}

function ast_for_async_funcdef(c, n, decorator_seq)
{
    /* async_funcdef: 'async' funcdef */
    REQ(n, SYM.async_funcdef);
    REQ(CHILD(n, 0), TOK.T_NAME);
    Sk.asserts.assert(STR(CHILD(n, 0) === "async"));
    REQ(CHILD(n, 1), SYM.funcdef);

    return ast_for_funcdef_impl(c, n, decorator_seq,
                                true /* is_async */);
}

function ast_for_funcdef(c, n, decorator_seq) {
    /* funcdef: 'def' NAME parameters ['->' test] ':' suite */
    return ast_for_funcdef_impl(c, n, decorator_seq,
        false /* is_async */);
}

function ast_for_funcdef_impl(c, n0, decorator_seq, is_async) {
    /* funcdef: 'def' NAME parameters ['->' test] ':' [TYPE_COMMENT] suite */
    var n = is_async ? CHILD(n0, 1) : n0;
    var name;
    var args;
    var body;
    var returns = NULL;
    var name_i = 1;
    var end_lineno, end_col_offset;
    var tc;
    var type_comment = NULL;

    if (is_async && c.c_feature_version < 5) {
        ast_error(c, n,
                  "Async functions are only supported in Python 3.5 and greater");
        return NULL;
    }

    REQ(n, SYM.funcdef);

    name = new_identifier(CHILD(n, name_i));

    if (forbiddenCheck(c, name, CHILD(n, name_i), 0)) {
        return NULL;
    }
    args = astForArguments(c, CHILD(n, name_i + 1));
    if (!args) {
        return NULL;
    }
    if (TYPE(CHILD(n, name_i+2)) == TOK.T_RARROW) {
        returns = ast_for_expr(c, CHILD(n, name_i + 3));
        if (!returns) {
            return NULL
        }
        name_i += 2;
    }

    if (TYPE(CHILD(n, name_i + 3)) == TOK.T_TYPE_COMMENT) {
        type_comment = TOK.T_NEW_TYPE_COMMENT(CHILD(n, name_i + 3));
        if (!type_comment)
            return NULL;
        name_i += 1;
    }

    body = astForSuite(c, CHILD(n, name_i + 3));
    if (!body) {
        return NULL;
    }
    // get_last_end_pos(body, &end_lineno, &end_col_offset);

    if (NCH(CHILD(n, name_i + 3)) > 1) {
        /* Check if the suite has a type comment in it. */
        tc = CHILD(CHILD(n, name_i + 3), 1);

        if (TYPE(tc) == TOK.T_TYPE_COMMENT) {
            if (type_comment != NULL) {
                ast_error(c, n, "Cannot have two type comments on def");
                return NULL;
            }
            type_comment = TOK.T_NEW_TYPE_COMMENT(tc);
            if (!type_comment)
                return NULL;
        }
    }

    if (is_async)
        return new Sk.astnodes.AsyncFunctionDef(name, args, body, decorator_seq, returns, type_comment,
                                LINENO(n0), n0.col_offset, end_lineno, end_col_offset);
    else
        return new Sk.astnodes.FunctionDef(name, args, body, decorator_seq, returns, type_comment,
                           LINENO(n), n.col_offset, end_lineno, end_col_offset);
}

function astForClassBases (c, n) {
    /* testlist: test (',' test)* [','] */
    Sk.asserts.assert(NCH(n) > 0);
    REQ(n, SYM.testlist);
    if (NCH(n) === 1) {
        return [ ast_for_expr(c, CHILD(n, 0)) ];
    }
    return seq_for_testlist(c, n);
}

function astForClassdef (c, n, decoratorSeq) {
    /* classdef: 'class' NAME ['(' arglist ')'] ':' suite */
    var classname;
    var call;
    var s;

    REQ(n, SYM.classdef);

    if (NCH(n) == 4) { /* class NAME ':' suite */
        s = astForSuite(c, CHILD(n, 3));
        classname = new_identifier(CHILD(n, 1).value);
        forbiddenCheck(c, CHILD(n,3), classname, n.lineno);

        return new Sk.astnodes.ClassDef(classname, [], [], s, decoratorSeq,
                                    /*TODO docstring*/null, LINENO(n), n.col_offset);
    }

    if (TYPE(CHILD(n, 3)) === TOK.T_RPAR) { /* class NAME '(' ')' ':' suite */
        s = astForSuite(c, CHILD(n, 5));
        classname = new_identifier(CHILD(n, 1).value);
        forbiddenCheck(c, CHILD(n, 3), classname, CHILD(n, 3).lineno);
        return new Sk.astnodes.ClassDef(classname, [], [], s, decoratorSeq,
                                    /*TODO docstring*/null, LINENO(n), n.col_offset);
    }

    /* class NAME '(' arglist ')' ':' suite */
    /* build up a fake Call node so we can extract its pieces */
    {
        var dummy_name;
        var dummy;
        dummy_name = new_identifier(CHILD(n, 1));
        dummy = new Sk.astnodes.Name(dummy_name, Sk.astnodes.Load, LINENO(n), n.col_offset);
        call = ast_for_call(c, CHILD(n, 3), dummy, false);
    }
    s = astForSuite(c, CHILD(n, 6));
    classname = new_identifier(CHILD(n, 1).value);
    forbiddenCheck(c, CHILD(n,1), classname, CHILD(n,1).lineno);

    return new Sk.astnodes.ClassDef(classname, call.args, call.keywords, s,
                               decoratorSeq, /*TODO docstring*/null, LINENO(n), n.col_offset);
}

function astForLambdef (c, n) {
    /* lambdef: 'lambda' [varargslist] ':' test */
    var args;
    var expression;
    if (NCH(n) === 3) {
        args = new Sk.astnodes.arguments_([], null, null, []);
        expression = ast_for_expr(c, CHILD(n, 2));
    }
    else {
        args = astForArguments(c, CHILD(n, 1));
        expression = ast_for_expr(c, CHILD(n, 3));
    }
    return new Sk.astnodes.Lambda(args, expression, n.lineno, n.col_offset);
}

function astForComprehension(c, n) {
    /* testlist_comp: test ( comp_for | (',' test)* [','] )
       argument: test [comp_for] | test '=' test       # Really [keyword '='] test */

    var j;
    var ifs;
    var nifs;
    var ge;
    var expression;
    var t;
    var forch;
    var i;
    var ch;
    var genexps;
    var nfors;
    var elt;
    var comps;
    var comp;

    function countCompFors(c, n) {
        var nfors = 0;
        count_comp_for: while (true) {
            nfors++;
            REQ(n, SYM.comp_for);
            if (NCH(n) === 5) {
                n = CHILD(n, 4);
            } else {
                return nfors;
            }
            count_comp_iter: while (true) {
                REQ(n, SYM.comp_iter);
                n = CHILD(n, 0);
                if (n.type === SYM.comp_for) {
                    continue count_comp_for;
                } else if (n.type === SYM.comp_if) {
                    if (NCH(n) === 3) {
                        n = CHILD(n, 2);
                        continue count_comp_iter;
                    } else {
                        return nfors;
                    }
                }
                break;
            }
            break;
        }
        Sk.asserts.fail("logic error in countCompFors");
    }

    function countCompIfs(c, n) {
        var nifs = 0;
        while (true) {
            REQ(n, SYM.comp_iter);
            if (CHILD(n, 0).type === SYM.comp_for) {
                return nifs;
            }
            n = CHILD(n, 0);
            REQ(n, SYM.comp_if);
            nifs++;
            if (NCH(n) === 2) {
                return nifs;
            }
            n = CHILD(n, 2);
        }
    }

    nfors = countCompFors(c, n);
    comps = [];
    for (i = 0; i < nfors; ++i) {
        REQ(n, SYM.comp_for);
        forch = CHILD(n, 1);
        t = ast_for_exprlist(c, forch, Sk.astnodes.Store);
        expression = ast_for_expr(c, CHILD(n, 3));
        if (NCH(forch) === 1) {
            comp = new Sk.astnodes.comprehension(t[0], expression, []);
        } else {
            comp = new Sk.astnodes.comprehension(new Sk.astnodes.Tuple(t, Sk.astnodes.Store, n.lineno, n.col_offset), expression, []);
        }
        if (NCH(n) === 5) {
            n = CHILD(n, 4);
            nifs = countCompIfs(c, n);
            ifs = [];
            for (j = 0; j < nifs; ++j) {
                REQ(n, SYM.comp_iter);
                n = CHILD(n, 0);
                REQ(n, SYM.comp_if);
                expression = ast_for_expr(c, CHILD(n, 1));
                ifs[j] = expression;
                if (NCH(n) === 3) {
                    n = CHILD(n, 2);
                }
            }
            if (n.type === SYM.comp_iter) {
                n = CHILD(n, 0);
            }
            comp.ifs = ifs;
        }
        comps[i] = comp;
    }
    return comps;
}

function astForIterComp(c, n, type) {
    var elt, comps;
    Sk.asserts.assert(NCH(n) > 1);
    elt = ast_for_expr(c, CHILD(n, 0));
    comps = astForComprehension(c, CHILD(n, 1));
    if (type === COMP_GENEXP) {
        return new Sk.astnodes.GeneratorExp(elt, comps, n.lineno, n.col_offset);
    } else if (type === COMP_SETCOMP) {
        return new Sk.astnodes.SetComp(elt, comps, n.lineno, n.col_offset);
    }
}

/*
   Count the number of 'for' loops in a comprehension.
   Helper for ast_for_comprehension().
*/
function count_comp_fors(c, n) {
    var n_fors = 0;
    var is_async;
    count_comp_for: while (true) {
        // @meredydd needs new grammar
        // REQ(n, SYM.comp_for);
        // if (NCH(n) === 2) {
        //     REQ(CHILD(n, 0), TOK.T_ASYNC);
        //     n = CHILD(n, 1);
        // } else if (NCH(n) === 1) {
        //     n = CHILD(n, 0);
        // } else {
        //     Sk.asserts.fail("logic error in count_comp_fors");
        // }
        // if (NCH(n) == (5)) {
        //     n = CHILD(n, 4);
        // } else {
        //     return n_fors;
        // }
        is_async = 0;
        n_fors++;
        REQ(n, SYM.comp_for);
        if (TYPE(CHILD(n, 0)) == TOK.T_ASYNC) {
            is_async = 1;
        }
        if (NCH(n) == (5 + is_async)) {
            n = CHILD(n, 4 + is_async);
        }
        else {
            return n_fors;
        }
        count_comp_iter: while (true) {
            REQ(n, SYM.comp_iter);
            n = CHILD(n, 0);
            if (TYPE(n) === SYM.comp_for) {
                continue count_comp_for;
            } else if (TYPE(n) === SYM.comp_if) {
                if (NCH(n) === 3) {
                    n = CHILD(n, 2);
                    continue count_comp_iter;
                } else {
                    return n_fors;
                }
            }
            break;
        }
        break;
    }
}

function count_comp_ifs(c, n)
{
    var n_ifs = 0;

    while (true) {
        REQ(n, SYM.comp_iter);
        if (TYPE(CHILD(n, 0)) == SYM.comp_for)
            return n_ifs;
        n = CHILD(n, 0);
        REQ(n, SYM.comp_if);
        n_ifs++;
        if (NCH(n) == 2) {
            return n_ifs;
        }
        n = CHILD(n, 2);
    }
}

function ast_for_comprehension(c, n) {
    var i, n_fors;
    var comps = [];
    n_fors = count_comp_fors(c, n);

    for (i = 0; i < n_fors; i++) {
        var comp;
        var t;
        var expression, first;
        var for_ch;
        var is_async = 0;

        if (TYPE(CHILD(n, 0)) == TOK.T_ASYNC) {
            is_async = 1;
        }

        for_ch = CHILD(n, 1 + is_async);
        t = ast_for_exprlist(c, for_ch, Sk.astnodes. Store);
        if (!t) {
            return null;
        }

        expression = ast_for_expr(c, CHILD(n, 3 + is_async));

        if (!expression) {
            return null;
        }

        // again new grammar needed
        // REQ(n, SYM.comp_for);

        // if (NCH(n) == 2) {
        //     is_async = 1;
        //     REQ(CHILD(n, 0), TOK.T_ASYNC);
        //     sync_n = CHILD(n, 1);
        // }
        // else {
        //     sync_n = CHILD(n, 0);
        // }
        // REQ(sync_n, SYM.sync_comp_for);

        // /* Async comprehensions only allowed in Python 3.6 and greater */
        // /* @meredydd see below for the joys of the future! */
        // if (is_async && c.c_feature_version < 6) {
        //     ast_error(c, n,
        //               "Async comprehensions are only supported in Python 3.6 and greater");
        //     return null;
        // }

        // for_ch = CHILD(sync_n, 1);
        // t = ast_for_exprlist(c, for_ch, Sk.astnodes.Store);

        // expression = ast_for_expr(c, CHILD(sync_n, 3));

        /* Check the # of children rather than the length of t, since
           (x for x, in ...) has 1 element in t, but still requires a Tuple. */
        first = t[0];
        if (NCH(for_ch) == 1)
            comp = new Sk.astnodes.comprehension(first, expression, null, is_async);
        else
            comp = new Sk.astnodes.comprehension(new Sk.astnodes.Tuple(t, Sk.astnodes.Store, first.lineno, first.col_offset,
                                       for_ch.end_lineno, for_ch.end_col_offset),
                                 expression, null, is_async);

        if (NCH(n) == (5 + is_async)) {
            var j, n_ifs;
            var ifs = [];

            n = CHILD(n, 4 + is_async);
            n_ifs = count_comp_ifs(c, n);
            if (n_ifs == -1) {
                return null;
            }

            for (j = 0; j < n_ifs; j++) {
                REQ(n, SYM.comp_iter);
                n = CHILD(n, 0);
                REQ(n, SYM.comp_if);

                expression = ast_for_expr(c, CHILD(n, 1));
                if (!expression) {
                    return null;
                }

                ifs[j] = expression;
                if (NCH(n) == 3) {
                    n = CHILD(n, 2);
                }
            }
            /* on exit, must guarantee that n is a comp_for */
            if (TYPE(n) == SYM.comp_iter) {
                n = CHILD(n, 0);
            }
            comp.ifs = ifs;
        }
        // if (NCH(sync_n) == 5) {
        //     var j, n_ifs;
        //     var ifs = [];

        //     n = CHILD(sync_n, 4);
        //     n_ifs = count_comp_ifs(c, n);

        //     for (j = 0; j < n_ifs; j++) {
        //         REQ(n, comp_iter);
        //         n = CHILD(n, 0);
        //         REQ(n, comp_if);

        //         expression = ast_for_expr(c, CHILD(n, 1));
        //         if (!expression) {
        //             return null;
        //         }

        //         ifs[j] = expression;
        //         if (NCH(n) == 3) {
        //             n = CHILD(n, 2);
        //         }
        //     }
        //     /* on exit, must guarantee that n is a comp_for */
        //     if (TYPE(n) == SYM.comp_iter) {
        //         n = CHILD(n, 0);
        //     }
        //     comp.ifs = ifs;
        // }
        comps[i] = comp;
    }
    return comps;
}

function ast_for_itercomp(c, n, type) {
    /* testlist_comp: (test|star_expr)
     *                ( comp_for | (',' (test|star_expr))* [','] ) */
    var elt;
    var comps;
    var ch;

    Sk.asserts.assert(NCH(n) > 1);

    ch = CHILD(n, 0);
    elt = ast_for_expr(c, ch);

    if (elt.constructor === Sk.astnodes.Starred) {
        ast_error(c, ch, "iterable unpacking cannot be used in comprehension");
        return NULL;
    }

    comps = ast_for_comprehension(c, CHILD(n, 1));

    if (type == COMP_GENEXP) {
        return new Sk.astnodes.GeneratorExp(elt, comps, LINENO(n), n.col_offset,
                            n.end_lineno, n.end_col_offset);
    } else if (type == COMP_LISTCOMP) {
        return new Sk.astnodes.ListComp(elt, comps, LINENO(n), n.col_offset,
                        n.end_lineno, n.end_col_offset);
    } else if (type == COMP_SETCOMP) {
        return new Sk.astnodes.SetComp(elt, comps, LINENO(n), n.col_offset,
                       n.end_lineno, n.end_col_offset);
    } else {
        /* Should never happen */
        return null;
    }
}

/* Fills in the key, value pair corresponding to the dict element.  In case
 * of an unpacking, key is NULL.  *i is advanced by the number of ast
 * elements.  Iff successful, nonzero is returned.
 */
function ast_for_dictelement(c, n, i)
{
    var expression;
    if (TYPE(CHILD(n, i)) == TOK.T_DOUBLESTAR) {
        Sk.asserts.assert(NCH(n) - i >= 2);

        expression = ast_for_expr(c, CHILD(n, i + 1));

        return { key: null, value: expression, i: i + 2 }
    } else {
        Sk.asserts.assert(NCH(n) - i >= 3);

        expression = ast_for_expr(c, CHILD(n, i));
        if (!expression)
            return 0;
        var key = expression;

        REQ(CHILD(n, i + 1), TOK.T_COLON);

        expression = ast_for_expr(c, CHILD(n, i + 2));
        if (!expression) {
            return false;
        }

        var value = expression;

        return { key: key, value: value, i: i + 3 };
    }
}

function ast_for_dictcomp(c, n) {
    var key, value;
    var comps = [];
    Sk.asserts.assert(NCH(n) > 3);
    REQ(CHILD(n, 1), TOK.T_COLON);
    key = ast_for_expr(c, CHILD(n, 0));
    value = ast_for_expr(c, CHILD(n, 2));
    comps = astForComprehension(c, CHILD(n, 3));
    return new Sk.astnodes.DictComp(key, value, comps, n.lineno, n.col_offset);
}

function ast_for_dictdisplay(c, n)
{
    var i;
    var j;
    var keys = [], values = [];

    j = 0;
    for (i = 0; i < NCH(n); i++) {
        var res = ast_for_dictelement(c, n, i);
        i = res.i
        keys[j] = res.key;
        values[j] = res.value;
        j++;
    }

    return new Sk.astnodes.Dict(keys, values, LINENO(n), n.col_offset,
                n.end_lineno, n.end_col_offset);
}

function ast_for_gen_expr(c, n) {
    Sk.asserts.assert(n.type === SYM.testlist_comp || n.type === SYM.argument);
    return astForIterComp(c, n, COMP_GENEXP);
}

function ast_for_setcomp(c, n) {
    Sk.asserts.assert(n.type === SYM.dictorsetmaker);
    return astForIterComp(c, n, COMP_SETCOMP);
}

function astForWhileStmt (c, n) {
    /* while_stmt: 'while' test ':' suite ['else' ':' suite] */
    REQ(n, SYM.while_stmt);
    if (NCH(n) === 4) {
        return new Sk.astnodes.While(ast_for_expr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.lineno, n.col_offset);
    }
    else if (NCH(n) === 7) {
        return new Sk.astnodes.While(ast_for_expr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.lineno, n.col_offset);
    }
    Sk.asserts.fail("wrong number of tokens for 'while' stmt");
}

function astForAugassign (c, n) {
    REQ(n, SYM.augassign);
    n = CHILD(n, 0);
    switch (n.value.charAt(0)) {
        case "+":
            return Sk.astnodes.Add;
        case "-":
            return Sk.astnodes.Sub;
        case "/":
            if (n.value.charAt(1) === "/") {
                return Sk.astnodes.FloorDiv;
            }
            return Sk.astnodes.Div;
        case "%":
            return Sk.astnodes.Mod;
        case "<":
            return Sk.astnodes.LShift;
        case ">":
            return Sk.astnodes.RShift;
        case "&":
            return Sk.astnodes.BitAnd;
        case "^":
            return Sk.astnodes.BitXor;
        case "|":
            return Sk.astnodes.BitOr;
        case "*":
            if (n.value.charAt(1) === "*") {
                return Sk.astnodes.Pow;
            }
            return Sk.astnodes.Mult;
        case "@":
            if (Sk.__future__.python3) {
                return Sk.astnodes.MatMult;
            }
        default:
            Sk.asserts.fail("invalid augassign");
    }
}

function astForBinop (c, n) {
    /* Must account for a sequence of expressions.
     How should A op B op C by represented?
     BinOp(BinOp(A, op, B), op, C).
     */
    var tmp;
    var newoperator;
    var nextOper;
    var i;
    var result = new Sk.astnodes.BinOp(
        ast_for_expr(c, CHILD(n, 0)),
        getOperator(CHILD(n, 1)),
        ast_for_expr(c, CHILD(n, 2)),
        n.lineno, n.col_offset);
    var nops = (NCH(n) - 1) / 2;
    for (i = 1; i < nops; ++i) {
        nextOper = CHILD(n, i * 2 + 1);
        newoperator = getOperator(nextOper);
        tmp = ast_for_expr(c, CHILD(n, i * 2 + 2));
        result = new Sk.astnodes.BinOp(result, newoperator, tmp, nextOper.lineno, nextOper.col_offset);
    }
    return result;
}

function ast_for_testlist (c, n) {
    /* testlist_comp: test (',' comp_for | (',' test)* [',']) */
    /* testlist: test (',' test)* [','] */
    Sk.asserts.assert(NCH(n) > 0);
    if (n.type === SYM.testlist_comp) {
        if (NCH(n) > 1) {
            Sk.asserts.assert(CHILD(n, 1).type !== SYM.comp_for);
        }
    }
    else {
        Sk.asserts.assert(n.type === SYM.testlist || n.type === SYM.testlist_star_expr);
    }

    if (NCH(n) === 1) {
        return ast_for_expr(c, CHILD(n, 0));
    }
    else {
        return new Sk.astnodes.Tuple(seq_for_testlist(c, n), Sk.astnodes.Load, n.lineno, n.col_offset/*, c.c_arena */);
    }
}

function ast_for_exprStmt (c, n) {
    var expression;
    var value;
    var e;
    var i;
    var targets;
    var expr2;
    var varName;
    var expr1;
    var ch;
    var ann;
    var simple;
    var deep;
    var expr3;
    REQ(n, SYM.expr_stmt);
    /* expr_stmt: testlist_star_expr (annassign | augassign (yield_expr|testlist) |
                            ('=' (yield_expr|testlist_star_expr))*)
       annassign: ':' test ['=' test]
       testlist_star_expr: (test|star_expr) (',' test|star_expr)* [',']
       augassign: '+=' | '-=' | '*=' | '@=' | '/=' | '%=' | '&=' | '|=' | '^='
                | '<<=' | '>>=' | '**=' | '//='
       test: ... here starts the operator precedence dance
     */
    if (NCH(n) === 1) {
        return new Sk.astnodes.Expr(ast_for_testlist(c, CHILD(n, 0)), n.lineno, n.col_offset);
    }
    else if (CHILD(n, 1).type === SYM.augassign) {
        ch = CHILD(n, 0);
        expr1 = ast_for_testlist(c, ch);
        setContext(c, expr1, Sk.astnodes.Store, ch);
        switch (expr1.constructor) {
            case Sk.astnodes.Name:
                varName = expr1.id;
                forbiddenCheck(c, ch, varName, n.lineno);
                break;
            case Sk.astnodes.Attribute:
            case Sk.astnodes.Subscript:
                break;
            case Sk.astnodes.GeneratorExp:
                throw new Sk.builtin.SyntaxError("augmented assignment to generator expression not possible", c.c_filename, n.lineno);
            case Sk.astnodes.Yield:
                throw new Sk.builtin.SyntaxError("augmented assignment to yield expression not possible", c.c_filename, n.lineno);
            default:
                throw new Sk.builtin.SyntaxError("illegal expression for augmented assignment", c.c_filename, n.lineno);
        }

        ch = CHILD(n, 2);
        if (ch.type === SYM.testlist) {
            expr2 = ast_for_testlist(c, ch);
        }
        else {
            expr2 = ast_for_expr(c, ch);
        }

        return new Sk.astnodes.AugAssign(expr1, astForAugassign(c, CHILD(n, 1)), expr2, n.lineno, n.col_offset);
    }
    else if (CHILD(n, 1).type === SYM.annassign) {
        if (!Sk.__future__.python3) {
            throw new Sk.builtin.SyntaxError("Annotated assignment is not supported in Python 2", c.c_filename, n.lineno);
        }
        // annotated assignment
        ch = CHILD(n, 0);
        ann = CHILD(n, 1);
        simple = 1;
        deep = ch;
        while (NCH(deep) == 1) {
            deep = CHILD(deep, 0);
        }
        if (NCH(deep) > 0 && TYPE(CHILD(deep, 0)) == TOK.T_LPAR) {
            simple = 0;
        }
        expr1 = ast_for_testlist(c, ch);
        switch (expr1.constructor) {
            case Sk.astnodes.Name:
                varName = expr1.id;
                forbiddenCheck(c, ch, varName, n.lineno);
                setContext(c, expr1, Sk.astnodes.Store, ch);
                break;
            case Sk.astnodes.Attribute:
                varName = expr1.attr;
                forbiddenCheck(c, ch, varName, n.lineno);
                setContext(c, expr1, Sk.astnodes.Store, ch);
                break;
            case Sk.astnodes.Subscript:
                setContext(c, expr1, Sk.astnodes.Store, ch);
                break;
            case Sk.astnodes.List:
                throw new Sk.builtin.SyntaxError("only single target (not list) can be annotated", c.c_filename, n.lineno);
            case Sk.astnodes.Tuple:
                throw new Sk.builtin.SyntaxError("only single target (not tuple) can be annotated", c.c_filename, n.lineno);
            default:
                throw new Sk.builtin.SyntaxError("illegal target for annotation", c.c_filename, n.lineno);
        }
        
        if (expr1.constructor != Sk.astnodes.Name) {
            simple = 0;
        }
        
        ch = CHILD(ann, 1);
        expr2 = ast_for_expr(c, ch);
        if (NCH(ann) == 2) {
            return new Sk.astnodes.AnnAssign(expr1, expr2, null, simple, n.lineno, n.col_offset);
        } else {
            ch = CHILD(ann, 3);
            expr3 = ast_for_expr(c, ch);
            return new Sk.astnodes.AnnAssign(expr1, expr2, expr3, simple, n.lineno, n.col_offset);
        }
    }
    else {
        // normal assignment
        REQ(CHILD(n, 1), TOK.T_EQUAL);
        targets = [];
        for (i = 0; i < NCH(n) - 2; i += 2) {
            ch = CHILD(n, i);
            if (ch.type === SYM.yield_expr) {
                throw new Sk.builtin.SyntaxError("assignment to yield expression not possible", c.c_filename, n.lineno);
            }
            e = ast_for_testlist(c, ch);
            setContext(c, e, Sk.astnodes.Store, CHILD(n, i));
            targets[i / 2] = e;
        }
        value = CHILD(n, NCH(n) - 1);
        if (value.type === SYM.testlist_star_expr) {
            expression = ast_for_testlist(c, value);
        }
        else {
            expression = ast_for_expr(c, value);
        }
        return new Sk.astnodes.Assign(targets, expression, n.lineno, n.col_offset);
    }
}

function astForIfexpr (c, n) {
    /* test: or_test 'if' or_test 'else' test */
    Sk.asserts.assert(NCH(n) === 5);
    return new Sk.astnodes.IfExp(
        ast_for_expr(c, CHILD(n, 2)),
        ast_for_expr(c, CHILD(n, 0)),
        ast_for_expr(c, CHILD(n, 4)),
        n.lineno, n.col_offset);
}

/**
 * s is a python-style string literal, including quote characters and u/r/b
 * prefixes. Returns [decoded string object, is-an-fstring]
 */
function parsestr (c, n, s) {
    var quote = s.charAt(0);
    var rawmode = false;
    var unicode = false;
    var fmode = false;
    var bytesmode = false;

    var decodeEscape = function (s, quote) {
        var d3;
        var d2;
        var d1;
        var d0;
        var ch;
        var i;
        var len = s.length;
        var ret = "";
        for (i = 0; i < len; ++i) {
            ch = s.charAt(i);
            if (ch === "\\") {
                ++i;
                ch = s.charAt(i);
                if (ch === "n") {
                    ret += "\n";
                }
                else if (ch === "\\") {
                    ret += "\\";
                }
                else if (ch === "t") {
                    ret += "\t";
                }
                else if (ch === "r") {
                    ret += "\r";
                }
                else if (ch === "b") {
                    ret += "\b";
                }
                else if (ch === "f") {
                    ret += "\f";
                }
                else if (ch === "v") {
                    ret += "\v";
                }
                else if (ch === "0") {
                    ret += "\0";
                }
                else if (ch === '"') {
                    ret += '"';
                }
                else if (ch === '\'') {
                    ret += '\'';
                }
                else if (ch === "\n") /* escaped newline, join lines */ {
                }
                else if (ch === "x") {
                    if (i+2 >= len) {
                        ast_error(c, n, "Truncated \\xNN escape");
                    }
                    ret += String.fromCharCode(parseInt(s.substr(i+1,2), 16));
                    i += 2;
                }
                else if (!bytesmode && ch === "u") {
                    if (i+4 >= len) {
                        ast_error(c, n, "Truncated \\uXXXX escape");
                    }
                    ret += String.fromCharCode(parseInt(s.substr(i+1, 4), 16))
                    i += 4;
                }
                else if (!bytesmode && ch === "U") {
                    if (i+8 >= len) {
                        ast_error(c, n, "Truncated \\UXXXXXXXX escape");
                    }
                    ret += String.fromCodePoint(parseInt(s.substr(i+1, 8), 16))
                    i += 8;
                }
                else {
                    // Leave it alone
                    ret += "\\" + ch;
                    // Sk.asserts.fail("unhandled escape: '" + ch.charCodeAt(0) + "'");
                }
            }
            else if (bytesmode && ch.charCodeAt(0) > 0x7f) {
                ast_error(c, n, "bytes can only contain ASCII literal characters");
            } else {
                ret += ch;
            }
        }
        return ret;
    };

    //console.log("parsestr", s);

    // treats every sequence as unicodes even if they are not treated with uU prefix
    // kinda hacking though working for most purposes
    if((c.c_flags & Sk.Parser.CO_FUTURE_UNICODE_LITERALS || Sk.__future__.unicode_literals === true)) {
        unicode = true;
    }

    let seenflags = {};

    while(true) {
        if (quote === "u" || quote === "U") {
            unicode = true;
        }
        else if (quote === "r" || quote === "R") {
            rawmode = true;
        }
        else if (quote === "b" || quote === "B") {
            bytesmode = true;
        }
        else if (quote === "f" || quote === "F") {
            fmode = true;
        }
        else {
            break;
        }
        s = s.substr(1);
        quote = s.charAt(0);
    }

    Sk.asserts.assert(quote === "'" || quote === '"' && s.charAt(s.length - 1) === quote);
    s = s.substr(1, s.length - 2);

    if (s.length >= 4 && s.charAt(0) === quote && s.charAt(1) === quote) {
        Sk.asserts.assert(s.charAt(s.length - 1) === quote && s.charAt(s.length - 2) === quote);
        s = s.substr(2, s.length - 4);
    }

    if (rawmode || s.indexOf("\\") === -1) {
        if (bytesmode) {
            for (let i=0; i<s.length; i++) {
                if (s.charCodeAt(i) > 0x7f) {
                    ast_error(c, n, "bytes can only contain ASCII literal characters");
                }
            }
        }
        return [strobj(s), fmode, bytesmode];
    }
    return [strobj(decodeEscape(s, quote)), fmode, bytesmode];
}

function fstring_compile_expr(str, expr_start, expr_end, c, n) {
    Sk.asserts.assert(expr_end >= expr_start);
    Sk.asserts.assert(str.charAt(expr_start-1) == '{');
    Sk.asserts.assert(str.charAt(expr_end) == '}' || str.charAt(expr_end) == '!' || str.charAt(expr_end) == ':');

    let s = str.substring(expr_start, expr_end);

    /* If the substring is all whitespace, it's an error.  We need to catch this
       here, and not when we call PyParser_SimpleParseStringFlagsFilename,
       because turning the expression '' in to '()' would go from being invalid
       to valid. */
    if (/^\s*$/.test(s)) {
        ast_error(c, n, "f-string: empty expression not allowed");
    }
    s = "(" + s + ")";

    let ast;
    try {
        let parsed = Sk.parse("<fstring>", s);
        ast = Sk.astFromParse(parsed.cst, "<fstring>", parsed.flags);
    } catch(e) {
        if (e.traceback && e.traceback[0]) {
            let tb = e.traceback[0];
            tb.lineno = (tb.lineno || 1) - 1 + LINENO(n);
            tb.filename = c.c_filename;
        }
        throw e;
    }

    // TODO fstring_fix_node_location

    Sk.asserts.assert(ast.body.length == 1 && ast.body[0].constructor === Sk.astnodes.Expr);

    return ast.body[0].value;
}

function fstring_find_expr(str, start, end, raw, recurse_lvl, c, n) {
    let i = start;
    Sk.asserts.assert(str.charAt(i) == "{");
    i++;
    let expr_start = i;
    /* null if we're not in a string, else the quote char we're trying to
       match (single or double quote). */
    let quote_char = null;
    /* If we're inside a string, 1=normal, 3=triple-quoted. */
    let string_type = 0;
    /* Keep track of nesting level for braces/parens/brackets in
       expressions. */
    let nested_depth = 0;

    let format_spec, conversion;

    let unexpected_end_of_string = () => ast_error(c, n, "f-string: expecting '}'");

    Sk.asserts.assert(i <= end);

    for (; i < end; i++) {
        let ch = str.charAt(i);

        /* Nowhere inside an expression is a backslash allowed. */
        if (ch == '\\') {
            /* Error: can't include a backslash character, inside
               parens or strings or not. */
            ast_error(c, n, "f-string expression part cannot include a backslash");
        }
        if (quote_char) {
            /* We're inside a string. See if we're at the end. */
            /* This code needs to implement the same non-error logic
               as tok_get from tokenizer.c, at the letter_quote
               label. To actually share that code would be a
               nightmare. But, it's unlikely to change and is small,
               so duplicate it here. Note we don't need to catch all
               of the errors, since they'll be caught when parsing the
               expression. We just need to match the non-error
               cases. Thus we can ignore \n in single-quoted strings,
               for example. Or non-terminated strings. */
            if (ch == quote_char) {
                /* Does this match the string_type (single or triple
                   quoted)? */
                if (string_type == 3) {
                    if (i+2 < end && str.charAt(i+1) == ch && str.charAt(i+2) == ch) {
                        /* We're at the end of a triple quoted string. */
                        i += 2;
                        string_type = 0;
                        quote_char = 0;
                        continue;
                    }
                } else {
                    /* We're at the end of a normal string. */
                    quote_char = 0;
                    string_type = 0;
                    continue;
                }
            }
        } else if (ch == '\'' || ch == '"') {
            /* Is this a triple quoted string? */
            if (i+2 < end && str.charAt(i+1) == ch && str.charAt(i+2) == ch) {
                string_type = 3;
                i += 2;
            } else {
                /* Start of a normal string. */
                string_type = 1;
            }
            /* Start looking for the end of the string. */
            quote_char = ch;
        } else if (ch == '[' || ch == '{' || ch == '(') {
            nested_depth++;
        } else if (nested_depth != 0 &&
                   (ch == ']' || ch == '}' || ch == ')')) {
            nested_depth--;
        } else if (ch == '#') {
            /* Error: can't include a comment character, inside parens
               or not. */
            ast_error(c, n, "f-string expression part cannot include '#'");
        } else if (nested_depth == 0 &&
                   (ch == '!' || ch == ':' || ch == '}')) {
            /* First, test for the special case of "!=". Since '=' is
               not an allowed conversion character, nothing is lost in
               this test. */
            if (ch == '!' && i+1 < end && str.charAt(i+1) == '=') {
                /* This isn't a conversion character, just continue. */
                continue;
            }
            /* Normal way out of this loop. */
            break;
        } else {
            /* Just consume this char and loop around. */
        }
    }

    /* If we leave this loop in a string or with mismatched parens, we
       don't care. We'll get a syntax error when compiling the
       expression. But, we can produce a better error message, so
       let's just do that.*/
    if (quote_char) {
        ast_error(c, n, "f-string: unterminated string");
    }
    if (nested_depth) {
        ast_error(c, n, "f-string: mismatched '(', '{', or '['");
    }

    let expr_end = i;

    /* Compile the expression as soon as possible, so we show errors
       related to the expression before errors related to the
       conversion or format_spec. */
    let simple_expression = fstring_compile_expr(str, expr_start, expr_end, c, n);
 
    /* Check for a conversion char, if present. */
    if (str.charAt(i) == '!') {
        i++;
        if (i >= end)
            unexpected_end_of_string();

        conversion = str.charAt(i);
        i++;

        /* Validate the conversion. */
        if (!(conversion == 's' || conversion == 'r'
              || conversion == 'a')) {
            ast_error(c, n, "f-string: invalid conversion character: expected 's', 'r', or 'a'");
        }
    }

    /* Check for the format spec, if present. */
    if (i >= end)
        unexpected_end_of_string();
    if (str.charAt(i) == ':') {
        i++
        if (i >= end)
            unexpected_end_of_string();

        /* Parse the format spec. */
        [format_spec, i] = fstring_parse(str, i, end, raw, recurse_lvl+1, c, n);
    }

    if (i >= end || str.charAt(i) != '}')
        unexpected_end_of_string();

    /* We're at a right brace. Consume it. */
    i++;

    /* And now create the FormattedValue node that represents this
       entire expression with the conversion and format spec. */
    let expr = new Sk.astnodes.FormattedValue(simple_expression, conversion,
                                              format_spec, LINENO(n), n.col_offset);

    return [expr, i];
}

function fstring_parse(str, start, end, raw, recurse_lvl, c, n) {
    let values = [];
    let idx = start;

    let addLiteral = (literal) => {
        if (literal.indexOf("}") !== -1) {
            // We need to error out on any lone }s, and
            // replace doubles with singles.
            if (/(^|[^}])}(}})*($|[^}])/.test(literal)) {
                throw new SyntaxError("f-string: single '}' is not allowed", LINENO(n), n.col_offset);
            }
            literal = literal.replace(/}}/g, "}");
        }
        values.push(new Sk.astnodes.Str(new Sk.builtin.str(literal), LINENO(n), n.col_offset, c.end_lineno, n.end_col_offset));
    };

    
    while (idx < end) {
        let bidx = str.indexOf("{", idx);
        if (recurse_lvl !== 0) {
            // If there's a closing brace before the next open brace,
            // that's our end-of-expression
            let cbidx = str.indexOf("}", idx);
            if (cbidx !== -1) {
                if (bidx === -1) {
                    end = cbidx;
                } else if (bidx > cbidx) {
                    bidx = -1;
                    end = cbidx;
                }
            }
        }
        if (bidx === -1) {
            addLiteral(str.substring(idx, end));
            idx = end;
            break;
        }
        else if (bidx+1 < end && str.charAt(bidx+1) === "{") {
            // Swallow the double {{
            addLiteral(str.substring(idx, bidx+1));
            idx = bidx + 2;
            continue;
        }
        else {
            addLiteral(str.substring(idx, bidx));
            idx = bidx;

            // And now parse the f-string expression itself
            let [expr, endIdx] = fstring_find_expr(str, bidx, end, raw, recurse_lvl, c, n);
            values.push(expr);
            idx = endIdx;
        }
    }
    return [new Sk.astnodes.JoinedStr(values, LINENO(n), n.col_offset), idx];
}

function parsestrplus (c, n) {
    let strs = [];
    let lastStrNode;
    let bytesmode;

    for (let i = 0; i < NCH(n); ++i) {
        let chstr = CHILD(n, i).value;
        let r = parsestr(c, CHILD(n,i), chstr);
        let str = r[0];
        let fmode = r[1];
        let this_bytesmode = r[2];


        /* Check that we're not mixing bytes with unicode. */
        if (i != 0 && bytesmode !== this_bytesmode) {
            ast_error(c, n, "cannot mix bytes and nonbytes literals");
        }
        bytesmode = this_bytesmode;

        if (fmode) {
            if (!Sk.__future__.python3) {
                throw new Sk.builtin.SyntaxError("invalid string (f-strings are not supported in Python 2)", c.c_filename, CHILD(n, i).lineno);
            }

            let jss = str.$jsstr();
            let [astnode, _] = fstring_parse(jss, 0, jss.length, false, 0, c, CHILD(n, i));
            strs.push.apply(strs, astnode.values);
            lastStrNode = null;
        } else {
            if (lastStrNode) {
                lastStrNode.s = lastStrNode.s.sq$concat(str);
            } else {
                let type = bytesmode ? Sk.astnodes.Bytes : Sk.astnodes.Str;
                lastStrNode = new type(str, LINENO(n), n.col_offset, c.end_lineno, n.end_col_offset)
                strs.push(lastStrNode);
            }
        }
    }

    if (strs.length === 1 && strs[0].constructor === Sk.astnodes.Str) {
        return strs[0];
    } else {
        return new Sk.astnodes.JoinedStr(strs, LINENO(n), n.col_offset, c.end_lineno, n.end_col_offset);
    }
}

const invalidSyntax = /_[eE]|[eE]_|\._|j_/;
const invalidDecimalLiteral = /_\.|[+-]_|^0_\D|_j/;
const validUnderscores = /_(?=[^_])/g;
function parsenumber (c, s, lineno) {
    var neg;
    var val;
    var tmp;
    var end = s.charAt(s.length - 1);
    
    if (s.indexOf("_") !== -1) {
        if (invalidSyntax.test(s)) {
            throw new Sk.builtin.SyntaxError("invalid syntax", c.c_filename, lineno);
        }
    
        if (invalidDecimalLiteral.test(s)) {
            throw new Sk.builtin.SyntaxError("invalid decimal literal", c.c_filename, lineno);
        }
        
        s = s.replace(validUnderscores, "");
    }
    
    // call internal complex type constructor for complex strings
    if (end === "j" || end === "J") {
        return Sk.builtin.complex.complex_subtype_from_string(s);
    }

    // Handle longs
    if (end === "l" || end === "L") {
        return Sk.longFromStr(s.substr(0, s.length - 1), 0);
    }

    // todo; we don't currently distinguish between int and float so
    // str is wrong for these.
    if (s.indexOf(".") !== -1) {
        return new Sk.builtin.float_(parseFloat(s));
    }

    // Handle integers of various bases
    tmp = s;
    neg = false;
    if (s.charAt(0) === "-") {
        tmp = s.substr(1);
        neg = true;
    }

    if (tmp.charAt(0) === "0" && (tmp.charAt(1) === "x" || tmp.charAt(1) === "X")) {
        // Hex
        tmp = tmp.substring(2);
        val = parseInt(tmp, 16);
    } else if ((s.indexOf("e") !== -1) || (s.indexOf("E") !== -1)) {
        // Float with exponent (needed to make sure e/E wasn't hex first)
        return new Sk.builtin.float_(parseFloat(s));
    } else if (tmp.charAt(0) === "0" && (tmp.charAt(1) === "b" || tmp.charAt(1) === "B")) {
        // Binary
        tmp = tmp.substring(2);
        val = parseInt(tmp, 2);
    } else if (tmp.charAt(0) === "0") {
        if (tmp === "0") {
            // Zero
            val = 0;
        } else {
            // Octal
            tmp = tmp.substring(1);
            if ((tmp.charAt(0) === "o") || (tmp.charAt(0) === "O")) {
                tmp = tmp.substring(1);
            }
            val = parseInt(tmp, 8);
        }
    }
    else {
        // Decimal
        val = parseInt(tmp, 10);
    }

    // Convert to long
    if (val > Number.MAX_SAFE_INTEGER &&
        Math.floor(val) === val &&
        (s.indexOf("e") === -1 && s.indexOf("E") === -1)) {
        return Sk.longFromStr(s, 0);
    }

    // Small enough, return parsed number
    if (neg) {
        return new Sk.builtin.int_(-val);
    } else {
        return new Sk.builtin.int_(val);
    }
}

function astForSlice (c, n) {
    var n2;
    var step;
    var upper;
    var lower;
    var ch;
    REQ(n, SYM.subscript);

    /*
     subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
     sliceop: ':' [test]
     */
    ch = CHILD(n, 0);
    lower = null;
    upper = null;
    step = null;
    if (ch.type === TOK.T_DOT) {
        return new Sk.astnodes.Ellipsis();
    }
    if (NCH(n) === 1 && ch.type === SYM.test) {
        return new Sk.astnodes.Index(ast_for_expr(c, ch));
    }
    if (ch.type === SYM.test) {
        lower = ast_for_expr(c, ch);
    }
    if (ch.type === TOK.T_COLON) {
        if (NCH(n) > 1) {
            n2 = CHILD(n, 1);
            if (n2.type === SYM.test) {
                upper = ast_for_expr(c, n2);
            }
        }
    }
    else if (NCH(n) > 2) {
        n2 = CHILD(n, 2);
        if (n2.type === SYM.test) {
            upper = ast_for_expr(c, n2);
        }
    }

    ch = CHILD(n, NCH(n) - 1);
    if (ch.type === SYM.sliceop) {
        if (NCH(ch) === 1) {
            ch = CHILD(ch, 0);
            step = new Sk.astnodes.NameConstant(Sk.builtin.none.none$, Sk.astnodes.Load, ch.lineno, ch.col_offset);
        }
        else {
            ch = CHILD(ch, 1);
            if (ch.type === SYM.test) {
                step = ast_for_expr(c, ch);
            }
        }
    }
    return new Sk.astnodes.Slice(lower, upper, step);
}

function ast_for_atom(c, n)
{
    /* atom: '(' [yield_expr|testlist_comp] ')' | '[' [testlist_comp] ']'
       | '{' [dictmaker|testlist_comp] '}' | NAME | NUMBER | STRING+
       | '...' | 'None' | 'True' | 'False'
    */
    var ch = CHILD(n, 0);

    switch (TYPE(ch)) {
        case TOK.T_NAME: {
            var name;
            var s = STR(ch);
            if (s.length >= 4 && s.length <= 5) {
                if (s === "None") {
                    return new Sk.astnodes.NameConstant(Sk.builtin.none.none$, n.lineno, n.col_offset);
                }

                if (s === "True") {
                    return new Sk.astnodes.NameConstant(Sk.builtin.bool.true$, n.lineno, n.col_offset);
                }

                if (s === "False") {
                    return new Sk.astnodes.NameConstant(Sk.builtin.bool.false$, n.lineno, n.col_offset);
                }
            }
            name = new_identifier(s, c);
            /* All names start in Load context, but may later be changed. */
            return new Sk.astnodes.Name(name, Sk.astnodes.Load, LINENO(n), n.col_offset,
                        n.end_lineno, n.end_col_offset);
        }
        case TOK.T_STRING:
            return parsestrplus(c, n);
        case TOK.T_NUMBER:
            return new Sk.astnodes.Num(parsenumber(c, ch.value, n.lineno), n.lineno, n.col_offset);
        case TOK.T_ELLIPSIS: /* Ellipsis */
            return new Sk.astnodes.Ellipsis(LINENO(n), n.col_offset,
                            n.end_lineno, n.end_col_offset);
        case TOK.T_LPAR: /* some parenthesized expressions */
            ch = CHILD(n, 1);

            if (TYPE(ch) == TOK.T_RPAR)
                return new Sk.astnodes.Tuple([], Sk.astnodes.Load, LINENO(n), n.col_offset,
                            n.end_lineno, n.end_col_offset);

            if (TYPE(ch) == SYM.yield_expr) {
                return ast_for_expr(c, ch);
            }

            /* testlist_comp: test ( comp_for | (',' test)* [','] ) */
            if (NCH(ch) == 1) {
                return ast_for_testlist(c, ch);
            }

            if (TYPE(CHILD(ch, 1)) == SYM.comp_for) {
                return copy_location(ast_for_genexp(c, ch), n);
            }
            else {
                return copy_location(ast_for_testlist(c, ch), n);
            }
        case TOK.T_LSQB: /* list (or list comprehension) */
            ch = CHILD(n, 1);

            if (TYPE(ch) == TOK.T_RSQB)
                return new Sk.astnodes.List([], Sk.astnodes.Load, LINENO(n), n.col_offset,
                            n.end_lineno, n.end_col_offset);

            REQ(ch, SYM.testlist_comp);
            if (NCH(ch) == 1 || TYPE(CHILD(ch, 1)) == TOK.T_COMMA) {
                var elts = seq_for_testlist(c, ch);
                if (!elts) {
                    return null;
                }
                return new Sk.astnodes.List(elts, Sk.astnodes.Load, LINENO(n), n.col_offset,
                            n.end_lineno, n.end_col_offset);
            }
            else {
                return copy_location(ast_for_listcomp(c, ch), n);
            }
        case TOK.T_LBRACE: {
            /* dictorsetmaker: ( ((test ':' test | '**' test)
            *                    (comp_for | (',' (test ':' test | '**' test))* [','])) |
            *                   ((test | '*' test)
            *                    (comp_for | (',' (test | '*' test))* [','])) ) */
            var res;
            ch = CHILD(n, 1);
            if (TYPE(ch) == TOK.T_RBRACE) {
                /* It's an empty dict. */
                return new Sk.astnodes.Dict(null, null, LINENO(n), n.col_offset,
                    n.end_lineno, n.end_col_offset);
            }
            else {
                var is_dict = (TYPE(CHILD(ch, 0)) == TOK.T_DOUBLESTAR);
                if (NCH(ch) == 1 ||
                        (NCH(ch) > 1 &&
                        TYPE(CHILD(ch, 1)) == TOK.T_COMMA)) {
                    /* It's a set display. */
                    res = ast_for_setdisplay(c, ch);
                }
                else if (NCH(ch) > 1 &&
                        TYPE(CHILD(ch, 1)) == SYM.comp_for) {
                    /* It's a set comprehension. */
                    res = ast_for_setcomp(c, ch);
                }
                else if (NCH(ch) > 3 - is_dict &&
                        TYPE(CHILD(ch, 3 - is_dict)) == SYM.comp_for) {
                    /* It's a dictionary comprehension. */
                    if (is_dict) {
                        ast_error(c, n,
                                "dict unpacking cannot be used in dict comprehension");
                        return null;
                    }
                    res = ast_for_dictcomp(c, ch);
                }
                else {
                    /* It's a dictionary display. */
                    res = ast_for_dictdisplay(c, ch);
                }
                return copy_location(res, n);
            }
        }
        default:
            Sk.asserts.fail("unhandled atom " + TYPE(ch));
            return null;
    }
}

function ast_for_setdisplay(c, n) {
    var i;
    var elts = [];

    Sk.asserts.assert(TYPE(n) === SYM.dictorsetmaker);

    for (i = 0; i < NCH(n); i += 2) {
        var expression;
        expression = ast_for_expr(c, CHILD(n, i));
        elts[i / 2] = expression;
    }

    return new Sk.astnodes.Set(elts, LINENO(n), n.col_offset);
}

function astForAtomExpr(c, n) {
    var i, nch, start = 0;
    var e, tmp;

    REQ(n, SYM.atom_expr);
    nch = NCH(n);

    if (CHILD(n, 0).type === TOK.T_AWAIT) {
        start = 1;
        Sk.asserts.assert(nch > 1);
    }

    e = ast_for_atom(c, CHILD(n, start));
    if (!e) {
        return null;
    }

    if (nch === 1) {
        return e;
    }

    if (start && nch === 2) {
        return new Sk.astnodes.Await(e, n.lineno, n.col_offset /*, c->c_arena*/);
    }

    for (i = start + 1; i < nch; i++) {
        var ch = CHILD(n, i);
        if (ch.type !== SYM.trailer) {
            break;
        }
        tmp = ast_for_trailer(c, ch, e);
        if (!tmp) {
            return null;
        }

        tmp.lineno = e.lineno;
        tmp.col_offset = e.col_offset;
        e = tmp;
    }

    if (start) {
        /* there was an AWAIT */
        return new Sk.astnodes.Await(e, n.line, n.col_offset /*, c->c_arena*/);
    }
    else {
        return e;
    }
}

function astForPower (c, n) {
    /* power: atom trailer* ('**' factor)*
     */
    var f;
    var tmp;
    var ch;
    var i;
    var e;
    REQ(n, SYM.power);
    e = astForAtomExpr(c, CHILD(n, 0));
    if (NCH(n) === 1) {
        return e;
    }
    if (CHILD(n, NCH(n) - 1).type === SYM.factor) {
        f = ast_for_expr(c, CHILD(n, NCH(n) - 1));
        e = new Sk.astnodes.BinOp(e, Sk.astnodes.Pow, f, n.lineno, n.col_offset);
    }
    return e;
}

function astForStarred(c, n) {
    REQ(n, SYM.star_expr);

    /* The Load context is changed later */
    return new Sk.astnodes.Starred(ast_for_expr(c, CHILD(n ,1)), Sk.astnodes.Load, n.lineno, n.col_offset /*, c.c_arena */)
}

function ast_for_expr (c, n) {
    /*
     handle the full range of simple expressions
     test: or_test ['if' or_test 'else' test] | lambdef
     test_nocond: or_test | lambdef_nocond
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
     power: atom_expr ['**' factor]
     atom_expr: [AWAIT] atom trailer*
     yield_expr: 'yield' [yield_arg]
    */

    var exp;
    var cmps;
    var ops;
    var i;
    var seq;
    LOOP: while (true) {
        switch (n.type) {
            case SYM.test:
            case SYM.test_nocond:
                if (CHILD(n, 0).type === SYM.lambdef || CHILD(n, 0).type === SYM.lambdef_nocond) {
                    return astForLambdef(c, CHILD(n, 0));
                }
                else if (NCH(n) > 1) {
                    return astForIfexpr(c, n);
                }
                // fallthrough
            case SYM.or_test:
            case SYM.and_test:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                seq = [];
                for (i = 0; i < NCH(n); i += 2) {
                    seq[i / 2] = ast_for_expr(c, CHILD(n, i));
                }
                if (CHILD(n, 1).value === "and") {
                    return new Sk.astnodes.BoolOp(Sk.astnodes.And, seq, n.lineno, n.col_offset /*, c.c_arena*/);
                }
                Sk.asserts.assert(CHILD(n, 1).value === "or");
                return new Sk.astnodes.BoolOp(Sk.astnodes.Or, seq, n.lineno, n.col_offset);
            case SYM.not_test:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                else {
                    return new Sk.astnodes.UnaryOp(Sk.astnodes.Not, ast_for_expr(c, CHILD(n, 1)), n.lineno, n.col_offset);
                }
                break;
            case SYM.comparison:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                else {
                    ops = [];
                    cmps = [];
                    for (i = 1; i < NCH(n); i += 2) {
                        ops[(i - 1) / 2] = astForCompOp(c, CHILD(n, i));
                        cmps[(i - 1) / 2] = ast_for_expr(c, CHILD(n, i + 1));
                    }
                    return new Sk.astnodes.Compare(ast_for_expr(c, CHILD(n, 0)), ops, cmps, n.lineno, n.col_offset);
                }
                break;
            case SYM.star_expr:
                return astForStarred(c, n);
            /* The next fize cases all handle BinOps  The main body of code
               is the same in each case, but the switch turned inside out to
               reuse the code for each type of operator
             */
            case SYM.expr:
            case SYM.xor_expr:
            case SYM.and_expr:
            case SYM.shift_expr:
            case SYM.arith_expr:
            case SYM.term:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                return astForBinop(c, n);
            case SYM.yield_expr:
                var an;
                var en
                var is_from = false;
                exp = null;
                if (NCH(n) > 1) {
                    an = CHILD(n, 1); /* yield_arg */
                }

                if (an) {
                    en = CHILD(an, NCH(an) - 1);
                    if (NCH(an) == 2) {
                        is_from = true;
                        exp = ast_for_expr(c, en);
                    } else {
                        exp = ast_for_testlist(c, en);
                    }
                }

                if (is_from) {
                    return new Sk.astnodes.YieldFrom(exp, n.lineno, n.col_offset);
                }

                return new Sk.astnodes.Yield(exp, n.lineno, n.col_offset);
            case SYM.factor:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                return astForFactor(c, n);
            case SYM.power:
                return astForPower(c, n);
            default:
                Sk.asserts.fail("unhandled expr", "n.type: %d", n.type);
        }
        break;
    }
}

function astForNonLocalStmt(c, n) {
    ast_error(c, n, "Not implemented: nonlocal");
}

function astForAsyncStmt(c, n) {
    ast_error(c, n, "Not implemented: async");
}

// This is only used for Python 2 support.
function astForPrintStmt (c, n) {

    if (Sk.__future__.print_function) {
        ast_error(c, n, "Missing parentheses in call to 'print'");
    }

    /* print_stmt: 'print' ( [ test (',' test)* [','] ]
     | '>>' test [ (',' test)+ [','] ] )
     */
    var nl;
    var i, j;
    var seq;
    var start = 1;
    var dest = null;
    REQ(n, SYM.print_stmt);
    if (NCH(n) >= 2 && CHILD(n, 1).type === TOK.T_RIGHTSHIFT) {
        dest = ast_for_expr(c, CHILD(n, 2));
        start = 4;
    }
    seq = [];
    for (i = start, j = 0; i < NCH(n); i += 2, ++j) {
        seq[j] = ast_for_expr(c, CHILD(n, i));
    }
    nl = (CHILD(n, NCH(n) - 1)).type === TOK.T_COMMA ? false : true;
    return new Sk.astnodes.Print(dest, seq, nl, n.lineno, n.col_offset);
}

function astForStmt (c, n) {
    var ch;
    if (n.type === SYM.stmt) {
        Sk.asserts.assert(NCH(n) === 1);
        n = CHILD(n, 0);
    }
    if (n.type === SYM.simple_stmt) {
        Sk.asserts.assert(numStmts(n) === 1);
        n = CHILD(n, 0);
    }
    if (n.type === SYM.small_stmt) {
        n = CHILD(n, 0);
        /* small_stmt: expr_stmt | del_stmt | pass_stmt | flow_stmt
                   | import_stmt | global_stmt | nonlocal_stmt | assert_stmt
                   | debugger_stmt (skulpt special)
        */
        switch (n.type) {
            case SYM.expr_stmt:
                return ast_for_exprStmt(c, n);
            case SYM.del_stmt:
                return astForDelStmt(c, n);
            case SYM.pass_stmt:
                return new Sk.astnodes.Pass(n.lineno, n.col_offset);
            case SYM.flow_stmt:
                return ast_for_flow_stmt(c, n);
            case SYM.import_stmt:
                return astForImportStmt(c, n);
            case SYM.global_stmt:
                return astForGlobalStmt(c, n);
            case SYM.nonlocal_stmt:
                return astForNonLocalStmt(c, n);
            case SYM.assert_stmt:
                return astForAssertStmt(c, n);
            case SYM.print_stmt:
                return astForPrintStmt(c, n);
            case SYM.debugger_stmt:
                return new Sk.astnodes.Debugger(n.lineno, n.col_offset);
            default:
                Sk.asserts.fail("unhandled small_stmt");
        }
    }
    else {
        /* compound_stmt: if_stmt | while_stmt | for_stmt | try_stmt
                        | funcdef | classdef | decorated | async_stmt
        */
        ch = CHILD(n, 0);
        REQ(n, SYM.compound_stmt);
        switch (ch.type) {
            case SYM.if_stmt:
                return astForIfStmt(c, ch);
            case SYM.while_stmt:
                return astForWhileStmt(c, ch);
            case SYM.for_stmt:
                return astForForStmt(c, ch);
            case SYM.try_stmt:
                return astForTryStmt(c, ch);
            case SYM.with_stmt:
                return ast_for_with_stmt(c, ch);
            case SYM.funcdef:
                return ast_for_funcdef(c, ch, []);
            case SYM.classdef:
                return astForClassdef(c, ch, []);
            case SYM.decorated:
                return ast_for_decorated(c, ch);
            case SYM.async_stmt:
                return astForAsyncStmt(c, ch);
            default:
                Sk.asserts.assert("unhandled compound_stmt");
        }
    }
};

Sk.astFromParse = function (n, filename, c_flags) {
    var j;
    var num;
    var ch;
    var i;
    var c = new Compiling("utf-8", filename, c_flags);
    var stmts = [];
    var k = 0;
    switch (n.type) {
        case SYM.file_input:
            for (i = 0; i < NCH(n) - 1; ++i) {
                ch = CHILD(n, i);
                if (n.type === TOK.T_NEWLINE) {
                    continue;
                }
                REQ(ch, SYM.stmt);
                num = numStmts(ch);
                if (num === 1) {
                    stmts[k++] = astForStmt(c, ch);
                }
                else {
                    ch = CHILD(ch, 0);
                    REQ(ch, SYM.simple_stmt);
                    for (j = 0; j < num; ++j) {
                        stmts[k++] = astForStmt(c, CHILD(ch, j * 2));
                    }
                }
            }
            return new Sk.astnodes.Module(stmts);
        case SYM.eval_input:
            Sk.asserts.fail("todo;");
        case SYM.single_input:
            Sk.asserts.fail("todo;");
        default:
            Sk.asserts.fail("todo;");
    }
};

Sk.astDump = function (node) {
    var spaces = function (n) // todo; blurgh
    {
        var i;
        var ret = "";
        for (i = 0; i < n; ++i) {
            ret += " ";
        }
        return ret;
    };

    var _format = function (node, indent) {
        var ret;
        var elemsstr;
        var x;
        var elems;
        var fieldstr;
        var field;
        var attrs;
        var fieldlen;
        var b;
        var a;
        var i;
        var fields;
        var namelen;
        if (node === null) {
            return indent + "None";
        }
        else if (node.prototype && node.prototype._astname !== undefined && node.prototype._isenum) {
            return indent + node.prototype._astname + "()";
        }
        else if (node._astname !== undefined) {
            namelen = spaces(node._astname.length + 1);
            fields = [];
            for (i = 0; i < node._fields.length; i += 2) // iter_fields
            {
                a = node._fields[i]; // field name
                b = node._fields[i + 1](node); // field getter func
                fieldlen = spaces(a.length + 1);
                fields.push([a, _format(b, indent + namelen + fieldlen)]);
            }
            attrs = [];
            for (i = 0; i < fields.length; ++i) {
                field = fields[i];
                attrs.push(field[0] + "=" + field[1].replace(/^\s+/, ""));
            }
            fieldstr = attrs.join(",\n" + indent + namelen);
            return indent + node._astname + "(" + fieldstr + ")";
        }
        else if (Sk.isArrayLike(node)) {
            //Sk.debugout("arr", node.length);
            elems = [];
            for (i = 0; i < node.length; ++i) {
                x = node[i];
                elems.push(_format(x, indent + " "));
            }
            elemsstr = elems.join(",\n");
            return indent + "[" + elemsstr.replace(/^\s+/, "") + "]";
        }
        else {
            if (node === true) {
                ret = "True";
            }
            else if (node === false) {
                ret = "False";
            }
            else if (node instanceof Sk.builtin.lng) {
                ret = node.tp$str().v;
            }
            else if (node instanceof Sk.builtin.str) {
                ret = node["$r"]().v;
            }
            else {
                ret = "" + node;
            }
            return indent + ret;
        }
    };

    return _format(node, "");
};

Sk.exportSymbol("Sk.astFromParse", Sk.astFromParse);
Sk.exportSymbol("Sk.astDump", Sk.astDump);
