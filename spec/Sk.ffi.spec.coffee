describe "Sk.ffi", ->

  beforeEach () ->
    Sk.currLineNo = 12345

  describe "err", ->

    it "argument.mustHaveType when Sk.currLineNo is defined.", ->
      expect(Sk.ffi.err.argument("x").mustHaveType("T").toString()).toBe "TypeError: x must be a T on line #{Sk.currLineNo}"

    it "argument.mustHaveType when Sk.currLineNo is zero.", ->
      Sk.currLineNo = 0
      expect(Sk.ffi.err.argument("x").mustHaveType("T").toString()).toBe "TypeError: x must be a T on line <unknown>"

    it "argument.inFunction.mustHaveType when Sk.currLineNo is defined.", ->
      expect(Sk.ffi.err.argument("x").inFunction('foo').mustHaveType("T").toString()).toBe "TypeError: Expecting argument 'x' in function 'foo' to have type 'T'. on line #{Sk.currLineNo}"

    it "argument.inFunction.mustHaveType when Sk.currLineNo is zero.", ->
      Sk.currLineNo = 0
      expect(Sk.ffi.err.argument("x").inFunction('foo').mustHaveType("T").toString()).toBe "TypeError: Expecting argument 'x' in function 'foo' to have type 'T'. on line <unknown>"

    it "argument.mustHaveType when Sk.currLineNo is defined.", ->
      expect(Sk.ffi.err.argument("x").mustHaveType("T").toString()).toBe "TypeError: x must be a T on line #{Sk.currLineNo}"

    it "argument.mustHaveType when Sk.currLineNo is zero.", ->
      Sk.currLineNo = 0
      expect(Sk.ffi.err.argument("x").mustHaveType("T").toString()).toBe "TypeError: x must be a T on line <unknown>"

  describe "bool", ->
    it "getType True => PyType.BOOL", -> expect(Sk.ffi.getType Sk.ffi.bool.True).toBe Sk.ffi.PyType.BOOL
    it "remapToJs True => true", -> expect(Sk.ffi.remapToJs Sk.ffi.bool.True).toBe true
    it "typeName True => 'bool'", -> expect(Sk.ffi.typeName Sk.ffi.bool.True).toBe 'bool'
    it "getType False => PyType.BOOL", -> expect(Sk.ffi.getType Sk.ffi.bool.False).toBe Sk.ffi.PyType.BOOL
    it "remapToJs False => false", -> expect(Sk.ffi.remapToJs Sk.ffi.bool.False).toBe false
    it "typeName False => 'bool'", -> expect(Sk.ffi.typeName Sk.ffi.bool.False).toBe 'bool'

  describe "none", ->
    it "getType None => PyType.NONE", -> expect(Sk.ffi.getType Sk.ffi.none.None).toBe Sk.ffi.PyType.NONE
    it "remapToJs None => null", -> expect(Sk.ffi.remapToJs Sk.ffi.none.None).toBe null

  describe "booleanToPy", ->
    it "getType booleanToPy true => Sk.ffi.PyType.BOOL", -> expect(Sk.ffi.getType Sk.ffi.booleanToPy true).toBe Sk.ffi.PyType.BOOL
    it "getType booleanToPy false => Sk.ffi.PyType.BOOL", -> expect(Sk.ffi.getType Sk.ffi.booleanToPy false).toBe Sk.ffi.PyType.BOOL
    it "remapToJs booleanToPy true => true", -> expect(Sk.ffi.remapToJs Sk.ffi.booleanToPy true).toBe true
    it "remapToJs booleanToPy false => false", -> expect(Sk.ffi.remapToJs Sk.ffi.booleanToPy false).toBe false
    it "typeName booleanToPy true => 'bool'", -> expect(Sk.ffi.typeName Sk.ffi.booleanToPy true).toBe 'bool'
    it "typeName booleanToPy false => 'bool'", -> expect(Sk.ffi.typeName Sk.ffi.booleanToPy false).toBe 'bool'
    it "true => True", -> expect(Sk.ffi.booleanToPy true ).toBe Sk.ffi.bool.True
    it "false => False", -> expect(Sk.ffi.booleanToPy false).toBe Sk.ffi.bool.False
    it "null => None", -> expect(Sk.ffi.booleanToPy null).toBe Sk.ffi.none.None
    it "undefined => undefined", -> expect(Sk.ffi.booleanToPy undefined).toBeUndefined()
    it "getType booleanToPy undefined, true => getType booleanToPy true", -> expect(Sk.ffi.getType Sk.ffi.booleanToPy undefined, true).toBe Sk.ffi.getType Sk.ffi.booleanToPy true
    it "remapToPy booleanToJs undefined, true => remapToJs booleanToPy true", -> expect(Sk.ffi.remapToJs Sk.ffi.booleanToPy undefined, true).toBe Sk.ffi.remapToJs Sk.ffi.booleanToPy true
    it "getType booleanToPy undefined, false => getType booleanToPy false", -> expect(Sk.ffi.getType Sk.ffi.booleanToPy undefined, false).toBe Sk.ffi.getType Sk.ffi.booleanToPy false
    it "remapToPy booleanToJs undefined, false => remapToJs booleanToPy false", -> expect(Sk.ffi.remapToJs Sk.ffi.booleanToPy undefined, false).toBe Sk.ffi.remapToJs Sk.ffi.booleanToPy false
    it "string throws TypeError", ->
      foo = () -> Sk.ffi.booleanToPy("s")
      expect(foo).toThrow()
      try
        foo()
      catch e
        expect(e.toString()).toBe Sk.ffi.err.argument('valueJs').inFunction('Sk.ffi.booleanToPy').mustHaveType("boolean or null or undefined").toString()

  describe "numberToPy", ->
    it "getType numberToPy number => PyType.FLOAT", -> expect(Sk.ffi.getType Sk.ffi.numberToPy 6) .toBe Sk.ffi.PyType.FLOAT
    it "remapToJs numberToPy number => number", -> expect(Sk.ffi.remapToJs Sk.ffi.numberToPy 6).toBe 6
    it "typeName numberToPy number => 'float'", -> expect(Sk.ffi.typeName Sk.ffi.numberToPy 6).toBe 'float'
    it "null => None", -> expect(Sk.ffi.numberToPy null).toBe Sk.ffi.none.None
    it "undefined => undefined", -> expect(Sk.ffi.numberToPy undefined).toBeUndefined()
    it "getType numberToPy undefined, number => getType numberToPy number", -> expect(Sk.ffi.getType Sk.ffi.numberToPy undefined, 23).toBe Sk.ffi.getType Sk.ffi.numberToPy 23
    it "remapToJs numberToPy undefined, number => remapToJs numberToPy number", -> expect(Sk.ffi.remapToJs Sk.ffi.numberToPy undefined, 23).toBe Sk.ffi.remapToJs Sk.ffi.numberToPy 23
    it "undefined, null => None", -> expect(Sk.ffi.numberToPy undefined, null).toBe Sk.ffi.none.None
    it "string throws TypeError", ->
      foo = () -> Sk.ffi.numberToPy("s")
      expect(foo).toThrow()
      try
        foo()
      catch e
        expect(e.toString()).toBe Sk.ffi.err.argument('valueJs').inFunction('Sk.ffi.numberToPy').mustHaveType("number or null or undefined").toString()

  describe "numberToIntPy", ->
    it "getType numberToIntPy number => PyType.INT", -> expect(Sk.ffi.getType Sk.ffi.numberToIntPy 6) .toBe Sk.ffi.PyType.INT
    it "remapToJs numberToIntPy number => number", -> expect(Sk.ffi.remapToJs Sk.ffi.numberToIntPy 6).toBe 6
    it "typeName numberToIntPy number => 'int'", -> expect(Sk.ffi.typeName Sk.ffi.numberToIntPy 6).toBe 'int'
    it "null => None", -> expect(Sk.ffi.numberToIntPy null).toBe Sk.ffi.none.None
    it "undefined => undefined", -> expect(Sk.ffi.numberToIntPy undefined).toBeUndefined()
    it "getType numberToIntPy undefined, number => getType numberToIntPy number", -> expect(Sk.ffi.getType Sk.ffi.numberToIntPy undefined, 23).toBe Sk.ffi.getType Sk.ffi.numberToIntPy 23
    it "remapToJs numberToIntPy undefined, number => remapToJs numberToIntPy number", -> expect(Sk.ffi.remapToJs Sk.ffi.numberToIntPy undefined, 23).toBe Sk.ffi.remapToJs Sk.ffi.numberToPy 23
    it "undefined, null => None", -> expect(Sk.ffi.numberToIntPy undefined, null).toBe Sk.ffi.none.None
    it "string throws TypeError", ->
      foo = () -> Sk.ffi.numberToPy("s")
      expect(foo).toThrow()
      try
        foo()
      catch e
        expect(e.toString()).toBe Sk.ffi.err.argument('valueJs').inFunction('Sk.ffi.numberToPy').mustHaveType("number or null or undefined").toString()

  describe "stringToPy", ->
    it "getType stringToPy 'Hello' => Sk.ffi.PyType.STRING", -> expect(Sk.ffi.getType Sk.ffi.stringToPy 'Hello').toBe Sk.ffi.PyType.STRING
    it "remapToJs stringToPy 'Hello' => 'Hello'", -> expect(Sk.ffi.remapToJs Sk.ffi.stringToPy 'Hello').toBe 'Hello'
    it "typeName stringToPy 'Hello' => 'str'", -> expect(Sk.ffi.typeName Sk.ffi.stringToPy 'Hello').toBe 'str'
    it "null => None", -> expect(Sk.ffi.stringToPy null).toBe Sk.ffi.none.None
    it "undefined => undefined", -> expect(Sk.ffi.stringToPy undefined).toBeUndefined()
    it "undefined, 'foo' => stringToPy 'foo'", -> expect(Sk.ffi.stringToPy undefined, 'foo').toBe Sk.ffi.stringToPy 'foo'
    it "undefined, null => None", -> expect(Sk.ffi.stringToPy undefined, null).toBe Sk.ffi.none.None
    it "number throws TypeError", ->
      foo = () -> Sk.ffi.stringToPy(6)
      expect(foo).toThrow()
      try
        foo()
      catch e
        expect(e.toString()).toBe Sk.ffi.err.argument('valueJs').inFunction('Sk.ffi.stringToPy').mustHaveType("string or null or undefined").toString()

  describe "referenceToPy", ->
    obj = name:"xyz"
    targetPy = {}
    it "getType referenceToPy obj, 'Foo' => PyType.OBJREF", -> expect(Sk.ffi.getType Sk.ffi.referenceToPy obj, 'Foo').toBe Sk.ffi.PyType.OBJREF
    it "remapToJs referenceToPy obj, 'Foo' => obj", -> expect(Sk.ffi.remapToJs Sk.ffi.referenceToPy obj, 'Foo').toBe obj
    it "typeName referenceToPy obj, 'Foo' => 'Foo'", -> expect(Sk.ffi.typeName Sk.ffi.referenceToPy obj, 'Foo').toBe 'Foo'
    xit "getType targetJs", ->
      Sk.ffi.referenceToPy obj, 'Foo', undefined, targetPy
      expect(Sk.ffi.getType targetPy).toBe Sk.ffi.PyType.OBJREF
    it "remapToJs targetJs", ->
      Sk.ffi.referenceToPy obj, 'Foo', undefined, targetPy
      expect(Sk.ffi.remapToJs targetPy).toBe obj
    it "typeName targetJs", ->
      Sk.ffi.referenceToPy obj, 'Foo', undefined, targetPy
      expect(Sk.ffi.typeName targetPy).toBe 'Foo'

  describe "functionPy", ->
    # The test function has arguments and a return type in the Python value space.
    # This is the kind of function that we would write for an implentation of a function.
    # Python arguments and return types are used so that we can control conversions.
    # Just for the hell of it, we'll add the precondition functions.
    doubleMe = (xPy) ->
      Sk.ffi.checkFunctionArgs 'doubleMe', arguments, 1, 1
      Sk.ffi.checkArgType 'x', 'Number', Sk.ffi.isNumber xPy
      x = Sk.ffi.remapToJs xPy
      return Sk.ffi.remapToPy 2 * x

    it "getType functionPy doubleMe => PyType.FUNCTION", ->
      doubleMePy = Sk.ffi.functionPy(doubleMe)
      expect(Sk.ffi.getType doubleMePy).toBe Sk.ffi.PyType.FUNCTION
    it "remapToJs functionPy function", ->
      # The Pythonized version of the function has to be mapped back to JavaScript.
      # This involves a wrapper that automatically converts JavaScript arguments to Python.
      doubleMePy = Sk.ffi.functionPy(doubleMe)
      # The JavaScript function here is twice-wrapped but works in the JavaScript value space.
      twiceWrappedDoubleMeJs = Sk.ffi.remapToJs doubleMePy
      # Now let's compare the execution values.
      x = Math.random()
      # Verify the test function first.
      expect(2 * x).toBe Sk.ffi.remapToJs doubleMe.call Sk.ffi.remapToPy('Hello'), Sk.ffi.remapToPy(x)
      # Finally, verify the twice-wrapped version.
      expect(twiceWrappedDoubleMeJs.call 'Hello', x).toBe 2 * x
