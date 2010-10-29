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

    mod.identity = new Sk.builtin.func(function(target)
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

    // row major
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
                dst[ 0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
                dst[ 1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
                dst[ 2] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
                dst[ 3] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
                dst[ 4] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
                dst[ 5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
                dst[ 6] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
                dst[ 7] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
                dst[ 8] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
                dst[ 9] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
                dst[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
                dst[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
                dst[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
                dst[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
                dst[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
                dst[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
                return target;
            });

    mod.invert = new Sk.builtin.func(function(target, mat)
            {
                var dst = target.v;
                var m = mat.v;
                var m00 = m[0 * 4 + 0];
                var m01 = m[0 * 4 + 1];
                var m02 = m[0 * 4 + 2];
                var m03 = m[0 * 4 + 3];
                var m10 = m[1 * 4 + 0];
                var m11 = m[1 * 4 + 1];
                var m12 = m[1 * 4 + 2];
                var m13 = m[1 * 4 + 3];
                var m20 = m[2 * 4 + 0];
                var m21 = m[2 * 4 + 1];
                var m22 = m[2 * 4 + 2];
                var m23 = m[2 * 4 + 3];
                var m30 = m[3 * 4 + 0];
                var m31 = m[3 * 4 + 1];
                var m32 = m[3 * 4 + 2];
                var m33 = m[3 * 4 + 3];
                var tmp_0  = m22 * m33;
                var tmp_1  = m32 * m23;
                var tmp_2  = m12 * m33;
                var tmp_3  = m32 * m13;
                var tmp_4  = m12 * m23;
                var tmp_5  = m22 * m13;
                var tmp_6  = m02 * m33;
                var tmp_7  = m32 * m03;
                var tmp_8  = m02 * m23;
                var tmp_9  = m22 * m03;
                var tmp_10 = m02 * m13;
                var tmp_11 = m12 * m03;
                var tmp_12 = m20 * m31;
                var tmp_13 = m30 * m21;
                var tmp_14 = m10 * m31;
                var tmp_15 = m30 * m11;
                var tmp_16 = m10 * m21;
                var tmp_17 = m20 * m11;
                var tmp_18 = m00 * m31;
                var tmp_19 = m30 * m01;
                var tmp_20 = m00 * m21;
                var tmp_21 = m20 * m01;
                var tmp_22 = m00 * m11;
                var tmp_23 = m10 * m01;

                var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
                    (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
                var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
                    (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
                var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
                    (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
                var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
                    (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

                var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

                dst[ 0] = d * t0;
                dst[ 1] = d * t1;
                dst[ 2] = d * t2;
                dst[ 3] = d * t3;
                dst[ 4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
                        (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
                dst[ 5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
                        (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
                dst[ 6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
                        (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
                dst[ 7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
                        (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
                dst[ 8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
                        (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
                dst[ 9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
                        (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
                dst[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
                        (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
                dst[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
                        (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
                dst[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
                        (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
                dst[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
                        (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
                dst[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
                        (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
                dst[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
                        (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));
                return target;
            });

    mod.transpose = new Sk.builtin.func(function(target, mat)
            {
                var dst = target.v;
                var m = mat.v;
                for (var j = 0; j < 4; ++j) {
                    for (var i = 0; i < 4; ++i)
                    dst[j * 4 + i] = m[i * 4 + j];
                }
                return dst;
            });

    return mod;
};
