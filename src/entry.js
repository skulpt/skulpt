//
//
//
// Main entry points
//
//
//
function compileStr(filename, input)
{
    var ast = transform(parse(filename, input));
    return compile(ast);
}

function compileUrl(url)
{
    // xmlhttp the url and compileStr it
    throw "todo;";
}

function execStr(filename, input)
{
    // compileStr and eval in some context
    throw "todo;";
}

function execUrl(url)
{
    // compileUrl and eval in some context
    throw "todo;";
}
 
function InteractiveContext()
{
    this.p = makeParser("<stdin>", 'single_input');
}
InteractiveContext.prototype.evalLine = function(line)
{
    var ret = this.p(line);
    //print(parseTestDump(ret));
    //print("ret:"+ret);
    if (ret)
    {
        return compile(transform(ret));
    }
    return false;
};
