var $builtinmodule = function(name)
{
    var mod = {};

    // todo how should our wrapped object keep a reference to the real object?
    // when a new object is created we may need to iterate over its methods and
    // inject the real object... but that probably is bad because there should only 
    // be one method shared among all instances, this means we need a way at run
    // time to actually plug in the globals on a call....
    //var props = Object.getOwnPropertyNames(document)
    var args_unwrap = function(args) {
        for (var a in args) {
            if (args[a] instanceof Sk.builtin.list) {
                args[a] = args[a].v
            }
            else if (args[a] instanceof Sk.builtin.str) {
                args[a] = args[a].v
            }
        }
    }

    var res_wrap = function(res) {
        if (typeof res === "string") {
            return new Sk.builtin.str(res);
        }
        else if (res instanceof Array) {
            return new Sk.builtin.list(res);
        }
        else {
            return new Sk.builtin.str("Unknown return object");
        }
        // can use Sk.misceval.callsim to create an instance of on of our user defined classes.
        
    }
    
    htmldocument = function($gbl,$loc) {

        var props = document;        
        for (i in props) {
            if (typeof document[i] === "number" ) {
                $loc[i] = document[i];
            }
            if (typeof document[i] == "function") {
                console.log("adding function " + i)
                $loc[i] = new Sk.builtin.func(document[i],document,undefined,undefined,true);
            }
        }
    }
    
    mod.document = Sk.misceval.buildClass(mod, htmldocument, 'document', []);

    return mod;
}