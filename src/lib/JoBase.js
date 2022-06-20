const $builtinmodule = () => {
    Sk.misceval.print_("Welcome to JoBase\n")

    const canvas = Sk.JoBase
    const module = {}
    const textures = []
    const fonts = []

    const gl = canvas.getContext("webgl")
    const program = gl.createProgram()
    const mesh = gl.createBuffer()

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

    const str = e => new Sk.builtin.str(e)
    const def = e => new Sk.builtin.func(e)
    const float = e => new Sk.builtin.float_(e)
    const int = e => new Sk.builtin.int_(e)
    const bool = e => new Sk.builtin.bool(e)
    const tuple = e => new Sk.builtin.tuple(e)
    const dict = e => new Sk.builtin.dict(e)

    const number = e => {
        if (Sk.builtin.checkNumber(e)) return e.v
        throw new Sk.builtin.TypeError("must be real number, not " + e.tp$name)
    }

    const string = e => {
        if (Sk.builtin.checkString(e)) return e.v
        throw new Sk.builtin.TypeError("must be str, not " + e.tp$name)
    }

    const property = (...args) => call(Sk.builtins.property, ...args)
    const build = (...args) => Sk.misceval.buildClass(module, ...args)
    const call = (...args) => Sk.misceval.callsimOrSuspend(...args)
    const is = (...args) => Sk.builtin.isinstance(...args).v
    const wait = e => Sk.misceval.promiseToSuspension(new Promise(e))
    const file = e => new Sk.builtin.FileNotFoundError(e)
    const object = e => {throw new Sk.builtin.TypeError("must be Shape or cursor, not " + e.tp$name)}

    const path = file => str("https://jobase.org/Browser/JoBase/" + file)
    const width = () => canvas.width / devicePixelRatio
    const height = () => canvas.height / devicePixelRatio
    const x = () => module.cursor.$x - width() / 2
    const y = () => height() / 2 - module.cursor.$y
    const blank = () => {}

    const getPolyLeft = poly => poly.reduce((a, b) => b[0] < a ? b[0] : a, poly[0][0])
    const getPolyTop = poly => poly.reduce((a, b) => b[1] > a ? b[1] : a, poly[0][1])
    const getPolyRight = poly => poly.reduce((a, b) => b[0] > a ? b[0] : a, poly[0][0])
    const getPolyBottom = poly => poly.reduce((a, b) => b[1] < a ? b[1] : a, poly[0][1])

    const mouseEnter = () => module.cursor.$enter = true
    const mouseLeave = () => module.cursor.$leave = true

    const mouseDown = () => {
        module.cursor.$press = true
        module.cursor.$hold = true
    }

    const mouseUp = () => {
        module.cursor.$release = true
        module.cursor.$hold = false
    }

    const mouseMove = event => {
        const rect = canvas.getBoundingClientRect()

        module.cursor.$x = event.clientX - rect.left
        module.cursor.$y = event.clientY - rect.top
        module.cursor.$move = true
    }

    const keyDown = event => {
        const name = Object.keys(module.key.$data).find(k => module.key.$data[k].code == event.code)
        const key = module.key.$data[name]

        if (event.repeat) {
            module.key.$repeat = true
            key && (key.repeat = true)
        }
        
        else {
            module.key.$press = true
            key && (key.press = true) && (key.hold = true)
        }
    }

    const keyUp = event => {
        const name = Object.keys(module.key.$data).find(k => module.key.$data[k].code == event.code)
        const key = module.key.$data[name]

        module.key.$release = true
        key && (key.release = true) && (key.hold = false)
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

    const rotPoly = (poly, angle, pos) => {
        const cos = Math.cos(angle * Math.PI / 180)
        const sin = Math.sin(angle * Math.PI / 180)

        return poly.map(e => [
            e[0] * cos - e[1] * sin + pos[0],
            e[0] * sin + e[1] * cos + pos[1]
        ])
    }

    const getRectPoly = rect => {
        const px = rect.$anchor[0] + rect.$size[0] * rect.$scale[0] / 2
        const py = rect.$anchor[1] + rect.$size[1] * rect.$scale[1] / 2
        const poly = [[-px, py], [px, py], [px, -py], [-px, -py]]
    
        return rotPoly(poly, rect.$angle, rect.$pos)
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
        const name = text.$fontSize + "px _" + fonts.indexOf(text.$font)
        context.font = name

        const size = context.measureText(text.$content)
        const width = size.actualBoundingBoxRight - size.actualBoundingBoxLeft

        const metrics = context.measureText("Sy")
        const height = metrics.actualBoundingBoxDescent + metrics.actualBoundingBoxAscent

        text.$size[0] = canvas.width = width
        text.$size[1] = canvas.height = height

        context.font = name
        context.fillStyle = "#fff"
        context.fillText(text.$content, 0, metrics.actualBoundingBoxAscent)

        gl.deleteTexture(text.$texture)
        text.$texture = createImage(canvas)
    }

    const loadFont = font => new Promise((resolve, reject) => {
        if (fonts.includes(font))
            return resolve()
        
        new FontFace("_" + fonts.length, `url(${font})`).load().then(face => {
            document.fonts.add(face)
            fonts.push(font)
            resolve()
        }).catch(() => reject(file(`failed to load font: "${font}"`)))
    })

    const setUniform = (matrix, color) => {
        gl.uniform4fv(gl.getUniformLocation(program, "color"), new Float32Array(color))
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "object"), false, new Float32Array(matrix))
    }

    const drawShape = (shape, size, buffer, mode, image, count) => {
        const sx = size[0] * shape.$scale[0]
        const sy = size[1] * shape.$scale[1]
        const ax = shape.$anchor[0]
        const ay = shape.$anchor[1]
        const px = shape.$pos[0]
        const py = shape.$pos[1]
        const s = Math.sin(shape.$angle * Math.PI / 180)
        const c = Math.cos(shape.$angle * Math.PI / 180)
    
        setUniform([
            sx * c, sx * s, 0, 0,
            sy * -s, sy * c, 0, 0,
            0, 0, 1, 0,
            ax * c + ay * -s + px, ax * s + ay * c + py, 0, 1
        ], shape.$color)

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.uniform1i(gl.getUniformLocation(program, "image"), image)
        gl.drawArrays(mode, 0, count)
    }

    const collidesWith = def((self, other) => {
        if (is(self, module.Rectangle)) {
            if (is(other, module.Rectangle))
                return bool(collidePolyPoly(getRectPoly(self), getRectPoly(other)))

            else if (other == module.cursor)
                return bool(collidePolyPoint(getRectPoly(self), [x(), y()]))

            object(other)
        }

        if (self == module.cursor) {
            if (is(other, module.Rectangle))
                return bool(collidePolyPoint(getRectPoly(other), [x(), y()]))

            else if (other == module.cursor)
                return Sk.builtins.bool.true$

            object(other)
        }

        object(self)
    })

    const vector = {
        set: (value, array) => {
            if (value.ob$type == vector.class)
                array.forEach((e, i, a) => a[i] = i < value.$data.length ? value.$get()[i] : e)

            else if (Sk.builtin.checkSequence(value))
                array.forEach((e, i, a) => a[i] = i < value.v.length ? value.v[i].v : e)

            else throw new Sk.builtins.TypeError("attribute must be a sequence of values")
            return array
        },

        new: (parent, get, ...data) => {
            const value = call(vector.class)

            value.$parent = parent
            value.$get = get
            value.$data = data.map(e => ({name: e[0], set: e[1]}))

            return value
        },

        class: build((_globals, locals) => {    
            locals.__getattr__ = def((self, name) => {
                const index = self.$data.findIndex(e => e.name == name.v)
                if (index != -1) return float(self.$get()[index])
            })
    
            locals.__setattr__ = def((self, name, value) => {
                const item = self.$data.find(e => e.name == name.v)
                item && item.set(self.$parent, value)
            })
    
            locals.__str__ = def(self => str(`(${self.$get().join(", ")})`))
            locals.__repr__ = def(self => str(`[${self.$get().join(", ")}]`))
        }, "Vector")
    }

    const shape = {
        new: (self, x, y, angle, color) => {
            self.$color = vector.set(color, [0, 0, 0, 1])
            self.$pos = [number(x), number(y)]
            self.$angle = number(angle)
            self.$anchor = [0, 0]
            self.$scale = [1, 1]
        },

        class: build((_globals, locals) => {
            locals.collides_with = collidesWith

            locals.look_at = def((self, other) => {
                const set = (x, y) => {
                    const angle = Math.atan2(y - self.$pos[1], x - self.$pos[0])
                    self.$angle = angle * 180 / Math.PI
                }
    
                other == module.cursor ? set(x(), y()) : is(
                    other, shape.class) ? set(...other.$pos) : object(other)
            })
    
            locals.move_toward = def((self, other, speed) => {
                const pixels = number(speed) ?? 1
    
                const set = (x, y) => {
                    const a = x - self.$pos[0]
                    const b = y - self.$pos[1]
    
                    if (Math.hypot(a, b) < pixels) {
                        self.$pos[0] += a
                        self.$pos[1] += b
                    }
    
                    else {
                        self.$pos[0] += Math.cos(Math.atan2(b, a)) * pixels
                        self.$pos[1] += Math.sin(Math.atan2(b, a)) * pixels
                    }
                }
    
                other == module.cursor ? set(x(), y()) : is(
                    other, shape.class) ? set(...other.$pos) : object(other)
            })

            const x = (self, value) => self.$pos[0] = number(value)
            const y = (self, value) => self.$pos[1] = number(value)

            locals.x = property(def(s => float(s.$pos[0])), def(x))
            locals.y = property(def(s => float(s.$pos[1])), def(y))

            locals.pos = locals.position = property(
                def(self => vector.new(self, () => self.$pos, ["x", x], ["y", y])),
                def((self, value) => vector.set(value, self.$pos)))

            locals.top = property(
                def(self => float(self.$top())),
                def((self, value) => self.$pos[1] += value - self.$top()))

            locals.left = property(
                def(self => float(self.$left())),
                def((self, value) => self.$pos[0] += value - self.$left()))

            locals.bottom = property(
                def(self => float(self.$bottom())),
                def((self, value) => self.$pos[1] += value - self.$bottom()))

            locals.right = property(
                def(self => float(self.$right())),
                def((self, value) => self.$pos[0] += value - self.$right()))

            const scaleX = (self, value) => self.$scale[0] = number(value)
            const scaleY = (self, value) => self.$scale[1] = number(value)

            locals.scale = property(
                def(self => vector.new(self, () => self.$scale, ["x", scaleX], ["y", scaleY])),
                def((self, value) => vector.set(value, self.$scale)))

            const anchorX = (self, value) => self.$anchor[0] = number(value)
            const anchorY = (self, value) => self.$anchor[1] = number(value)

            locals.anchor = property(
                def(self => vector.new(self, () => self.$anchor, ["x", anchorX], ["y", anchorY])),
                def((self, value) => vector.set(value, self.$anchor)))

            locals.angle = property(
                def(self => float(self.$angle)),
                def((self, value) => self.$angle = number(value)))

            const red = (self, value) => self.$color[0] = number(value)
            const green = (self, value) => self.$color[1] = number(value)
            const blue = (self, value) => self.$color[2] = number(value)
            const alpha = (self, value) => self.$color[3] = number(value)

            locals.red = property(def(s => float(s.$color[0])), def(red))
            locals.green = property(def(s => float(s.$color[1])), def(green))
            locals.blue = property(def(s => float(s.$color[2])), def(blue))
            locals.blue = property(def(s => float(s.$color[3])), def(alpha))

            locals.color = property(
                def(self => vector.new(self, () => self.$color, ["red", red], ["green", green], ["blue", blue], ["alpha", alpha])),
                def((self, value) => vector.set(value, self.$color)))
        }, "Shape")
    }

    module.MAN = path("images/man.png")
    module.COIN = path("images/coin.png")
    module.ENEMY = path("images/enemy.png")

    module.DEFAULT = path("fonts/default.ttf")
    module.CODE = path("fonts/code.ttf")
    module.PENCIL = path("fonts/pencil.ttf")
    module.SERIF = path("fonts/serif.ttf")
    module.HANDWRITING = path("fonts/handwriting.ttf")
    module.TYPEWRITER = path("fonts/typewriter.ttf")
    module.JOINED = path("fonts/joined.ttf")

    module.window = call(build((_globals, locals) => {
        const init = (self, caption, _width, _height, color) => {
            self.$caption = string(caption)
            self.$color = vector.set(color, [1, 1, 1])

            gl.clearColor(...self.$color, 1)
        }

        init.$defaults = [str("JoBase"), null, null, tuple()]
        init.co_varnames = ["self", "caption", "width", "height", "color"]
        locals.__init__ = def(init)

        locals.close = def(self => self.$close = true)
        locals.maximize = def(blank)
        locals.minimize = def(blank)
        locals.focus = def(blank)

        locals.caption = property(
            def(self => str(self.$caption)),
            def((self, value) => self.$caption = string(value)))

        const red = (self, value) => {
            self.$color[0] = number(value)
            gl.clearColor(...self.$color, 1)
        }
        
        const green = (self, value) => {
            self.$color[1] = number(value)
            gl.clearColor(...self.$color, 1)
        }

        const blue = (self, value) => {
            self.$color[2] = number(value)
            gl.clearColor(...self.$color, 1)
        }

        locals.red = property(def(s => float(s.$color[0])), def(red))
        locals.green = property(def(s => float(s.$color[1])), def(green))
        locals.blue = property(def(s => float(s.$color[2])), def(blue))

        locals.color = property(
            def(self => vector.new(self, () => self.$color, ["red", red], ["green", green], ["blue", blue])),
            def((self, value) => gl.clearColor(...vector.set(value, self.$color), 1)))
        
        locals.width = property(def(() => float(width())))
        locals.height = property(def(() => float(height())))

        locals.size = property(
            def(self => vector.new(self, () => [width(), height()], ["x", blank], ["y", blank])),
            def((_self, value) => vector.set(value, new Array(2))))

        locals.top = property(def(() => float(height() / 2)))
        locals.bottom = property(def(() => float(height() / -2)))
        locals.left = property(def(() => float(width() / -2)))
        locals.right = property(def(() => float(width() / 2)))
        locals.resize = property(def(self => bool(self.$resize)))
    }, "Window"))

    module.cursor = call(build((_globals, locals) => {
        locals.x = property(def(() => float(x())))
        locals.y = property(def(() => float(y())))

        locals.pos = locals.position = property(
            def(self => vector.new(self, () => [x(), y()], ["x", blank], ["y", blank])),
            def((_self, value) => vector.set(value, new Array(2))))

        locals.move = property(def(self => bool(self.$move)))
        locals.enter = property(def(self => bool(self.$enter)))
        locals.leave = property(def(self => bool(self.$leave)))
        locals.press = property(def(self => bool(self.$press)))
        locals.release = property(def(self => bool(self.$release)))
        locals.hold = property(def(self => bool(self.$hold)))
    }, "Cursor"))

    module.cursor.$x = 0
    module.cursor.$y = 0

    module.key = call(build((_globals, locals) => {
        locals.__getattr__ = def((self, name) => {
            const key = self.$data[name.v]

            if (key) return key.hold || key.release ? dict([
                str("press"), bool(key.press),
                str("release"), bool(key.release),
                str("repeat"), bool(key.repeat)
            ]) : Sk.builtin.bool.false$
        })

        locals.hold = property(def(self => {
            for (const key in self.$data)
                if (self.$data[key].hold)
                    return Sk.builtin.bool.true$

            return Sk.builtin.bool.false$
        }))

        locals.press = property(def(self => bool(self.$press)))
        locals.release = property(def(self => bool(self.$release)))
        locals.repeat = property(def(self => bool(self.$repeat)))
    }, "Key"))

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

    module.camera = call(build((_globals, locals) => {
        const init = (self, x, y) => {self.$pos = [number(x), number(y)]}

        init.$defaults = [int(), int()]
        init.co_varnames = ["self", "x", "y"]
        locals.__init__ = def(init)

        const x = (self, value) => self.$pos[0] = number(value)
        const y = (self, value) => self.$pos[1] = number(value)

        locals.x = property(def(s => float(s.$pos[0])), def(x))
        locals.y = property(def(s => float(s.$pos[1])), def(y))

        locals.pos = locals.position = property(
            def(self => vector.new(self, () => self.$pos, ["x", x], ["y", y])),
            def((self, value) => vector.set(value, self.$pos)))
    }, "Camera"))

    module.Rectangle = build((_globals, locals) => {
        const init = (self, x, y, width, height, angle, color) => {
            shape.new(self, x, y, angle, color)

            self.$size = [number(width), number(height)]
            self.$top = () => getPolyTop(getRectPoly(self))
            self.$left = () => getPolyLeft(getRectPoly(self))
            self.$bottom = () => getPolyBottom(getRectPoly(self))
            self.$right = () => getPolyRight(getRectPoly(self))
        }

        init.$defaults = [int(), int(), int(50), int(50), int(), tuple()]
        init.co_varnames = ["self", "x", "y", "width", "height", "angle", "color"]

        locals.__init__ = def(init)
        locals.draw = def(self => drawShape(self, self.$size, mesh, gl.TRIANGLE_STRIP, false, 4))

        const width = (self, value) => self.$size[0] = number(value)
        const height = (self, value) => self.$size[1] = number(value)

        locals.width = property(def(s => float(s.$size[0])), def(width))
        locals.height = property(def(s => float(s.$size[1])), def(height))

        locals.size = property(
            def(self => vector.new(self, () => self.$size, ["width", width], ["height", height])),
            def((self, value) => vector.set(value, self.$size)))
    }, "Rectangle", [shape.class])

    module.Image = build((_globals, locals) => {
        const init = (self, name, x, y, angle, width, height, color) => wait((resolve, reject) => {
            call(module.Rectangle.prototype.__init__, self, x, y, width, height, angle)
            const texture = textures.find(e => e.name == string(name))

            const set = image => {
                self.$texture = image.source
                self.$size[0] ||= image.width
                self.$size[1] ||= image.height
            }

            self.$color = vector.set(color, [1, 1, 1, 1])
            if (texture) return set(texture), resolve()

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
                set(texture)
                resolve()
            }
        })

        init.$defaults = [module.MAN, int(), int(), int(), int(), int(), tuple()]
        init.co_varnames = ["self", "name", "x", "y", "angle", "width", "height", "color"]
        locals.__init__ = def(init)

        locals.draw = def(self => {
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, self.$texture)
            drawShape(self, self.$size, mesh, gl.TRIANGLE_STRIP, true, 4)
        })
    }, "Image", [module.Rectangle])

    module.Text = build((_globals, locals) => {
        const init = (self, content, x, y, fontSize, angle, color, font) => wait((resolve, reject) => {
            call(module.Rectangle.prototype.__init__, self, x, y, int(), int(), angle, color)

            self.$font = string(font)
            self.$fontSize = number(fontSize)
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
            drawShape(self, self.$size, mesh, gl.TRIANGLE_STRIP, true, 4)
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
        const min = Math.min(number(a), number(b))
        return float(Math.random() * (Math.max(number(a), number(b)) - min) + min)
    })

    module.run = def(() => wait((resolve, reject) => {
        const update = () => {
            const final = error => {
                gl.deleteBuffer(mesh)
                gl.deleteProgram(program)

                textures.forEach(e => gl.deleteTexture(e.source))
                size.disconnect()

                canvas.removeEventListener("mouseenter", mouseEnter)
                canvas.removeEventListener("mouseleave", mouseLeave)
                canvas.removeEventListener("mousedown", mouseDown)
                canvas.removeEventListener("mouseup", mouseUp)
                canvas.removeEventListener("mousemove", mouseMove)
                canvas.removeEventListener("keydown", keyDown)
                canvas.removeEventListener("keyup", keyUp)
    
                cancelAnimationFrame(process.frame)
                error ? reject(error) : resolve()
            }

            if (module.window.$close || Date.now() - Sk.execStart > Sk.execLimit)
                return final()

            const px = module.camera.$pos[0];
            const py = module.camera.$pos[1];
        
            const matrix = new Float32Array([
                2 / width(), 0, 0, 0,
                0, 2 / height(), 0, 0,
                0, 0, -2, 0,
                -px * 2 / width(), -py * 2 / height(), -1, 1
            ])

            gl.uniformMatrix4fv(gl.getUniformLocation(program, "camera"), false, matrix)
            gl.clear(gl.COLOR_BUFFER_BIT)

            try {process.main.$d.loop && call(process.main.$d.loop)}
            catch (e) {final(e)}

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

        const loop = () => {
            process.frame = requestAnimationFrame(loop)
            update()
        }

        const process = {
            main: Sk.importModule("__main__", false, true),
            frame: requestAnimationFrame(loop)
        }

        const size = new MutationObserver(() => {
            gl.viewport(0, 0, canvas.width, canvas.height)
            module.window.$resize = true

            update()
        })

        size.observe(canvas, {attributes: true})
    }))

    canvas.addEventListener("mouseenter", mouseEnter)
    canvas.addEventListener("mouseleave", mouseLeave)
    canvas.addEventListener("mousedown", mouseDown)
    canvas.addEventListener("mouseup", mouseUp)
    canvas.addEventListener("mousemove", mouseMove)
    canvas.addEventListener("keydown", keyDown)
    canvas.addEventListener("keyup", keyUp)

    canvas.tabIndex = 0
    canvas.focus()

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

    gl.vertexAttribPointer(gl.getAttribLocation(program, "vertex"), 2, gl.FLOAT, false, 16, 0)
    gl.vertexAttribPointer(gl.getAttribLocation(program, "coordinate"), 2, gl.FLOAT, false, 16, 8)
    gl.enableVertexAttribArray(0)
    gl.enableVertexAttribArray(1)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)

    return module
}