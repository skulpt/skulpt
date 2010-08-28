function read(fn)
{
    return readFromVFS(fn);
}
Sk.read = read;

function print()
{
    console.log.apply(console, arguments);

    var output = document.getElementById('output');
    for (var i = 0; i < arguments.length; ++i)
    {
        output.innerHTML += arguments[i].toString();
        if (i !== arguments.length - 1)
            output.innerHTML += " ";
    }
    output.innerHTML += "\n";
}
