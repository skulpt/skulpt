// this code is modelled after same in cpython. that file might be helpful to
// understand this one.
//
// builds a symbol table from the ast. this determines the scope of all names
// in the tree.
//
// a name can be local, global, or free. local variables can also be 'cell'
// variables. cells are variables that are referenced from an inner scope.
//
// there are 2 kinds of free variables too: implicit and explicit. an explicit
// global is declared with the global keyword. an implicit global is a free
// variable for which there's no binding up higher. the implicit is either a
// global or a builtin. this is strange behaviour in python, the name is
// global until it has been written to, then it's local.

(function() {

Sk.symtableBuild = function(mod, filename)
{
    var st = new Symtable(filename);
    if (
};

}());
