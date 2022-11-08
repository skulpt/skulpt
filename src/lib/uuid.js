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
        abstr: { buildNativeClass, checkArgsLen, copyKeywordsToNamedArgs, setUpModuleMethods },
        misceval: { callsimArray: pyCall, richCompareBool },
    } = Sk;

    const mod = {
        __name__: new pyStr("uuid"),
        RESERVED_NCS: pyNone,
        RFC_4122: pyNone,
        RESERVED_FUTURE: pyNone,
    };

    const fromBytes = pyInt.tp$getattr(new pyStr("from_bytes"));
    const toBytes = pyInt.tp$getattr(new pyStr("to_bytes"));
    const _intMax = new pyInt(1).nb$lshift(new pyInt(128));
    const _0 = new pyInt(0);
    const _4 = new pyInt(4);
    const _16 = new pyInt(16);

    const _s_big = new pyStr("big");
    const _s_32bit = new pyStr("%032x");

    const lt = (a, b) => richCompareBool(a, b, "Lt");
    const ge = (a, b) => richCompareBool(a, b, "GtE");

    function notImplemented() {
        throw new pyNotImplementedError("Not yet implemneted in Skulpt");
    }

    const UUID = (mod.UUID = buildNativeClass("uuid.UUID", {
        constructor: function () {},
        slots: {
            tp$init(args, kws) {
                checkArgsLen("UUID", args, 0, 6);
                let [hex, bytes, bytes_le, fields, int, version, is_safe] = copyKeywordsToNamedArgs(
                    "UUID",
                    ["hex", "bytes", "bytes_le", "fields", "int" , "version", "is_safe"],
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
                    hex = hex.replaceAll("-", "");
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
                    bytes = [
                        bytes_le[3],
                        bytes_le[2],
                        bytes_le[1],
                        bytes_le[0],
                        bytes_le[5],
                        bytes_le[4],
                        bytes_le[7],
                        bytes_le[6],
                    ];
                    bytes.push(...bytes_le.slice(8));
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
            tp$repr() {
                const name = this.tp$name;
                const s = new pyStr(this);
                return new pyStr(`${name}(${s})`);
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
            }
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
                    const bytes_le = [bytes[3], bytes[2], bytes[1], bytes[0], bytes[5], bytes[4], bytes[7], bytes[6]];
                    bytes_le.push(...bytes.slice(8));
                    return new pyBytes(bytes_le);
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
