//
// This is pretty much a straight port of ast.c from CPython 2.6.5.
//
// The previous version was easier to work with and more JS-ish, but having a
// somewhat different ast structure than cpython makes testing more difficult.
//
// This way, we can use a dump from the ast module on any arbitrary python
// code and know that we're the same up to ast level, at least.
//

(function() {

var SYM = Sk.ParseTables.sym;
var TOK = Sk.Tokenizer;

/** @constructor */
function Compiling(encoding, filename)
{
    this.c_encoding = encoding;
    this.c_filename = filename;
}

/**
 * @return {number}
 */
function NCH(n) { goog.asserts.assert(n !== undefined); return n.children.length; }

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
    return 0;
}

function forbiddenCheck(c, n, x)
{
    if (x === "None") throw new SyntaxError("assignment to None");
    if (x === "True" || x === "False") throw new SyntaxError("assignment to True or False is forbidden");
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
            if (ctx === Store) forbiddenCheck(c, n, e.attr);
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
                throw new SyntaxError("can't assign to ()");
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
        case Generator:
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
        throw new SyntaxError("can't " + (ctx === Store ? "assign to" : "delete") + " " + exprName);
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

function astForIfStmt(c, n)
{
    /* if_stmt: 'if' test ':' suite ('elif' test ':' suite)*
       ['else' ':' suite]
    */
    REQ(n, SYM.if_stmt);
    if (NCH(n) === 4)
        return new If_(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.lineno, n.col_offset);

    var s = CHILD(n, 4).value;
    var decider = s.substr(2, 1); // elSe or elIf
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
            && CHILD(n, nElif + 1).value.substr(2, 1) === 's')
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
            nElif -= 1;
        }

        for (var i = 0; i < nElif; ++i)
        {
            var off = 5 + (nElif - i - 1) * 4;
            orelse = [
                new If_(
                    astForExpr(c, CHILD(n, off)),
                    astForSuite(c, CHILD(n, off + 2)),
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
    if (ngens > 1 || (ngens && (narsg || nkeywords)))
        throw new SyntaxError("Generator expression must be parenthesized if not sole argument");
    if (nargs + nkeywords + ngens > 255)
        throw new SyntaxError("more than 255 arguments");
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
                if (nkeywords) throw new SyntaxError("non-keyword arg after keyword arg");
                if (vararg) throw new SyntaxError("only named arguments may follow *expression");
                args[nargs++] = astForExpr(c, CHILD(ch, 0));
            }
            else if (CHILD(ch, 1).type === SYM.gen_for)
                args[nargs++] = astForGenexp(c, ch);
            else
            {
                var e = astForExpr(c, CHILD(ch, 0));
                if (e.constructor === Lambda) throw new SyntaxError("lambda cannot contain assignment");
                else if (e.constructor === Name) throw new SyntaxError("keyword can't be an expression");
                var key = e.id;
                forbiddenCheck(c, CHILD(ch, 0), key);
                for (var k = 0; k < nkeywords; ++k)
                {
                    var tmp = keywords[k].arg;
                    if (tmp === key) throw new SyntaxError("keyword argument repeated");
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
            return new Call(leftExpr, null, null, null, null, n.lineno, n.col_offset);
        else
            return astForCall(c, CHILD(n, 1), leftExpr);
    }
    else if (CHILD(n, 0).type === TOK.T_DOT)
        return new Attribute(leftExpr, CHILD(n, 1).value, Load, n.lineno, n.col_offset);
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
                return new Subscript(leftExpr, new ExtSlice(slice), Load, n.lineno, n.col_offset);
            }
            var elts = [];
            for (var j = 0; j < slices.length; ++j)
            {
                var slc = slices[j];
                goog.asserts.assert(slc.constructor === Index && slc.value !== null && slc.vaule !== undefined);
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
            return new arguments_(null, null, null, []);
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
                            throw new SyntaxError("parenthesized arg with default");
                        throw new SyntaxError("non-default argument follows default argument");
                    }

                    if (NCH(ch) === 3)
                    {
                        ch = CHILD(ch, 1);
                        // def foo((x)): is not complex, special case.
                        if (NCH(ch) !== 1)
                        {
                            throw new SyntaxError("tuple parameter unpacking has been removed");
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
                        forbiddenCheck(c, n, CHILD(ch, 0).value);
                        var id = CHILD(ch, 0).value;
                        args[k++] = new Name(id, Param, ch.lineno, ch.col_offset);
                    }
                    i += 2;
                    if (parenthesized)
                        throw new SyntaxError("parenthesized argument names are invalid");
                break; }
                break;
            case TOK.T_STAR:
                forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value);
                vararg = CHILD(n, i + 1).value;
                i += 3;
                break;
            case TOK.T_DOUBLESTAR:
                forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value);
                kwarg = CHILD(n, i + 1).value;
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
    var name = CHILD(n, 1).value;
    forbiddenCheck(c, CHILD(n, 1), CHILD(n, 1).value);
    var args = astForArguments(c, CHILD(n, 2));
    var body = astForSuite(c, CHILD(n, 4));
    return new FunctionDef(name, args, body, decoratorSeq, n.lineno, n.col_offset);
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
    switch (n.value.substr(0, 1))
    {
        case '+': return Add;
        case '-': return Sub;
        case '/': if (n.value.substr(1, 1) === '/') return FloorDiv;
                  return Div;
        case '%': return Mod;
        case '<': return LShift;
        case '>': return RShift;
        case '&': return BitAnd;
        case '^': return BitXor;
        case '|': return BitOr;
        case '*': if (n.value.substr(1, 1) === '*') return Pow;
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
            case GeneratorExp: throw new SyntaxError("augmented assignment to generator expression not possible");
            case Yield: throw new SyntaxError("augmented assignment to yield expression not possible");
            case Name:
                var varName = expr1.id;
                forbiddenCheck(c, ch, varName);
                break;
            case Attribute:
            case Subscript:
                break;
            default:
                throw new SyntaxError("illegal expression for augmented assignment");
        }
        setContext(c, expr1, Store, ch);

        ch = CHILD(n, 2);
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
            if (ch.type === SYM.yield_expr) throw new SyntaxError("assignment to yield expression not possible");
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

function parsenumber(c, s)
{
    // todo; no complex support
    var end = s.substr(s.length - 1, 1);
    if (end === 'l' || end === 'L')
        return Sk.longfromStr(s);
    return parseInt(s);
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
            return new Name(ch.value, Load, n.lineno, n.col_offset);
        case TOK.T_STRING:
            return new Str(parsestrplus(c, n), n.lineno, n.col_offset);
        case TOK.T_NUMBER:
            return new Num(parsenumber(c, ch.value), n.lineno, n.col_offset);
        case TOK.LPAR: // various uses for parens
            ch = CHILD(n, 1);
            if (ch.type === TOK.RPAR)
                return new Tuple(null, Load, n.lineno, n.col_offset);
            if (ch.type === SYM.yield_expr)
                return astForExpr(c, ch);
            if (NCH(ch) > 1 && CHILD(ch, 1).type === SYM.gen_for)
                return astForGenexp(c, ch);
            return astForTestlistGexp(c, ch);
        case TOK.LSQB: // list or listcomp
            ch = CHILD(n, 1);
            if (ch.type === RSQB)
                return new List(null, Load, n.lineno, n.col_offset);
            REQ(ch, SYM.listmaker);
            if (NCH(ch) === 1 || CHILD(ch, 1).type === TOK.T_COMMA)
                return new List(seqForTestlist(c, ch), Load, n.lineno, n.col_offset);
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
            case SYM.with_stmt: return astForWith1Stmt(c, ch);
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
        else if (node._astname !== undefined) // an 'enumeration' node
        {
            return indent + node._astname + "()";
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

}());
