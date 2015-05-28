var $builtinmodule = function (name) {
    var elementClass;
    var mod = {};

    mod.getElementById = new Sk.builtin.func(function (id) {
        var result = document.getElementById(id.v);
        if (result) {
            return Sk.misceval.callsim(mod.Element, result);
        }
        return Sk.builtin.none.none$;
    });

    mod.createElement = new Sk.builtin.func(function (eName) {
        var r = document.createElement(eName.v);
        if (r) {
            return Sk.misceval.callsim(mod.Element, r);
        }
    });


    mod.getElementsByTagName = new Sk.builtin.func(function (tag) {
        var r = document.getElementsByTagName(tag.v)
        var reslist = [];
        for (var i = r.length - 1; i >= 0; i--) {
            reslist.push(Sk.misceval.callsim(mod.Element, r[i]))
        }
        return new Sk.builtin.list(reslist)
    });

    mod.getElementsByClassName = new Sk.builtin.func(function (cname) {
        var r = document.getElementsByClassName(cname.v);
        var reslist = [];
        for (var i = 0; i < r.length; i++) {
            reslist.push(Sk.misceval.callsim(mod.Element, r[i]));
        }
        ;
        return new Sk.builtin.list(reslist);
    });

    mod.getElementsByName = new Sk.builtin.func(function (cname) {
        var r = document.getElementsByName(cname.v);
        var reslist = [];
        for (var i = 0; i < r.length; i++) {
            reslist.push(Sk.misceval.callsim(mod.Element, r[i]));
        }
        ;
        return new Sk.builtin.list(reslist);
    });

    mod.currentDiv = new Sk.builtin.func(function () {
        if (Sk.divid !== undefined) {
            return new Sk.builtin.str(Sk.divid)
        }
        else {
            throw new Sk.builtin.AttributeError("There is no value set for divid");
        }
    })

    elementClass = function ($gbl, $loc) {
        /*
         Notes:  self['$d'] is the dictionary used by the GenericGetAttr mechanism for an object.
         for various reasons  if you create a class in Javascript and have self.xxxx instance
         variables, you cannot say instance.xxx and get the value of the instance variable unless
         it is stored in the self['$d'] object.  This seems like a duplication of storage to me
         but that is how it works right now  (5/2013)

         Writing your own __getattr__ is also an option but this gets very tricky when an attr is
         a method...
         */
        $loc.__init__ = new Sk.builtin.func(function (self, elem) {
            self.v = elem
            self.innerHTML = elem.innerHTML
            self.innerText = elem.innerText
            if (elem.value !== undefined) {
                self.value = elem.value
                Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('value'), new Sk.builtin.str(self.value))
            }

            if (elem.checked !== undefined) {
                self.checked = elem.checked
                Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('checked'), new Sk.builtin.str(self.checked))
            }

            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('innerHTML'), new Sk.builtin.str(self.innerHTML))
            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('innerText'), new Sk.builtin.str(self.innerText))

        })

        $loc.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

        $loc.__setattr__ = new Sk.builtin.func(function (self, key, value) {
            key = Sk.ffi.remapToJs(key);
            if (key === 'innerHTML') {
                self.innerHTML = value
                self.v.innerHTML = value.v
                Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('innerHTML'), value)
            }
            if (key === 'innerText') {
                self.innerText = value
                self.v.innerText = value.v
                Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('innerText'), value)
            }
        });


        $loc.appendChild = new Sk.builtin.func(function (self, ch) {
            self.v.appendChild(ch.v);
        });

        $loc.removeChild = new Sk.builtin.func(function (self, node) {
            self.v.removeChild(node.v)
        })

        // getCSS

        $loc.getCSS = new Sk.builtin.func(function (self, key) {
            return new Sk.builtin.str(self.v.style[key.v]);
        });


        $loc.setCSS = new Sk.builtin.func(function (self, attr, value) {
            self.v.style[attr.v] = value.v

        })

        $loc.getAttribute = new Sk.builtin.func(function (self, key) {
            var res = self.v.getAttribute(key.v)
            if (res) {
                return new Sk.builtin.str(res)
            } else {
                return Sk.builtin.none.none$;
            }
        });

        $loc.setAttribute = new Sk.builtin.func(function (self, attr, value) {
            self.v.setAttribute(attr.v, value.v)
        });

        $loc.getProperty = new Sk.builtin.func(function (self, key) {
            var res = self.v[key.v]
            if (res) {
                return new Sk.builtin.str(res)
            } else {
                return Sk.builtin.none.none$;
            }
        });

        $loc.__str__ = new Sk.builtin.func(function (self) {
            console.log(self.v.tagName);
            return new Sk.builtin.str(self.v.tagName)
        })

        $loc.__repr__ = new Sk.builtin.func(function (self) {
            return new Sk.builtin.str('[DOM Element]')
        })


    };

    mod.Element = Sk.misceval.buildClass(mod, elementClass, 'Element', []);

    return mod;

}
