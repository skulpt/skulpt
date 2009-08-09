//
// Helpers for walkers
//
function genericVisit(ast, o, argrest)
{
    //dotrace("in generic visit:"+this+","+ast+","+(o ? o.toString() : "null")+","+argrest);
    if (!ast) return undefined;
    if (o === undefined) throw "no output buffer";
    //dotrace("name:"+ ast.nodeName);
    if (ast.nodeName in this)
    {
        this[ast.nodeName].call(this, ast, o, argrest);
    }
    else if (ast.walkChildren)
    {
        ast.walkChildren(this, o);
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
// modify all functions that fall off the end to explicitly return None (to
// handle null vs undefined in js).
//
var hMakeNoReturnANull = {
visit: genericVisit,
Function_: function(ast, o)
           {
               if (ast.code.nodes.length === 0 ||
                       !(ast.code.nodes[ast.code.nodes.length - 1] instanceof Return_))
               {
                   ast.code.nodes.push(new Return_(null));
               }
               // handle nested functions
               this.visit(ast.code, o);
           }
};


//
// walks a lhs that's a tuple unpack and verifies and returns all the names in
// the nested binops
//
var hGetTupleNames = {
visit: genericVisit,
AssName: function(ast, names)
         {
             names.push(ast.name);
         }
};

//
// walks a function body and notes all names that are declared global
//
var hFindGlobals = {
visit: genericVisit,
Global: function(ast, o)
        {
            for (var i = 0; i < ast.names.length; ++i)
                o.push(ast.names[i]);
        }
};

//
// declares all locals in a function, excluding func args or globals
//
var hDeclareLocals = {
visit: genericVisit,
Assign: function(ast, args)
        {
            var o = args.o;
            var func = args.func;
            var globals = [];
            var i, j;

            func.walkChildren(hFindGlobals, globals);

            var names = [];
            for (i = 0; i < ast.nodes.length; ++i)
            {
                var node = ast.nodes[i];
                if (node instanceof AssName)
                {
                    names.push(node.name);
                }
                else
                {
                    throw "unhandled case in hDeclareLocals";
                }
            }

            for (i = 0; i < names.length; ++i)
            {
                var ok = true;
                for (j = 0; j < func.argnames.length && ok; ++j)
                {
                    if (func.argnames[j] === names[i])
                        ok = false;
                }
                for (j = 0; j < globals.length && ok; ++j)
                {
                    if (globals[j] === names[i])
                        ok = false;
                }

                if (ok)
                {
                    o.push("var ");
                    o.push(names[i]);
                    o.push(";");
                }
            }

        }
};


//
// main code generation handler
//
var hMainCompile =
{
visit: genericVisit,

Stmt: function(ast, o)
      {
          for (var i = 0; i < ast.nodes.length; ++i)
          {
              this.visit(ast.nodes[i], o);
              o.push(";");
          }
      },
Print: function(ast, o)
       {
           //dotrace("in print:"+ast.toString());
           for (var i = 0; i < ast.nodes.length; ++i)
           {
               o.push("sk$print(");
               this.visit(ast.nodes[i], o);
               o.push(");");
               if (i !== ast.nodes.length - 1) o.push("sk$print(' ');");
           }
           if (ast.nl)
               o.push("sk$print('\\n')");
       },

Assign: function(ast, o)
        {
            var tmp = gensym();
            o.push("var ");
            o.push(tmp);
            o.push("=");
            this.visit(ast.expr, o);
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
                else if (type === "Subscript")
                {
                    this.visit(ast.nodes[i], o, tmp);
                }
                else if (type === "AssTuple")
                {
                    o.push("sk$unpack([");
                    var names = [];
                    ast.nodes[i].walkChildren(hGetTupleNames, names);
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

AssName: function(ast, o)
         {
             if (ast.flags === "OP_DELETE")
             {
                 o.push("delete ");
                 o.push(ast.name);
             }
         },

Subscript: function(ast, o, tmp)
           {
               var j, k, nodes;

               if (ast.flags === OP_ASSIGN)
               {
                   if (!tmp) throw "expecting tmp node to assign from";
                   this.visit(ast.expr, o);
                   for (j = 0; j < ast.subs.length; ++j)
                   {
                       o.push(".__setitem__(");
                       this.visit(ast.subs[j], o);
                       o.push(",");
                       o.push(tmp);
                       o.push(")");
                   }
               }
               else if (ast.flags === OP_APPLY)
               {
                   for (j = 0; j < ast.subs.length; ++j)
                   {
                       this.visit(ast.expr, o);
                       o.push(".__getitem__(");
                       this.visit(ast.subs[j], o);
                       o.push(")");
                   }
               }
               else if (ast.flags === OP_DELETE)
               {
                   for (j = 0; j < ast.subs.length; ++j)
                   {
                       this.visit(ast.expr, o);
                       o.push(".__delitem__(");
                       this.visit(ast.subs[j], o);
                       o.push(")");
                   }
               }
               else
               {
                   throw "unexpected Subscript flags:" + ast.flags;
               }
           },

Sliceobj: function(ast, o)
          {
              //print(JSON.stringify(ast, null, 2));
              o.push("new Slice$(");
              var si = function(i) {
                  if (ast.nodes.length > i)
                  {
                      if (ast.nodes[i] === null) o.push('null');
                      else this.visit(ast.nodes[i], o);
                      if (ast.nodes.length > i + 1)
                          o.push(",");
                  }
              };
              for (var i = 0; i < 3; ++i) si.call(this, i);
              o.push(")");
          },

Getattr: function(ast, o)
         {
             this.visit(ast.expr, o);
             o.push(".");
             o.push(ast.attrname);
         },

AugAssign: function(ast, o)
           {
               this.visit(ast.node, o);
               o.push(ast.op); // todo; rename to js version
               this.visit(ast.expr, o);
           },

Tuple: function(ast, o)
       {
           o.push("new Tuple$([");
           for (var i = 0; i < ast.nodes.length; ++i)
           {
               this.visit(ast.nodes[i], o);
               if (i !== ast.nodes.length - 1) o.push(",");
           }
           o.push("])");
       },

If_: function(ast, o)
     {
         for (var i = 0; i < ast.tests.length; ++i)
         {
             if (i !== 0) o.push("else ");
             o.push("if(");
             this.visit(ast.tests[i][0], o);
             o.push("){");
             this.visit(ast.tests[i][1], o);
             o.push("}");
         }
         if (ast.else_)
         {
             o.push("else{");
             this.visit(ast.else_, o);
             o.push("}");
         }
     },

While_: function(ast, o)
        {
            o.push("while(");
            this.visit(ast.test, o);
            o.push("){");
            this.visit(ast.body, o);
            o.push("}");
        },

For_: function(ast, o)
      {
          o.push("sk$iter(");
          this.visit(ast.list, o);
          o.push(", function(");
          this.visit(ast.assign, o);
          o.push("){");
          this.visit(ast.body, o);
          o.push("})");
      },

Or: function(ast, o)
    {
        for (var i = 0; i < ast.nodes.length; ++i)
        {
            this.visit(ast.nodes[i], o);
            if (i !== ast.nodes.length - 1) o.push("||");
        }
    },

And: function(ast, o)
    {
        for (var i = 0; i < ast.nodes.length; ++i)
        {
            this.visit(ast.nodes[i], o);
            if (i !== ast.nodes.length - 1) o.push("&&");
        }
    },

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

Compare: function(ast, o)
         {
             if (ast.ops[0][0] in this.simpleRemapOp)
             {
                 this.visit(ast.expr, o);
                 o.push(this.simpleRemapOp[ast.ops[0][0]]);
                 this.visit(ast.ops[0][1], o);
             }
             else if (ast.ops[0][0] === "in")
             {
                 o.push("sk$in(");
                 this.visit(ast.expr, o);
                 o.push(",");
                 this.visit(ast.ops[0][1], o);
                 o.push(")");
             }
         },

UnarySub: function(ast, o)
          {
              o.push("-");
              this.visit(ast.expr, o);
          },

Not: function(ast, o)
     {
         o.push("!(");
         this.visit(ast.expr, o);
         o.push(")");
     },

Const_: function(ast, o)
        {
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
            else
            {
                throw "todo;";
            }
            o.push(")");
        },

Function_: function(ast, o)
           {
               var i;
               o.push("function ");
               o.push(ast.name); // todo; safeize?
               o.push("(");
               for (i = 0; i < ast.argnames.length; ++i)
               {
                   o.push(ast.argnames[i]);
                   if (i !== ast.argnames.length - 1) o.push(",");
               }
               o.push("){");
               for (i = 0; i < ast.argnames.length; ++i)
               {
                   if (!ast.defaults[i]) continue;
                   o.push("if(");
                   o.push(ast.argnames[i]); // todo; safeize
                   o.push("===undefined){");
                   o.push(ast.argnames[i]);
                   o.push("=");
                   this.visit(ast.defaults[i], o);
                   o.push(";}");
               }
               // todo; varargs, kwargs
               ast.code.walkChildren(hDeclareLocals, { func: ast, o: o });
               this.visit(ast.code, o);
               o.push("}");
           },

Return_: function(ast, o)
         {
             o.push("return ");
             if (ast.value) this.visit(ast.value, o);
             else o.push("null");
         },

Break_: function(ast, o)
         {
             o.push("break");
         },

Continue_: function(ast, o)
         {
             o.push("continue");
         },

Discard: function(ast, o)
         {
             this.visit(ast.expr, o);
         },

CallFunc: function(ast, o)
          {
              o.push("(");
              this.visit(ast.node, o);
              o.push(")(");
              for (var i = 0; i < ast.args.length; ++i)
              {
                  this.visit(ast.args[i], o);
                  if (i !== ast.args.length - 1) o.push(",");
              }
              o.push(")");
          },

Name: function(ast, o)
      {
          if (ast.name === "None") o.push("null");
          else if (ast.name === "True") o.push("true");
          else if (ast.name === "False") o.push("false");
          else o.push(ast.name);
      },

Dict: function(ast, o)
      {
          o.push("new Dict$([");
          for (var i = 0; i < ast.items.length; ++i)
          {
              this.visit(ast.items[i][0], o);
              o.push(",");
              this.visit(ast.items[i][1], o);
              if (i < ast.items.length - 1) o.push(",");
          }
          o.push("])");
      },

List: function(ast, o)
      {
          o.push("new List$([");
          for (var i = 0; i < ast.nodes.length; ++i)
          {
              this.visit(ast.nodes[i], o);
              if (i < ast.nodes.length - 1) o.push(",");
          }
          o.push("])");
      },

compileQuals: function(quals, i, expr, tmp, o)
              {
                  var j;
                  o.push("sk$iter(");
                  this.visit(quals[i].list, o);
                  o.push(",function(");
                  if (!(quals[i].assign instanceof AssName)) throw "todo; non-AssName";
                  o.push(quals[i].assign.name);
                  o.push("){");
                  for (j = 0; j < quals[i].ifs.length; ++j)
                  {
                      this.visit(quals[i].ifs[j], o);
                  }
                  if (i < quals.length - 1)
                  {
                      this.compileQuals(quals, i + 1, expr, tmp, o);
                  }
                  else
                  {
                      o.push(tmp);
                      o.push(".push(");
                      this.visit(expr, o);
                      o.push(");");
                  }
                  for (j = 0; j < quals[i].ifs.length; ++j)
                      o.push("}");
                  o.push("});");
              },

ListCompIf: function(ast, o)
            {
                //print(astDump(ast));
                o.push("if(");
                this.visit(ast.test, o);
                o.push("){");
                // the close happens in compileQuals after the other quals (fors)
            },

ListComp: function(ast, o)
          {
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
              this.compileQuals(ast.quals, 0, ast.expr, tmp, o);

              // return accumulator as a pyobj
              o.push("return new List$(");
              o.push(tmp);
              o.push(");");

              // end wrapper to make whole thing an expression
              o.push("})()");
          },

Add: function(ast, o) { this.binopfunc(ast, o, "sk$add"); },
Sub: function(ast, o) { this.binopfunc(ast, o, "sk$sub"); },
Mul: function(ast, o) { this.binopfunc(ast, o, "sk$mul"); },
Div: function(ast, o) { this.binopfunc(ast, o, "sk$truediv"); },
Mod: function(ast, o) { this.binopfunc(ast, o, "sk$mod"); },
Power: function(ast, o) { this.binopfunc(ast, o, "sk$pow"); },
In_: function(ast, o) { this.binopfunc(ast, o, "sk$in"); },

binopfunc: function(ast, o, opstr)
       {
           o.push(opstr);
           o.push("(");
           this.visit(ast.left, o);
           o.push(",");
           this.visit(ast.right, o);
           o.push(")");
       }
};


function compile(ast)
{
    var result = [];
    ast.walkChildren(hMakeNoReturnANull, null);
    ast.walkChildren(hMainCompile, result);
    return result.join(""); 
}

