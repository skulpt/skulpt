// most of this file is from 'tdl'

var $builtinmodule = function(name)
{
    var mod = {};



    /**
     * AttribBuffer manages a TypedArray as an array of vectors.
     *
     * @param {number} numComponents Number of components per
     *     vector.
     * @param {number|!Array.<number>} numElements Number of vectors or the data.
     * @param {string} opt_type The type of the TypedArray to
     *     create. Default = 'Float32Array'.
     * @param {!Array.<number>} opt_data The data for the array.
     */
    var AttribBuffer = function(
            numComponents, numElements, opt_type) {
        opt_type = opt_type || 'Float32Array';
        var type = window[opt_type];
        if (numElements.length) {
            this.buffer = new type(numElements);
            numElements = this.buffer.length / numComponents;
            this.cursor = numElements;
        } else {
            this.buffer = new type(numComponents * numElements);
            this.cursor = 0;
        }
        this.numComponents = numComponents;
        this.numElements = numElements;
        this.type = opt_type;
    };

    AttribBuffer.prototype.stride = function() {
        return 0;
    };

    AttribBuffer.prototype.offset = function() {
        return 0;
    };

    AttribBuffer.prototype.getElement = function(index) {
        var offset = index * this.numComponents;
        var value = [];
        for (var ii = 0; ii < this.numComponents; ++ii) {
            value.push(this.buffer[offset + ii]);
        }
        return value;
    };

    AttribBuffer.prototype.setElement = function(index, value) {
        var offset = index * this.numComponents;
        for (var ii = 0; ii < this.numComponents; ++ii) {
            this.buffer[offset + ii] = value[ii];
        }
    };

    AttribBuffer.prototype.clone = function() {
        var copy = new AttribBuffer(
                this.numComponents, this.numElements, this.type);
        copy.pushArray(this);
        return copy;
    }

    AttribBuffer.prototype.push = function(value) {
        this.setElement(this.cursor++, value);
    };

    AttribBuffer.prototype.pushArray = function(array) {
        //  this.buffer.set(array, this.cursor * this.numComponents);
        //  this.cursor += array.numElements;
        for (var ii = 0; ii < array.numElements; ++ii) {
            this.push(array.getElement(ii));
        }
    };

    AttribBuffer.prototype.pushArrayWithOffset =
    function(array, offset) {
        for (var ii = 0; ii < array.numElements; ++ii) {
            var elem = array.getElement(ii);
            for (var jj = 0; jj < offset.length; ++jj) {
                elem[jj] += offset[jj];
            }
            this.push(elem);
        }
    };

    /**
    * Computes the extents
    * @param {!AttribBuffer} positions The positions
    * @return {!{min: !tdl.math.Vector3, max:!tdl.math.Vector3}}
    *     The min and max extents.
    */
    AttribBuffer.prototype.computeExtents = function() {
        var numElements = this.numElements;
        var numComponents = this.numComponents;
        var minExtent = this.getElement(0);
        var maxExtent = this.getElement(0);
        for (var ii = 1; ii < numElements; ++ii) {
            var element = this.getElement(ii);
            for (var jj = 0; jj < numComponents; ++jj) {
                minExtent[jj] = Math.min(minExtent[jj], element[jj]);
                maxExtent[jj] = Math.max(maxExtent[jj], element[jj]);
            }
        }
        return {min: minExtent, max: maxExtent};
    };


    /**
     * Creates the vertices and indices for a cube. The
     * cube will be created around the origin. (-size / 2, size / 2)
     *
     * @param {number} size Width, height and depth of the cube.
     * @return {!Object.<string, !tdl.primitives.AttribBuffer>} The
     *         created plane vertices.
     */
    mod.createCube = new Sk.builtin.func(function(size)
            {
                var CUBE_FACE_INDICES_ = [
                    [3, 7, 5, 1],
                    [0, 4, 6, 2],
                    [6, 7, 3, 2],
                    [0, 1, 5, 4],
                    [5, 7, 6, 4],
                    [2, 3, 1, 0]
                ];

                var k = size / 2;

                var cornerVertices = [
                        [-k, -k, -k],
                        [+k, -k, -k],
                        [-k, +k, -k],
                        [+k, +k, -k],
                        [-k, -k, +k],
                        [+k, -k, +k],
                        [-k, +k, +k],
                        [+k, +k, +k]
                    ];

                var faceNormals = [
                        [+1, +0, +0],
                        [-1, +0, +0],
                        [+0, +1, +0],
                        [+0, -1, +0],
                        [+0, +0, +1],
                        [+0, +0, -1]
                    ];

                var uvCoords = [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1]
                    ];

                var numVertices = 6 * 4;
                var positions = new AttribBuffer(3, numVertices);
                var normals = new AttribBuffer(3, numVertices);
                var texCoords = new AttribBuffer(2, numVertices);
                var indices = new AttribBuffer(3, 6 * 2, 'Uint16Array');

                for (var f = 0; f < 6; ++f) {
                    var faceIndices = CUBE_FACE_INDICES_[f];
                    for (var v = 0; v < 4; ++v) {
                        var position = cornerVertices[faceIndices[v]];
                        var normal = faceNormals[f];
                        var uv = uvCoords[v];

                        // Each face needs all four vertices because the normals and texture
                        // coordinates are not all the same.
                        positions.push(position);
                        normals.push(normal);
                        texCoords.push(uv);

                    }
                    // Two triangles make a square face.
                    var offset = 4 * f;
                    indices.push([offset + 0, offset + 1, offset + 2]);
                    indices.push([offset + 0, offset + 2, offset + 3]);
                }

                return {
                        position: positions,
                        normal: normals,
                        texCoord: texCoords,
                        indices: indices
                };
            });

    return mod;
};
