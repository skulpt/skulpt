function $builtinmodule() {
    const {
        builtin: {
            bytes: pyBytes,
            str: pyStr,
            int_: pyInt,
            TypeError: pyTypeError,
            ValueError: pyValueError,
            NotImplementedError: pyNotImplementedError,
            none: { none$: pyNone },
            NotImplemented: { NotImplemented$: pyNotImplemented },
        },
        abstr: { buildNativeClass, checkArgsLen, copyKeywordsToNamedArgs, lookupSpecial, setUpModuleMethods },
        misceval: { callsimArray: pyCall, objectRepr, richCompareBool },
    } = Sk;

    const mod = {
        __name__: new pyStr("uuid"),
        RESERVED_NCS: pyNone,
        RFC_4122: pyNone,
        RESERVED_FUTURE: pyNone,
    };

    let crypto = Sk.global.crypto;

    if (typeof crypto === "undefined") {
        // polyfill for node so the tests work
        crypto = {
            getRandomValues(u8) {
                let l = u8.length;
                while (l--) {
                    u8[l] = Math.floor(Math.random() * 256);
                }
                return u8;
            },
        };
    }

    const fromBytes = pyInt.tp$getattr(new pyStr("from_bytes"));
    const toBytes = pyInt.tp$getattr(new pyStr("to_bytes"));
    const _intMax = new pyInt(1).nb$lshift(new pyInt(128));
    const _0 = new pyInt(0);
    const _4 = new pyInt(4);
    const _16 = new pyInt(16);

    const _s_big = new pyStr("big");
    const _s_32bit = new pyStr("%032x");

    const _r_dash = /-/g;

    const lt = (a, b) => richCompareBool(a, b, "Lt");
    const ge = (a, b) => richCompareBool(a, b, "GtE");

    function notImplemented() {
        throw new pyNotImplementedError("Not yet implemneted in Skulpt");
    }

    function switchBytesBytesLe(b) {
        const t = new Uint8Array(b);
        t[0] = b[3];
        t[1] = b[2];
        t[2] = b[1];
        t[3] = b[0];
        t[4] = b[5];
        t[5] = b[4];
        t[6] = b[7];
        t[7] = b[6];
        return t;
    }

    const UUID = (mod.UUID = buildNativeClass("uuid.UUID", {
        constructor: function () {},
        slots: {
            tp$init(args, kws) {
                checkArgsLen("UUID", args, 0, 6);
                let [hex, bytes, bytes_le, fields, int, version, is_safe] = copyKeywordsToNamedArgs(
                    "UUID",
                    ["hex", "bytes", "bytes_le", "fields", "int", "version", "is_safe"],
                    args,
                    kws,
                    [pyNone, pyNone, pyNone, pyNone, pyNone, pyNone, pyNone]
                );

                if ([hex, bytes, bytes_le, fields, int].filter((x) => x === pyNone).length !== 4) {
                    throw new pyTypeError("one of the hex, bytes, bytes_le, fields, or int arguments must be given");
                }

                if (hex !== pyNone) {
                    hex = hex.toString().replace("urn:", "").replace("uuid:", "");
                    let start = 0,
                        end = hex.length - 1;
                    while ("{}".indexOf(hex[start]) >= 0) {
                        start++;
                    }
                    while ("{}".indexOf(hex[end]) >= 0) {
                        end--;
                    }
                    hex = hex.slice(start, end + 1);
                    hex = hex.replace(_r_dash, "");
                    if (hex.length !== 32) {
                        throw new pyValueError("badly formed hexadecimal UUID string");
                    }
                    int = pyCall(pyInt, [new pyStr(hex), _16]);
                }

                if (bytes_le !== pyNone) {
                    if (!(bytes_le instanceof pyBytes)) {
                        throw new pyTypeError("bytes_le should be a bytes instance");
                    }
                    bytes_le = bytes_le.valueOf();
                    if (bytes_le.length !== 16) {
                        throw new pyValueError("bytes_le is not a 16-char string");
                    }
                    bytes = switchBytesBytesLe(bytes_le);
                    bytes = new pyBytes(bytes);
                }
                if (bytes !== pyNone) {
                    if (!(bytes instanceof pyBytes)) {
                        throw new pyTypeError("bytes_le should be a bytes instance");
                    }
                    if (bytes.valueOf().length !== 16) {
                        throw new pyValueError("bytes is not a 16-char string");
                    }
                    int = pyCall(fromBytes, [bytes], ["byteorder", _s_big]);
                }
                if (fields !== pyNone) {
                    throw new pyNotImplementedError("fields argument is not yet supported");
                }
                if (int !== pyNone) {
                    if (lt(int, _0) || ge(int, _intMax)) {
                        throw new pyValueError("int is out of range (need a 128-bit value)");
                    }
                }

                this.$int = int;
                this.$isSafe = is_safe;
            },
            tp$str() {
                const hex = _s_32bit.nb$remainder(this.$int).toString();
                return new pyStr(
                    `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
                );
            },
            $r() {
                const name = lookupSpecial(this.ob$type, pyStr.$name);
                const str = objectRepr(this.tp$str());
                return new pyStr(`${name}(${str})`);
            },
            tp$hash() {
                return this.$int.tp$hash();
            },
            tp$richcompare(other, op) {
                if (!(other instanceof UUID)) {
                    return pyNotImplemented;
                }
                return this.$int.tp$richcompare(other.$int, op);
            },
            tp$as_number: true,
            nb$int() {
                return this.$int;
            },
        },
        getsets: {
            int: {
                $get() {
                    return this.$int;
                },
            },
            is_safe: {
                $get() {
                    return this.$isSafe;
                },
            },
            bytes: {
                $get() {
                    return pyCall(toBytes, [this.$int, _16, _s_big]);
                },
            },
            bytes_le: {
                $get() {
                    const bytes = this.tp$getattr(new pyStr("bytes")).valueOf();
                    return new pyBytes(switchBytesBytesLe(bytes));
                },
            },
            fields: {
                $get() {
                    return notImplemented();
                },
            },
            time_low: {
                $get() {
                    return notImplemented();
                },
            },
            time_mid: {
                $get() {
                    return notImplemented();
                },
            },
            time_hi_version: {
                $get() {
                    return notImplemented();
                },
            },
            clock_seq_hi_variant: {
                $get() {
                    return notImplemented();
                },
            },
            clock_seq_low: {
                $get() {
                    return notImplemented();
                },
            },
            time: {
                $get() {
                    return notImplemented();
                },
            },
            clock_seq: {
                $get() {
                    return notImplemented();
                },
            },
            node: {
                $get() {
                    return notImplemented();
                },
            },
            hex: {
                $get() {
                    return _s_32bit.nb$remainder(this.$int);
                },
            },
            urn: {
                $get() {
                    return new pyStr(`urn:uuid:${this}`);
                },
            },
            variant: {
                $get() {
                    return notImplemented();
                },
            },
            version: {
                $get() {
                    return notImplemented();
                },
            },
        },
    }));

    setUpModuleMethods("uuid", mod, {
        uuid1: {
            $meth() {
                notImplemented();
            },
            $flags: { FastCall: true },
        },
        uuid2: {
            $meth() {
                notImplemented();
            },
            $flags: { FastCall: true },
        },
        uuid3: {
            $meth() {
                notImplemented();
            },
            $flags: { FastCall: true },
        },
        uuid4: {
            $meth() {
                const bytes = new pyBytes(crypto.getRandomValues(new Uint8Array(16)));
                return pyCall(UUID, [], ["bytes", bytes, "version", _4]);
            },
            $flags: { NoArgs: true },
        },
        uuid5: {
            $meth() {
                notImplemented();
            },
            $flags: { FastCall: true },
        },
    });

    return mod;
}
