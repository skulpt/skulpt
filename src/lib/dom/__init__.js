var $builtinmodule = function(name)
{
    var mod = {};
    var funcMap = {}
    //var props = Object.getOwnPropertyNames(document)
    var props = document;
    for (i in props) {
        if (typeof document[i] === "number" ) {
            mod[i] = document[i];
        }
        if (typeof document[i] == "function") {
            console.log("adding function " + i)
            mod[i] = new Sk.builtin.func(document[i],document,undefined,undefined,true);

        }
    }

    return mod;
}