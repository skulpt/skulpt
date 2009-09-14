//
// Helpers for walkers
//
function genericVisit(ast, args)
{
    //dotrace("in generic visit:"+this+","+ast+","+(args.o ? args.o.toString() : "null")+","+argrest);
    if (!ast) return undefined;
    if (args === undefined) throw "no args";
    //if (args.o === undefined) throw "no output buffer";
    //dotrace("name:"+ ast.nodeName);
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
var globalObject = this;
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
               ast.code.walkChildren(this, { func: ast });
           },
Yield_: function(ast, a)
{
    a.func.isGenerator = true;
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
               if (ast.isGenerator)
               {
                   // we don't want
                   return;
               }

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
// declares all locals in a function, excluding func args or globals
//
var hDeclareLocals = {
visit: genericVisit,
Assign: function(ast, a)
        {
            var o = a.o;
            var func = a.func;
            var globals = [];
            var i, j;

            func.walkChildren(hFindGlobals, globals);

            //print(JSON.stringify(ast.nodes, null, 2));

            var names = [];
            // todo; there's duplicates here
            for (i = 0; i < ast.nodes.length; ++i)
            {
                var node = ast.nodes[i];
                if (node instanceof AssName)
                {
                    names.push(node.name);
                }
                else if (node instanceof AssAttr)
                {
                    if (node.expr.name === undefined) throw "assert";
                    names.push(node.expr.name);
                }
                else
                {
                    throw "unhandled case in hDeclareLocals";
                }
            }
            // todo; should probably walk expr?

            for (i = 0; i < names.length; ++i)
            {
                if (!appearsIn(names[i], func.argnames)
                        && !appearsIn(names[i], globals))
                {
                    o.push("var ");
                    o.push(names[i]);
                    o.push(";");
                }
            }

        }
};

//
// rename locals in a generator to be attribute accesses on $genstate rather
// than direct accesses so they're saved across invocations.
//
var hRenameGeneratorLocals = {
visit: genericVisit,
Assign: function(ast, a)
        {
            var func = a.func;
            var globals = [];
            var i, j;

            func.walkChildren(hFindGlobals, globals);

            //print("nodes",JSON.stringify(ast.nodes, null, 2));
            //print("expr",JSON.stringify(ast.expr, null, 2));

            var newexpr = this.visit(ast.expr, a);
            if (newexpr !== undefined) ast.expr = newexpr;

            //print("exprafter",JSON.stringify(ast.expr, null, 2));

            var names = [];
            for (i = 0; i < ast.nodes.length; ++i)
            {
                var node = ast.nodes[i];
                if (node instanceof AssName)
                {
                    if (!appearsIn(node.name, func.argnames)
                            && !appearsIn(node.name, globals))
                    {
                        ast.nodes[i] = new GenAss(a.generatorStateName, node.name);
                    }
                }
                else
                {
                    throw "unhandled case in hRenameGeneratorLocals";
                }
            }
        },
Name: function(ast, a)
      {
          var func = a.func;
          var globals = [];

          // todo; this is both ugly and wrong
          var predefs = [
              "abs",
              "chr",
              "dir",
              "hash",
              "len",
              "max",
              "min",
              "ord",
              "range",
              "repr",
              "slice",
              "str",
              "type"
              ];

          func.walkChildren(hFindGlobals, globals);
          if (!appearsIn(ast.name, func.argnames)
                  && !appearsIn(ast.name, globals)
                  && !appearsIn(ast.name, predefs))
          {
              return new GenGet(a.generatorStateName, ast.name);
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
                var type = ast.nodes[i].nodeName;
                if (type === "AssName")
                {
                    if (ast.nodes[i].flags === "OP_ASSIGN")
                    {
                        o.push(ast.nodes[i].name);
                        o.push("=");
                        o.push(tmp);
                    }
                    else
                    {
                        throw "unexpected flags";
                    }
                }
                else if (type === "Subscript" || type === "AssAttr" || type === "GenAss")
                {
                    acopy = shallowcopy(a);
                    acopy.tmp = tmp;
                    this.visit(ast.nodes[i], acopy);
                }
                else if (type === "AssTuple")
                {
                    if (a.asGenerator) throw "probably doesn't work in generator";
                    o.push("sk$unpack([");
                    var names = [];
                    acopy = shallowcopy(a);
                    acopy.names = names;
                    ast.nodes[i].walkChildren(hGetTupleNames, acopy);
                    o.push("'" + names.join("','") + "'");
                    o.push("],");
                    o.push(tmp);
                    o.push(")");
                }
                else
                {
                    throw "todo;" + type;
                }
                if (i !== ast.nodes.length - 1) o.push(";");
            }
        },

AssName: function(ast, a)
         {
             var o = a.o;
             if (ast.flags === "OP_DELETE")
             {
                 o.push("delete ");
                 o.push(ast.name);
             }
         },

Subscript: function(ast, a)
           {
               var j, k, nodes;
               var o = a.o;
               var tmp = a.tmp;

               if (ast.flags === OP_ASSIGN)
               {
                   if (!tmp) throw "expecting tmp node to assign from";
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

GenAss: function(ast, a)
        {
            var o = a.o;
            var tmp = a.tmp;

            if (!tmp) throw "expecting tmp node to assign from";
            o.push(ast.genstate);
            o.push(".");
            o.push(ast.name);
            o.push("=");
            o.push(tmp);
            o.push(";");
        },

GenGet: function(ast, a)
        {
            var o = a.o;
            o.push(ast.genstate);
            o.push(".");
            o.push(ast.name);
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

AugAssign: function(ast, a)
           {
               this.visit(ast.node, a);
               a.o.push(ast.op); // todo; rename to js version
               this.visit(ast.expr, a);
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

If_: function(ast, a)
     {
         var o = a.o;
         for (var i = 0; i < ast.tests.length; ++i)
         {
             if (i !== 0) o.push("else ");
             o.push("if(");
             this.visit(ast.tests[i][0], a);
             o.push("){");
             this.visit(ast.tests[i][1], a);
             o.push("}");
         }
         if (ast.else_)
         {
             o.push("else{");
             this.visit(ast.else_, a);
             o.push("}");
         }
     },

genSliceBeforeLoop: function(a)
                    {
                        if (a.asGenerator)
                        {
                            var o = a.o;
                            o.push(a.generatorStateName);
                            o.push(".");
                            o.push(a.curLocationMarker);
                            o.push("++;}");
                            o.push("\ncase ");
                            o.push(a.curLocationMarkerValue++);
                            o.push(":{\n");
                        }
                    },

genHeadOfLoop: function(a, inLoopMarker)
               {
                   if (a.asGenerator)
                   {
                       var o = a.o;
                       var locMarker = gensym();
                       var acopy = shallowcopy(a);
                       acopy.locationMarkers.push(locMarker);
                       acopy.curLocationMarker = locMarker;

                       o.push("switch(");
                       o.push(a.generatorStateName);
                       o.push(".");
                       o.push(locMarker);
                       o.push("){\ncase 0:{\n");
                       acopy.curLocationMarkerValue = 1;

                       o.push(inLoopMarker);
                       o.push("=true;");
                       return [ locMarker, acopy ];
                   }
                   return [ undefined, a ];
               },

genTailOfLoop: function(a, locMarker, inLoopMarker)
               {
                   if (a.asGenerator)
                   {
                       var o = a.o;
                       o.push(a.generatorStateName);
                       o.push(".");
                       o.push(locMarker);
                       o.push("=0;");
                       o.push(inLoopMarker);
                       o.push("=false;}}");
                   }
               },

While_: function(ast, a)
        {
            var o = a.o;

            this.genSliceBeforeLoop(a);
            
            o.push("while(true){");
            //o.push("print('n',n);");
            o.push("if(!(");

            if (a.asGenerator)
            {
                var inLoopMarker = a.generatorStateName + "." + gensym();
                o.push(inLoopMarker);
                o.push("||");
            }

            this.visit(ast.test, a);
            o.push("))break;");

            var ret = this.genHeadOfLoop(a, inLoopMarker);
            var locMarker = ret[0]; a = ret[1];

            this.visit(ast.body, a);

            this.genTailOfLoop(a, locMarker, inLoopMarker);

            o.push("}");
        },

For_: function(ast, a)
      {
          var o = a.o;
          var tmp = gensym();
          var tmp2 = gensym();

          o.push(tmp);              // todo; this is a local that needs to go into state
          o.push("=(");
          this.visit(ast.list, a);
          o.push(").__iter__();");

          this.genSliceBeforeLoop(a);

          o.push("while(true){");

          if (a.asGenerator)
          {
              var inLoopMarker = a.generatorStateName + "." + gensym();
              o.push("if(!");
              o.push(inLoopMarker);
              o.push("){");
          }

          o.push("var ");
          o.push(tmp2);
          o.push("=");
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

          var ret = this.genHeadOfLoop(a, inLoopMarker);
          var locMarker = ret[0]; a = ret[1];

          this.visit(ast.body, a);

          this.genTailOfLoop(a, locMarker, inLoopMarker);

          o.push("}");
      },

Or: function(ast, a) { this.binopop(ast, a, "||"); },
And: function(ast, a) { this.binopop(ast, a, "&&"); },
Bitor: function(ast, a) { this.binopop(ast, a, "|"); },
Bitxor: function(ast, a) { this.binopop(ast, a, "^"); },
Bitand: function(ast, a) { this.binopop(ast, a, "&"); },

simpleRemapOp: {
                    "==": "==",
                    "!=": "!=",
                    "<=": "<=",
                    "<": "<",
                    ">=": ">=",
                    ">": ">",
                    "is": "===",
                    "is not": "!=="
                },

Compare: function(ast, a)
         {
             var o = a.o;
             if (ast.ops[0][0] in this.simpleRemapOp)
             {
                 this.visit(ast.expr, a);
                 o.push(this.simpleRemapOp[ast.ops[0][0]]);
                 this.visit(ast.ops[0][1], a);
             }
             else if (ast.ops[0][0] === "in")
             {
                 o.push("sk$in(");
                 this.visit(ast.expr, a);
                 o.push(",");
                 this.visit(ast.ops[0][1], a);
                 o.push(")");
             }
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
                o.push(ast.value);
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
                // todo; lame way of "saving" the object between compiler/runtime envs
                var tmp = gensym();
                globalObject[tmp] = ast.value;
                o.push(tmp);
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

                   if (inclass) o.push(a.klass + ".prototype.");

                   o.push(ast.name); // todo; safeize?
                   if (!islamb) o.push("="); // lambdas are compiled as "values"
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
                       o.push(ast.argnames[i]); // todo; safeize
                       o.push("===undefined){");
                       o.push(ast.argnames[i]);
                       o.push("=");
                       this.visit(ast.defaults[i], a);
                       o.push(";}");
                   }

                   // todo; varargs, kwargs
               },

makeFuncBody: function(ast, a)
              {
                  var o = a.o;
                  var inclass = a.klass !== undefined;
                  var islamb = a.islamb !== undefined;

                  this.functionSetup(ast, a, inclass, islamb);

                  ast.code.walkChildren(hDeclareLocals, { func: ast, o: o });
                  if (islamb) o.push("return(");
                  if (inclass)
                  {
                      ast.code.walkChildren(hRenameAccessesToSelf, { func: ast, o: o, origname: ast.argnames[0] });
                  }
                  this.visit(ast.code, a);
                  if (islamb) o.push(");");
                  o.push("};");
                  if (inclass)
                  {
                      // for direct calls to base, like Base.__init__(self, ...)
                      o.push(a.klass);
                      o.push(".");
                      o.push(ast.name);
                      o.push("=function(){");
                      o.push(a.klass);
                      o.push(".prototype.");
                      o.push(ast.name);
                      o.push(".apply(arguments[0],Array.prototype.slice.call(arguments,1));};");
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
                      o.push("={\n__iter__:function(){return ");
                      o.push(tmp);
                      o.push(";},\n__repr__:function(){return new Str$('<generator object ");
                      o.push(ast.name);
                      o.push(">');},");
                      o.push("\nnext:function(){\n");

                      var acopy = shallowcopy(a);
                      acopy.asGenerator = true;
                      acopy.generatorStateName = tmp;
                      var outerLocationMarker = "loc__";//todo; + gensym();
                      acopy.locationMarkers = [ outerLocationMarker ];
                      acopy.curLocationMarker = outerLocationMarker;
                      acopy.func = ast;

                      ast.code.walkChildren(hRenameGeneratorLocals, acopy);

                      // todo; self accesses

                      o.push("switch(");
                      o.push(tmp);
                      o.push(".");
                      o.push(outerLocationMarker);
                      o.push("){\ncase 0:{\n");
                      acopy.curLocationMarkerValue = 1;
                      this.visit(ast.code, acopy);
                      o.push("}}");

                      o.push("},\n");
                      for (i = 0; i < acopy.locationMarkers.length; ++i)
                      {
                          o.push(acopy.locationMarkers[i]);
                          o.push(":0");
                          if (i !== acopy.locationMarkers.length - 1) o.push(",\n");
                      }
                      o.push("};\nreturn ");
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
             o.push("return ");
             if (ast.value) this.visit(ast.value, a);
             else o.push("null");
         },

Yield_: function(ast, a)
        {
            var o = a.o;
            if (!a.asGenerator) throw "assert";

            // previous case is started before we get here so that the body of
            // other non-yield statements can be compiled

            o.push(a.generatorStateName);
            o.push(".");
            o.push(a.curLocationMarker);
            o.push("++;");
            o.push("return ");
            if (ast.value) this.visit(ast.value, a);
            else o.push("null");
            o.push(";}"); // end of previous case
            o.push("\ncase ");
            o.push(a.curLocationMarkerValue++);
            o.push(":{\n");
        },

Break_: function(ast, a)
         {
             a.o.push("break");
         },

Continue_: function(ast, a)
         {
             a.o.push("continue");
         },

Discard: function(ast, a)
         {
             this.visit(ast.expr, a);
         },

CallFunc: function(ast, a)
          {
              // see comment in env.js about sk$call
              var o = a.o;
              o.push("sk$call(");
              this.visit(ast.node, a);
              if (ast.args.length !== 0) o.push(", ");
              for (var i = 0; i < ast.args.length; ++i)
              {
                  this.visit(ast.args[i], a);
                  if (i !== ast.args.length - 1) o.push(",");
              }
              o.push(")");
          },

Name: function(ast, a)
      {
          var o = a.o;
          if (ast.name === "None") o.push("null");
          else if (ast.name === "True") o.push("true");
          else if (ast.name === "False") o.push("false");
          else o.push(ast.name);
      },

Dict: function(ast, a)
      {
          var o = a.o;
          o.push("new Dict$([");
          for (var i = 0; i < ast.items.length; ++i)
          {
              this.visit(ast.items[i][0], a);
              o.push(",");
              this.visit(ast.items[i][1], a);
              if (i < ast.items.length - 1) o.push(",");
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
                o.push(ast.name + ".prototype=new object();\n");
            else
            {
                if (ast.bases.length > 1) throw "todo; multiple bases";
                o.push(ast.name + ".prototype=new ");
                this.visit(ast.bases[0], a);
                o.push("();");
            }
            o.push(ast.name + ".__class__=sk$TypeType;");
            o.push(ast.name + ".__name__='" + ast.name + "';");
            o.push(ast.name + ".__repr__=function(){return new Str$(\"<class '__main__." + ast.name + "'>\");};");
            o.push(ast.name + ".prototype.__class__=" + ast.name +";");
            for (var i = 0; i < ast.code.nodes.length; ++i)
            {
                var acopy = shallowcopy(a);
                acopy.klass = ast.name;
                this.visit(ast.code.nodes[i], acopy);
                o.push("\n");
            }
            o.push("undefined"); // no return in repl
        },

Add: function(ast, a) { this.binopfunc(ast, a, "sk$add"); },
Sub: function(ast, a) { this.binopfunc(ast, a, "sk$sub"); },
Mul: function(ast, a) { this.binopfunc(ast, a, "sk$mul"); },
Div: function(ast, a) { this.binopfunc(ast, a, "sk$truediv"); },
Mod: function(ast, a) { this.binopfunc(ast, a, "sk$mod"); },
Power: function(ast, a) { this.binopfunc(ast, a, "sk$pow"); },
In_: function(ast, a) { this.binopfunc(ast, a, "sk$in"); },

binopfunc: function(ast, a, opstr)
       {
           var o = a.o;
           o.push(opstr);
           o.push("(");
           this.visit(ast.left, a);
           o.push(",");
           this.visit(ast.right, a);
           o.push(")");
       },
binopop: function(ast, a, opstr)
         {
             for (var i = 0; i < ast.nodes.length; ++i)
             {
                 this.visit(ast.nodes[i], a);
                 if (i !== ast.nodes.length - 1) a.o.push(opstr);
             }
         }
};


function compile(ast)
{
    var result = [];
    ast.walkChildren(hMarkGeneratorFunctions, {});
    ast.walkChildren(hMakeNoReturnANull, {});
    ast.walkChildren(hMainCompile, {o:result});
    return result.join(""); 
}

