describe("Vector", function () {
    'use strict';
    var Vector = TurtleGraphics.Vector,
        DegreesInRad = Math.PI / 180;
    beforeEach(function () {});

    it("cross product", function () {
        var v = new Vector([3, -3, 1]),
            v2 = new Vector([4, 9, 2]);
        
        expect(v.cross(v2)).toEqual(new Vector([-15, -2, 39]));
    });
    
    it("rotate", function () {
        var v = new Vector([1, 0, 0]);
        
        expect(v.rotate(90)).toEqual(new Vector([0, 1, 0]));
        expect(v.rotateNormal(new Vector([0, 0, 0]), 180 * DegreesInRad)).toEqual(new Vector([-1, 0, 0]));
    });
    
    it("vector <-> angle", function () {
        var v =  new Vector([0, 1, 0]);
        expect(v.toAngle()).toEqual(90);
        expect(v.rotate(90).toAngle()).toEqual(180);
        expect(Vector.angle2vec(90)).toEqual(new Vector([0, 1, 0]))
    });
    
    it("basics", function () {
        var v = new Vector([1, 2, 3]);
        expect(v.div(3)).toEqual(new Vector([1 / 3, 2 / 3, 3 / 3]));
        expect(v.add(new Vector([3, 3, 3]))).toEqual(new Vector([4, 5, 6]));
        expect(v.smul(3)).toEqual(new Vector([3, 6, 9]));
    });
    
    it("scale", function () {
        var v = new Vector([0.5, 0.5, 1]);
        expect(v.scale(3, 3)).toEqual(new Vector([1.5, 1.5, 1]));
    });
    
    it("length", function () {
        var v = new Vector([2, 4, 1]);
        expect(v.len()).toBe(4.58257569495584);
    });
    
    it("linear", function () {
        var v = new Vector([0, 10, 0]);
        expect(v.linear(1, 2, new Vector([1, 0, 0]))).toEqual(new Vector([2, 10, 0]));
    });
});