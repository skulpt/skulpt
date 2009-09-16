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

function compileUrlAsync(url, oncomplete)
{
    // xmlhttp the url and compileStr it
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
