goog.require('goog.net.IframeIo');

function read(fn)
{
    return document.getElementById("test_run_t00_py").innerText;
}

function print()
{
    var output = document.getElementById('output');
    for (var i = 0; i < arguments.length; ++i)
    {
        output.innerHTML += arguments[i].toString();
        if (i !== arguments.length - 1)
            output.innerHTML += " ";
    }
    output.innerHTML += "\n";
}
