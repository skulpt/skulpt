/*
This is an implementation of set in Javascrpit that is more or less automatically
wrapped in the appropriate skulpt wrapper stuff.  It was developed as a proof of
concept to see how I could wrap other more complicated objects.

You can test this with the following code:

import wset

x = wset.ObjectSet()
y = wset.ObjectSet()
print x.isEmpty()

x.add('1')
x.add('2')
x.add('3')
y.add('3')
y.add('4')
y.add('5')
y.add('2')
print x.item_count
print x.count()

print y.item_count

z = x.intersect(y)
print z.item_count
print z.values()

y.clear()
print y.count()
print y.stuff()

Save it to a file settest.py for example and then
$  ./m run settest.py


*/

var ObjectSet = function ()
{
    this.items = {};
    this.item_count = 0;
};

ObjectSet.prototype.contains = function (x)
{
    return this.items.hasOwnProperty(x.toString());
};

ObjectSet.prototype.add = function (x)
{
    if (!this.contains(x))
    {
        this.items[x.toString()] = x;
        this.item_count++;
    }

};

ObjectSet.prototype.remove = function (x)
{
    if (this.contains(x))
    {
        delete this.items[x.toString()];
        this.item_count--;
    }

};

ObjectSet.prototype.clear = function ()
{
    this.items = {};
    this.item_count = 0;

};

ObjectSet.prototype.isEmpty = function ()
{
    return this.item_count === 0;
};

ObjectSet.prototype.count = function ()
{
    return this.item_count;
};

ObjectSet.prototype.values = function ()
{
    var i, ret = [];

    for (i in this.items)
    {
        if (this.items.hasOwnProperty(i))
            ret.push(this.items[i]);
    }

    return ret;
};

ObjectSet.prototype.intersect = function(other) {
    var i = 0;
    var ret = new ObjectSet();

    for (i in this.items) {
        if (other.contains(this.items[i])) {
            ret.add(this.items[i])
        }

    }

    return ret;

}

/////// Here ends the test object

var $builtinmodule = function(name)
{
    var mod = {};


    /*
    Skulpt object Arguments going in to a function will need to be unwrapped
    and converted to their native javascript form if possible.
    */
    var args_unwrap = function(args) {
        for (var a in args) {
            if (args[a] instanceof Sk.builtin.list) {
                args[a] = args[a].v
            }
            else if (args[a] instanceof Sk.builtin.str) {
                args[a] = args[a].v
            } else if (args[a] instanceof mod.ObjectSet) { // customize
                args[a] = args[a].realObj
            }
        }
    }

    /*  Each time someone might want to use this the res_wrap function should be customized
    to detect and return the appropriate 'Skulpt native' objects as well as the user defined
    objects in the module/class we are wrapping.  In this case the challenge is that the
    intersect function returns

    */
    var res_wrap = function(res) {
        if (typeof res === "string") {
            return new Sk.builtin.str(res);
        }
        else if (res instanceof Array) {
            var newres = res.map(res_wrap)
            return new Sk.builtin.list(newres);
        } else if (res instanceof ObjectSet) {
            //return new mod.ObjectSet(res);
            return Sk.misceval.callsim(mod.ObjectSet,res)  // customize
        }
        else {
            return res
        }

    }

    /*
    Now we begin to make an object that will be used as the basis for a Skulpt
    'user defined' object type.  In other words this is the skulpt version of
    the ObjectSet 'class' defined above.
    */
    objectset = function($gbl,$loc) {
        /*
        This next block of code is only exected once, when the module is imported.
        */
        var realFuncs = {};
        props = Object.getOwnPropertyNames(ObjectSet.prototype)
        for (i in props) {
            if (typeof props[i] === "number" ) {
                realFuncs = ObjectSet.prototype[i];
            }
            if (typeof ObjectSet.prototype[props[i]] == "function") {
                realFuncs[props[i]] = ObjectSet.prototype[props[i]]
            }
        }

        /*
        The init method will need to be mindful of the parameters it needs, but in any
        case will need to make allowance for the fact that it may get an ObjectSet
        as an additional parameter.
        */
        $loc.__init__ = function(self) {
            if (arguments.length > 1) {
                self.realObj = arguments[1]
            } else {
                //If the real object constructor takes parameters pass them here
                self.realObj = new ObjectSet();

            }
        }

        $loc.__getattr__ = function(self,key) {
            if (key in realFuncs) {
                // this seems a bit wasteful to create a new func each time we want to call a function... Maybe the func could be built once and stored in self?? which is still wasteful...
                return new Sk.builtin.func(realFuncs[key],self.realObj,undefined,undefined,args_unwrap,res_wrap)
            } else {
                if (key in self.realObj) {
                    return res_wrap(self.realObj[key])
                } else {
                    throw new Sk.builtin.AttributeError("No attribute named " + key);
                }
            }
        }
    }

    // This builds the Skulpt version of the class.
    mod.ObjectSet = Sk.misceval.buildClass(mod, objectset, 'ObjectSet', []);

    // repeat here for additional classes defined by the module.

    // Module level functions can also be defined here using Sk.builtin.func.

    return mod;
}