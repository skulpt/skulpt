describe("Sk", function() {

  describe("err", function () {
    var withLineNo = function(message) {
      return message + " on line " + ((Sk.currLineNo > 0) ? "" + Sk.currLineNo : "<unknown>");
    };
    it("argument.mustHaveType when Sk.currLineNo is defined.", function() {
      expect(Sk.ffi.err.argument("x").mustHaveType(Sk.ffi.PyType.STR).toString()).toBe(withLineNo("TypeError: x must be a <type 'str'>"));
    });
  });


  xdescribe("mangleName", function() {
    it("x => x", function() {
      expect(Sk.mangleName("x")).toBe("x");
    });
    it("apply is mangled", function() {
      expect(Sk.mangleName("apply")).toBe("apply_$rn$");
    });
    it("call is mangled", function() {
      expect(Sk.mangleName("call")).toBe("call_$rn$");
    });
    it("eval is mangled", function() {
      expect(Sk.mangleName("eval")).toBe("eval_$rn$");
    });
    it("hasOwnProperty is mangled", function() {
      expect(Sk.mangleName("hasOwnProperty")).toBe("hasOwnProperty_$rn$");
    });
    it("length is mangled", function() {
      expect(Sk.mangleName("length")).toBe("length_$rn$");
    });
    it("toString is mangled", function() {
      expect(Sk.mangleName("toString")).toBe("toString_$rn$");
    });
    it("valueOf is mangled", function() {
      expect(Sk.mangleName("valueOf")).toBe("valueOf_$rn$");
    });
  });
});