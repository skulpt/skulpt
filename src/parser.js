// low level parser to a concrete syntax tree, derived from cpython's lib2to3

function ParseError(msg, type, value, context)
{
    this.msg = msg;
    this.type = type;
    this.value = value;
    this.context = context;
    return this;
}

/*
 * p = new Parser(grammar);
 * p.setup([start]);
 * foreach input token:
 *     if p.addtoken(...):
 *         break
 * root = p.rootnode
 *
 * can throw ParseError
 */
function Parser(grammar, convert)
{
    this.grammar = grammar;
    this.convert = convert || function(grammar, node) { return node; };
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

    while (true)
    {
        var tp = this.stack[this.stack.length - 1];
        var states = tp.dfa[0];
        var first = tp.dfa[1];
        var arcs = states[tp.state];

        var doelse = true;
        
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
                if (t >= 256) throw "assert";
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
                if (ilabel in itsfirst)
                {
                    // push a symbol
                    this.push(t, this.grammar.dfas[t], newstate, context);
                    doelse = false;
                    break; // to the while loop
                }
            }
        }

        if (doelse)
        {
            //print("findInDfa: " + JSON.stringify(arcs)+" vs. " + tp.state);
            if (findInDfa(arcs, [0, tp.state]))
            {
                // an accepting state, pop it and try somethign else
                //print("WAA");
                this.pop();
                if (this.stack.length === 0)
                {
                    throw "ParseError: too much input"; //, type, value, context);
                }
            }
            else
            {
                // no transition
                throw "ParseError: bad input"; //, type, value, context);
            }
        }
    }
};

// turn a token into a label
Parser.prototype.classify = function(type, value, context)
{
    var ilabel;
    if (type === T_NAME)
    {
        this.used_names[value] = true;
        ilabel = this.grammar.keywords[value];
        if (ilabel)
        {
            //print("is keyword");
            return ilabel;
        }
    }
    ilabel = this.grammar.tokens[type];
    if (!ilabel)
        throw new ParseError("bad token", type, value, context);
    return ilabel;
};

// shift a token
Parser.prototype.shift = function(type, value, newstate, context)
{
    var dfa = this.stack[this.stack.length - 1].dfa;
    var state = this.stack[this.stack.length - 1].state;
    var node = this.stack[this.stack.length - 1].node;
    var newnode = {
        type: type, 
        value: value,
        context: context,
        children: null
    };
    newnode = this.convert(this.grammar, newnode);
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
        context: context,
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
    var newnode = this.convert(this.grammar, pop.node);
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

// parser for interactive input. returns a function that should be called with
// lines of input as they are entered. the function will return false
// until the input is complete, when it will return the rootnode of the parse.
function makeParser(filename, style)
{
    if (style === undefined) style = "file_input";
    var p = new Parser(SkulptParseTables);
    p.setup(SkulptParseTables.symbol2number[style]);
    var curIndex = 0;
    var lineno = 1;
    var column = 0;
    var prefix = "";
    var tokenizer = new Tokenizer(filename, function(type, value, start, end, line)
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
                    return undefined;
                }
                if (type === T_OP)
                {
                    type = SkulptOpMap[value];
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
            if (ret !== "done")
                throw "ParseError: incomplete input";
            return p.rootnode;
        }
        return false;
    };
}

function parse(filename, input)
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
}
