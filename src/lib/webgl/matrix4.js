// more from 'tdl'
var $builtinmodule = function(name)
{
    var mod = {};

    var temp0v3_ = new Float32Array(3);
    var temp1v3_ = new Float32Array(3);
    var temp2v3_ = new Float32Array(3);

    var temp0v4_ = new Float32Array(4);
    var temp1v4_ = new Float32Array(4);
    var temp2v4_ = new Float32Array(4);

    var temp0m4_ = new Float32Array(16);
    var temp1m4_ = new Float32Array(16);
    var temp2m4_ = new Float32Array(16);

    var normalize = function(dst, a) {
        var n = 0.0;
        var aLength = a.length;
        for (var i = 0; i < aLength; ++i)
            n += a[i] * a[i];
        n = Math.sqrt(n);
        if (n > 0.00001) {
            for (var i = 0; i < aLength; ++i)
                dst[i] = a[i] / n;
        } else {
            for (var i = 0; i < aLength; ++i)
                dst[i] = 0;
        }
        return dst;
    };

    var cross = function(dst, a, b) {
        dst[0] = a[1] * b[2] - a[2] * b[1];
        dst[1] = a[2] * b[0] - a[0] * b[2];
        dst[2] = a[0] * b[1] - a[1] * b[0];
        return dst;
    };

    var subVector = function(dst, a, b) {
        var aLength = a.length;
        for (var i = 0; i < aLength; ++i)
            dst[i] = a[i] - b[i];
        return dst;
    };

    var dot = function(a, b) {
        return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
    };

    mod.lookAt = new Sk.builtin.func(function(view, eye, target, up)
            {
                var t0 = temp0v3_;
                var t1 = temp1v3_;
                var t2 = temp2v3_;

                var vz = normalize(t0, subVector(t0, eye.v, target.v));
                var vx = normalize(t1, cross(t1, up.v, vz));
                var vy = cross(t2, vz, vx);

                var dst = view.v;
                dst[ 0] = vx[0];
                dst[ 1] = vy[0];
                dst[ 2] = vz[0];
                dst[ 3] = 0;
                dst[ 4] = vx[1];
                dst[ 5] = vy[1];
                dst[ 6] = vz[1];
                dst[ 7] = 0;
                dst[ 8] = vx[2];
                dst[ 9] = vy[2];
                dst[10] = vz[2];
                dst[11] = 0;
                dst[12] = -dot(vx, eye.v);
                dst[13] = -dot(vy, eye.v);
                dst[14] = -dot(vz, eye.v);
                dst[15] = 1;

                return dst;
            });

    return mod;
};
