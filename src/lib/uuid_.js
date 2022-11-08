function $builtinmodule() {
    const uuid = {
        __name__: new pyStr("uuid"),
    };

    // Unique ID creation requires a high quality random # generator. In the browser we therefore
    // require the crypto API and do not support built-in fallback to lower quality random number
    // generators (like Math.random()).

    let getRandomValues;

    const rnds8 = new Uint8Array(16);

    function rng() {
        // lazy load so that environments that need to polyfill have a chance to do so
        if (!getRandomValues) {
            // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
            // find the complete implementation of crypto (msCrypto) on IE11.
            getRandomValues =
                (typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
                (typeof msCrypto !== "undefined" &&
                    typeof msCrypto.getRandomValues === "function" &&
                    msCrypto.getRandomValues.bind(msCrypto));
        }
        return getRandomValues(rnds8);
    }

    const byteToHex = [];

    for (let i = 0; i < 256; ++i) {
        byteToHex.push((i + 0x100).toString(16).substr(1));
    }

    function stringify(arr, offset = 0) {
        // Note: Be careful editing this code!  It's been tuned for performance
        // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
        const uuid = (
            byteToHex[arr[offset + 0]] +
            byteToHex[arr[offset + 1]] +
            byteToHex[arr[offset + 2]] +
            byteToHex[arr[offset + 3]] +
            "-" +
            byteToHex[arr[offset + 4]] +
            byteToHex[arr[offset + 5]] +
            "-" +
            byteToHex[arr[offset + 6]] +
            byteToHex[arr[offset + 7]] +
            "-" +
            byteToHex[arr[offset + 8]] +
            byteToHex[arr[offset + 9]] +
            "-" +
            byteToHex[arr[offset + 10]] +
            byteToHex[arr[offset + 11]] +
            byteToHex[arr[offset + 12]] +
            byteToHex[arr[offset + 13]] +
            byteToHex[arr[offset + 14]] +
            byteToHex[arr[offset + 15]]
        ).toLowerCase();

        // Consistency check for valid UUID.  If this throws, it's likely due to one
        // of the following:
        // - One or more input array values don't map to a hex octet (leading to
        // "undefined" in the uuid)
        // - Invalid input values for the RFC `version` or `variant` fields
        if (!validate(uuid)) {
            throw TypeError("Stringified UUID is invalid");
        }

        return uuid;
    }

    function v35(name, version, hashfunc) {
        function generateUUID(value, namespace, buf, offset) {
            if (typeof value === "string") {
                value = stringToBytes(value);
            }

            if (typeof namespace === "string") {
                namespace = parse(namespace);
            }

            if (namespace.length !== 16) {
                throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
            }

            // Compute hash of namespace and value, Per 4.3
            // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
            // hashfunc([...namespace, ... value])`
            let bytes = new Uint8Array(16 + value.length);
            bytes.set(namespace);
            bytes.set(value, namespace.length);
            bytes = hashfunc(bytes);

            bytes[6] = (bytes[6] & 0x0f) | version;
            bytes[8] = (bytes[8] & 0x3f) | 0x80;

            return bytes;
        }
        // Function#name is not settable on some platforms (#270)
        try {
            generateUUID.name = name;
            // eslint-disable-next-line no-empty
        } catch (err) {}
        return generateUUID;
    }

    import v35 from './v35.js';
import sha1 from './sha1.js';

const v5 = v35('v5', 0x50, sha1);

    function v4() {
        const rnds = rnt();
        // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
        rnds[6] = (rnds[6] & 0x0f) | 0x40;
        rnds[8] = (rnds[8] & 0x3f) | 0x80;
    }

    uuid.UUID = buildNativeClass("uuid.UUID", {
        constructor: function UUID() {},
        slots: {
            tp$str() {
                return new pyStr(stringify(this.$b));
            },
        },
        getsets: {
            bytes: {},
            int: {},
            hex: {},
        },
    });

    setUpModuleMethods("uuid", uuid, {
        uuid4: {
            $meth() {
                const bytes = v4();
                return new uuid.UUID(bytes);
            },
        },
    });
}
