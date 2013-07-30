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
var TOK = Sk.Tokenizer.Tokens;

/** @constructor */
function Compiling(encoding, filename)
{
    this.c_encoding = encoding;
    this.c_filename = filename;
}

/**
 * @return {number}
 */
function NCH(n) { goog.asserts.assert(n !== undefined); if (n.children === null) return 0; return n.children.length; }

function CHILD(n, i)
{
    goog.asserts.assert(n !== undefined);
    goog.asserts.assert(i !== undefined);
    return n.children[i];
}

function REQ(n, type) { goog.asserts.assert(n.type === type, "node wasn't expected type"); }

function strobj(s)
{
    goog.asserts.assert(typeof s === "string", "expecting string, got " + (typeof s));
    return new Sk.builtin.str(s);
}

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
    return 0;
}

function forbiddenCheck(c, n, x, lineno)
{
    if (x === "None") throw new Sk.builtin.SyntaxError("assignment to None", c.c_filename, lineno);
    if (x === "True" || x === "False") throw new Sk.builtin.SyntaxError("assignment to True or False is forbidden", c.c_filename, lineno);
}

/**
 * Set the context ctx for e, recursively traversing e.
 *
 * Only sets context for expr kinds that can appear in assignment context as
 * per the asdl file.
 */
function setContext(c, e, ctx, n)
{
    goog.asserts.assert(ctx !== AugStore && ctx !== AugLoad);
    var s = null;
    var exprName = null;

    switch (e.constructor)
    {
        case Attribute:
        case Name:
            if (ctx === Store) forbiddenCheck(c, n, e.attr, n.lineno);
            e.ctx = ctx;
            break;
        case Subscript:
            e.ctx = ctx;
            break;
        case List:
            e.ctx = ctx;
            s = e.elts;
            break;
        case Tuple:
            if (e.elts.length === 0)
                throw new Sk.builtin.SyntaxError("can't assign to ()", c.c_filename, n.lineno);
            e.ctx = ctx;
            s = e.elts;
            break;
        case Lambda:
            exprName = "lambda";
            break;
        case Call:
            exprName = "function call";
            break;
        case BoolOp:
        case BinOp:
        case UnaryOp:
            exprName = "operator";
            break;
        case GeneratorExp:
            exprName = "generator expression";
            break;
        case Yield:
            exprName = "yield expression";
            break;
        case ListComp:
            exprName = "list comprehension";
            break;
        case Dict:
        case Num:
        case Str:
            exprName = "literal";
            break;
        case Compare:
            exprName = "comparison";
            break;
        case IfExp:
            exprName = "conditional expression";
            break;
        default:
            goog.asserts.fail("unhandled expression in assignment");
    }
    if (exprName)
    {
        throw new Sk.builtin.SyntaxError("can't " + (ctx === Store ? "assign to" : "delete") + " " + exprName, c.c_filename, n.lineno);
    }

    if (s)
    {
        for (var i = 0; i < s.length; ++i)
        {
            setContext(c, s[i], ctx, n);
        }
    }
}

var operatorMap = {};
(function() {
    operatorMap[TOK.T_VBAR] = BitOr;
    operatorMap[TOK.T_VBAR] = BitOr;
    operatorMap[TOK.T_CIRCUMFLEX] = BitXor;
    operatorMap[TOK.T_AMPER] = BitAnd;
    operatorMap[TOK.T_LEFTSHIFT] = LShift;
    operatorMap[TOK.T_RIGHTSHIFT] = RShift;
    operatorMap[TOK.T_PLUS] = Add;
    operatorMap[TOK.T_MINUS] = Sub;
    operatorMap[TOK.T_STAR] = Mult;
    operatorMap[TOK.T_SLASH] = Div;
    operatorMap[TOK.T_DOUBLESLASH] = FloorDiv;
    operatorMap[TOK.T_PERCENT] = Mod;
}());
function getOperator(n)
{
    goog.asserts.assert(operatorMap[n.type] !== undefined);
    return operatorMap[n.type];
}

function astForCompOp(c, n)
{
    /* comp_op: '<'|'>'|'=='|'>='|'<='|'<>'|'!='|'in'|'not' 'in'|'is'
               |'is' 'not'
    */
    REQ(n, SYM.comp_op);
    if (NCH(n) === 1)
    {
        n = CHILD(n, 0);
        switch (n.type)
        {
            case TOK.T_LESS: return Lt;
            case TOK.T_GREATER: return Gt;
            case TOK.T_EQEQUAL: return Eq;
            case TOK.T_LESSEQUAL: return LtE;
            case TOK.T_GREATEREQUAL: return GtE;
            case TOK.T_NOTEQUAL: return NotEq;
            case TOK.T_NAME:
                if (n.value === "in") return In_;
                if (n.value === "is") return Is;
        }
    }
    else if (NCH(n) === 2)
    {
        if (CHILD(n, 0).type === TOK.T_NAME)
        {
            if (CHILD(n, 1).value === "in") return NotIn;
            if (CHILD(n, 0).value === "is") return IsNot;
        }
    }
    goog.asserts.fail("invalid comp_op");
}

function seqForTestlist(c, n)
{
    /* testlist: test (',' test)* [','] */
    goog.asserts.assert(n.type === SYM.testlist ||
            n.type === SYM.listmaker ||
            n.type === SYM.testlist_gexp ||
            n.type === SYM.testlist_safe ||
            n.type === SYM.testlist1);
    var seq = [];
    for (var i = 0; i < NCH(n); i += 2)
    {
        goog.asserts.assert(CHILD(n, i).type === SYM.test || CHILD(n, i).type === SYM.old_test);
        seq[i / 2] = astForExpr(c, CHILD(n, i));
    }
    return seq;
}

function astForSuite(c, n)
{
    /* suite: simple_stmt | NEWLINE INDENT stmt+ DEDENT */
    REQ(n, SYM.suite);
    var seq = [];
    var pos = 0;
    var ch;
    if (CHILD(n, 0).type === SYM.simple_stmt)
    {
        n = CHILD(n, 0);
        /* simple_stmt always ends with an NEWLINE and may have a trailing
         * SEMI. */
        var end = NCH(n) - 1;
        if (CHILD(n, end - 1).type === TOK.T_SEMI)
            end -= 1;
        for (var i = 0; i < end; i += 2) // by 2 to skip ;
            seq[pos++] = astForStmt(c, CHILD(n, i));
    }
    else
    {
        for (var i = 2; i < NCH(n) - 1; ++i)
        {
            ch = CHILD(n, i);
            REQ(ch, SYM.stmt);
            var num = numStmts(ch);
            if (num === 1)
            {
                // small_stmt or compound_stmt w/ only 1 child
                seq[pos++] = astForStmt(c, ch);
            }
            else
            {
                ch = CHILD(ch, 0);
                REQ(ch, SYM.simple_stmt);
                for (var j = 0; j < NCH(ch); j += 2)
                {
                    if (NCH(CHILD(ch, j)) === 0)
                    {
                        goog.asserts.assert(j + 1 === NCH(ch));
                        break;
                    }
                    seq[pos++] = astForStmt(c, CHILD(ch, j));
                }
            }
        }
    }
    goog.asserts.assert(pos === numStmts(n));
    return seq;
}

function astForExceptClause(c, exc, body)
{
    /* except_clause: 'except' [test [(',' | 'as') test]] */
    REQ(exc, SYM.except_clause);
    REQ(body, SYM.suite);
    if (NCH(exc) === 1)
        return new ExceptHandler(null, null, astForSuite(c, body), exc.lineno, exc.col_offset);
    else if (NCH(exc) === 2)
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), null, astForSuite(c, body), exc.lineno, exc.col_offset);
    else if (NCH(exc) === 4)
    {
        var e = astForExpr(c, CHILD(exc, 3));
        setContext(c, e, Store, CHILD(exc, 3));
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), e, astForSuite(c, body), exc.lineno, exc.col_offset);
    }
    goog.asserts.fail("wrong number of children for except clause");
}

function astForTryStmt(c, n)
{
    var nc = NCH(n);
    var nexcept = (nc - 3) / 3;
    var body, orelse = [], finally_ = null;

    REQ(n, SYM.try_stmt);
    body = astForSuite(c, CHILD(n, 2));
    if (CHILD(n, nc - 3).type === TOK.T_NAME)
    {
        if (CHILD(n, nc - 3).value === "finally")
        {
            if (nc >= 9 && CHILD(n, nc - 6).type === TOK.T_NAME)
            {
                /* we can assume it's an "else",
                   because nc >= 9 for try-else-finally and
                   it would otherwise have a type of except_clause */
                orelse = astForSuite(c, CHILD(n, nc - 4));
                nexcept--;
            }

            finally_ = astForSuite(c, CHILD(n, nc - 1));
            nexcept--;
        }
        else
        {
            /* we can assume it's an "else",
               otherwise it would have a type of except_clause */
            orelse = astForSuite(c, CHILD(n, nc - 1));
            nexcept--;
        }
    }
    else if (CHILD(n, nc - 3).type !== SYM.except_clause)
    {
        throw new Sk.builtin.SyntaxError("malformed 'try' statement", c.c_filename, n.lineno);
    }

    if (nexcept > 0)
    {
        var handlers = [];
        for (var i = 0; i < nexcept; ++i)
            handlers[i] = astForExceptClause(c, CHILD(n, 3 + i * 3), CHILD(n, 5 + i * 3));
        var exceptSt = new TryExcept(body, handlers, orelse, n.lineno, n.col_offset);

        if (!finally_)
            return exceptSt;

        /* if a 'finally' is present too, we nest the TryExcept within a
           TryFinally to emulate try ... except ... finally */
        body = [exceptSt];
    }

    goog.asserts.assert(finally_ !== null);
    return new TryFinally(body, finally_, n.lineno, n.col_offset);
}


function astForDottedName(c, n)
{
    REQ(n, SYM.dotted_name);
    var lineno = n.lineno;
    var col_offset = n.col_offset;
    var id = strobj(CHILD(n, 0).value);
    var e = new Name(id, Load, lineno, col_offset);
    for (var i = 2; i < NCH(n); i += 2)
    {
        id = strobj(CHILD(n, i).value);
        e = new Attribute(e, id, Load, lineno, col_offset);
    }
    return e;
}

function astForDecorator(c, n)
{
    /* decorator: '@' dotted_name [ '(' [arglist] ')' ] NEWLINE */
    REQ(n, SYM.decorator);
    REQ(CHILD(n, 0), TOK.T_AT);
    REQ(CHILD(n, NCH(n) - 1), TOK.T_NEWLINE);
    var nameExpr = astForDottedName(c, CHILD(n, 1));
    var d;
    if (NCH(n) === 3) // no args
        return nameExpr;
    else if (NCH(n) === 5) // call with no args
        return new Call(nameExpr, [], [], null, null, n.lineno, n.col_offset);
    else
        return astForCall(c, CHILD(n, 3), nameExpr);
}

function astForDecorators(c, n)
{
    REQ(n, SYM.decorators);
    var decoratorSeq = [];
    for (var i = 0; i < NCH(n); ++i)
        decoratorSeq[i] = astForDecorator(c, CHILD(n, i));
    return decoratorSeq;
}

function astForDecorated(c, n)
{
    REQ(n, SYM.decorated);
    var decoratorSeq = astForDecorators(c, CHILD(n, 0));
    goog.asserts.assert(CHILD(n, 1).type === SYM.funcdef || CHILD(n, 1).type === SYM.classdef);

    var thing = null;
    if (CHILD(n, 1).type === SYM.funcdef)
        thing = astForFuncdef(c, CHILD(n, 1), decoratorSeq);
    else if (CHILD(n, 1) === SYM.classdef)
        thing = astForClassdef(c, CHILD(n, 1), decoratorSeq);
    if (thing)
    {
        thing.lineno = n.lineno;
        thing.col_offset = n.col_offset;
    }
    return thing;
}

function astForWithVar(c, n)
{
    REQ(n, SYM.with_var);
    return astForExpr(c, CHILD(n, 1));
}

function astForWithStmt(c, n)
{
    /* with_stmt: 'with' test [ with_var ] ':' suite */
    var suiteIndex = 3; // skip with, test, :
    goog.asserts.assert(n.type === SYM.with_stmt);
    var contextExpr = astForExpr(c, CHILD(n, 1));
    if (CHILD(n, 2).type === SYM.with_var)
    {
        var optionalVars = astForWithVar(c, CHILD(n, 2));
        setContext(c, optionalVars, Store, n);
        suiteIndex = 4;
    }
    return new With_(contextExpr, optionalVars, astForSuite(c, CHILD(n, suiteIndex)), n.lineno, n.col_offset);
}

function astForExecStmt(c, n)
{
    var expr1, globals = null, locals = null;
    var nchildren = NCH(n);
    goog.asserts.assert(nchildren === 2 || nchildren === 4 || nchildren === 6);

    /* exec_stmt: 'exec' expr ['in' test [',' test]] */
    REQ(n, SYM.exec_stmt);
    var expr1 = astForExpr(c, CHILD(n, 1));
    if (nchildren >= 4)
        globals = astForExpr(c, CHILD(n, 3));
    if (nchildren === 6)
        locals = astForExpr(c, CHILD(n, 5));
    return new Exec(expr1, globals, locals, n.lineno, n.col_offset);
}

function astForIfStmt(c, n)
{
    /* if_stmt: 'if' test ':' suite ('elif' test ':' suite)*
       ['else' ':' suite]
    */
    REQ(n, SYM.if_stmt);
    if (NCH(n) === 4)
        return new If_(
                astForExpr(c, CHILD(n, 1)),
                astForSuite(c, CHILD(n, 3)),
                [], n.lineno, n.col_offset);

    var s = CHILD(n, 4).value;
    var decider = s.charAt(2); // elSe or elIf
    if (decider === 's')
    {
        return new If_(
                astForExpr(c, CHILD(n, 1)),
                astForSuite(c, CHILD(n, 3)), 
                astForSuite(c, CHILD(n, 6)), 
                n.lineno, n.col_offset);
    }
    else if (decider === 'i')
    {
        var nElif = NCH(n) - 4;
        var hasElse = false;
        var orelse = [];
        
        /* must reference the child nElif+1 since 'else' token is third, not
         * fourth child from the end. */
        if (CHILD(n, nElif + 1).type === TOK.T_NAME
            && CHILD(n, nElif + 1).value.charAt(2) === 's')
        {
            hasElse = true;
            nElif -= 3;
        }
        nElif /= 4;

        if (hasElse)
        {
            orelse = [
                new If_(
                    astForExpr(c, CHILD(n, NCH(n) - 6)),
                    astForSuite(c, CHILD(n, NCH(n) - 4)),
                    astForSuite(c, CHILD(n, NCH(n) - 1)),
                    CHILD(n, NCH(n) - 6).lineno,
                    CHILD(n, NCH(n) - 6).col_offset)];
            nElif--;
        }

        for (var i = 0; i < nElif; ++i)
        {
            var off = 5 + (nElif - i - 1) * 4;
            orelse = [
                new If_(
                    astForExpr(c, CHILD(n, off)),
                    astForSuite(c, CHILD(n, off + 2)),
                    orelse,
                    CHILD(n, off).lineno,
                    CHILD(n, off).col_offset)];
        }
        return new If_(
                astForExpr(c, CHILD(n, 1)),
                astForSuite(c, CHILD(n, 3)),
                orelse, n.lineno, n.col_offset);
    }
    
    goog.asserts.fail("unexpected token in 'if' statement");
}

function astForExprlist(c, n, context)
{
    REQ(n, SYM.exprlist);
    var seq = [];
    for (var i = 0; i < NCH(n); i += 2)
    {
        var e = astForExpr(c, CHILD(n, i));
        seq[i / 2] = e;
        if (context) setContext(c, e, context, CHILD(n, i));
    }
    return seq;
}

function astForDelStmt(c, n)
{
    /* del_stmt: 'del' exprlist */
    REQ(n, SYM.del_stmt);
    return new Delete_(astForExprlist(c, CHILD(n, 1), Del), n.lineno, n.col_offset);
}

function astForGlobalStmt(c, n)
{
    /* global_stmt: 'global' NAME (',' NAME)* */
    REQ(n, SYM.global_stmt);
    var s = [];
    for (var i = 1; i < NCH(n); i += 2)
    {
        s[(i - 1) / 2] = strobj(CHILD(n, i).value);
    }
    return new Global(s, n.lineno, n.col_offset);
}

function astForAssertStmt(c, n)
{
    /* assert_stmt: 'assert' test [',' test] */
    REQ(n, SYM.assert_stmt);
    if (NCH(n) === 2)
        return new Assert(astForExpr(c, CHILD(n, 1)), null, n.lineno, n.col_offset);
    else if (NCH(n) === 4)
        return new Assert(astForExpr(c, CHILD(n, 1)), astForExpr(c, CHILD(n, 3)), n.lineno, n.col_offset);
    goog.asserts.fail("improper number of parts to assert stmt");
}

function aliasForImportName(c, n)
{
    /*
      import_as_name: NAME ['as' NAME]
      dotted_as_name: dotted_name ['as' NAME]
      dotted_name: NAME ('.' NAME)*
    */

    loop: while (true) {
        switch (n.type)
        {
            case SYM.import_as_name:
                var str = null;
                var name = strobj(CHILD(n, 0).value);
                if (NCH(n) === 3)
                    str = CHILD(n, 2).value;
                return new alias(name, str == null ? null : strobj(str));
            case SYM.dotted_as_name:
                if (NCH(n) === 1)
                {
                    n = CHILD(n, 0);
                    continue loop;
                }
                else
                {
                    var a = aliasForImportName(c, CHILD(n, 0));
                    goog.asserts.assert(!a.asname);
                    a.asname = strobj(CHILD(n, 2).value);
                    return a;
                }
            case SYM.dotted_name:
                if (NCH(n) === 1)
                    return new alias(strobj(CHILD(n, 0).value), null);
                else
                {
                    // create a string of the form a.b.c
                    var str = '';
                    for (var i = 0; i < NCH(n); i += 2)
                        str += CHILD(n, i).value + ".";
                    return new alias(strobj(str.substr(0, str.length - 1)), null);
                }
            case TOK.T_STAR:
                return new alias(strobj("*"), null);
            default:
                throw new Sk.builtin.SyntaxError("unexpected import name", c.c_filename, n.lineno);
        }
    break; }
}

function astForImportStmt(c, n)
{
    /*
      import_stmt: import_name | import_from
      import_name: 'import' dotted_as_names
      import_from: 'from' ('.'* dotted_name | '.') 'import'
                          ('*' | '(' import_as_names ')' | import_as_names)
    */
    REQ(n, SYM.import_stmt);
    var lineno = n.lineno;
    var col_offset = n.col_offset;
    n = CHILD(n, 0);
    if (n.type === SYM.import_name)
    {
        n = CHILD(n, 1);
        REQ(n, SYM.dotted_as_names);
        var aliases = [];
        for (var i = 0; i < NCH(n); i += 2)
            aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
        return new Import_(aliases, lineno, col_offset);
    }
    else if (n.type === SYM.import_from)
    {
        var mod = null;
        var ndots = 0;
        var nchildren;

        for (var idx = 1; idx < NCH(n); ++idx)
        {
            if (CHILD(n, idx).type === SYM.dotted_name)
            {
                mod = aliasForImportName(c, CHILD(n, idx));
                idx++;
                break;
            }
            else if (CHILD(n, idx).type !== TOK.T_DOT)
                break;
            ndots++;
        }
        ++idx; // skip the import keyword
        switch (CHILD(n, idx).type)
        {
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
                if (nchildren % 2 === 0)
                    throw new Sk.builtin.SyntaxError("trailing comma not allowed without surrounding parentheses", c.c_filename, n.lineno);
                break;
            default:
                throw new Sk.builtin.SyntaxError("Unexpected node-type in from-import", c.c_filename, n.lineno);
        }
        var aliases = [];
        if (n.type === TOK.T_STAR)
            aliases[0] = aliasForImportName(c, n);
        else
            for (var i = 0; i < NCH(n); i += 2)
                aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
        var modname = mod ? mod.name.v : "";
        return new ImportFrom(strobj(modname), aliases, ndots, lineno, col_offset);
    }
    throw new Sk.builtin.SyntaxError("unknown import statement", c.c_filename, n.lineno);
}

function astForTestlistGexp(c, n)
{
    /* testlist_gexp: test ( gen_for | (',' test)* [','] ) */
    /* argument: test [ gen_for ] */
    goog.asserts.assert(n.type === SYM.testlist_gexp || n.type === SYM.argument);
    if (NCH(n) > 1 && CHILD(n, 1).type === SYM.gen_for)
        return astForGenexp(c, n);
    return astForTestlist(c, n);
}

function astForListcomp(c, n)
{
    /* listmaker: test ( list_for | (',' test)* [','] )
       list_for: 'for' exprlist 'in' testlist_safe [list_iter]
       list_iter: list_for | list_if
       list_if: 'if' test [list_iter]
       testlist_safe: test [(',' test)+ [',']]
    */

    function countListFors(c, n)
    {
        var nfors = 0;
        var ch = CHILD(n, 1);
        count_list_for: while(true) {
            nfors++;
            REQ(ch, SYM.list_for);
            if (NCH(ch) === 5)
                ch = CHILD(ch, 4);
            else
                return nfors;
            count_list_iter: while(true) {
                REQ(ch, SYM.list_iter);
                ch = CHILD(ch, 0);
                if (ch.type === SYM.list_for)
                    continue count_list_for;
                else if (ch.type === SYM.list_if)
                {
                    if (NCH(ch) === 3)
                    {
                        ch = CHILD(ch, 2);
                        continue count_list_iter;
                    }
                    else
                        return nfors;
                }
            break; }
        break; }
    }

    function countListIfs(c, n)
    {
        var nifs = 0;
        while (true)
        {
            REQ(n, SYM.list_iter);
            if (CHILD(n, 0).type === SYM.list_for)
                return nifs;
            n = CHILD(n, 0);
            REQ(n, SYM.list_if);
            nifs++;
            if (NCH(n) == 2)
                return nifs;
            n = CHILD(n, 2);
        }
    }

    REQ(n, SYM.listmaker);
    goog.asserts.assert(NCH(n) > 1);
    var elt = astForExpr(c, CHILD(n, 0));
    var nfors = countListFors(c, n);
    var listcomps = [];
    var ch = CHILD(n, 1);
    for (var i = 0; i < nfors; ++i)
    {
        REQ(ch, SYM.list_for);
        var forch = CHILD(ch, 1);
        var t = astForExprlist(c, forch, Store);
        var expression = astForTestlist(c, CHILD(ch, 3));
        var lc;
        if (NCH(forch) === 1)
            lc = new comprehension(t[0], expression, []);
        else
            lc = new comprehension(new Tuple(t, Store, ch.lineno, ch.col_offset), expression, []);

        if (NCH(ch) === 5)
        {
            ch = CHILD(ch, 4);
            var nifs = countListIfs(c, ch);
            var ifs = [];
            for (var j = 0; j < nifs; ++j)
            {
                REQ(ch, SYM.list_iter);
                ch = CHILD(ch, 0);
                REQ(ch, SYM.list_if);
                ifs[j] = astForExpr(c, CHILD(ch, 1));
                if (NCH(ch) === 3)
                    ch = CHILD(ch, 2);
            }
            if (ch.type === SYM.list_iter)
                ch = CHILD(ch, 0);
            lc.ifs = ifs;
        }
        listcomps[i] = lc;
    }
    return new ListComp(elt, listcomps, n.lineno, n.col_offset);
}

function astForFactor(c, n)
{
    /* some random peephole thing that cpy does */
    if (CHILD(n, 0).type === TOK.T_MINUS && NCH(n) === 2)
    {
        var pfactor = CHILD(n, 1);
        if (pfactor.type === SYM.factor && NCH(pfactor) === 1)
        {
            var ppower = CHILD(pfactor, 0);
            if (ppower.type === SYM.power && NCH(ppower) === 1)
            {
                var patom = CHILD(ppower, 0);
                if (patom.type === SYM.atom)
                {
                    var pnum = CHILD(patom, 0);
                    if (pnum.type === TOK.T_NUMBER)
                    {
                        pnum.value = "-" + pnum.value;
                        return astForAtom(c, patom);
                    }
                }
            }
        }
    }

    var expression = astForExpr(c, CHILD(n, 1));
    switch (CHILD(n, 0).type)
    {
        case TOK.T_PLUS: return new UnaryOp(UAdd, expression, n.lineno, n.col_offset);
        case TOK.T_MINUS: return new UnaryOp(USub, expression, n.lineno, n.col_offset);
        case TOK.T_TILDE: return new UnaryOp(Invert, expression, n.lineno, n.col_offset);
    }

    goog.asserts.fail("unhandled factor");
}

function astForForStmt(c, n)
{
    /* for_stmt: 'for' exprlist 'in' testlist ':' suite ['else' ':' suite] */
    var seq = [];
    REQ(n, SYM.for_stmt);
    if (NCH(n) === 9)
        seq = astForSuite(c, CHILD(n, 8));
    var nodeTarget = CHILD(n, 1);
    var _target = astForExprlist(c, nodeTarget, Store);
    var target;
    if (NCH(nodeTarget) === 1)
        target = _target[0];
    else
        target = new Tuple(_target, Store, n.lineno, n.col_offset);

    return new For_(target,
            astForTestlist(c, CHILD(n, 3)),
            astForSuite(c, CHILD(n, 5)),
            seq, n.lineno, n.col_offset);
}

function astForCall(c, n, func)
{
    /*
      arglist: (argument ',')* (argument [',']| '*' test [',' '**' test]
               | '**' test)
      argument: [test '='] test [gen_for]        # Really [keyword '='] test
    */
    REQ(n, SYM.arglist);
    var nargs = 0;
    var nkeywords = 0;
    var ngens = 0;
    for (var i = 0; i < NCH(n); ++i)
    {
        var ch = CHILD(n, i);
        if (ch.type === SYM.argument)
        {
            if (NCH(ch) === 1) nargs++;
            else if (CHILD(ch, 1).type === SYM.gen_for) ngens++;
            else nkeywords++;
        }
    }
    if (ngens > 1 || (ngens && (nargs || nkeywords)))
        throw new Sk.builtin.SyntaxError("Generator expression must be parenthesized if not sole argument", c.c_filename, n.lineno);
    if (nargs + nkeywords + ngens > 255)
        throw new Sk.builtin.SyntaxError("more than 255 arguments", c.c_filename, n.lineno);
    var args = [];
    var keywords = [];
    nargs = 0;
    nkeywords = 0;
    var vararg = null;
    var kwarg = null;
    for (var i = 0; i < NCH(n); ++i)
    {
        var ch = CHILD(n, i);
        if (ch.type === SYM.argument)
        {
            if (NCH(ch) === 1)
            {
                if (nkeywords) throw new Sk.builtin.SyntaxError("non-keyword arg after keyword arg", c.c_filename, n.lineno);
                if (vararg) throw new Sk.builtin.SyntaxError("only named arguments may follow *expression", c.c_filename, n.lineno);
                args[nargs++] = astForExpr(c, CHILD(ch, 0));
            }
            else if (CHILD(ch, 1).type === SYM.gen_for)
                args[nargs++] = astForGenexp(c, ch);
            else
            {
                var e = astForExpr(c, CHILD(ch, 0));
                if (e.constructor === Lambda) throw new Sk.builtin.SyntaxError("lambda cannot contain assignment", c.c_filename, n.lineno);
                else if (e.constructor !== Name) throw new Sk.builtin.SyntaxError("keyword can't be an expression", c.c_filename, n.lineno);
                var key = e.id;
                forbiddenCheck(c, CHILD(ch, 0), key, n.lineno);
                for (var k = 0; k < nkeywords; ++k)
                {
                    var tmp = keywords[k].arg;
                    if (tmp === key) throw new Sk.builtin.SyntaxError("keyword argument repeated", c.c_filename, n.lineno);
                }
                keywords[nkeywords++] = new keyword(key, astForExpr(c, CHILD(ch, 2)));
            }
        }
        else if (ch.type === TOK.T_STAR)
            vararg = astForExpr(c, CHILD(n, ++i));
        else if (ch.type === TOK.T_DOUBLESTAR)
            kwarg = astForExpr(c, CHILD(n, ++i));
    }
    return new Call(func, args, keywords, vararg, kwarg, func.lineno, func.col_offset);
}

function astForTrailer(c, n, leftExpr)
{
    /* trailer: '(' [arglist] ')' | '[' subscriptlist ']' | '.' NAME 
       subscriptlist: subscript (',' subscript)* [',']
       subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
     */
    REQ(n, SYM.trailer);
    if (CHILD(n, 0).type === TOK.T_LPAR)
    {
        if (NCH(n) === 2)
            return new Call(leftExpr, [], [], null, null, n.lineno, n.col_offset);
        else
            return astForCall(c, CHILD(n, 1), leftExpr);
    }
    else if (CHILD(n, 0).type === TOK.T_DOT)
        return new Attribute(leftExpr, strobj(CHILD(n, 1).value), Load, n.lineno, n.col_offset);
    else
    {
        REQ(CHILD(n, 0), TOK.T_LSQB);
        REQ(CHILD(n, 2), TOK.T_RSQB);
        n = CHILD(n, 1);
        if (NCH(n) === 1)
            return new Subscript(leftExpr, astForSlice(c, CHILD(n, 0)), Load, n.lineno, n.col_offset);
        else
        {
            /* The grammar is ambiguous here. The ambiguity is resolved 
               by treating the sequence as a tuple literal if there are
               no slice features.
            */
            var simple = true;
            var slices = [];
            for (var j = 0; j < NCH(n); j += 2)
            {
                var slc = astForSlice(c, CHILD(n, j));
                if (slc.constructor !== Index)
                    simple = false;
                slices[j / 2] = slc;
            }
            if (!simple)
            {
                return new Subscript(leftExpr, new ExtSlice(slices), Load, n.lineno, n.col_offset);
            }
            var elts = [];
            for (var j = 0; j < slices.length; ++j)
            {
                var slc = slices[j];
                goog.asserts.assert(slc.constructor === Index && slc.value !== null && slc.value !== undefined);
                elts[j] = slc.value;
            }
            var e = new Tuple(elts, Load, n.lineno, n.col_offset);
            return new Subscript(leftExpr, new Index(e), Load, n.lineno, n.col_offset);
        }
    }
}

function astForFlowStmt(c, n)
{
    /*
      flow_stmt: break_stmt | continue_stmt | return_stmt | raise_stmt
                 | yield_stmt
      break_stmt: 'break'
      continue_stmt: 'continue'
      return_stmt: 'return' [testlist]
      yield_stmt: yield_expr
      yield_expr: 'yield' testlist
      raise_stmt: 'raise' [test [',' test [',' test]]]
    */
    var ch;
    REQ(n, SYM.flow_stmt);
    ch = CHILD(n, 0);
    switch (ch.type)
    {
        case SYM.break_stmt: return new Break_(n.lineno, n.col_offset);
        case SYM.continue_stmt: return new Continue_(n.lineno, n.col_offset);
        case SYM.yield_stmt:
            return new Expr(astForExpr(c, CHILD(ch, 0)), n.lineno, n.col_offset);
        case SYM.return_stmt:
            if (NCH(ch) === 1)
                return new Return_(null, n.lineno, n.col_offset);
            else
                return new Return_(astForTestlist(c, CHILD(ch, 1)), n.lineno, n.col_offset);
        case SYM.raise_stmt:
            if (NCH(ch) === 1)
                return new Raise(null, null, null, n.lineno, n.col_offset);
            else if (NCH(ch) === 2)
                return new Raise(astForExpr(c, CHILD(ch, 1)), null, null, n.lineno, n.col_offset);
            else if (NCH(ch) === 4)
                return new Raise(
                        astForExpr(c, CHILD(ch, 1)),
                        astForExpr(c, CHILD(ch, 3)),
                        null, n.lineno, n.col_offset);
            else if (NCH(ch) === 6)
                return new Raise(
                        astForExpr(c, CHILD(ch, 1)),
                        astForExpr(c, CHILD(ch, 3)),
                        astForExpr(c, CHILD(ch, 5)),
                        n.lineno, n.col_offset);
        default:
            goog.asserts.fail("unexpected flow_stmt");
    }
    goog.asserts.fail("unhandled flow statement");
}

function astForArguments(c, n)
{
    /* parameters: '(' [varargslist] ')'
       varargslist: (fpdef ['=' test] ',')* ('*' NAME [',' '**' NAME]
            | '**' NAME) | fpdef ['=' test] (',' fpdef ['=' test])* [',']
    */
    var ch;
    var vararg = null;
    var kwarg = null;
    if (n.type === SYM.parameters)
    {
        if (NCH(n) === 2) // () as arglist
            return new arguments_([], null, null, []);
        n = CHILD(n, 1);
    }
    REQ(n, SYM.varargslist);

    var args = [];
    var defaults = [];

    /* fpdef: NAME | '(' fplist ')'
       fplist: fpdef (',' fpdef)* [',']
    */
    var foundDefault = false;
    var i = 0;
    var j = 0; // index for defaults
    var k = 0; // index for args
    while (i < NCH(n))
    {
        ch = CHILD(n, i);
        switch (ch.type)
        {
            case SYM.fpdef:
                var complexArgs = 0;
                var parenthesized = 0;
                handle_fpdef: while (true) {
                    if (i + 1 < NCH(n) && CHILD(n, i + 1).type === TOK.T_EQUAL)
                    {
                        defaults[j++] = astForExpr(c, CHILD(n, i + 2));
                        i += 2;
                        foundDefault = true;
                    }
                    else if (foundDefault)
                    {
                        /* def f((x)=4): pass should raise an error.
                           def f((x, (y))): pass will just incur the tuple unpacking warning. */
                        if (parenthesized && !complexArgs)
                            throw new Sk.builtin.SyntaxError("parenthesized arg with default", c.c_filename, n.lineno);
                        throw new Sk.builtin.SyntaxError("non-default argument follows default argument", c.c_filename, n.lineno);
                    }

                    if (NCH(ch) === 3)
                    {
                        ch = CHILD(ch, 1);
                        // def foo((x)): is not complex, special case.
                        if (NCH(ch) !== 1)
                        {
                            throw new Sk.builtin.SyntaxError("tuple parameter unpacking has been removed", c.c_filename, n.lineno);
                        }
                        else
                        {
                            /* def foo((x)): setup for checking NAME below. */
                            /* Loop because there can be many parens and tuple
                               unpacking mixed in. */
                            parenthesized = true;
                            ch = CHILD(ch, 0);
                            goog.asserts.assert(ch.type === SYM.fpdef);
                            continue handle_fpdef;
                        }
                    }
                    if (CHILD(ch, 0).type === TOK.T_NAME)
                    {
                        forbiddenCheck(c, n, CHILD(ch, 0).value, n.lineno);
                        var id = strobj(CHILD(ch, 0).value);
                        args[k++] = new Name(id, Param, ch.lineno, ch.col_offset);
                    }
                    i += 2;
                    if (parenthesized)
                        throw new Sk.builtin.SyntaxError("parenthesized argument names are invalid", c.c_filename, n.lineno);
                break; }
                break;
            case TOK.T_STAR:
                forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value, n.lineno);
                vararg = strobj(CHILD(n, i + 1).value);
                i += 3;
                break;
            case TOK.T_DOUBLESTAR:
                forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value, n.lineno);
                kwarg = strobj(CHILD(n, i + 1).value);
                i += 3;
                break;
            default:
                goog.asserts.fail("unexpected node in varargslist");
        }
    }
    return new arguments_(args, vararg, kwarg, defaults);
}

function astForFuncdef(c, n, decoratorSeq)
{
    /* funcdef: 'def' NAME parameters ':' suite */
    REQ(n, SYM.funcdef);
    var name = strobj(CHILD(n, 1).value);
    forbiddenCheck(c, CHILD(n, 1), CHILD(n, 1).value, n.lineno);
    var args = astForArguments(c, CHILD(n, 2));
    var body = astForSuite(c, CHILD(n, 4));
    return new FunctionDef(name, args, body, decoratorSeq, n.lineno, n.col_offset);
}

function astForClassBases(c, n)
{
    /* testlist: test (',' test)* [','] */
    goog.asserts.assert(NCH(n) > 0);
    REQ(n, SYM.testlist);
    if (NCH(n) === 1)
        return [ astForExpr(c, CHILD(n, 0)) ];
    return seqForTestlist(c, n);
}

function astForClassdef(c, n, decoratorSeq)
{
    /* classdef: 'class' NAME ['(' testlist ')'] ':' suite */
    REQ(n, SYM.classdef);
    forbiddenCheck(c, n, CHILD(n, 1).value, n.lineno);
    var classname = strobj(CHILD(n, 1).value);
    if (NCH(n) === 4)
        return new ClassDef(classname, [], astForSuite(c, CHILD(n, 3)), decoratorSeq, n.lineno, n.col_offset);
    if (CHILD(n, 3).type === TOK.T_RPAR)
        return new ClassDef(classname, [], astForSuite(c, CHILD(n, 5)), decoratorSeq, n.lineno, n.col_offset);

    var bases = astForClassBases(c, CHILD(n, 3));
    var s = astForSuite(c, CHILD(n, 6));
    return new ClassDef(classname, bases, s, decoratorSeq, n.lineno, n.col_offset);
}

function astForLambdef(c, n)
{
    /* lambdef: 'lambda' [varargslist] ':' test */
    var args;
    var expression;
    if (NCH(n) === 3)
    {
        args = new arguments_([], null, null, []);
        expression = astForExpr(c, CHILD(n, 2));
    }
    else
    {
        args = astForArguments(c, CHILD(n, 1));
        expression = astForExpr(c, CHILD(n, 3));
    }
    return new Lambda(args, expression, n.lineno, n.col_offset);
}

function astForGenexp(c, n)
{
    /* testlist_gexp: test ( gen_for | (',' test)* [','] )
       argument: [test '='] test [gen_for]       # Really [keyword '='] test */
    goog.asserts.assert(n.type === SYM.testlist_gexp || n.type === SYM.argument);
    goog.asserts.assert(NCH(n) > 1);

    function countGenFors(c, n)
    {
        var nfors = 0;
        var ch = CHILD(n, 1);
        count_gen_for: while(true) {
            nfors++;
            REQ(ch, SYM.gen_for);
            if (NCH(ch) === 5)
                ch = CHILD(ch, 4);
            else
                return nfors;
            count_gen_iter: while(true) {
                REQ(ch, SYM.gen_iter);
                ch = CHILD(ch, 0);
                if (ch.type === SYM.gen_for)
                    continue count_gen_for;
                else if (ch.type === SYM.gen_if)
                {
                    if (NCH(ch) === 3)
                    {
                        ch = CHILD(ch, 2);
                        continue count_gen_iter;
                    }
                    else
                        return nfors;
                }
            break; }
        break; }
        goog.asserts.fail("logic error in countGenFors");
    }

    function countGenIfs(c, n)
    {
        var nifs = 0;
        while (true)
        {
            REQ(n, SYM.gen_iter);
            if (CHILD(n, 0).type === SYM.gen_for)
                return nifs;
            n = CHILD(n, 0);
            REQ(n, SYM.gen_if);
            nifs++;
            if (NCH(n) == 2)
                return nifs;
            n = CHILD(n, 2);
        }
    }

    var elt = astForExpr(c, CHILD(n, 0));
    var nfors = countGenFors(c, n);
    var genexps = [];
    var ch = CHILD(n, 1);
    for (var i = 0; i < nfors; ++i)
    {
        REQ(ch, SYM.gen_for);
        var forch = CHILD(ch, 1);
        var t = astForExprlist(c, forch, Store);
        var expression = astForExpr(c, CHILD(ch, 3));
        var ge;
        if (NCH(forch) === 1)
            ge = new comprehension(t[0], expression, []);
        else
            ge = new comprehension(new Tuple(t, Store, ch.lineno, ch.col_offset), expression, []);
        if (NCH(ch) === 5)
        {
            ch = CHILD(ch, 4);
            var nifs = countGenIfs(c, ch);
            var ifs = [];
            for (var j = 0; j < nifs; ++j)
            {
                REQ(ch, SYM.gen_iter);
                ch = CHILD(ch, 0);
                REQ(ch, SYM.gen_if);
                expression = astForExpr(c, CHILD(ch, 1));
                ifs[j] = expression;
                if (NCH(ch) === 3)
                    ch = CHILD(ch, 2);
            }
            if (ch.type === SYM.gen_iter)
                ch = CHILD(ch, 0);
            ge.ifs = ifs;
        }
        genexps[i] = ge;
    }
    return new GeneratorExp(elt, genexps, n.lineno, n.col_offset);
}

function astForWhileStmt(c, n)
{
    /* while_stmt: 'while' test ':' suite ['else' ':' suite] */
    REQ(n, SYM.while_stmt);
    if (NCH(n) === 4)
        return new While_(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.lineno, n.col_offset);
    else if (NCH(n) === 7)
        return new While_(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.lineno, n.col_offset);
    goog.asserts.fail("wrong number of tokens for 'while' stmt");
}

function astForAugassign(c, n)
{
    REQ(n, SYM.augassign);
    n = CHILD(n, 0);
    switch (n.value.charAt(0))
    {
        case '+': return Add;
        case '-': return Sub;
        case '/': if (n.value.charAt(1) === '/') return FloorDiv;
                  return Div;
        case '%': return Mod;
        case '<': return LShift;
        case '>': return RShift;
        case '&': return BitAnd;
        case '^': return BitXor;
        case '|': return BitOr;
        case '*': if (n.value.charAt(1) === '*') return Pow;
                  return Mult;
        default: goog.asserts.fail("invalid augassign");
    }
}

function astForBinop(c, n)
{
    /* Must account for a sequence of expressions.
        How should A op B op C by represented?  
        BinOp(BinOp(A, op, B), op, C).
    */
    var result = new BinOp(
            astForExpr(c, CHILD(n, 0)),
            getOperator(CHILD(n, 1)),
            astForExpr(c, CHILD(n, 2)),
            n.lineno, n.col_offset);
    var nops = (NCH(n) - 1) / 2;
    for (var i = 1 ; i < nops; ++i)
    {
        var nextOper = CHILD(n, i * 2 + 1);
        var newoperator = getOperator(nextOper);
        var tmp = astForExpr(c, CHILD(n, i * 2 + 2));
        result = new BinOp(result, newoperator, tmp, nextOper.lineno, nextOper.col_offset);
    }
    return result;

}

function astForTestlist(c, n)
{
    /* testlist_gexp: test (',' test)* [','] */
    /* testlist: test (',' test)* [','] */
    /* testlist_safe: test (',' test)+ [','] */
    /* testlist1: test (',' test)* */
    goog.asserts.assert(NCH(n) > 0);
    if (n.type === SYM.testlist_gexp)
    {
        if (NCH(n) > 1)
        {
            goog.asserts.assert(CHILD(n, 1).type !== SYM.gen_for);
        }
    }
    else
    {
        goog.asserts.assert(n.type === SYM.testlist || n.type === SYM.testlist_safe || n.type === SYM.testlist1);
    }

    if (NCH(n) === 1)
    {
        return astForExpr(c, CHILD(n, 0));
    }
    else
    {
        return new Tuple(seqForTestlist(c, n), Load, n.lineno, n.col_offset);
    }

}

function astForExprStmt(c, n)
{
    REQ(n, SYM.expr_stmt);
    /* expr_stmt: testlist (augassign (yield_expr|testlist) 
                | ('=' (yield_expr|testlist))*)
       testlist: test (',' test)* [',']
       augassign: '+=' | '-=' | '*=' | '/=' | '%=' | '&=' | '|=' | '^='
                | '<<=' | '>>=' | '**=' | '//='
       test: ... here starts the operator precendence dance
     */
    if (NCH(n) === 1)
        return new Expr(astForTestlist(c, CHILD(n, 0)), n.lineno, n.col_offset);
    else if (CHILD(n, 1).type === SYM.augassign)
    {
        var ch = CHILD(n, 0);
        var expr1 = astForTestlist(c, ch);
        switch (expr1.constructor)
        {
            case GeneratorExp: throw new Sk.builtin.SyntaxError("augmented assignment to generator expression not possible", c.c_filename, n.lineno);
            case Yield: throw new Sk.builtin.SyntaxError("augmented assignment to yield expression not possible", c.c_filename, n.lineno);
            case Name:
                var varName = expr1.id;
                forbiddenCheck(c, ch, varName, n.lineno);
                break;
            case Attribute:
            case Subscript:
                break;
            default:
                throw new Sk.builtin.SyntaxError("illegal expression for augmented assignment", c.c_filename, n.lineno);
        }
        setContext(c, expr1, Store, ch);

        ch = CHILD(n, 2);
        var expr2;
        if (ch.type === SYM.testlist)
            expr2 = astForTestlist(c, ch);
        else
            expr2 = astForExpr(c, ch);

        return new AugAssign(expr1, astForAugassign(c, CHILD(n, 1)), expr2, n.lineno, n.col_offset);
    }
    else
    {
        // normal assignment
        REQ(CHILD(n, 1), TOK.T_EQUAL);
        var targets = [];
        for (var i = 0; i < NCH(n) - 2; i += 2)
        {
            var ch = CHILD(n, i);
            if (ch.type === SYM.yield_expr) throw new Sk.builtin.SyntaxError("assignment to yield expression not possible", c.c_filename, n.lineno);
            var e = astForTestlist(c, ch);
            setContext(c, e, Store, CHILD(n, i));
            targets[i / 2] = e;
        }
        var value = CHILD(n, NCH(n) - 1);
        var expression;
        if (value.type === SYM.testlist)
            expression = astForTestlist(c, value);
        else
            expression = astForExpr(c, value);
        return new Assign(targets, expression, n.lineno, n.col_offset);
    }
}

function astForIfexpr(c, n)
{
    /* test: or_test 'if' or_test 'else' test */ 
    goog.asserts.assert(NCH(n) === 5);
    return new IfExp(
            astForExpr(c, CHILD(n, 2)),
            astForExpr(c, CHILD(n, 0)),
            astForExpr(c, CHILD(n, 4)),
            n.lineno, n.col_offset);
}

/**
 * s is a python-style string literal, including quote characters and u/r/b
 * prefixes. Returns decoded string object.
 */
function parsestr(c, s)
{
    var encodeUtf8 = function(s) { return unescape(encodeURIComponent(s)); };
    var decodeUtf8 = function(s) { return decodeURIComponent(escape(s)); };
    var decodeEscape = function(s, quote)
    {
        var len = s.length;
        var ret = '';
        for (var i = 0; i < len; ++i)
        {
            var c = s.charAt(i);
            if (c === '\\')
            {
                ++i;
                c = s.charAt(i);
                if (c === 'n') ret += "\n";
                else if (c === '\\') ret += "\\";
                else if (c === 't') ret += "\t";
                else if (c === 'r') ret += "\r";
                else if (c === 'b') ret += "\b";
                else if (c === 'f') ret += "\f";
                else if (c === 'v') ret += "\v";
                else if (c === '0') ret += "\0";
                else if (c === '"') ret += '"';
                else if (c === '\'') ret += '\'';
                else if (c === '\n') /* escaped newline, join lines */ {}
                else if (c === 'x')
                {
                    var d0 = s.charAt(++i);
                    var d1 = s.charAt(++i);
                    ret += String.fromCharCode(parseInt(d0+d1, 16));
                }
                else if (c === 'u' || c === 'U')
                {
                    var d0 = s.charAt(++i);
                    var d1 = s.charAt(++i);
                    var d2 = s.charAt(++i);
                    var d3 = s.charAt(++i);
                    ret += String.fromCharCode(parseInt(d0+d1, 16), parseInt(d2+d3, 16));
                }
                else
                {
                    // Leave it alone
                    ret += "\\" + c;
                    // goog.asserts.fail("unhandled escape: '" + c.charCodeAt(0) + "'");
                }
            }
            else
            {
                ret += c;
            }
        }
        return ret;
    };

    //print("parsestr", s);

    var quote = s.charAt(0);
    var rawmode = false;

    if (quote === 'u' || quote === 'U')
    {
        s = s.substr(1);
        quote = s.charAt(0);
    }
    else if (quote === 'r' || quote === 'R')
    {
        s = s.substr(1);
        quote = s.charAt(0);
        rawmode = true;
    }
    goog.asserts.assert(quote !== 'b' && quote !== 'B', "todo; haven't done b'' strings yet");

    goog.asserts.assert(quote === "'" || quote === '"' && s.charAt(s.length - 1) === quote);
    s = s.substr(1, s.length - 2);

    if (s.length >= 4 && s.charAt(0) === quote && s.charAt(1) === quote)
    {
        goog.asserts.assert(s.charAt(s.length - 1) === quote && s.charAt(s.length - 2) === quote);
        s = s.substr(2, s.length - 4);
    }

    if (rawmode || s.indexOf('\\') === -1)
    {
        return strobj(decodeUtf8(s));
    }
    return strobj(decodeEscape(s, quote));
}

function parsestrplus(c, n)
{
    REQ(CHILD(n, 0), TOK.T_STRING);
    var ret = new Sk.builtin.str("");
    for (var i = 0; i < NCH(n); ++i)
    {
        try {
            ret = ret.sq$concat(parsestr(c, CHILD(n, i).value));
        } catch (x) {
            throw new Sk.builtin.SyntaxError("invalid string (possibly contains a unicode character)", c.c_filename, CHILD(n, i).lineno);
        }
    }
    return ret;
}

function parsenumber(c, s, lineno)
{
    var end = s.charAt(s.length - 1);

    // todo; no complex support
    if (end === 'j' || end === 'J') {
	throw new Sk.builtin.SyntaxError("complex numbers are currently unsupported", c.c_filename, lineno);
    }

    // Handle longs
    if (end === 'l' || end === 'L') {
        return Sk.longFromStr(s.substr(0, s.length - 1), 0);
    }
    
    // todo; we don't currently distinguish between int and float so
    // str is wrong for these.
    if (s.indexOf('.') !== -1)
    {
        return new Sk.builtin.nmber(parseFloat(s), Sk.builtin.nmber.float$);
    }

    // Handle integers of various bases
    var tmp = s;
    var val;
    var neg = false;
    if (s.charAt(0) === '-') {
        tmp = s.substr(1);
        neg = true;
    }

    if (tmp.charAt(0) === '0' && (tmp.charAt(1) === 'x' || tmp.charAt(1) === 'X')) {
        // Hex
        tmp = tmp.substring(2);
        val = parseInt(tmp, 16);
    } else if ((s.indexOf('e') !== -1) || (s.indexOf('E') !== -1)) {
	// Float with exponent (needed to make sure e/E wasn't hex first)
	return new Sk.builtin.nmber(parseFloat(s), Sk.builtin.nmber.float$);
    } else if (tmp.charAt(0) === '0' && (tmp.charAt(1) === 'b' || tmp.charAt(1) === 'B')) {
        // Binary
        tmp = tmp.substring(2);
        val = parseInt(tmp, 2);
    } else if (tmp.charAt(0) === '0') {
        if (tmp === "0") {
            // Zero
            val = 0;
        } else {
            // Octal
            tmp = tmp.substring(1);
            if ((tmp.charAt(0) === 'o') || (tmp.charAt(0) === 'O')) {
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
    if (val > Sk.builtin.lng.threshold$
        && Math.floor(val) === val
        && (s.indexOf('e') === -1 && s.indexOf('E') === -1))
    {
        return Sk.longFromStr(s, 0);
    }

    // Small enough, return parsed number
    if (neg) {
        return new Sk.builtin.nmber(-val, Sk.builtin.int$);
    } else {
        return new Sk.builtin.nmber(val, Sk.builtin.int$);
    }
}

function astForSlice(c, n)
{
    REQ(n, SYM.subscript);

    /*
       subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
       sliceop: ':' [test]
    */
    var ch = CHILD(n, 0);
    var lower = null;
    var upper = null;
    var step = null;
    if (ch.type === TOK.T_DOT)
        return new Ellipsis();
    if (NCH(n) === 1 && ch.type === SYM.test)
        return new Index(astForExpr(c, ch));
    if (ch.type === SYM.test)
        lower = astForExpr(c, ch);
    if (ch.type === TOK.T_COLON)
    {
        if (NCH(n) > 1)
        {
            var n2 = CHILD(n, 1);
            if (n2.type === SYM.test)
                upper = astForExpr(c, n2);
        }
    }
    else if (NCH(n) > 2)
    {
        var n2 = CHILD(n, 2);
        if (n2.type === SYM.test)
            upper = astForExpr(c, n2);
    }

    ch = CHILD(n, NCH(n) - 1);
    if (ch.type === SYM.sliceop)
    {
        if (NCH(ch) === 1)
        {
            ch = CHILD(ch, 0);
            step = new Name(strobj("None"), Load, ch.lineno, ch.col_offset);
        }
        else
        {
            ch = CHILD(ch, 1);
            if (ch.type === SYM.test)
                step = astForExpr(c, ch);
        }
    }
    return new Slice(lower, upper, step);
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
            return new Name(strobj(ch.value), Load, n.lineno, n.col_offset);
        case TOK.T_STRING:
            return new Str(parsestrplus(c, n), n.lineno, n.col_offset);
        case TOK.T_NUMBER:
        return new Num(parsenumber(c, ch.value, n.lineno), n.lineno, n.col_offset);
        case TOK.T_LPAR: // various uses for parens
            ch = CHILD(n, 1);
            if (ch.type === TOK.T_RPAR)
                return new Tuple([], Load, n.lineno, n.col_offset);
            if (ch.type === SYM.yield_expr)
                return astForExpr(c, ch);
            if (NCH(ch) > 1 && CHILD(ch, 1).type === SYM.gen_for)
                return astForGenexp(c, ch);
            return astForTestlistGexp(c, ch);
        case TOK.T_LSQB: // list or listcomp
            ch = CHILD(n, 1);
            if (ch.type === TOK.T_RSQB)
                return new List([], Load, n.lineno, n.col_offset);
            REQ(ch, SYM.listmaker);
            if (NCH(ch) === 1 || CHILD(ch, 1).type === TOK.T_COMMA)
                return new List(seqForTestlist(c, ch), Load, n.lineno, n.col_offset);
            else
                return astForListcomp(c, ch);
        case TOK.T_LBRACE:
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
            throw new Sk.builtin.SyntaxError("backquote not supported, use repr()", c.c_filename, n.lineno);
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
        e = new BinOp(e, Pow, f, n.lineno, n.col_offset);
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
                    return new BoolOp(And, seq, n.lineno, n.col_offset);
                goog.asserts.assert(CHILD(n, 1).value === "or");
                return new BoolOp(Or, seq, n.lineno, n.col_offset);
            case SYM.not_test:
                if (NCH(n) === 1)
                {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                else
                {
                    return new UnaryOp(Not, astForExpr(c, CHILD(n, 1)), n.lineno, n.col_offset);
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
                        ops[(i - 1) / 2] = astForCompOp(c, CHILD(n, i));
                        cmps[(i - 1) / 2] = astForExpr(c, CHILD(n, i + 1));
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
            case SYM.with_stmt: return astForWithStmt(c, ch);
            case SYM.funcdef: return astForFuncdef(c, ch, []);
            case SYM.classdef: return astForClassdef(c, ch, []);
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
        else if (node.prototype && node.prototype._astname !== undefined && node.prototype._isenum)
        {
            return indent + node.prototype._astname + "()";
        }
        else if (node._astname !== undefined)
        {
            var namelen = spaces(node._astname.length + 1);
            var fields = [];
            for (var i = 0; i < node._fields.length; i += 2) // iter_fields
            {
                var a = node._fields[i]; // field name
                var b = node._fields[i + 1](node); // field getter func
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
            return indent + node._astname + "(" + fieldstr + ")";
        }
        else if (goog.isArrayLike(node))
        {
            //Sk.debugout("arr", node.length);
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
            if (node === true) ret = "True";
            else if (node === false) ret = "False";
            else if (node instanceof Sk.builtin.lng) ret = node.tp$str().v;
            else if (node instanceof Sk.builtin.str) ret = node['$r']().v;
            else ret = "" + node;
            return indent + ret;
        }
    };

    return _format(node, "");
};

goog.exportSymbol("Sk.astFromParse", Sk.astFromParse);
goog.exportSymbol("Sk.astDump", Sk.astDump);
