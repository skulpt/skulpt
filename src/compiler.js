//
// Helpers for walkers
//
function genericVisit(ast, args)
{
    if (!ast) return undefined;
    if (args === undefined) throw "no args";
    //if (args.o === undefined) throw "no output buffer";
    //print("name:"+ ast.nodeName);
    if (ast.nodeName in this)
    {
        return this[ast.nodeName].call(this, ast, args);
    }
    else if (ast.walkChildren)
    {
        ast.walkChildren(this, args);
    }

}

var gensymCounter = 0;
function gensym()
{
    gensymCounter += 1;
    return "G$" + gensymCounter + "$";
}

//
//
//
// Walkers that perform various actions on the AST (including spitting out JS)
//
//
//

//
// determines if the body of a function contains any 'yield's and so it should
// be compiled as a generator rather than a function. tags all generator
// functions for later passes.
//
var hMarkGeneratorFunctions = {
visit: genericVisit,
Function_: function(ast, a)
           {
               ast.code.walkChildren(this, { block: ast });
           },
Yield_: function(ast, a)
{
    a.block.isGenerator = true;
}
};

//
// convert generator expressions to functions.
// http://docs.python.org/reference/executionmodel.html mentions that this is
// how generator expressions are implemented.
//
var hConvertGeneratorExpressionsToFunctions = {
visit: genericVisit,
GenExpr: function(ast, a)
{
    //print(JSON2.stringify(ast, null, 2));
    var lineno = ast.lineno;
    var cur;
    var root;
    for (var i = 0; i < ast.code.quals.length; ++i)
    {
        var qual = ast.code.quals[i];
        var next = new For_(new Name(qual.assign.name, lineno), qual.iter, new Stmt(new Pass(), lineno), null, lineno);
        if (cur !== undefined) cur.body.nodes = [next];
        cur = next;
        if (root === undefined) root = cur;
    }
    cur.body = new Stmt([ new Yield_(ast.code.expr, lineno) ], lineno);
    // todo; argnames of .0?
    var ret = new GenExprTransformed(new Function_(null, "<genexpr>", [], [], ast.varargs, ast.kwargs, null, new Stmt([root], lineno), lineno));
    //print(JSON2.stringify(ret, null, 2));
    return ret;
}
};

//
// modify all functions that fall off the end to explicitly return None (to
// handle null vs undefined in js).
//
var hMakeNoReturnANull = {
visit: genericVisit,
Function_: function(ast, a)
           {
               if (ast.code.nodes.length === 0 ||
                       !(ast.code.nodes[ast.code.nodes.length - 1] instanceof Return_))
               {
                   ast.code.nodes.push(new Return_(null));
               }
               // handle nested functions
               this.visit(ast.code, a);
           }
};


//
// walks a lhs that's a tuple unpack and verifies and returns all the names in
// the nested binops
//
var hGetTupleNames = {
visit: genericVisit,
AssName: function(ast, a)
         {
             a.names.push(ast.name);
         }
};

//
// walks a function body and notes all names that are declared global
//
var hFindGlobals = {
visit: genericVisit,
Global: function(ast, names)
        {
            for (var i = 0; i < ast.names.length; ++i)
                names.push(ast.names[i]);
        }
};

function appearsIn(name, namelist)
{
    for (var j = 0; j < namelist.length; ++j)
    {
        if (namelist[j] === name)
            return true;
    }
    return false;
}

//
// annotates blocks with the names that are bound within the block
// propagation of scope into functions is not done here (so functions need to
// look at functions they were declared in to find name bindings
//
//
// from http://docs.python.org/dev/reference/executionmodel.html
// a block is: a module, a class body, or a function body
// the following bind names:
// - function arguments
// - import
// - class and def
// - targets of assignment if identifiers
// - for loop header
// - the variable of except
// - variable in as and with
// when a name is bound, it becomes a local in that block. it doesn't matter
// when the name is bound, it's a local for the whole block. this means that a
// scan of the body of the block can determine at compile time whether it's a
// local or a global.
//
// the global statement causes references to that name to be global.
//
// i interpret http://docs.python.org/dev/reference/executionmodel.html#interaction-with-dynamic-features
// to mean that you can't muck with the static-icity; it's either clearly a
// local because its assigned to in the body, or it's always global.
//
var BIND_LOCAL = 'BIND_LOCAL';
var BIND_ARG = 'BIND_ARG'; // ARG is the same as LOCAL, just tagged for later info
var BIND_GLOBAL = 'BIND_GLOBAL';
var hAnnotateBlocksWithBindings = {
visit: genericVisit,
AssName: function(ast, a)
         {
             this.bindName(a, ast.name, BIND_LOCAL);
         },
// Subscript and AssAttr aren't necessary, AssTuple is handled by AssName
Global: function(ast, a)
        {
            for (var i = 0; i < ast.names.length; ++i)
                this.bindName(a, ast.names[i], BIND_GLOBAL);
        },
Module: function(ast, a)
        {
            //print("WEEE", astDump(ast));
            a.localIsGlobal = true;
            this.newBlockAndWalkChildren(ast, a);
        },
Interactive: function(ast, a)
             {
                 a.localIsGlobal = true;
                 this.newBlockAndWalkChildren(ast, a);
             },
For_: function(ast, a)
      {
          if (ast.assign.nodeName === "Name")
          {
              this.bindName(a, ast.assign.name, BIND_LOCAL);
          }
          else
          {
              throw "unhandled case in For_";
          }
          ast.walkChildren(this, a);
      },
Class_: function(ast, a)
        {
            this.bindName(a, ast.name, BIND_LOCAL);

            var acopy = shallowcopy(a);
            acopy.localIsGlobal = false;
            this.newBlockAndWalkChildren(ast, acopy);
        },
Function_: function(ast, a)
           {
               this.bindName(a, ast.name, BIND_LOCAL);
               var acopy = shallowcopy(a);
               acopy.localIsGlobal = false;
               this.newBlockAndWalkChildren(ast, acopy);

               print("HERE", ast.argnames.length, ast.argnames[0]);
               a.currentBlocks.push(ast);
               for (var i = 0; i < ast.argnames.length; ++i)
                   this.bindName(a, ast.argnames[i], BIND_ARG);
               a.currentBlocks.pop();
           },

// todo; except, as, with, import

newBlockAndWalkChildren: function(ast, a)
                         {
                             ast.nameBindings = {};
                             a.currentBlocks.push(ast);
                             //print(a.currentBlocks, a.currentBlocks.length);
                             ast.walkChildren(this, a);
                             a.currentBlocks.pop();
                         },
bindName: function(a, name, level)
          {
              if (a.localIsGlobal && level === BIND_LOCAL) level = BIND_GLOBAL;
              var end = a.currentBlocks.length - 1;
              var prev = a.currentBlocks[end].nameBindings[name];
              // allow global to override local, but not the other way around
              if (level === BIND_GLOBAL || prev === undefined)
              {
                  a.currentBlocks[end].nameBindings[name] = level;
              }
          }
};

//
// for the body of methods, renames all accesses to the 0th parameter
// (typically 'self') to be 'this' instead.
//
var hRenameAccessesToSelf = {
visit: genericVisit,
AssAttr: function(ast, a)
         {
             var origname = a.origname;
             if (ast.expr.nodeName === "Name")
             {
                 if (ast.expr.name === origname)
                     ast.expr.name = "this";
             }
             else
             {
                 print(JSON.stringify(ast.expr));
                 throw "todo;";
             }
         },
Getattr: function(ast, a)
         {
             var origname = a.origname;
             if (ast.expr.nodeName === "Name")
             {
                 if (ast.expr.name === origname)
                     ast.expr.name = "this";
             }
             else
             {
                 print(JSON.stringify(ast.expr));
                 throw "todo;";
             }
         },
Name: function(ast, a)
      {
          // todo; might be too aggressive?
          if (ast.name === a.origname) ast.name = "this";
      }
};

function shallowcopy(obj)
{
    var ret = new obj.constructor(); 
    for (var key in obj)
    {
        if (obj.hasOwnProperty(key))
        {
            ret[key] = obj[key];
        }
    }
    return ret;
}

//
// main code generation handler
//
var hMainCompile =
{
visit: genericVisit,

Stmt: function(ast, a)
      {
          for (var i = 0; i < ast.nodes.length; ++i)
          {
              this.visit(ast.nodes[i], a);
              a.o.push(";");
          }
      },
Print: function(ast, a)
       {
           var o = a.o;
           //dotrace("in print:"+ast.toString());
           for (var i = 0; i < ast.nodes.length; ++i)
           {
               o.push("sk$print(");
               this.visit(ast.nodes[i], a);
               o.push(");");
               if (i !== ast.nodes.length - 1) o.push("sk$print(' ');");
           }
           if (ast.nl)
               o.push("sk$print('\\n')");
       },

Assign: function(ast, a)
        {
            var o = a.o;
            var acopy;
            var tmp = gensym();
            o.push("var ");
            o.push(tmp);
            o.push("=");
            this.visit(ast.expr, a);
            o.push(";");
            for (var i = 0; i < ast.nodes.length; ++i)
            {
                var node = ast.nodes[i];
                if (node instanceof AssName ||
                        node instanceof Subscript ||
                        node instanceof AssAttr)
                {
                    acopy = shallowcopy(a);
                    acopy.tmp = tmp;
                    this.visit(ast.nodes[i], acopy);
                }
                // todo; this should probably be in the AssTuple handler
                else if (node instanceof AssTuple)
                {
                    o.push("sk$unpack([");
                    var names = [];
                    acopy = shallowcopy(a);
                    acopy.names = names;
                    ast.nodes[i].walkChildren(hGetTupleNames, acopy);
                    o.push("'" + names.join("','") + "'");
                    o.push("],");
                    o.push(tmp);
                    if (a.asGenerator)
                    {
                        o.push(",");
                        o.push(a.generatorStateName);
                    }
                    o.push(")");
                }
                else
                {
                    throw "todo;" + node.nodeName;
                }
                if (i !== ast.nodes.length - 1) o.push(";");
            }
        },

AssName: function(ast, a)
         {
             var o = a.o;
             var tmp = a.tmp;
             if (ast.flags === OP_ASSIGN)
             {
                 if (!tmp) throw "expecting tmp node to assign from";
                 if (a.asGenerator && a.block.nameBindings[ast.name] === BIND_LOCAL)
                 {
                     o.push(a.generatorStateName);
                     o.push(".");
                 }
                 o.push(ast.name);
                 o.push("=");
                 o.push(tmp);
             }
             else if (ast.flags === OP_DELETE)
             {
                 o.push("delete ");
                 o.push(ast.name);
             }
             else
             {
                 throw "unexpected flags";
             }
         },

Subscript: function(ast, a)
           {
               var j, k, nodes;
               var o = a.o;
               var tmp = a.tmp;

               var pushStateName = function()
               {
                   if (a.asGenerator)
                   {
                       o.push(a.generatorStateName);
                       o.push(".");
                   }
               };

               if (ast.flags === OP_ASSIGN)
               {
                   if (!tmp) throw "expecting tmp node to assign from";
                   pushStateName();
                   this.visit(ast.expr, a);
                   for (j = 0; j < ast.subs.length; ++j)
                   {
                       o.push(".__setitem__(");
                       this.visit(ast.subs[j], a);
                       o.push(",");
                       o.push(tmp);
                       o.push(")");
                   }
               }
               else if (ast.flags === OP_APPLY)
               {
                   for (j = 0; j < ast.subs.length; ++j)
                   {
                       pushStateName();
                       this.visit(ast.expr, a);
                       o.push(".__getitem__(");
                       this.visit(ast.subs[j], a);
                       o.push(")");
                   }
               }
               else if (ast.flags === OP_DELETE)
               {
                   for (j = 0; j < ast.subs.length; ++j)
                   {
                       pushStateName();
                       this.visit(ast.expr, a);
                       o.push(".__delitem__(");
                       this.visit(ast.subs[j], a);
                       o.push(")");
                   }
               }
               else
               {
                   throw "unexpected Subscript flags:" + ast.flags;
               }
           },

AssAttr: function(ast, a)
         {
             var o = a.o;
             var tmp = a.tmp;
             //print(JSON.stringify(ast.nodes, null, 2));
             if (ast.flags === OP_ASSIGN)
             {
                 if (!tmp) throw "expecting tmp node to assign from";
                 if (a.asGenerator)
                 {
                     o.push(a.generatorStateName);
                     o.push(".");
                 }
                 this.visit(ast.expr, a);
                 o.push(".__setattr__('" + ast.attrname + "',");
                 o.push(tmp);
                 o.push(")");
             }
             else
             {
                 throw "unexpected AssAttr flags:" + ast.flags;
             }
         },

Sliceobj: function(ast, a)
          {
              var o = a.o;
              //print(JSON.stringify(ast, null, 2));
              o.push("new Slice$(");
              var si = function(i) {
                  if (ast.nodes.length > i)
                  {
                      if (ast.nodes[i] === null) o.push('null');
                      else this.visit(ast.nodes[i], a);
                      if (ast.nodes.length > i + 1)
                          o.push(",");
                  }
              };
              for (var i = 0; i < 3; ++i) si.call(this, i);
              o.push(")");
          },

Getattr: function(ast, a)
         {
             var o = a.o;
             o.push("sk$ga(");
             this.visit(ast.expr, a);
             o.push(",'");
             o.push(ast.attrname);
             o.push("')");
         },

wrapAug: function(node)
         {
             if (node instanceof Getattr) return new AugGetattr(node);
             if (node instanceof Name) return new AugName(node);
             if (node instanceof Slice) return new AugSlice(node);
             if (node instanceof Subscript) return new AugSubscript(node);
             throw "assert";
         },

AugName: function(ast, a)
         {
             var tmp = a.tmp;
             var o = a.o;
             if (!tmp) throw "expecting tmp";
             if (a.augmode === 'load')
             {
                 o.push("var ");
                 o.push(tmp);
                 o.push("=");
                 this.visit(ast.node, a);
             }
             else if (a.augmode === 'store')
             {
                 this.visit(ast.node, a);
                 o.push("=");
                 o.push(tmp);
             }
             o.push(";");
         },

AugGetattr: function(ast, a)
            {
                var tmp = a.tmp;
                var o = a.o;
                if (!tmp) throw "expecting tmp";
                if (a.augmode === 'load')
                {
                    o.push("var ");
                    o.push(tmp);
                    o.push("=");
                    this.visit(ast.node, a);
                }
                else if (a.augmode === 'store')
                {
                    o.push("sk$sa(");
                    this.visit(ast.node.expr, a);
                    o.push(",'");
                    o.push(ast.node.attrname);
                    o.push("',");
                    o.push(tmp);
                    o.push(")");
                }
                o.push(";");
            },

AugSlice: function(ast, a)
          {
              throw "can't augslice yet";
          },

AugSubscript: function(ast, a)
              {
                  throw "can't augsubscript yet";
              },


AugAssign: function(ast, a)
           {
               var o = a.o;

               // 4 separate sub-cases depending on LHS:
               // Attr, Name, Slice, Subscript
               // first, use the normal compile to get the value into a tmp
               // then modify it inplace if possible
               // then use a modified compile on node to store it again.
               var augnode = this.wrapAug(ast.node);
               var acopy = shallowcopy(a);
               acopy.augmode = 'load';
               acopy.tmp = gensym();
               this.visit(augnode, acopy);

               o.push(acopy.tmp);
               o.push("=sk$inplace(");
               o.push(acopy.tmp);
               o.push(",");
               this.visit(ast.expr, a);
               o.push(",'");
               o.push(ast.op);
               o.push("');");

               acopy.augmode = 'store';
               this.visit(augnode, acopy);
           },

Tuple: function(ast, a)
       {
           var o = a.o;
           o.push("new Tuple$([");
           for (var i = 0; i < ast.nodes.length; ++i)
           {
               this.visit(ast.nodes[i], a);
               if (i !== ast.nodes.length - 1) o.push(",");
           }
           o.push("])");
       },

genSliceAtBlockBoundary: function(a)
                         {
                             if (a.asGenerator)
                             {
                                 var o = a.o;

                                 var inLoopMarker = a.generatorStateName + "." + gensym();

                                 o.push(a.locationMarkers[a.locationMarkers.length - 1]);
                                 o.push("++;}");
                                 o.push("case ");
                                 o.push(a.locationMarkerValues[a.locationMarkerValues.length - 1]++);
                                 o.push(":{");

                                 // tag the loop with a label for break/continue
                                 // save the inLoopMarker so it can be cleared too
                                 var label = gensym();
                                 a.loopLabels.push({ label: label, inLoopMarker: inLoopMarker });
                                 o.push(label);
                                 o.push(":");

                                 return inLoopMarker;
                             }
                         },

genTailOfLoop: function(a, inLoopMarker)
               {
                   if (a.asGenerator)
                   {
                       var o = a.o;
                       o.push(a.locationMarkers[a.locationMarkers.length - 1]);
                       o.push("=0;");
                       o.push(inLoopMarker);
                       o.push("=false;");

                       a.loopLabels.pop();
                   }
               },

       // todo; this doesn't work for generators
       // need to have a genSliceBeforeLoop-ish before
       // and then the body of all blocks should share the stuff that's
       // currently in the function setup
If_: function(ast, a)
     {
         //this.genSliceAtBlockBoundary(a);

         var o = a.o;
         for (var i = 0; i < ast.tests.length; i += 2)
         {
             if (i !== 0) o.push("else ");
             o.push("if(");
             this.visit(ast.tests[i], a);
             o.push("){");
             this.startGeneratorCodeBlock(a);
             this.visit(ast.tests[i + 1], a);
             this.endGeneratorCodeBlock(a);
             o.push("}");
         }
         if (ast.else_)
         {
             o.push("else{");
             this.startGeneratorCodeBlock(a);
             this.visit(ast.else_, a);
             this.endGeneratorCodeBlock(a);
             o.push("}");
         }
     },

While_: function(ast, a)
        {
            var o = a.o;

            var inLoopMarker = this.genSliceAtBlockBoundary(a);
            
            o.push("while(true){");
            //o.push("print('n',n);");
            o.push("if(!(");

            if (a.asGenerator)
            {
                o.push(inLoopMarker);
                o.push("||");
            }

            this.visit(ast.test, a);
            o.push("))break;");

            this.startGeneratorCodeBlock(a);
            if (a.asGenerator)
            {
                o.push(inLoopMarker);
                o.push("=true;");
            }

            this.visit(ast.body, a);

            this.genTailOfLoop(a, inLoopMarker);

            this.endGeneratorCodeBlock(a);

            o.push("}");
        },

For_: function(ast, a)
      {
          var o = a.o;
          var tmp = gensym();
          var tmp2 = gensym();

          if (a.asGenerator)
          {
              o.push(a.generatorStateName);
              o.push(".");
          }
          o.push(tmp);
          o.push("=(");
          this.visit(ast.list, a);
          o.push(").__iter__();");

          var inLoopMarker = this.genSliceAtBlockBoundary(a);

          o.push("while(true){");

          if (a.asGenerator)
          {
              o.push("if(!");
              o.push(inLoopMarker);
              o.push("){");
          }

          o.push("var ");
          o.push(tmp2);
          o.push("=");
          if (a.asGenerator)
          {
              o.push(a.generatorStateName);
              o.push(".");
          }
          o.push(tmp);
          o.push(".next();");

          o.push("if(");
          o.push(tmp2);
          o.push("===undefined)break;");

          this.visit(ast.assign, a);
          o.push("=");
          o.push(tmp2);
          o.push(";");

          if (a.asGenerator)
          {
              o.push("}");
          }

          this.startGeneratorCodeBlock(a);
          if (a.asGenerator)
          {
              o.push(inLoopMarker);
              o.push("=true;");
          }

          this.visit(ast.body, a);

          this.genTailOfLoop(a, inLoopMarker);

          this.endGeneratorCodeBlock(a);

          o.push("}");
      },

simpleRemapOp: {
                    "is": "===",
                    "is not": "!=="
                },
funcCallRemapOp: {
                    "in": "sk$in"
                 },
cmpCallRemapOp: {
                    "==": true,
                    "!=": true,
                    "<=": true,
                    "<": true,
                    ">=": true,
                    ">": true
                },

Compare: function(ast, a)
         {
             var o = a.o;
             if (ast.ops[0] in this.simpleRemapOp)
             {
                 this.visit(ast.expr, a);
                 o.push(this.simpleRemapOp[ast.ops[0]]);
                 this.visit(ast.ops[1], a);
             }
             else if (ast.ops[0] in this.funcCallRemapOp)
             {
                 o.push(this.funcCallRemapOp[ast.ops[0]]);
                 o.push("(");
                 this.visit(ast.expr, a);
                 o.push(",");
                 this.visit(ast.ops[1], a);
                 o.push(")");
             }
             else if (ast.ops[0] in this.cmpCallRemapOp)
             {
                 o.push("sk$cmp(");
                 this.visit(ast.expr, a);
                 o.push(",");
                 this.visit(ast.ops[1], a);
                 o.push(",'");
                 o.push(ast.ops[0]);
                 o.push("')");
             }
             // todo; multiple ops in same compare
         },

UnarySub: function(ast, a)
          {
              var o = a.o;
              o.push("sk$neg(");
              this.visit(ast.expr, a);
              o.push(")");
          },

Not: function(ast, a)
     {
         var o = a.o;
         o.push("!(");
         this.visit(ast.expr, a);
         o.push(")");
     },

Const_: function(ast, a)
        {
            var o = a.o;
            o.push("(");
            if (typeof ast.value === "string")
            {
                o.push("new Str$(");
                var v = ast.value;
                var ss = v.substring(0, 3);
                if (ss === "'''" || ss === '"""')
                {
                    v = v.replace(/\n/g, "\\n");
                    v = v.substring(3, v.length - 3);
                    if (ss === "'''") v = "'" + v.replace(/'/g, "\\'") + "'";
                    else if (ss === '"""') v = '"' + v.replace(/"/g, '\\"') + '"';
                }
                o.push(v);
                o.push(")");
            }
            else if (typeof ast.value === "number")
            {
                o.push(ast.value.toString());
            }
            else if (ast.value === null)
            {
                o.push('null');
            }
            else if (ast.value.constructor === Long$)
            {
                var tmp = gensym();
                Skulpt.consts$[tmp] = ast.value;
                if (!Skulpt.consts$[tmp]) throw "wha?";
                o.push("Skulpt.consts$." + tmp);
            }
            else
            {
                throw "todo;";
            }
            o.push(")");
        },

functionSetup: function(ast, a, inclass, islamb)
               {
                   var o = a.o;
                   var i;
                   var argstart = inclass ? 1 : 0; // todo; staticmethod
                   // lambdas are compiled as "values"
                   var asvalue = islamb || ast.name === "<genexpr>"; // todo; by name is ugly
                   var ret = undefined;

                   if (!asvalue)
                   {
                       if (inclass) o.push(a.klass + ".prototype.");
                       o.push(ast.name);
                       if (!islamb) o.push("="); 
                   }
                   else
                   {
                       ret = gensym(); // make a name that can have the argname stuff added to
                       o.push(ret);
                       o.push("=");
                   }
                   o.push("function(");
                   for (i = argstart; i < ast.argnames.length; ++i)
                   {
                       o.push(ast.argnames[i]);
                       if (i !== ast.argnames.length - 1) o.push(",");
                   }
                   o.push("){");
                   for (i = argstart; i < ast.argnames.length; ++i)
                   {
                       if (!ast.defaults[i]) continue;
                       o.push("if(");
                       o.push(ast.argnames[i]);
                       o.push("===undefined){");
                       o.push(ast.argnames[i]);
                       o.push("=");
                       this.visit(ast.defaults[i], a);
                       o.push(";}");
                   }

                   // todo; varargs, kwargs
                   return ret;
               },

makeFuncBody: function(ast, a)
              {
                  var o = a.o;
                  var inclass = a.klass !== undefined;
                  var islamb = a.islamb !== undefined;

                  var name = this.functionSetup(ast, a, inclass, islamb);
                  if (!name) name = ast.name;

                  //print("bindings", JSON.stringify(ast.nameBindings, null, 2));
                  for (var k in ast.nameBindings)
                  {
                      //print("k",k);
                      if (ast.nameBindings.hasOwnProperty(k))
                      {
                          var v = ast.nameBindings[k];
                          if (v === BIND_LOCAL)
                          {
                              o.push("var ");
                              o.push(k);
                              o.push(";");
                          }
                          else if (v === BIND_GLOBAL)
                          {
                              o.push("/* " + k + " is in func_globals */");
                          }
                      }
                  }

                  if (islamb) o.push("return(");
                  if (inclass)
                  {
                      //print("origname:",ast.argnames[0]);
                      ast.code.walkChildren(hRenameAccessesToSelf, { block: ast, o: o, origname: ast.argnames[0] });
                  }

                  var acopy = shallowcopy(a);
                  acopy.klass = undefined;
                  this.visit(ast.code, acopy);

                  if (islamb) o.push(");");
                  o.push("};");
                  if (inclass && !islamb)
                  {
                      // for direct calls to base, like Base.__init__(self, ...)
                      o.push(a.klass);
                      o.push(".");
                      o.push(name);
                      o.push("=function(){");
                      o.push(a.klass);
                      o.push(".prototype.");
                      o.push(name);
                      o.push(".apply(arguments[0],Array.prototype.slice.call(arguments,1));};");
                  }

                  // attach metadata to the function definition

                  var outputprefix = function() {
                      if (inclass)
                      {
                          o.push(a.klass);
                          o.push(".prototype.");
                      }
                      o.push(name);
                  };

                  // store global environment
                  outputprefix();
                  var tmp = gensym();
                  Skulpt.consts$[tmp] = a.module.__dict__;
                  o.push(".func_globals=Skulpt.consts$.");
                  o.push(tmp);
                  o.push(";");

                  // names of arguments to kwargs can be unpacked to the right location
                  outputprefix();
                  o.push(".argnames$=[");
                  for (var i = inclass ? 1 : 0; i < ast.argnames.length; ++i)
                  {
                      o.push("'");
                      o.push(ast.argnames[i]);
                      o.push("'");
                      if (i !== ast.argnames.length - 1) o.push(",");
                  }
                  o.push("];");
              },

startGeneratorCodeBlock: function(a)
                     {
                         if (a.asGenerator)
                         {
                             var locMarker = gensym();
                             var o = a.o;

                             a.locationMarkers.push(a.generatorStateName + "." + locMarker);
                             a.locationMarkersToBeInitialized.push(locMarker);

                             o.push("switch(");
                             o.push(a.generatorStateName);
                             o.push(".");
                             o.push(locMarker);
                             o.push("){case 0:{");
                             a.locationMarkerValues.push(1);
                         }
                     },

endGeneratorCodeBlock: function(a)
                       {
                           if (a.asGenerator)
                           {
                               var o = a.o;
                               var locMarker = a.locationMarkers.pop();

                               o.push(locMarker);
                               o.push("=0;");

                               o.push("}}");
                               a.locationMarkerValues.pop();
                               return locMarker;
                           }
                       },

compileGenerator: function(ast, a)
                  {
                      var o = a.o;
                      var i;
                      var inclass = a.klass !== undefined;
                      this.functionSetup(ast, a, inclass, false);

                      var tmp = gensym();
                      o.push("var ");
                      o.push(tmp);
                      o.push("={__iter__:function(){return ");
                      o.push(tmp);
                      o.push(";},__repr__:function(){return new Str$('<generator object ");
                      o.push(ast.name);
                      o.push(">');},");
                      o.push("next:function(){");

                      var acopy = shallowcopy(a);
                      acopy.asGenerator = true;
                      acopy.generatorStateName = tmp;
                      acopy.locationMarkers = [];
                      acopy.locationMarkersToBeInitialized = [];
                      acopy.locationMarkerValues = [];
                      acopy.loopLabels = [];
                      acopy.block = ast;

                      // todo; self accesses

                      this.startGeneratorCodeBlock(acopy);

                      this.visit(ast.code, acopy);

                      this.endGeneratorCodeBlock(acopy);

                      o.push("},");
                      for (i = 0; i < acopy.locationMarkersToBeInitialized.length; ++i)
                      {
                          o.push(acopy.locationMarkersToBeInitialized[i]);
                          o.push(":0");
                          if (i !== acopy.locationMarkersToBeInitialized.length - 1) o.push(",");
                      }

                      o.push("};return ");
                      o.push(tmp);
                      o.push(";}");

                      // todo; suffix for class methods
                  },

Function_: function(ast, a)
           {
               if (ast.isGenerator)
                   this.compileGenerator(ast, a);
               else
                   this.makeFuncBody(ast, a);
           },

Lambda: function(ast, a)
        {
            var acopy = shallowcopy(a);
            acopy.islamb = true;
            this.makeFuncBody(ast, acopy);
        },

Return_: function(ast, a)
         {
             var o = a.o;
             if (a.asGenerator)
             {
                 if (ast.value) throw new SyntaxError("'return' with argument inside generator");
                 // todo; StopIteration
                 o.push("return undefined");
             }
             else
             {
                 o.push("return ");
                 if (ast.value) this.visit(ast.value, a);
                 else o.push("null");
             }
         },

Assert: function(ast, a)
        {
            var o = a.o;
            o.push("if(!(");
            this.visit(ast.test, a);
            // todo; exceptions, etc.
            o.push("))sk$output('AssertionFailure:'+");

            // lame way of getting a string repr of the code; it's the
            // compiled version, but for basic stuff it's something at least
            var res = { o: [] };
            hMainCompile.visit(ast.test, res);
            var asStr = res.o.join("");
            asStr = '"' + asStr.replace(/"/g, '\\"') + '"';
            o.push(asStr);
            o.push(")");
        },

Yield_: function(ast, a)
        {
            var o = a.o;
            if (!a.asGenerator) throw "assert";

            // previous case is started before we get here so that the body of
            // other non-yield statements can be compiled

            o.push(a.locationMarkers[a.locationMarkers.length - 1]);
            o.push("++;");
            o.push("return ");
            if (ast.value) this.visit(ast.value, a);
            else o.push("null");
            o.push(";}"); // end of previous case
            o.push("case ");
            o.push(a.locationMarkerValues[a.locationMarkerValues.length - 1]++);
            o.push(":{");
        },

breakOrCont: function(ast, a, boc)
             {
                 var o = a.o;
                 if (a.asGenerator)
                 {
                     o.push(a.loopLabels[a.loopLabels.length - 1].inLoopMarker);
                     o.push("=false;");
                 }
                 o.push(boc);
                 if (a.asGenerator)
                 {
                     o.push(" " + a.loopLabels[a.loopLabels.length - 1].label);
                 }
             },
Break_: function(ast, a)
         {
             this.breakOrCont(ast, a, "break");
         },

Continue_: function(ast, a)
         {
             this.breakOrCont(ast, a, "continue");
         },

Discard: function(ast, a)
         {
             this.visit(ast.expr, a);
             a.o.push(";"); // needed here in case it's just a value
         },

CallFunc: function(ast, a)
          {
              // see comment in env.js about sk$call
              var o = a.o;
              var i;
              var kwargs = [];
              var posargs = [];
              for (i = 0; i < ast.args.length; ++i)
              {
                  if (ast.args[i] instanceof Keyword) kwargs.push(ast.args[i]);
                  else posargs.push(ast.args[i]);
              }
              
              o.push("sk$call(");
              this.visit(ast.node, a);

              // how do we pass kwargs?
              //
              // - we can't tell at call site how many args the function
              // wants, so we can't pad the positional args and have a list in
              // arguments.
              //
              // - we could try stuffing an extra argument into the the
              // sk$call, and have it store that into the function object
              // being called (ick). but that'd break for nested calls to the
              // same function.
              //
              // - so, we have to pass an additional first argument to all
              // functions. it seems unfortunate, but actually, the arg names
              // are part of the function signature for all methods (unrelated
              // to defaults, so it's required anyway). ie:
              //
              //     def f(x, y):
              //         print x,y
              //     f(y=5, x="dog")
              //
              // is fine.
              //
              // this also means all builtin and library functions must match
              // in argument names. seems an unfortunate part of python's
              // design.
              //
              // we do the unpack/rename in sk$call rather than
              // per-method. metadata is added to the function definition to
              // allow order modification based on kwargs being passed. 
              
              if (kwargs.length !== 0) o.push(", [");
              else o.push(", undefined");

              for (i = 0; i < kwargs.length; ++i)
              {
                  o.push("'");
                  o.push(kwargs[i].name);
                  o.push("',");
                  this.visit(kwargs[i].expr, a);
                  if (i !== kwargs.length - 1) o.push(",");
              }
              if (kwargs.length !== 0) o.push("]");

              if (posargs.length !== 0) o.push(", ");
              for (i = 0; i < posargs.length; ++i)
              {
                  this.visit(posargs[i], a);
                  if (i !== posargs.length - 1) o.push(",");
              }
              o.push(")");
          },

Name: function(ast, a)
      {
          var o = a.o;
          if (ast.name === "None") o.push("null");
          else if (ast.name === "True") o.push("true");
          else if (ast.name === "False") o.push("false");
          else
          {

              if (a.asGenerator && nb === BIND_LOCAL)
              {
                  o.push(a.generatorStateName);
                  o.push(".");
              }
              o.push("/*nb for" + ast.name + "is" + nb + "*/");
              o.push("/* " + JSON2.stringify(a.block.nameBindings) + " */");
              if (nb !== BIND_LOCAL && nb !== BIND_ARG)
                  o.push("/*stuff*/");
              o.push(ast.name);
          }
      },

Dict: function(ast, a)
      {
          var o = a.o;
          o.push("new Dict$([");
          for (var i = 0; i < ast.items.length; i += 2)
          {
              this.visit(ast.items[i], a);
              o.push(",");
              this.visit(ast.items[i + 1], a);
              if (i < ast.items.length - 2) o.push(",");
          }
          o.push("])");
      },

List: function(ast, a)
      {
          var o = a.o;
          o.push("new List$([");
          for (var i = 0; i < ast.nodes.length; ++i)
          {
              this.visit(ast.nodes[i], a);
              if (i < ast.nodes.length - 1) o.push(",");
          }
          o.push("])");
      },

compileQuals: function(quals, i, expr, tmp, a)
              {
                  var o = a.o;
                  var j;
                  o.push("sk$iter(");
                  this.visit(quals[i].list, a);
                  o.push(",function(");
                  if (!(quals[i].assign instanceof AssName)) throw "todo; non-AssName";
                  o.push(quals[i].assign.name);
                  o.push("){");
                  for (j = 0; j < quals[i].ifs.length; ++j)
                  {
                      this.visit(quals[i].ifs[j], a);
                  }
                  if (i < quals.length - 1)
                  {
                      this.compileQuals(quals, i + 1, expr, tmp, a);
                  }
                  else
                  {
                      o.push(tmp);
                      o.push(".push(");
                      this.visit(expr, a);
                      o.push(");");
                  }
                  for (j = 0; j < quals[i].ifs.length; ++j)
                      o.push("}");
                  o.push("});");
              },

ListCompIf: function(ast, a)
            {
                var o = a.o;
                //print(astDump(ast));
                o.push("if(");
                this.visit(ast.test, a);
                o.push("){");
                // the close happens in compileQuals after the other quals (fors)
            },

ListComp: function(ast, a)
          {
              var o = a.o;
              //print(JSON.stringify(ast.quals, null, 2));
              var tmp = gensym();

              // wrapper to make the whole thing an expression
              o.push("(function(){");

              // accumulator
              o.push("var ");
              o.push(tmp);
              o.push("=[];");

              // there's a list of quals (fors) and ifs on those quals
              // this is kind of complicated because our iteration needs to be
              // turned inside out too for iter: walk down the list of quals
              // so that they're nested.
              this.compileQuals(ast.quals, 0, ast.expr, tmp, a);

              // return accumulator as a pyobj
              o.push("return new List$(");
              o.push(tmp);
              o.push(");");

              // end wrapper to make whole thing an expression
              o.push("})()");
          },

GenExprTransformed: function (ast, a)
                    {
                        var o = a.o;
                        o.push("(");
                        this.visit(ast.node, a);
                        o.push(")()");
                    },

Class_: function(ast, a)
        {
            var o = a.o;
            //print(JSON.stringify(ast, null, 2));
            o.push("var " + ast.name + "=function(args,doinit){if(!(this instanceof ");
            o.push(ast.name);
            o.push(")) return new ");
            o.push(ast.name);
            // doinit is a hack to not call __init__ when we're just setting
            // up prototype chains.
            o.push("(arguments,true);if(doinit&&this.__init__!==undefined)this.__init__.apply(this, args);return this;};");
            if (ast.bases === null || ast.bases.length === 0)
                o.push(ast.name + ".prototype=new object();");
            else
            {
                if (ast.bases.length > 1) throw "todo; multiple bases";
                o.push(ast.name + ".prototype=new ");
                this.visit(ast.bases[0], a);
                o.push("();");
            }
            // todo; __module__ should only be in class I think, and then the
            // instance chains back up to to the class
            o.push(ast.name + ".__class__=sk$TypeType;");
            o.push(ast.name + ".__name__='" + ast.name + "';");
            o.push(ast.name + ".__module__='" + a.module.__name__ + "';");
            o.push(ast.name + ".__repr__=function(){return new Str$(\"<class '__main__." + ast.name + "'>\");};");
            o.push(ast.name + ".prototype.__module__='" + a.module.__name__ + "';");
            o.push(ast.name + ".prototype.__class__=" + ast.name +";");
            for (var i = 0; i < ast.code.nodes.length; ++i)
            {
                var acopy = shallowcopy(a);
                acopy.klass = ast.name;
                this.visit(ast.code.nodes[i], acopy);
            }
            o.push("undefined"); // no return in repl
        },

Module: function(ast, a)
        {
            var acopy = shallowcopy(a);
            acopy.block = ast;
            this.visit(ast.node, acopy);
        },

Import_: function(ast, a)
         {
             var o = a.o;
             var tmp = gensym();
             o.push("var ");
             o.push(tmp);
             o.push("=sk$import('");
             o.push(ast.names[0][0]); // todo; dotted, etc
             o.push("')");
         },

Add: function(ast, a) { this.binopfunc(ast, a, "+"); },
Sub: function(ast, a) { this.binopfunc(ast, a, "-"); },
Mul: function(ast, a) { this.binopfunc(ast, a, "*"); },
Div: function(ast, a) { this.binopfunc(ast, a, "/"); },
FloorDiv: function(ast, a) { this.binopfunc(ast, a, "//"); },
Mod: function(ast, a) { this.binopfunc(ast, a, "%"); },
Power: function(ast, a) { this.binopfunc(ast, a, "**"); },
LeftShift: function(ast, a) { this.binopfunc(ast, a, "<<"); },
RightShift: function(ast, a) { this.binopfunc(ast, a, ">>"); },

binopfunc: function(ast, a, opstr)
       {
           var o = a.o;
           o.push("sk$binop(");
           this.visit(ast.left, a);
           o.push(",");
           this.visit(ast.right, a);
           o.push(",'");
           o.push(opstr);
           o.push("'");
           o.push(")");
       },

// have to be ops to short circuit, todo; need a __nonzero__ or something here
Or: function(ast, a) { this.binopop(ast, a, "||"); },
And: function(ast, a) { this.binopop(ast, a, "&&"); },
Bitor: function(ast, a) { this.binopop(ast, a, "|"); },
Bitxor: function(ast, a) { this.binopop(ast, a, "^"); },
Bitand: function(ast, a) { this.binopop(ast, a, "&"); },

binopop: function(ast, a, opstr)
         {
             for (var i = 0; i < ast.nodes.length; ++i)
             {
                 this.visit(ast.nodes[i], a);
                 if (i !== ast.nodes.length - 1) a.o.push(opstr);
             }
         }
};


function compile(ast, module)
{
    //print(astDump(ast));
    hConvertGeneratorExpressionsToFunctions.visit(ast, {});
    hMarkGeneratorFunctions.visit(ast, {});
    hAnnotateBlocksWithBindings.visit(ast, { currentBlocks: [] });
    hMakeNoReturnANull.visit(ast, {});
    var result = [];
    hMainCompile.visit(ast, { o: result, module: module });
    return result.join(""); 
}

