const $builtinmodule = () => {
    const str = e => new Sk.builtin.str(e)
    const def = e => new Sk.builtin.func(e)
    const int = e => new Sk.builtin.int_(e)
    const float = e => new Sk.builtin.float_(e)
    const bool = e => new Sk.builtin.bool(e)
    const tuple = e => new Sk.builtin.tuple(e)
    const dict = e => new Sk.builtin.dict(e)
    const build = (e, n, b) => Sk.misceval.buildClass(module, e, n, b)
    const call = (f, ...e) => Sk.misceval.callsimOrSuspend(f, ...e)
    const property = (g, s) => call(Sk.builtins.property, g, s)
    const isShape = e => Sk.builtin.isinstance(e, shape).v
    const image = e => str(`https://jobase.org/Browser/JoBase/images/${e}.png`)
    const font = e => str(`https://jobase.org/Browser/JoBase/fonts/${e}.ttf`)
    const wait = e => Sk.misceval.promiseToSuspension(new Promise(e))
    const shapeError = e => new Sk.builtin.TypeError("must be Shape or cursor, not " + e.tp$name)

    const number = e => {
        if (e) {
            if (e.ob$type != Sk.builtin.int_ && e.ob$type != Sk.builtin.float_)
                throw new Sk.builtin.TypeError("must be real number, not " + e.tp$name)

            return e.v
        }
    }

    const string = e => {
        if (e) {
            if (e.ob$type != Sk.builtin.str)
                throw new Sk.builtin.TypeError("must be str, not " + e.tp$name)

            return e.v
        }
    }

    const findKey = e => module.key.$data[Object.keys(module.key.$data).find(
        k => module.key.$data[k].code == e.code)]

    const setVector = (object, source) => {
        if (object) {
            if (object.ob$type == vector)
                source.forEach((e, i) => source[i] = i < object.$data.length ?
                    object.$data[i].get(object.$parent).v : e)

            else if (object.ob$type == Sk.builtin.tuple || object.ob$type == Sk.builtin.list)
                source.forEach((e, i) => source[i] = i < object.v.length ?
                    object.v[i].v : e)

            else throw new Sk.builtins.TypeError("attribute must be a sequence of values")
        }

        return source
    }

    const getCursorPos = () => [
        module.cursor.$pos[0] - canvas.width / 2,
        canvas.height / 2 - module.cursor.$pos[1]
    ]

    const newMatrix = () => new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])

    const invMatrix = matrix => {
        const result = []
        let value = 0

        const invert = (i, j) => {
            const value = 2 + (j - i)
            const t = (a, b) => matrix[((j + b) % 4) * 4 + ((i + a) % 4)]

            i += 4 + value
            j += 4 - value

            const final =
                + t(1, -1) * t(0, 0) * t(-1, 1)
                + t(1, 1) * t(0, -1) * t(-1, 0)
                + t(-1, -1) * t(1, 0) * t(0, 1)
                - t(-1, -1) * t(0, 0) * t(1, 1)
                - t(-1, 1) * t(0, -1) * t(1, 0)
                - t(1, -1) * t(-1, 0) * t(0, 1)

            return value % 2 ? final : -final
        }

        for (let i = 0; i < 4; i ++)
            for (let j = 0; j < 4; j ++)
                result[j * 4 + i] = invert(i, j)

        for(let i = 0; i < 4; i ++)
            value += matrix[i] * result[i * 4]

        result.forEach((e, i) => matrix[i] = e * value)
    }

    const mulMatrix = (a, b) => {
        const result = []

        for (let i = 0; i < 16; i ++) {
            const i1 = i - Math.floor(i / 4) * 4
            const i2 = Math.floor(i / 4) * 4

            result[i] =
                a[i2] * b[i1] + a[i2 + 1] * b[i1 + 4] +
                a[i2 + 2] * b[i1 + 8] + a[i2 + 3] * b[i1 + 12]
        }

        result.forEach((e, i) => a[i] = e)
    }

    const posMatrix = (matrix, pos) => {
        const base = newMatrix()

        base[12] = pos[0]
        base[13] = pos[1]
        mulMatrix(matrix, base)
    }

    const scaleMatrix = (matrix, scale) => {
        const base = newMatrix()

        base[0] = scale[0]
        base[5] = scale[1]
        mulMatrix(matrix, base)
    }

    const rotMatrix = (matrix, angle) => {
        const base = newMatrix()
        const sin = Math.sin(angle * Math.PI / 180)
	    const cos = Math.cos(angle * Math.PI / 180)

        base[0] = cos
        base[1] = sin
        base[4] = -sin
        base[5] = cos
        mulMatrix(matrix, base)
    }

    const viewMatrix = (matrix, view) => {
        const base = newMatrix()

        base[0] = 2 / canvas.width
        base[5] = 2 / canvas.height
        base[10] = -2 / (view[1] - view[0])
        base[14] = (-view[1] + view[0]) / (view[1] - view[0])
        mulMatrix(matrix, base)
    }

    const setUniform = (matrix, color) => {
        gl.uniform4fv(gl.getUniformLocation(program, "color"), new Float32Array(color))
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "object"), false, matrix)
    }

    const collideLineLine = (p1, p2, p3, p4) => {
        const value = (p4[1] - p3[1]) * (p2[0] - p1[0]) - (p4[0] - p3[0]) * (p2[1] - p1[1]);
        const u1 = ((p4[0] - p3[0]) * (p1[1] - p3[1]) - (p4[1] - p3[1]) * (p1[0] - p3[0])) / value
        const u2 = ((p2[0] - p1[0]) * (p1[1] - p3[1]) - (p2[1] - p1[1]) * (p1[0] - p3[0])) / value
    
        return u1 >= 0 && u1 <= 1 && u2 >= 0 && u2 <= 1
    }
    
    const collidePolyLine = (poly, p1, p2) => poly.find(
        (e, i, a) => collideLineLine(p1, p2, e, a[i + 1 == a.length ? 0 : i + 1]))

    const collidePolyPoly = (p1, p2) => collidePolyPoint(p1, p2[0]) || collidePolyPoint(p2, p1[0]) || p1.find(
        (e, i, a) => collidePolyLine(p2, e, a[i + 1 == a.length ? 0 : i + 1]))
    
    const collidePolyPoint = (poly, point) => poly.reduce((s, e, i, a) => {
        const v = a[i + 1 == a.length ? 0 : i + 1]

        return (point[0] < (v[0] - e[0]) * (point[1] - e[1]) / (v[1] - e[1]) + e[0]) &&
            ((e[1] > point[1] && v[1] < point[1]) ||
            (e[1] < point[1] && v[1] > point[1])) ? !s : s
    }, false)

    const posPoly = (poly, pos) => poly.forEach(e => {
        e[0] += pos[0]
        e[1] += pos[1]
    })

    const scalePoly = (poly, scale) => poly.forEach(e => {
        e[0] *= scale[0]
        e[1] *= scale[1]
    })

    const rotPoly = (poly, angle) => {
        const cos = Math.cos(angle * Math.PI / 180)
        const sin = Math.sin(angle * Math.PI / 180)

        poly.forEach(e => {
            const x = e[0]
            const y = e[1]

            e[0] = x * cos - y * sin
            e[1] = x * sin + y * cos
        })
    }

    const getPolyLeft = poly => poly.reduce((a, b) => b[0] < a ? b[0] : a, poly[0][0])
    const getPolyTop = poly => poly.reduce((a, b) => b[1] > a ? b[1] : a, poly[0][1])
    const getPolyRight = poly => poly.reduce((a, b) => b[0] > a ? b[0] : a, poly[0][0])
    const getPolyBottom = poly => poly.reduce((a, b) => b[1] < a ? b[1] : a, poly[0][1])

    const getRectPoly = rect => {
        const poly = [[-.5, .5], [.5, .5], [.5, -.5], [-.5, -.5]]
        
        scalePoly(poly, rect.$size.map((e, i) => e * rect.$scale[i]))
        posPoly(poly, rect.$anchor)
        rotPoly(poly, rect.$angle)
        posPoly(poly, rect.$pos)

        return poly
    }

    const drawRect = (rect, type) => {
        const matrix = newMatrix()

        gl.uniform1i(gl.getUniformLocation(program, "image"), type)
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh)

        scaleMatrix(matrix, rect.$size.map((e, i) => e * rect.$scale[i]))
        posMatrix(matrix, rect.$anchor)
        rotMatrix(matrix, rect.$angle)
        posMatrix(matrix, rect.$pos)
        setUniform(matrix, rect.$color)

        gl.vertexAttribPointer(
            gl.getAttribLocation(program, "vertex"),
            2, gl.FLOAT, false, 16, 0)

        gl.vertexAttribPointer(
            gl.getAttribLocation(program, "coordinate"),
            2, gl.FLOAT, false, 16, 8)

        gl.enableVertexAttribArray(0)
        gl.enableVertexAttribArray(1)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    const createImage = image => {
        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        return texture
    }

    const renderText = text => {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")
        const name = text.$font_size + "px _" + fonts.indexOf(text.$font)
        context.font = name

        const size = context.measureText(text.$content)
        const width = size.actualBoundingBoxRight - size.actualBoundingBoxLeft

        const metrics = context.measureText("Hy")
        const height = metrics.actualBoundingBoxDescent + metrics.actualBoundingBoxAscent

        text.$size[0] = canvas.width = width
        text.$size[1] = canvas.height = height

        context.font = name
        context.fillStyle = "#fff"
        context.fillText(text.$content, 0, metrics.actualBoundingBoxAscent)

        gl.deleteTexture(text.$texture)
        text.$texture = createImage(canvas)
    }

    const loadFont = font => new Promise(
        (resolve, reject) => fonts.includes(font) ? resolve() : new FontFace(
            "_" + fonts.length, `url(${font})`).load().then(face => {
                document.fonts.add(face)

                fonts.push(font)
                resolve()
            }).catch(() => reject(new Sk.builtin.FileNotFoundError(
                `failed to load font: "${font}"`))))

    const mouseEnter = () => module.cursor.$enter = true
    const mouseLeave = () => module.cursor.$leave = true
    const mouseDown = () => module.cursor.$press = true
    const mouseUp = () => module.cursor.$release = true

    const mouseMove = event => {
        const rect = canvas.getBoundingClientRect()

        module.cursor.$pos[0] = event.clientX - rect.left
        module.cursor.$pos[1] = event.clientY - rect.top
        module.cursor.$move = true
    }

    const keyDown = event => {
        const key = findKey(event)

        if (event.repeat) {
            module.key.$repeat = true
            if (key) key.repeat = true
        }
        
        else {
            module.key.$press = true

            if (key) {
                key.hold = true
                key.press = true
            }
        }
    }

    const keyUp = event => {
        const key = findKey(event)
        module.key.$release = true

        if (key) {
            key.hold = false
            key.release = true
        }
    }

    const canvas = Sk.JoBase
    const gl = canvas.getContext("webgl")
    const program = gl.createProgram()
    const mesh = gl.createBuffer()
    const empty = def(() => {})
    const module = {}

    const textures = []
    const fonts = []

    const vector = build((globals, locals) => {
        const string = s => s.$data.map(v => v.get(s.$parent)).join(", ")

        locals.__init__ = def((self, parent, ...list) => {
            self.$parent = parent
            self.$data = list.map(e => ({var: e[0], get: e[1], set: e[2]}))
        })

        locals.__getattr__ = def((self, name) => {
            const item = self.$data.find(e => e.var == name.v)
            if (item) return item.get(self.$parent)
        })

        locals.__setattr__ = def((self, name, value) => {
            const item = self.$data.find(e => e.set && e.var == name.v)
            item && item.set(self.$parent, value)
        })

        locals.__str__ = def(self => str(`(${string(self)})`))
        locals.__repr__ = def(self => str(`[${string(self)}]`))
    }, "Vector")

    const shape = build((globals, locals) => {
        const init = (self, x, y, angle, color) => {
            self.$color = [0, 0, 0, 1]
            self.$pos = [number(x), number(y)]
            self.$angle = number(angle)
            self.$anchor = [0, 0]
            self.$scale = [1, 1]

            setVector(color, self.$color)
        }

        init.$defaults = [int(), int(), int(), tuple()]
        init.co_varnames = ["self", "x", "y", "angle", "color"]
        locals.__init__ = def(init)

        locals.look_at = def((self, other) => {
            const set = pos => self.$angle = Math.atan2(
                pos[1] - self.$pos[1], pos[0] - self.$pos[0]) * 180 / Math.PI

            if (other == module.cursor) set(getCursorPos())
            else if (isShape(other)) set(other.$pos)
            else throw shapeError(other)
        })

        locals.move_toward = def((self, other, speed) => {
            const pixels = number(speed) ?? 1

            const set = pos => {
                const x = pos[0] - self.$pos[0]
                const y = pos[1] - self.$pos[1]

                if (Math.hypot(x, y) < pixels) {
                    self.$pos[0] += x
                    self.$pos[1] += y
                }

                else {
                    self.$pos[0] += Math.cos(Math.atan2(y, x)) * pixels
                    self.$pos[1] += Math.sin(Math.atan2(y, x)) * pixels
                }
            }

            if (other == module.cursor) set(getCursorPos())
            else if (isShape(other)) set(other.$pos)
            else throw shapeError(other)
        })

        const getX = self => float(self.$pos[0])
        const setX = (self, value) => self.$pos[0] = number(value)
        const getY = self => float(self.$pos[1])
        const setY = (self, value) => self.$pos[1] = number(value)

        locals.x = property(def(getX), def(setX))
        locals.y = property(def(getY), def(setY))

        locals.pos = locals.position = property(
            def(self => call(vector, self, ["x", getX, setX], ["y", getY, setY])),
            def((self, value) => setVector(value, self.$pos)))

        const getScaleX = self => float(self.$scale[0])
        const setScaleX = (self, value) => self.$scale[0] = number(value)
        const getScaleY = self => float(self.$scale[1])
        const setScaleY = (self, value) => self.$scale[1] = number(value)

        locals.scale = property(
            def(self => call(vector, self, ["x", getScaleX, setScaleX], ["y", getScaleY, setScaleY])),
            def((self, value) => setVector(value, self.$scale)))

        const getAnchorX = self => float(self.$anchor[0])
        const setAnchorX = (self, value) => self.$anchor[0] = number(value)
        const getAnchorY = self => float(self.$anchor[1])
        const setAnchorY = (self, value) => self.$anchor[1] = number(value)

        locals.anchor = property(
            def(self => call(vector, self, ["x", getAnchorX, setAnchorX], ["y", getAnchorY, setAnchorY])),
            def((self, value) => setVector(value, self.$anchor)))

        locals.angle = property(
            def(self => float(self.$angle)),
            def((self, value) => self.$angle = number(value)))

        const getRed = self => float(self.$color[0])
        const setRed = (self, value) => self.$color[0] = number(value)
        const getGreen = self => float(self.$color[1])
        const setGreen = (self, value) => self.$color[1] = number(value)
        const getBlue = self => float(self.$color[2])
        const setBlue = (self, value) => self.$color[2] = number(value)
        const getAlpha = self => float(self.$color[3])
        const setAlpha = (self, value) => self.$color[3] = number(value)

        locals.red = property(def(getRed), def(setRed))
        locals.green = property(def(getGreen), def(setGreen))
        locals.blue = property(def(getBlue), def(setBlue))
        locals.blue = property(def(getAlpha), def(setAlpha))

        locals.color = property(
            def(self => call(
                vector, self, ["red", getRed, setRed], ["green", getGreen, setGreen],
                ["blue", getBlue, setBlue], ["alpha", getAlpha, setAlpha])),
            def((self, value) => setVector(value, self.$color)))
    }, "Shape")

    Sk.misceval.print_("Welcome to JoBase\n")
    module.__name__ = str("JoBase")

    module.MAN = image("man")
    module.COIN = image("coin")
    module.ENEMY = image("enemy")

    module.DEFAULT = font("default")
    module.CODE = font("code")
    module.PENCIL = font("pencil")
    module.SERIF = font("serif")
    module.HANDWRITING = font("handwriting")
    module.TYPEWRITER = font("typewriter")
    module.JOINED = font("joined")

    module.window = call(build((globals, locals) => {
        const init = (self, caption, width, height, color) => {
            self.$caption = string(caption)
            self.$color = [1, 1, 1]

            gl.clearColor(...setVector(color, self.$color), 1)
        }

        init.$defaults = [str("JoBase"), int(640), int(480), tuple()]
        init.co_varnames = ["self", "caption", "width", "height", "color"]
        locals.__init__ = def(init)

        locals.close = def(self => self.$close = true)
        locals.maximize = empty
        locals.minimize = empty
        locals.focus = empty

        locals.caption = property(
            def(self => str(self.$caption)),
            def((self, value) => self.$caption = string(value)))

        const getRed = self => float(self.$color[0])
        const setRed = (self, value) => {
            self.$color[0] = number(value)
            gl.clearColor(...self.$color, 1)
        }

        const getGreen = self => float(self.$color[1])
        const setGreen = (self, value) => {
            self.$color[1] = number(value)
            gl.clearColor(...self.$color, 1)
        }

        const getBlue = self => float(self.$color[2])
        const setBlue = (self, value) => {
            self.$color[2] = number(value)
            gl.clearColor(...self.$color, 1)
        }

        locals.red = property(def(getRed), def(setRed))
        locals.green = property(def(getGreen), def(setGreen))
        locals.blue = property(def(getBlue), def(setBlue))

        locals.color = property(
            def(self => call(
                vector, self, ["red", getRed, setRed], ["green", getGreen, setGreen],
                ["blue", getBlue, setBlue])),
            def((self, value) => gl.clearColor(...setVector(value, self.$color), 1)))

        const getWidth = () => int(canvas.width)
        const getHeight = () => int(canvas.height)
        
        locals.width = property(def(getWidth))
        locals.height = property(def(getHeight))

        locals.size = property(def(self => call(vector, self, ["x", getWidth], ["y", getHeight])))
        locals.top = property(def(() => float(canvas.height / 2)))
        locals.bottom = property(def(() => float(canvas.height / -2)))
        locals.left = property(def(() => float(canvas.width / -2)))
        locals.right = property(def(() => float(canvas.width / 2)))
        locals.resize = property(def(self => bool(self.$resize)))
    }, "Window"))

    module.cursor = call(build((globals, locals) => {
        locals.__init__ = def(self => {self.$pos = [0, 0]})

        const getX = () => float(getCursorPos()[0])
        const getY = () => float(getCursorPos()[1])

        locals.x = property(def(getX))
        locals.y = property(def(getY))

        locals.pos = locals.position = property(
            def(self => call(vector, self, ["x", getX], ["y", getY])))

        locals.move = property(def(self => bool(self.$move)))
        locals.enter = property(def(self => bool(self.$enter)))
        locals.leave = property(def(self => bool(self.$leave)))
        locals.press = property(def(self => bool(self.$press)))
        locals.release = property(def(self => bool(self.$release)))
    }, "Cursor"))

    module.key = call(build((globals, locals) => {
        locals.__getattr__ = def((self, name) => {
            const key = self.$data[name.v]

            if (key) return key.hold || key.release ? dict([
                str("press"), bool(key.press),
                str("release"), bool(key.release),
                str("repeat"), bool(key.repeat)
            ]) : Sk.builtin.bool.false$
        })

        locals.press = property(def(self => bool(self.$press)))
        locals.release = property(def(self => bool(self.$release)))
        locals.repeat = property(def(self => bool(self.$repeat)))
    }, "Key"))

    module.camera = call(build((globals, locals) => {
        const init = (self, x, y) => {
            self.$pos = [number(x), number(y)]
            self.$view = [0, 1]
        }

        init.$defaults = [int(), int()]
        init.co_varnames = ["self", "x", "y"]
        locals.__init__ = def(init)

        const getX = self => float(self.$pos[0])
        const setX = (self, value) => self.$pos[0] = number(value)
        const getY = self => float(self.$pos[1])
        const setY = (self, value) => self.$pos[1] = number(value)

        locals.x = property(def(getX), def(setX))
        locals.y = property(def(getY), def(setY))

        locals.pos = locals.position = property(
            def(self => call(vector, self, ["x", getX, setX], ["y", getY, setY])),
            def((self, value) => setVector(value, self.$pos)))
    }, "Camera"))

    module.Rectangle = build((globals, locals) => {
        const init = (self, x, y, width, height, angle, color) => {
            call(shape.prototype.__init__, self, x, y, angle, color)
            self.$size = [number(width), number(height)] 
        }

        init.$defaults = [int(), int(), int(50), int(50), int(), tuple()]
        init.co_varnames = ["self", "x", "y", "width", "height", "angle", "color"]

        locals.__init__ = def(init)
        locals.draw = def(self => drawRect(self, false))

        locals.collides_with = def((self, other) => {
            if (other == module.cursor)
                return collidePolyPoint(getRectPoly(self), getCursorPos())

            else if (isShape(other))
                return collidePolyPoly(getRectPoly(self), getRectPoly(other))

            else throw shapeError(other)
        })

        const getWidth = self => float(self.$size[0])
        const setWidth = (self, value) => self.$size[0] = number(value)
        const getHeight = self => float(self.$size[1])
        const setHeight = (self, value) => self.$size[1] = number(value)

        locals.width = property(def(getWidth), def(setWidth))
        locals.height = property(def(getHeight), def(setHeight))

        locals.size = property(
            def(self => call(
                vector, self, ["width", getWidth, setWidth],
                ["height", getHeight, setHeight])),
            def((self, value) => setVector(value, self.$size)))

        locals.left = property(
            def(self => float(getPolyLeft(getRectPoly(self)))),
            def((self, value) => self.$pos[0] += number(value) - getPolyLeft(getRectPoly(self))))

        locals.top = property(
            def(self => float(getPolyTop(getRectPoly(self)))),
            def((self, value) => self.$pos[1] += number(value) - getPolyTop(getRectPoly(self))))

        locals.right = property(
            def(self => float(getPolyRight(getRectPoly(self)))),
            def((self, value) => self.$pos[0] += number(value) - getPolyRight(getRectPoly(self))))

        locals.bottom = property(
            def(self => float(getPolyBottom(getRectPoly(self)))),
            def((self, value) => self.$pos[1] += number(value) - getPolyBottom(getRectPoly(self))))
    }, "Rectangle", [shape])

    module.Image = build((globals, locals) => {
        const init = (self, name, x, y, angle, width, height, color) => wait((resolve, reject) => {
            const texture = textures.find(e => e.name == string(name))
            call(module.Rectangle.prototype.__init__, self, x, y, width, height, angle)

            self.$color = [1, 1, 1, 1]
            setVector(color, self.$color)

            const setTexture = texture => {
                self.$texture = texture.source
                self.$size[0] ||= texture.width
                self.$size[1] ||= texture.height
            }

            if (texture) {
                setTexture(texture)
                return resolve()
            }

            const image = new Image()
            image.crossOrigin = "anonymous"
            image.src = string(name)

            image.onerror = () => reject(new Sk.builtin.FileNotFoundError(
                `failed to load image: "${string(name)}"`))

            image.onload = () => {
                const texture = {
                    name: string(name),
                    width: image.width,
                    height: image.height,
                    source: createImage(image)
                }

                textures.push(texture)
                setTexture(texture)
                resolve()
            }
        })

        init.$defaults = [module.MAN, int(), int(), int(), int(), int(), tuple()]
        init.co_varnames = ["self", "name", "x", "y", "angle", "width", "height", "color"]
        locals.__init__ = def(init)

        locals.draw = def(self => {
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, self.$texture)
            drawRect(self, true)
        })
    }, "Image", [module.Rectangle])

    module.Text = build((globals, locals) => {
        const init = (self, content, x, y, font_size, angle, color, font) => wait((resolve, reject) => {
            call(module.Rectangle.prototype.__init__, self, x, y, int(), int(), angle, color)

            self.$font = string(font)
            self.$font_size = number(font_size)
            self.$content = string(content)

            loadFont(self.$font).then(() => {
                renderText(self)
                resolve()
            }).catch(reject)
        })

        init.$defaults = [str("Text"), int(), int(), int(50), int(), tuple(), module.DEFAULT]
        init.co_varnames = ["self", "content", "x", "y", "font_size", "angle", "color", "font"]
        locals.__init__ = def(init)

        locals.draw = def(self => {
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, self.$texture)
            drawRect(self, true)
        })

        locals.content = property(
            def(self => str(self.$content)),
            def((self, value) => {
                self.$content = string(value)
                renderText(self)
            }))

        locals.font = property(
            def(self => str(self.$font)),
            def((self, value) => wait((resolve, reject) => {
                loadFont(self.$font = string(value)).then(() => {
                    renderText(self)
                    resolve()
                }).catch(reject)
            })))

        locals.font_size = property(
            def(self => float(self.$font_size)),
            def((self, value) => {
                self.$font_size = number(value)
                renderText(self)
            }))
    }, "Text", [module.Rectangle])

    module.random = def((a, b) => {
        const x = number(a)
        const y = number(b)
        const min = Math.min(x, y)

        return float(Math.random() * (Math.max(x, y) - min) + min)
    })

    module.run = def(() => wait((resolve, reject) => {
        const main = Sk.importModule("__main__", false, true)

        const observer = new MutationObserver(() => {
            module.window.$resize = true
            gl.viewport(0, 0, canvas.width, canvas.height)
            update()
        })

        const update = () => {
            const matrix = newMatrix()

            posMatrix(matrix, module.camera.$pos)
            invMatrix(matrix)
            viewMatrix(matrix, module.camera.$view)

            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "camera"), false, matrix)
            main.$d.loop && call(main.$d.loop)

            module.window.$resize = false
            module.cursor.$move = false
            module.cursor.$enter = false
            module.cursor.$leave = false
            module.cursor.$press = false
            module.cursor.$release = false
            module.key.$press = false
            module.key.$release = false
            module.key.$repeat = false

            for (const key in module.key.$data) {
                module.key.$data[key].press = false
                module.key.$data[key].release = false
                module.key.$data[key].repeat = false
            }
        }

        const final = error => {
            textures.forEach(e => gl.deleteTexture(e.source))

            gl.deleteBuffer(mesh)
            gl.deleteProgram(program)

            canvas.removeEventListener("mouseenter", mouseEnter)
            canvas.removeEventListener("mouseleave", mouseLeave)
            canvas.removeEventListener("mousedown", mouseDown)
            canvas.removeEventListener("mouseup", mouseUp)
            canvas.removeEventListener("mousemove", mouseMove)
            canvas.removeEventListener("keydown", keyDown)
            canvas.removeEventListener("keyup", keyUp)

            observer.disconnect()
            error ? reject(error) : resolve()
        }

        const loop = () => {
            if (module.window.$close)
                return final()

            try {
                update()
                requestAnimationFrame(loop)
            } catch(e) {final(e)}
        }

        observer.observe(canvas, {attributes: true})
        loop()
    }))

    canvas.addEventListener("mouseenter", mouseEnter)
    canvas.addEventListener("mouseleave", mouseLeave)
    canvas.addEventListener("mousedown", mouseDown)
    canvas.addEventListener("mouseup", mouseUp)
    canvas.addEventListener("mousemove", mouseMove)
    canvas.addEventListener("keydown", keyDown)
    canvas.addEventListener("keyup", keyUp)

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

    gl.shaderSource(vertexShader, `
        attribute vec2 vertex;
        attribute vec2 coordinate;
        varying vec2 position;
        
        uniform mat4 camera;
        uniform mat4 object;
        
        void main(void) {
            gl_Position = camera * object * vec4(vertex, 0, 1);
            position = coordinate;
        }`)

    gl.shaderSource(fragmentShader, `
        precision mediump float;
        varying vec2 position;

        uniform vec4 color;
        uniform sampler2D sampler;
        uniform int image;

        void main(void) {
            if (image == 1) gl_FragColor = texture2D(sampler, position) * color;
            else gl_FragColor = color;
        }`)
    
    gl.compileShader(vertexShader)
    gl.compileShader(fragmentShader)
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    
    gl.linkProgram(program)
    gl.useProgram(program)
    gl.uniform1i(gl.getUniformLocation(program, "sampler"), 0)

    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -.5, .5, 0, 0,
        .5, .5, 1, 0,
        -.5, -.5, 0, 1,
        .5, -.5, 1, 1
    ]), gl.STATIC_DRAW)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)

    module.key.$data = {
        space: {code: "Space"},
        apostrophe: {code: "Quote"},
        comma: {code: "Comma"},
        minus: {code: "Minus"},
        period: {code: "Period"},
        slash: {code: "Slash"},
        _0: {code: "Digit0"},
        _1: {code: "Digit1"},
        _2: {code: "Digit2"},
        _3: {code: "Digit3"},
        _4: {code: "Digit4"},
        _5: {code: "Digit5"},
        _6: {code: "Digit6"},
        _7: {code: "Digit7"},
        _8: {code: "Digit8"},
        _9: {code: "Digit9"},
        semicolon: {code: "Semicolon"},
        equal: {code: "Equal"},
        a: {code: "KeyA"},
        b: {code: "KeyB"},
        c: {code: "KeyC"},
        d: {code: "KeyD"},
        e: {code: "KeyE"},
        f: {code: "KeyF"},
        g: {code: "KeyG"},
        h: {code: "KeyH"},
        i: {code: "KeyI"},
        j: {code: "KeyJ"},
        k: {code: "KeyK"},
        l: {code: "KeyL"},
        m: {code: "KeyM"},
        n: {code: "KeyN"},
        o: {code: "KeyO"},
        p: {code: "KeyP"},
        q: {code: "KeyQ"},
        r: {code: "KeyR"},
        s: {code: "KeyS"},
        t: {code: "KeyT"},
        u: {code: "KeyU"},
        v: {code: "KeyV"},
        w: {code: "KeyW"},
        x: {code: "KeyX"},
        y: {code: "KeyY"},
        z: {code: "KeyZ"},
        left_bracket: {code: "BracketLeft"},
        backslash: {code: "Backslash"},
        right_bracket: {code: "BracketRight"},
        backquote: {code: "Backquote"},
        escape: {code: "Escape"},
        enter: {code: "Enter"},
        tab: {code: "Tab"},
        backspace: {code: "Backspace"},
        insert: {code: "Insert"},
        delete: {code: "Delete"},
        right: {code: "ArrowRight"},
        left: {code: "ArrowLeft"},
        down: {code: "ArrowDown"},
        up: {code: "ArrowUp"},
        page_up: {code: "PageUp"},
        page_down: {code: "PageDown"},
        home: {code: "Home"},
        end: {code: "End"},
        caps_lock: {code: "CapsLock"},
        scroll_lock: {code: "ScrollLock"},
        num_lock: {code: "NumLock"},
        print_screen: {code: "PrintScreen"},
        pause: {code: "Pause"},
        f1: {code: "F1"},
        f2: {code: "F2"},
        f3: {code: "F3"},
        f4: {code: "F4"},
        f5: {code: "F5"},
        f6: {code: "F6"},
        f7: {code: "F7"},
        f8: {code: "F8"},
        f9: {code: "F9"},
        f10: {code: "F10"},
        f11: {code: "F11"},
        f12: {code: "F12"},
        f13: {code: "F13"},
        f14: {code: "F14"},
        f15: {code: "F15"},
        f16: {code: "F16"},
        f17: {code: "F17"},
        f18: {code: "F18"},
        f19: {code: "F19"},
        f20: {code: "F20"},
        f21: {code: "F21"},
        f22: {code: "F22"},
        f23: {code: "F23"},
        f24: {code: "F24"},
        f25: {code: "F25"},
        pad_0: {code: "Numpad0"},
        pad_1: {code: "Numpad1"},
        pad_2: {code: "Numpad2"},
        pad_3: {code: "Numpad3"},
        pad_4: {code: "Numpad4"},
        pad_5: {code: "Numpad5"},
        pad_6: {code: "Numpad6"},
        pad_7: {code: "Numpad7"},
        pad_8: {code: "Numpad8"},
        pad_9: {code: "Numpad9"},
        decimal: {code: "NumpadDecimal"},
        divide: {code: "NumpadDivide"},
        multiply: {code: "NumpadMultiply"},
        subtract: {code: "NumpadSubtract"},
        add: {code: "NumpadAdd"},
        enter: {code: "NumpadEnter"},
        equal: {code: "NumpadEqual"},
        left_shift: {code: "ShiftLeft"},
        left_ctrl: {code: "ControlLeft"},
        left_alt: {code: "AltLeft"},
        left_super: {code: "SuperLeft"},
        right_shift: {code: "ShiftRight"},
        right_ctrl: {code: "ControlRight"},
        right_alt: {code: "AltRight"},
        right_super: {code: "SuperRight"},
        menu: {code: "Menu"}
    }

    return module
}