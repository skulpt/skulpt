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

                return view;
            });

    mod.perspective = new Sk.builtin.func(function(proj, angle, aspect, near, far)
            {
                var f = Math.tan(Math.PI * 0.5 - 0.5 * (angle * Math.PI / 180));
                var rangeInv = 1.0 / (near - far);

                var dst = proj.v;

                dst[0]  = f / aspect;
                dst[1]  = 0;
                dst[2]  = 0;
                dst[3]  = 0;

                dst[4]  = 0;
                dst[5]  = f;
                dst[6]  = 0;
                dst[7]  = 0;

                dst[8]  = 0;
                dst[9]  = 0;
                dst[10] = (near + far) * rangeInv;
                dst[11] = -1;

                dst[12] = 0;
                dst[13] = 0;
                dst[14] = near * far * rangeInv * 2;
                dst[15] = 0;

                return proj;
            });

    // builds, not appending
    mod.rotationY = new Sk.builtin.func(function(target, angle)
            {
                var dst = target.v;
                var c = Math.cos(angle * Math.PI / 180);
                var s = Math.sin(angle * Math.PI / 180);

                dst[ 0] = c;
                dst[ 1] = 0;
                dst[ 2] = -s;
                dst[ 3] = 0;
                dst[ 4] = 0;
                dst[ 5] = 1;
                dst[ 6] = 0;
                dst[ 7] = 0;
                dst[ 8] = s;
                dst[ 9] = 0;
                dst[10] = c;
                dst[11] = 0;
                dst[12] = 0;
                dst[13] = 0;
                dst[14] = 0;
                dst[15] = 1;

                return target;
            });
    mod.identity = Sk.builtin.func(function(target)
            {
                var dst = target.v;
                dst[ 0] = 1;
                dst[ 1] = 0;
                dst[ 2] = 0;
                dst[ 3] = 0;
                dst[ 4] = 0;
                dst[ 5] = 1;
                dst[ 6] = 0;
                dst[ 7] = 0;
                dst[ 8] = 0;
                dst[ 9] = 0;
                dst[10] = 1;
                dst[11] = 0;
                dst[12] = 0;
                dst[13] = 0;
                dst[14] = 0;
                dst[15] = 1;
                return target;
            });

    // column major
    mod.mul = new Sk.builtin.func(function(target, x, y)
            {
                var dst = target.v;
                var a = x.v;
                var b = y.v;

                var a00 = a[0];
                var a01 = a[1];
                var a02 = a[2];
                var a03 = a[3];
                var a10 = a[ 4 + 0];
                var a11 = a[ 4 + 1];
                var a12 = a[ 4 + 2];
                var a13 = a[ 4 + 3];
                var a20 = a[ 8 + 0];
                var a21 = a[ 8 + 1];
                var a22 = a[ 8 + 2];
                var a23 = a[ 8 + 3];
                var a30 = a[12 + 0];
                var a31 = a[12 + 1];
                var a32 = a[12 + 2];
                var a33 = a[12 + 3];
                var b00 = b[0];
                var b01 = b[1];
                var b02 = b[2];
                var b03 = b[3];
                var b10 = b[ 4 + 0];
                var b11 = b[ 4 + 1];
                var b12 = b[ 4 + 2];
                var b13 = b[ 4 + 3];
                var b20 = b[ 8 + 0];
                var b21 = b[ 8 + 1];
                var b22 = b[ 8 + 2];
                var b23 = b[ 8 + 3];
                var b30 = b[12 + 0];
                var b31 = b[12 + 1];
                var b32 = b[12 + 2];
                var b33 = b[12 + 3];
                dst[ 0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
                dst[ 1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
                dst[ 2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
                dst[ 3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
                dst[ 4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
                dst[ 5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
                dst[ 6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
                dst[ 7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
                dst[ 8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
                dst[ 9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
                dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
                dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
                dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
                dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
                dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
                dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
                return target;
            });

    return mod;
};
