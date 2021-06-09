// low level parser to a concrete syntax tree, derived from cpython's lib2to3

/**
 *
 * @constructor
 * @param {Object} grammar
 *
 * p = new Parser(grammar);
 * p.setup([start]);
 * foreach input token:
 *     if p.addtoken(...):
 *         break
 * root = p.rootnode
 *
 * can throw SyntaxError
 */
function Parser (filename, grammar) {
    this.filename = filename;
    this.grammar = grammar;
    this.p_flags = 0;
    return this;
}

// all possible parser flags
Parser.FUTURE_PRINT_FUNCTION = "print_function";
Parser.FUTURE_UNICODE_LITERALS = "unicode_literals";
Parser.FUTURE_DIVISION = "division";
Parser.FUTURE_ABSOLUTE_IMPORT = "absolute_import";
Parser.FUTURE_WITH_STATEMENT = "with_statement";
Parser.FUTURE_NESTED_SCOPES = "nested_scopes";
Parser.FUTURE_GENERATORS = "generators";
Parser.CO_FUTURE_PRINT_FUNCTION = 0x10000;
Parser.CO_FUTURE_UNICODE_LITERALS = 0x20000;
Parser.CO_FUTURE_DIVISON = 0x2000;
Parser.CO_FUTURE_ABSOLUTE_IMPORT = 0x4000;
Parser.CO_FUTURE_WITH_STATEMENT = 0x8000;

Parser.prototype.setup = function (start) {
    var stackentry;
    var newnode;
    start = start || this.grammar.start;
    //print("START:"+start);

    newnode =
    {
        type    : start,
        value   : null,
        context : null,
        children: []
    };
    stackentry =
    {
        dfa  : this.grammar.dfas[start],
        state: 0,
        node : newnode
    };
    this.stack = [stackentry];
    this.used_names = {};
};

function findInDfa (a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i][0] === obj[0] && a[i][1] === obj[1]) {
            return true;
        }
    }
    return false;
}


// Add a token; return true if we're done
Parser.prototype.addtoken = function (type, value, context) {
    var errline;
    var itsfirst;
    var itsdfa;
    var state;
    var v;
    var t;
    var newstate;
    var i;
    var a;
    var arcs;
    var first;
    var states;
    var tp;
    var ilabel = this.classify(type, value, context);
    //print("ilabel:"+ilabel);

    OUTERWHILE:
    while (true) {
        tp = this.stack[this.stack.length - 1];
        states = tp.dfa[0];
        first = tp.dfa[1];
        arcs = states[tp.state];

        // look for a state with this label
        for (a = 0; a < arcs.length; ++a) {
            i = arcs[a][0];
            newstate = arcs[a][1];
            t = this.grammar.labels[i][0];
            v = this.grammar.labels[i][1];
            if (ilabel === i) {
                // look it up in the list of labels
                Sk.asserts.assert(t < 256);
                // shift a token; we're done with it
                this.shift(type, value, newstate, context);
                // pop while we are in an accept-only state
                state = newstate;
                //print("before:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                /* jshint ignore:start */
                while (states[state].length === 1
                    && states[state][0][0] === 0
                    && states[state][0][1] === state) {
                    // states[state] == [(0, state)])
                    this.pop();
                    //print("in after pop:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                    if (this.stack.length === 0) {
                        // done!
                        return true;
                    }
                    tp = this.stack[this.stack.length - 1];
                    state = tp.state;
                    states = tp.dfa[0];
                    first = tp.dfa[1];
                    //print(JSON.stringify(states), JSON.stringify(first));
                    //print("bottom:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                }
                /* jshint ignore:end */
                // done with this token
                //print("DONE, return false");
                return false;
            } else if (t >= 256) {
                itsdfa = this.grammar.dfas[t];
                itsfirst = itsdfa[1];
                if (itsfirst.hasOwnProperty(ilabel)) {
                    // push a symbol
                    this.push(t, this.grammar.dfas[t], newstate, context);
                    continue OUTERWHILE;
                }
            }
        }

        //print("findInDfa: " + JSON.stringify(arcs)+" vs. " + tp.state);
        if (findInDfa(arcs, [0, tp.state])) {
            // an accepting state, pop it and try somethign else
            //print("WAA");
            this.pop();
            if (this.stack.length === 0) {
                throw new Sk.builtin.SyntaxError("too much input", this.filename);
            }
        } else {
            // no transition
            errline = context[0][0];
            throw new Sk.builtin.SyntaxError("bad input", this.filename, errline, context);
        }
    }
};

// turn a token into a label
Parser.prototype.classify = function (type, value, context) {
    var ilabel;
    if (type === Sk.token.tokens.T_NAME) {
        this.used_names[value] = true;
        ilabel = this.grammar.keywords.hasOwnProperty(value) && this.grammar.keywords[value];

        /* Check for handling print as a builtin function */
        if(value === "print" && (this.p_flags & Parser.CO_FUTURE_PRINT_FUNCTION || Sk.__future__.print_function === true)) {
            ilabel = false; // ilabel determines if the value is a keyword
        }

        if (ilabel) {
            //print("is keyword");
            return ilabel;
        }
    }
    ilabel = this.grammar.tokens.hasOwnProperty(type) && this.grammar.tokens[type];
    if (!ilabel) {
        // throw new Sk.builtin.SyntaxError("bad token", type, value, context);
        // Questionable modification to put line number in position 2
        // like everywhere else and filename in position 1.
        let descr = "#"+type;
        for (let i in Sk.token.tokens) {
            if (Sk.token.tokens[i] == type) {
                descr = i;
                break;
            }
        }

        throw new Sk.builtin.SyntaxError("bad token " + descr, this.filename, context[0][0], context);
    }
    return ilabel;
};

// shift a token
Parser.prototype.shift = function (type, value, newstate, context) {
    var dfa = this.stack[this.stack.length - 1].dfa;
    var state = this.stack[this.stack.length - 1].state;
    var node = this.stack[this.stack.length - 1].node;
    //print("context", context);
    var newnode = {
        type      : type,
        value     : value,
        lineno    : context[0][0],         // throwing away end here to match cpython
        col_offset: context[0][1],
        children  : null
    };
    if (newnode) {
        node.children.push(newnode);
    }
    this.stack[this.stack.length - 1] = {
        dfa  : dfa,
        state: newstate,
        node : node
    };
};

// push a nonterminal
Parser.prototype.push = function (type, newdfa, newstate, context) {
    var dfa = this.stack[this.stack.length - 1].dfa;
    var node = this.stack[this.stack.length - 1].node;
    var newnode = {
        type      : type,
        value     : null,
        lineno    : context[0][0],      // throwing away end here to match cpython
        col_offset: context[0][1],
        children  : []
    };
    this.stack[this.stack.length - 1] = {
        dfa  : dfa,
        state: newstate,
        node : node
    };
    this.stack.push({
        dfa  : newdfa,
        state: 0,
        node : newnode
    });
};

//var ac = 0;
//var bc = 0;

// pop a nonterminal
Parser.prototype.pop = function () {
    var node;
    var pop = this.stack.pop();
    var newnode = pop.node;
    //print("POP");
    if (newnode) {
        //print("A", ac++, newnode.type);
        //print("stacklen:"+this.stack.length);
        if (this.stack.length !== 0) {
            //print("B", bc++);
            node = this.stack[this.stack.length - 1].node;
            node.children.push(newnode);
        } else {
            //print("C");
            this.rootnode = newnode;
            this.rootnode.used_names = this.used_names;
        }
    }
};

/**
 * parser for interactive input. returns a function that should be called with
 * lines of input as they are entered. the function will return false
 * until the input is complete, when it will return the rootnode of the parse.
 *
 * @param {string} filename
 * @param {string=} style root of parse tree (optional)
 */
function makeParser (filename, style) {
    if (style === undefined) {
        style = "file_input";
    }
    var p = new Parser(filename, Sk.ParseTables);
    // for closure's benefit
    if (style === "file_input") {
        p.setup(Sk.ParseTables.sym.file_input);
    } else {
        Sk.asserts.fail("todo;");
    }
    return p;
}

Sk.parse = function parse (filename, input) {
    var T_COMMENT = Sk.token.tokens.T_COMMENT;
    var T_NL = Sk.token.tokens.T_NL;
    var T_OP = Sk.token.tokens.T_OP;
    var T_ENDMARKER = Sk.token.tokens.T_ENDMARKER;
    var T_ENCODING = Sk.token.tokens.T_ENCODING;

    var endmarker_seen = false;
    var parser = makeParser(filename);

    /**
     * takes a string splits it on '\n' and returns a function that returns
     * @param {Array<string>} input
     * @returns {function(): string}
     */
    function readline(input) {
        var lines = input.split("\n").reverse().map(function (l) { return l + "\n"; });

        return function() {
            if (lines.length === 0) {
                throw new Sk.builtin.Exception("EOF");
            }

            return lines.pop();
        };
    }

    Sk._tokenize(filename, readline(input), "utf-8", function (tokenInfo) {
        var s_lineno = tokenInfo.start[0];
        var s_column = tokenInfo.start[1];
        var type = null;
        var prefix, lineno, column;

        /* I don't know
         if (s_lineno !== lineno && s_column !== column)
         {
         // todo; update prefix and line/col
         }
         */

        if (tokenInfo.type === T_COMMENT || tokenInfo.type === T_NL || tokenInfo.type === T_ENCODING) {
            prefix += tokenInfo.value;
            lineno = tokenInfo.end[0];
            column = tokenInfo.end[1];
            if (tokenInfo.string[tokenInfo.string.length - 1] === "\n") {
                lineno += 1;
                column = 0;
            }
        } else {
            if (tokenInfo.type === T_OP) {
                type = Sk.OpMap[tokenInfo.string];
            }

            parser.addtoken(type || tokenInfo.type, tokenInfo.string, [tokenInfo.start, tokenInfo.end, tokenInfo.line]);

            if (tokenInfo.type === T_ENDMARKER) {
                endmarker_seen = true;
            }
        }
    });

    if (!endmarker_seen) {
        throw new Sk.builtin.SyntaxError("incomplete input", this.filename);
    }

    /**
     * Small adjustments here in order to return th flags and the cst
     */
    return {"cst": parser.rootnode, "flags": parser.p_flags};
};

Sk.parseTreeDump = function parseTreeDump (n, indent) {
    //return JSON.stringify(n, null, 2);
    var i;
    var ret;
    indent = indent || "";
    ret = "";
    ret += indent;
    if (n.type >= 256) { // non-term
        ret += Sk.ParseTables.number2symbol[n.type] + "\n";
        for (i = 0; i < n.children.length; ++i) {
            ret += Sk.parseTreeDump(n.children[i], indent + "  ");
        }
    } else {
        ret += Sk.token.tok_name[n.type] + ": " + new Sk.builtin.str(n.value)["$r"]().v + "\n";
    }
    return ret;
};


Sk.exportSymbol("Sk.Parser", Parser);
Sk.exportSymbol("Sk.parse", Sk.parse);
Sk.exportSymbol("Sk.parseTreeDump", Sk.parseTreeDump);
