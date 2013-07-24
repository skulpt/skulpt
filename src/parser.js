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
 * can throw ParseError
 */
function Parser(filename, grammar)
{
    this.filename = filename;
    this.grammar = grammar;
    return this;
}


Parser.prototype.setup = function(start)
{
    start = start || this.grammar.start;
    //print("START:"+start);

    var newnode =
    {
        type: start,
        value: null,
        context: null,
        children: []
    };
    var stackentry =
    {
        dfa: this.grammar.dfas[start],
        state: 0,
        node: newnode
    };
    this.stack = [stackentry];
    this.used_names = {};
};

function findInDfa(a, obj)
{
    var i = a.length;
    while (i--)
    {
        if (a[i][0] === obj[0] && a[i][1] === obj[1])
        {
            return true;
        }
    }
    return false;
}


// Add a token; return true if we're done
Parser.prototype.addtoken = function(type, value, context)
{
    var ilabel = this.classify(type, value, context);
    //print("ilabel:"+ilabel);

OUTERWHILE:
    while (true)
    {
        var tp = this.stack[this.stack.length - 1];
        var states = tp.dfa[0];
        var first = tp.dfa[1];
        var arcs = states[tp.state];

        // look for a state with this label
        for (var a = 0; a < arcs.length; ++a)
        {
            var i = arcs[a][0];
            var newstate = arcs[a][1];
            var t = this.grammar.labels[i][0];
            var v = this.grammar.labels[i][1];
            //print("a:"+a+", t:"+t+", i:"+i);
            if (ilabel === i)
            {
                // look it up in the list of labels
                goog.asserts.assert(t < 256);
                // shift a token; we're done with it
                this.shift(type, value, newstate, context);
                // pop while we are in an accept-only state
                var state = newstate;
                //print("before:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                while (states[state].length === 1
                        && states[state][0][0] === 0
                        && states[state][0][1] === state) // states[state] == [(0, state)])
                {
                    this.pop();
                    //print("in after pop:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                    if (this.stack.length === 0)
                    {
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
                // done with this token
                //print("DONE, return false");
                return false;
            }
            else if (t >= 256)
            {
                var itsdfa = this.grammar.dfas[t];
                var itsfirst = itsdfa[1];
                if (itsfirst.hasOwnProperty(ilabel))
                {
                    // push a symbol
                    this.push(t, this.grammar.dfas[t], newstate, context);
                    continue OUTERWHILE;
                }
            }
        }

        //print("findInDfa: " + JSON.stringify(arcs)+" vs. " + tp.state);
        if (findInDfa(arcs, [0, tp.state]))
        {
            // an accepting state, pop it and try somethign else
            //print("WAA");
            this.pop();
            if (this.stack.length === 0)
            {
                throw new Sk.builtin.ParseError("too much input", this.filename);
            }
        }
        else
        {
            // no transition
            var errline = context[0][0];
            throw new Sk.builtin.ParseError("bad input", this.filename, errline, context);	//	RNL
//          throw new Sk.builtin.ParseError("bad input on line " + errline.toString());		RNL
        }
    }
};

// turn a token into a label
Parser.prototype.classify = function(type, value, context)
{
    var ilabel;
    if (type === Sk.Tokenizer.Tokens.T_NAME)
    {
        this.used_names[value] = true;
        ilabel = this.grammar.keywords.hasOwnProperty(value) && this.grammar.keywords[value];
        if (ilabel)
        {
            //print("is keyword");
            return ilabel;
        }
    }
    ilabel = this.grammar.tokens.hasOwnProperty(type) && this.grammar.tokens[type];
    if (!ilabel) {
        // throw new Sk.builtin.ParseError("bad token", type, value, context);
        // Questionable modification to put line number in position 2
        // like everywhere else and filename in position 1.
        throw new Sk.builtin.ParseError("bad token", this.filename, context[0][0], context);
    }
    return ilabel;
};

// shift a token
Parser.prototype.shift = function(type, value, newstate, context)
{
    var dfa = this.stack[this.stack.length - 1].dfa;
    var state = this.stack[this.stack.length - 1].state;
    var node = this.stack[this.stack.length - 1].node;
    //print("context", context);
    var newnode = {
        type: type, 
        value: value,
        lineno: context[0][0],         // throwing away end here to match cpython
        col_offset: context[0][1],
        children: null
    };
    if (newnode)
    {
        node.children.push(newnode);
    }
    this.stack[this.stack.length - 1] = {
        dfa: dfa,
        state: newstate,
        node: node
    };
};

// push a nonterminal
Parser.prototype.push = function(type, newdfa, newstate, context)
{
    var dfa = this.stack[this.stack.length - 1].dfa; 
    var node = this.stack[this.stack.length - 1].node; 
    var newnode = {
        type: type,
        value: null,
        lineno: context[0][0],      // throwing away end here to match cpython
        col_offset: context[0][1],
        children: []
    };
    this.stack[this.stack.length - 1] = {
            dfa: dfa,
            state: newstate,
            node: node
        };
    this.stack.push({
            dfa: newdfa,
            state: 0,
            node: newnode
        });
};

//var ac = 0;
//var bc = 0;

// pop a nonterminal
Parser.prototype.pop = function()
{
    var pop = this.stack.pop();
    var newnode = pop.node;
    //print("POP");
    if (newnode)
    {
        //print("A", ac++, newnode.type);
        //print("stacklen:"+this.stack.length);
        if (this.stack.length !== 0)
        {
            //print("B", bc++);
            var node = this.stack[this.stack.length - 1].node;
            node.children.push(newnode);
        }
        else
        {
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
function makeParser(filename, style)
{
    if (style === undefined) style = "file_input";
    var p = new Parser(filename, Sk.ParseTables);
    // for closure's benefit
    if (style === "file_input")
        p.setup(Sk.ParseTables.sym.file_input);
    else
        goog.asserts.fail("todo;");
    var curIndex = 0;
    var lineno = 1;
    var column = 0;
    var prefix = "";
    var T_COMMENT = Sk.Tokenizer.Tokens.T_COMMENT;
    var T_NL = Sk.Tokenizer.Tokens.T_NL;
    var T_OP = Sk.Tokenizer.Tokens.T_OP;
    var tokenizer = new Sk.Tokenizer(filename, style === "single_input", function(type, value, start, end, line)
            {
                //print(JSON.stringify([type, value, start, end, line]));
                var s_lineno = start[0];
                var s_column = start[1];
                /*
                if (s_lineno !== lineno && s_column !== column)
                {
                    // todo; update prefix and line/col
                }
                */
                if (type === T_COMMENT || type === T_NL)
                {
                    prefix += value;
                    lineno = end[0];
                    column = end[1];
                    if (value[value.length - 1] === "\n")
                    {
                        lineno += 1;
                        column = 0;
                    }
                    //print("  not calling addtoken");
                    return undefined;
                }
                if (type === T_OP)
                {
                    type = Sk.OpMap[value];
                }
                if (p.addtoken(type, value, [start, end, line]))
                {
                    return true;
                }
            });
    return function(line)
    {
        var ret = tokenizer.generateTokens(line);
        //print("tok:"+ret);
        if (ret)
        {
            if (ret !== "done") {
                throw new Sk.builtin.ParseError("incomplete input", this.filename);
			}
            return p.rootnode;
        }
        return false;
    };
}

Sk.parse = function parse(filename, input)
{
    var parseFunc = makeParser(filename);
    if (input.substr(input.length - 1, 1) !== "\n") input += "\n";
    //print("input:"+input);
    var lines = input.split("\n");
    var ret;
    for (var i = 0; i < lines.length; ++i)
    {
        ret = parseFunc(lines[i] + ((i === lines.length - 1) ? "" : "\n"));
    }
    return ret;
};

Sk.parseTreeDump = function parseTreeDump(n, indent)
{
    //return JSON.stringify(n, null, 2);
    indent = indent || "";
    var ret = "";
    ret += indent;
    if (n.type >= 256) // non-term
    {
        ret += Sk.ParseTables.number2symbol[n.type] + "\n";
        for (var i = 0; i < n.children.length; ++i)
        {
            ret += Sk.parseTreeDump(n.children[i], indent + "  ");
        }
    }
    else
    {
        ret += Sk.Tokenizer.tokenNames[n.type] + ": " + new Sk.builtin.str(n.value)['$r']().v + "\n";
    }
    return ret;
};


goog.exportSymbol("Sk.parse", Sk.parse);
goog.exportSymbol("Sk.parseTreeDump", Sk.parseTreeDump);
