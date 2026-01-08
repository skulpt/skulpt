// ========================================================================
// Python Regex Parser - Exported for testing
// Converts Python regex patterns to JavaScript regex patterns
// ========================================================================

function getReParser() {
    // Pre-compiled regex patterns for performance
    const RE_CHAR_CLASS_ESCAPES = /[dDwWsS]/;
    const RE_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/;
    const RE_SPECIAL_CHARS_IN_CLASS = /[.*+?^${}()|[\]\\-]/;
    const RE_HEX_DIGIT = /[0-9a-fA-F]/;
    const RE_OCTAL_DIGIT = /[0-7]/;
    const RE_INVALID_OCTAL = /[89]/;
    const RE_ALPHA = /[a-zA-Z]/;
    const RE_BACKREF_START = /[1-9]/;
    const RE_DIGIT = /[0-9]/;
    const RE_GROUP_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    const RE_INLINE_FLAGS_START = /[aiLmsux-]/;
    const RE_INLINE_FLAGS = /[aiLmsux]/;
    const RE_INCOMPATIBLE_FLAGS = /[auL]/;

    // Access Unicode character classes from Sk.builtin.str._unicode (set in str.js)
    // Build Python-compatible character classes lazily
    let _unicodeClasses = null;
    function getUnicodeClasses() {
        if (_unicodeClasses) return _unicodeClasses;
        const U = Sk.builtin.str._unicode;
        _unicodeClasses = {
            // Python \d: Only decimal digits (Nd), not all numeric (N)
            d: U.Nd,
            // Python \w: Letters + decimal digits + connector punctuation
            w: U.L + U.Nd + U.Pc,
            // Python \s: Whitespace including Unicode space separators
            s: "\\t\\n\\r\\f\\v\\x1c-\\x1f\\x85" + U.Zs,
        };
        return _unicodeClasses;
    }

    // AST Node Types
    class RegexNode {
        constructor(type) {
            this.type = type;
        }
    }
    class Literal extends RegexNode {
        constructor(char) {
            super("Literal");
            this.char = char;
        }
    }
    class Escape extends RegexNode {
        constructor(sequence) {
            super("Escape");
            this.sequence = sequence;
        }
    }
    class Dot extends RegexNode {
        constructor() {
            super("Dot");
        }
    }
    class Anchor extends RegexNode {
        constructor(anchorType) {
            super("Anchor");
            this.anchorType = anchorType;
        }
    }
    class CharacterClass extends RegexNode {
        constructor(negated, items) {
            super("CharacterClass");
            this.negated = negated;
            this.items = items;
        }
    }
    class Group extends RegexNode {
        constructor(capturing, name, subpattern) {
            super("Group");
            this.capturing = capturing;
            this.name = name;
            this.subpattern = subpattern;
        }
    }
    class Backreference extends RegexNode {
        constructor(ref) {
            super("Backreference");
            this.ref = ref;
        }
    }
    class Lookaround extends RegexNode {
        constructor(positive, forward, subpattern) {
            super("Lookaround");
            this.positive = positive;
            this.forward = forward;
            this.subpattern = subpattern;
        }
    }
    class Quantifier extends RegexNode {
        constructor(min, max, greedy, child) {
            super("Quantifier");
            this.min = min;
            this.max = max;
            this.greedy = greedy;
            this.child = child;
        }
    }
    class Alternation extends RegexNode {
        constructor(branches) {
            super("Alternation");
            this.branches = branches;
        }
    }
    class Sequence extends RegexNode {
        constructor(elements) {
            super("Sequence");
            this.elements = elements;
        }
    }
    class InlineFlags extends RegexNode {
        constructor(flags) {
            super("InlineFlags");
            this.flags = flags;
        }
    }

    // Tokenizer - handles surrogate pairs for proper Unicode support
    class Tokenizer {
        constructor(pattern) {
            this.pattern = pattern;
            this.pos = 0;
            this.length = pattern.length;
        }

        // Check if code unit is a high surrogate
        isHighSurrogate(code) {
            return code >= 0xd800 && code <= 0xdbff;
        }
        isLowSurrogate(code) {
            return code >= 0xdc00 && code <= 0xdfff;
        }

        // Peek at next character (handling surrogate pairs)
        peek(offset = 0) {
            let idx = this.pos;
            // Skip forward by 'offset' characters, accounting for surrogate pairs
            for (let i = 0; i < offset && idx < this.length; i++) {
                const code = this.pattern.charCodeAt(idx);
                idx +=
                    this.isHighSurrogate(code) &&
                    idx + 1 < this.length &&
                    this.isLowSurrogate(this.pattern.charCodeAt(idx + 1))
                        ? 2
                        : 1;
            }
            if (idx >= this.length) return null;
            const code = this.pattern.charCodeAt(idx);
            // Return full character (may be surrogate pair)
            if (
                this.isHighSurrogate(code) &&
                idx + 1 < this.length &&
                this.isLowSurrogate(this.pattern.charCodeAt(idx + 1))
            ) {
                return this.pattern.slice(idx, idx + 2);
            }
            return this.pattern[idx];
        }

        // Get next character (handling surrogate pairs)
        get() {
            if (this.pos >= this.length) return null;
            const code = this.pattern.charCodeAt(this.pos);
            if (
                this.isHighSurrogate(code) &&
                this.pos + 1 < this.length &&
                this.isLowSurrogate(this.pattern.charCodeAt(this.pos + 1))
            ) {
                const char = this.pattern.slice(this.pos, this.pos + 2);
                this.pos += 2;
                return char;
            }
            return this.pattern[this.pos++];
        }

        match(char) {
            const next = this.peek();
            if (next === char) {
                this.get();
                return true;
            }
            return false;
        }

        getwhile(predicate) {
            let result = "";
            while (this.pos < this.length) {
                const char = this.peek();
                if (!char || !predicate(char)) break;
                result += this.get();
            }
            return result;
        }

        getUntil(char) {
            let result = "";
            while (this.pos < this.length) {
                const next = this.peek();
                if (!next || next === char) break;
                result += this.get();
            }
            return result;
        }

        error(msg, pos) {
            throw new SyntaxError(`${msg} at position ${pos !== undefined ? pos : this.pos}`);
        }
    }

    // Parser
    class RegexParser {
        constructor(pattern) {
            this.tokenizer = new Tokenizer(pattern);
            this.groupCount = 0;
            this.groupNames = new Set();
            this.openGroups = new Set();       // open named groups
            this.openGroupNumbers = new Set(); // open numbered groups
        }

        parse() {
            const result = this.parseAlternation();
            if (this.tokenizer.peek() !== null) {
                this.tokenizer.error(`Unexpected character '${this.tokenizer.peek()}'`);
            }
            return result;
        }

        parseAlternation() {
            const branches = [this.parseSequence()];
            while (this.tokenizer.match("|")) {
                branches.push(this.parseSequence());
            }
            return branches.length === 1 ? branches[0] : new Alternation(branches);
        }

        parseSequence() {
            const elements = [];
            while (true) {
                const next = this.tokenizer.peek();
                if (next === null || next === "|" || next === ")") break;
                elements.push(this.parseQuantified());
            }
            if (elements.length === 0) return new Sequence([]);
            if (elements.length === 1) return elements[0];
            return new Sequence(elements);
        }

        parseQuantified() {
            const atom = this.parseAtom();
            const next = this.tokenizer.peek();
            let min,
                max,
                greedy = true;

            if (next === "*") {
                this.tokenizer.get();
                min = 0;
                max = null;
            } else if (next === "+") {
                this.tokenizer.get();
                min = 1;
                max = null;
            } else if (next === "?") {
                this.tokenizer.get();
                min = 0;
                max = 1;
            } else if (next === "{") {
                const quantifier = this.parseRepetition();
                if (quantifier) {
                    min = quantifier.min;
                    max = quantifier.max;
                } else return atom;
            } else return atom;

            if (this.tokenizer.peek() === "?") {
                this.tokenizer.get();
                greedy = false;
            }
            return new Quantifier(min, max, greedy, atom);
        }

        parseRepetition() {
            const startPos = this.tokenizer.pos;
            this.tokenizer.get();
            let min = this.tokenizer.getwhile((c) => c >= "0" && c <= "9");
            let max = "",
                hasComma = false;
            if (this.tokenizer.peek() === ",") {
                hasComma = true;
                this.tokenizer.get();
                max = this.tokenizer.getwhile((c) => c >= "0" && c <= "9");
            }
            if (this.tokenizer.peek() !== "}") {
                this.tokenizer.pos = startPos;
                return null;
            }
            this.tokenizer.get();

            // {} without digits is not a valid quantifier - treat as literal
            if (min === "" && !hasComma) {
                this.tokenizer.pos = startPos;
                return null;
            }
            if (!hasComma) return { min: parseInt(min, 10), max: parseInt(min, 10) };
            if (min === "" && max !== "") return { min: 0, max: parseInt(max, 10) };
            if (min !== "" && max === "") return { min: parseInt(min, 10), max: null };
            if (min !== "" && max !== "") return { min: parseInt(min, 10), max: parseInt(max, 10) };
            return { min: 0, max: null };
        }

        parseAtom() {
            const char = this.tokenizer.peek();
            if (char === "(") return this.parseGroup();
            if (char === "[") return this.parseCharacterClass();
            if (char === "\\") return this.parseEscape();
            if (char === ".") {
                this.tokenizer.get();
                return new Dot();
            }
            if (char === "^") {
                this.tokenizer.get();
                return new Anchor("start");
            }
            if (char === "$") {
                this.tokenizer.get();
                return new Anchor("end");
            }
            // Handle { specially - it's a literal only if not a valid quantifier
            if (char === "{") {
                const startPos = this.tokenizer.pos;
                this.tokenizer.get();
                // Check if this could be a valid quantifier (has digits or comma)
                const next = this.tokenizer.peek();
                if (next >= "0" && next <= "9" || next === ",") {
                    // This looks like a quantifier - reset and let it error
                    this.tokenizer.pos = startPos;
                    this.tokenizer.error("nothing to repeat");
                }
                // Not a valid quantifier start, treat { as literal
                return new Literal(char);
            }
            if (char !== null && !"|)*+?".includes(char)) {
                this.tokenizer.get();
                return new Literal(char);
            }
            this.tokenizer.error(`Unexpected character '${char}'`);
        }

        parseGroup() {
            this.tokenizer.get();
            if (this.tokenizer.peek() === "?") {
                this.tokenizer.get();
                const next = this.tokenizer.peek();

                if (next === ":") {
                    this.tokenizer.get();
                    const subpattern = this.parseAlternation();
                    if (!this.tokenizer.match(")")) this.tokenizer.error("Unclosed group");
                    return new Group(false, null, subpattern);
                } else if (next === "P") {
                    this.tokenizer.get();
                    const nextNext = this.tokenizer.peek();
                    if (nextNext === "<") {
                        this.tokenizer.get();
                        const name = this.tokenizer.getUntil(">");
                        if (!this.tokenizer.match(">")) this.tokenizer.error("Unclosed group name");
                        if (!name || !RE_GROUP_NAME.test(name))
                            this.tokenizer.error(`Invalid group name '${name}'`);
                        if (this.groupNames.has(name)) this.tokenizer.error(`Duplicate group name '${name}'`);
                        this.groupNames.add(name);
                        this.openGroups.add(name);
                        this.groupCount++;
                        const groupNum = this.groupCount;
                        this.openGroupNumbers.add(groupNum);
                        const subpattern = this.parseAlternation();
                        if (!this.tokenizer.match(")")) this.tokenizer.error("Unclosed group");
                        this.openGroups.delete(name);
                        this.openGroupNumbers.delete(groupNum);
                        return new Group(true, name, subpattern);
                    } else if (nextNext === "=") {
                        this.tokenizer.get();
                        const name = this.tokenizer.getUntil(")");
                        if (!this.tokenizer.match(")")) this.tokenizer.error("Unclosed backreference");
                        if (!this.groupNames.has(name)) this.tokenizer.error(`Unknown group name '${name}'`);
                        if (this.openGroups.has(name)) this.tokenizer.error("cannot refer to an open group");
                        return new Backreference(name);
                    } else this.tokenizer.error(`Unknown group type '(?P${nextNext}'`);
                } else if (next === "=") {
                    this.tokenizer.get();
                    const subpattern = this.parseAlternation();
                    if (!this.tokenizer.match(")")) this.tokenizer.error("Unclosed lookahead");
                    return new Lookaround(true, true, subpattern);
                } else if (next === "!") {
                    this.tokenizer.get();
                    const subpattern = this.parseAlternation();
                    if (!this.tokenizer.match(")")) this.tokenizer.error("Unclosed lookahead");
                    return new Lookaround(false, true, subpattern);
                } else if (next === "<") {
                    this.tokenizer.get();
                    const lookType = this.tokenizer.peek();
                    if (lookType === "=" || lookType === "!") {
                        this.tokenizer.get();
                        const subpattern = this.parseAlternation();
                        if (!this.tokenizer.match(")")) this.tokenizer.error("Unclosed lookbehind");
                        return new Lookaround(lookType === "=", false, subpattern);
                    } else this.tokenizer.error(`Unknown lookbehind type '(?<${lookType}'`);
                } else if (RE_INLINE_FLAGS_START.test(next)) {
                    // Parse inline flags with full validation
                    let onFlags = "",
                        offFlags = "";
                    const flagStartPos = this.tokenizer.pos;

                    if (next === "-") {
                        // Negative flags only: (?-flags:...)
                        this.tokenizer.get();
                        const negNext = this.tokenizer.peek();
                        if (!negNext || negNext === ":" || negNext === ")") {
                            this.tokenizer.error("missing flag");
                        }
                        if (!RE_INLINE_FLAGS.test(negNext)) {
                            this.tokenizer.error("unknown flag");
                        }
                        offFlags = this.tokenizer.getwhile((c) => RE_INLINE_FLAGS.test(c));
                        // After negative flags must be :
                        const afterOff = this.tokenizer.peek();
                        if (afterOff && RE_ALPHA.test(afterOff)) {
                            this.tokenizer.error("unknown flag");
                        }
                        if (afterOff !== ":") {
                            this.tokenizer.error("missing :");
                        }
                        // Check for turning off a, u, L flags
                        if (RE_INCOMPATIBLE_FLAGS.test(offFlags)) {
                            this.tokenizer.error("bad inline flags: cannot turn off flags 'a', 'u' and 'L'");
                        }
                    } else {
                        // Positive flags first
                        onFlags = this.tokenizer.getwhile((c) => RE_INLINE_FLAGS.test(c));

                        // Check for incompatible flags
                        let auL = 0;
                        if (onFlags.includes("a")) auL++;
                        if (onFlags.includes("u")) auL++;
                        if (onFlags.includes("L")) auL++;
                        if (auL > 1) {
                            this.tokenizer.error("bad inline flags: flags 'a', 'u' and 'L' are incompatible");
                        }

                        const afterFlags = this.tokenizer.peek();
                        if (afterFlags === ")") {
                            this.tokenizer.get();
                            return new InlineFlags(onFlags);
                        }
                        if (afterFlags === ":") {
                            this.tokenizer.get();
                            const subpattern = this.parseAlternation();
                            if (!this.tokenizer.match(")"))
                                this.tokenizer.error("missing ), unterminated subpattern", 0);
                            return new Group(false, null, subpattern);
                        }
                        if (afterFlags === "-") {
                            // Negative flags after positive: (?on-off:...)
                            this.tokenizer.get();
                            const negNext = this.tokenizer.peek();
                            if (!negNext || negNext === ":" || negNext === ")") {
                                this.tokenizer.error("missing flag");
                            }
                            if (!RE_INLINE_FLAGS.test(negNext)) {
                                this.tokenizer.error("unknown flag");
                            }
                            offFlags = this.tokenizer.getwhile((c) => RE_INLINE_FLAGS.test(c));
                            const afterOff = this.tokenizer.peek();
                            if (afterOff && RE_ALPHA.test(afterOff)) {
                                this.tokenizer.error("unknown flag");
                            }
                            if (afterOff !== ":") {
                                this.tokenizer.error("missing :");
                            }
                            // Check for same flag on and off
                            for (const f of onFlags) {
                                if (offFlags.includes(f)) {
                                    this.tokenizer.error("bad inline flags: flag turned on and off");
                                }
                            }
                            // Check for turning off a, u, L flags
                            if (RE_INCOMPATIBLE_FLAGS.test(offFlags)) {
                                this.tokenizer.error("bad inline flags: cannot turn off flags 'a', 'u' and 'L'");
                            }
                        } else if (afterFlags && RE_ALPHA.test(afterFlags)) {
                            this.tokenizer.error("unknown flag");
                        } else {
                            this.tokenizer.error("missing -, : or )");
                        }
                    }

                    // Continue with scoped flags: (?flags:...)
                    if (this.tokenizer.peek() === ":") {
                        this.tokenizer.get();
                        const subpattern = this.parseAlternation();
                        if (!this.tokenizer.match(")")) this.tokenizer.error("missing ), unterminated subpattern", 0);
                        return new Group(false, null, subpattern);
                    }
                    this.tokenizer.error("missing :");
                } else this.tokenizer.error(`Unknown group type '(?${next}'`);
            } else {
                this.groupCount++;
                const groupNum = this.groupCount;
                this.openGroupNumbers.add(groupNum);
                const subpattern = this.parseAlternation();
                if (!this.tokenizer.match(")")) this.tokenizer.error("Unclosed group");
                this.openGroupNumbers.delete(groupNum);
                return new Group(true, null, subpattern);
            }
        }

        parseCharacterClass() {
            this.tokenizer.get();
            const negated = this.tokenizer.match("^");
            const items = [];
            if (this.tokenizer.peek() === "]") {
                this.tokenizer.get();
                items.push({ type: "literal", char: "]", wasEscaped: false });
            }

            while (this.tokenizer.peek() !== "]" && this.tokenizer.peek() !== null) {
                const item = this.parseCharacterClassItem();
                if (
                    this.tokenizer.peek() === "-" &&
                    this.tokenizer.peek(1) !== "]" &&
                    this.tokenizer.peek(1) !== null
                ) {
                    const dashPos = this.tokenizer.pos;
                    this.tokenizer.get();
                    const end = this.parseCharacterClassItem();
                    if (item.type === "literal" && end.type === "literal") {
                        // Validate range order - use codePointAt for proper Unicode support
                        const startCode = item.char.codePointAt(0);
                        const endCode = end.char.codePointAt(0);
                        if (startCode > endCode) {
                            this.tokenizer.error(`bad character range ${item.char}-${end.char}`, dashPos - 1);
                        }
                        items.push({ type: "range", start: item.char, end: end.char });
                    } else {
                        // Range with escape class is an error
                        const startStr = item.type === "escape" ? `\\${item.sequence}` : item.char;
                        const endStr = end.type === "escape" ? `\\${end.sequence}` : end.char;
                        this.tokenizer.error(`bad character range ${startStr}-${endStr}`, dashPos - 1);
                    }
                } else items.push(item);
            }
            if (!this.tokenizer.match("]")) this.tokenizer.error("Unclosed character class");
            return new CharacterClass(negated, items);
        }

        parseCharacterClassItem() {
            const char = this.tokenizer.peek();
            if (char === "\\") {
                this.tokenizer.get();
                const startPos = this.tokenizer.pos;
                const next = this.tokenizer.get();
                if (next === null) this.tokenizer.error("Trailing backslash");

                // Simple escape sequences
                const escapeMap = { n: "\n", r: "\r", t: "\t", f: "\f", v: "\v", 0: "\0", a: "\x07", b: "\b" };
                if (escapeMap[next] !== undefined) return { type: "literal", char: escapeMap[next] };

                // Character class escapes
                if (RE_CHAR_CLASS_ESCAPES.test(next)) return { type: "escape", sequence: next };

                // Unicode escape \uXXXX
                if (next === "u") {
                    let hex = "";
                    for (let i = 0; i < 4; i++) {
                        const h = this.tokenizer.peek();
                        if (h && RE_HEX_DIGIT.test(h)) {
                            hex += this.tokenizer.get();
                        } else break;
                    }
                    if (hex.length === 4) {
                        return { type: "literal", char: String.fromCharCode(parseInt(hex, 16)) };
                    }
                    // Incomplete \u escape is an error
                    this.tokenizer.error(`incomplete escape \\u${hex}`, startPos - 1);
                }

                // Unicode escape \UXXXXXXXX
                if (next === "U") {
                    let hex = "";
                    for (let i = 0; i < 8; i++) {
                        const h = this.tokenizer.peek();
                        if (h && RE_HEX_DIGIT.test(h)) {
                            hex += this.tokenizer.get();
                        } else break;
                    }
                    if (hex.length === 8) {
                        const codePoint = parseInt(hex, 16);
                        if (codePoint > 0x10ffff) {
                            this.tokenizer.error(`bad escape \\U${hex}`, startPos - 1);
                        }
                        return { type: "literal", char: String.fromCodePoint(codePoint) };
                    }
                    this.tokenizer.error(`incomplete escape \\U${hex}`, startPos - 1);
                }

                // Hex escape \xXX
                if (next === "x") {
                    let hex = "";
                    for (let i = 0; i < 2; i++) {
                        const h = this.tokenizer.peek();
                        if (h && RE_HEX_DIGIT.test(h)) {
                            hex += this.tokenizer.get();
                        } else break;
                    }
                    if (hex.length === 2) {
                        return { type: "literal", char: String.fromCharCode(parseInt(hex, 16)) };
                    }
                    // Incomplete \x escape is an error
                    this.tokenizer.error(`incomplete escape \\x${hex}`, startPos - 1);
                }

                // Octal escapes \0-\377
                if (RE_OCTAL_DIGIT.test(next)) {
                    let octal = next;
                    while (RE_OCTAL_DIGIT.test(this.tokenizer.peek()) && octal.length < 3) {
                        octal += this.tokenizer.get();
                    }
                    const value = parseInt(octal, 8);
                    if (value > 0o377) {
                        this.tokenizer.error(`octal escape value \\${octal} outside of range 0-0o377`, startPos - 1);
                    }
                    return { type: "literal", char: String.fromCharCode(value) };
                }

                // Backreference escapes \1-\9 are invalid in character classes
                if (RE_INVALID_OCTAL.test(next)) {
                    this.tokenizer.error(`bad escape \\${next}`, startPos - 1);
                }

                // Special metacharacters - escape them to match literally
                if (RE_SPECIAL_CHARS_IN_CLASS.test(next)) return { type: "literal", char: next, wasEscaped: true };

                // Invalid alphabetic escapes - Python raises error for these in char classes
                if (RE_ALPHA.test(next)) {
                    this.tokenizer.error(`bad escape \\${next}`, startPos - 1);
                }

                // Any other escaped character is literal
                return { type: "literal", char: next, wasEscaped: true };
            }
            this.tokenizer.get();
            return { type: "literal", char: char, wasEscaped: false };
        }

        parseEscape() {
            this.tokenizer.get();
            const next = this.tokenizer.get();
            if (next === null) this.tokenizer.error("Trailing backslash");

            // Anchors
            if (next === "A") return new Anchor("string_start");
            if (next === "Z") return new Anchor("string_end");
            if (next === "b") return new Anchor("word_boundary");
            if (next === "B") return new Anchor("not_word_boundary");

            // Backreferences
            if (RE_BACKREF_START.test(next)) {
                let num = next;
                while (RE_DIGIT.test(this.tokenizer.peek())) num += this.tokenizer.get();
                const groupNum = parseInt(num, 10);
                if (this.openGroupNumbers.has(groupNum)) {
                    this.tokenizer.error("cannot refer to an open group");
                }
                return new Backreference(groupNum);
            }

            // Simple escape sequences - convert to literal
            const escapeMap = { n: "\n", r: "\r", t: "\t", f: "\f", v: "\v", 0: "\0", a: "\x07" };
            if (escapeMap[next] !== undefined) return new Literal(escapeMap[next]);

            // Unicode escape \uXXXX
            if (next === "u") {
                let hex = "";
                for (let i = 0; i < 4; i++) {
                    const h = this.tokenizer.peek();
                    if (h && RE_HEX_DIGIT.test(h)) {
                        hex += this.tokenizer.get();
                    } else break;
                }
                if (hex.length === 4) {
                    return new Literal(String.fromCharCode(parseInt(hex, 16)));
                }
                return new Escape("u" + hex);
            }

            // Hex escape \xXX
            if (next === "x") {
                let hex = "";
                for (let i = 0; i < 2; i++) {
                    const h = this.tokenizer.peek();
                    if (h && RE_HEX_DIGIT.test(h)) {
                        hex += this.tokenizer.get();
                    } else break;
                }
                if (hex.length === 2) {
                    return new Literal(String.fromCharCode(parseInt(hex, 16)));
                }
                return new Escape("x" + hex);
            }

            // Character class escapes and other escapes valid in both Python and JS
            if (RE_CHAR_CLASS_ESCAPES.test(next)) return new Escape(next);

            // Special metacharacters - escape them to match literally
            // These are: . * + ? ^ $ { } ( ) | [ ] \
            if (RE_SPECIAL_CHARS.test(next)) return new Literal(next);

            // Invalid alphabetic escapes - Python raises error for these
            // Valid escapes are: d D w W s S b B A Z n r t f v a 0 x u (already handled above)
            if (RE_ALPHA.test(next)) {
                this.tokenizer.error(`bad escape \\${next}`);
            }

            // For non-alphabetic characters (like \# \& \~ from re.escape), treat as literal
            return new Literal(next);
        }
    }

    // Generator - Convert AST to JavaScript regex
    let hasLookbehindSupport = true;
    try {
        new RegExp("(?<!foo)");
    } catch {
        hasLookbehindSupport = false;
    }

    class JSRegexGenerator {
        constructor(options = {}) {
            this.unicodeMode = options.unicodeMode || false;
            this.asciiMode = options.asciiMode || false;
        }

        generate(ast) {
            return this.visit(ast);
        }

        visit(node) {
            const method = `visit${node.type}`;
            if (this[method]) return this[method](node);
            throw new Error(`Unknown node type: ${node.type}`);
        }

        visitLiteral(node) {
            const special = /[.*+?^${}()|[\]\\]/;
            if (special.test(node.char)) return "\\" + node.char;
            if (this.unicodeMode) {
                const escapeMap = { "\t": "\\t", "\n": "\\n", "\r": "\\r", "\v": "\\v", "\f": "\\f" };
                if (escapeMap[node.char]) return escapeMap[node.char];
            }
            return node.char;
        }

        visitEscape(node) {
            // If in ASCII mode, use JS's built-in escapes (they're ASCII only)
            if (this.asciiMode) {
                return "\\" + node.sequence;
            }
            // In Unicode mode (Python 3 default), expand to Unicode character classes
            const uc = getUnicodeClasses();
            switch (node.sequence) {
                case "w":
                    return "[" + uc.w + "]";
                case "W":
                    return "[^" + uc.w + "]";
                case "d":
                    return "[" + uc.d + "]";
                case "D":
                    return "[^" + uc.d + "]";
                case "s":
                    return "[" + uc.s + "]";
                case "S":
                    return "[^" + uc.s + "]";
                default:
                    return "\\" + node.sequence;
            }
        }
        visitDot(node) {
            return ".";
        }

        visitAnchor(node) {
            switch (node.anchorType) {
                case "start":
                    return "^";
                case "end":
                    return "(?:(?=\\n$)|$)";
                case "string_start":
                    return hasLookbehindSupport ? "(?<!\\n)^" : "^";
                case "string_end":
                    return "$(?!\\n)";
                case "word_boundary":
                    return "\\b";
                case "not_word_boundary":
                    return "\\B";
                default:
                    throw new Error(`Unknown anchor type: ${node.anchorType}`);
            }
        }

        visitCharacterClass(node) {
            let result = "[";
            if (node.negated) result += "^";
            const uc = this.asciiMode ? null : getUnicodeClasses();
            for (let i = 0; i < node.items.length; i++) {
                const item = node.items[i];
                if (item.type === "literal") {
                    // In JS regex inside character classes (unicode mode):
                    // - ] must ALWAYS be escaped (unicode mode doesn't allow unescaped ])
                    // - \ must always be escaped
                    // - ^ must be escaped if at position 0 and not negated
                    // - - must be escaped if in the middle
                    if (item.char === "]") {
                        result += "\\]";
                    } else if (item.char === "\\") result += "\\\\";
                    else if (item.char === "^" && i === 0 && !node.negated) result += "\\^";
                    else if (item.char === "-" && i > 0 && i < node.items.length - 1) result += "\\-";
                    else result += item.char;
                } else if (item.type === "range") result += item.start + "-" + item.end;
                else if (item.type === "escape") {
                    // In Unicode mode, expand character class escapes
                    if (uc) {
                        switch (item.sequence) {
                            case "w":
                                result += uc.w;
                                continue;
                            case "d":
                                result += uc.d;
                                continue;
                            case "s":
                                result += uc.s;
                                continue;
                            // Note: \W, \D, \S inside character classes are complex
                            // For now, keep them as escapes (they're less common)
                        }
                    }
                    result += "\\" + item.sequence;
                }
            }
            return result + "]";
        }

        visitGroup(node) {
            const inner = this.visit(node.subpattern);
            if (node.capturing) return node.name ? `(?<${node.name}>${inner})` : `(${inner})`;
            return `(?:${inner})`;
        }

        visitBackreference(node) {
            return typeof node.ref === "string" ? `\\k<${node.ref}>` : `\\${node.ref}`;
        }

        visitLookaround(node) {
            const inner = this.visit(node.subpattern);
            if (node.forward) return node.positive ? `(?=${inner})` : `(?!${inner})`;
            return node.positive ? `(?<=${inner})` : `(?<!${inner})`;
        }

        visitQuantifier(node) {
            const inner = this.visit(node.child);
            let quantifier;
            if (node.min === 0 && node.max === null) quantifier = "*";
            else if (node.min === 1 && node.max === null) quantifier = "+";
            else if (node.min === 0 && node.max === 1) quantifier = "?";
            else if (node.max === null) quantifier = `{${node.min},}`;
            else if (node.min === node.max) quantifier = `{${node.min}}`;
            else quantifier = `{${node.min},${node.max}}`;
            if (!node.greedy) quantifier += "?";
            const needsGroup =
                inner.length > 1 && !/^\(.*\)$/.test(inner) && !/^\[.*\]$/.test(inner) && !/^\\.$/.test(inner);
            return needsGroup ? `(?:${inner})${quantifier}` : inner + quantifier;
        }

        visitAlternation(node) {
            return node.branches.map((b) => this.visit(b)).join("|");
        }
        visitSequence(node) {
            return node.elements.map((e) => this.visit(e)).join("");
        }
        visitInlineFlags(node) {
            return "";
        }
    }

    // Main conversion function
    function parseAndConvert(pattern, options = {}) {
        const parser = new RegexParser(pattern);
        const ast = parser.parse();
        let inlineFlags = "";
        function collectFlags(node) {
            if (node.type === "InlineFlags") inlineFlags += node.flags;
            else if (node.type === "Sequence") node.elements.forEach(collectFlags);
            else if (node.type === "Alternation") node.branches.forEach(collectFlags);
            else if (node.type === "Group" && node.subpattern) collectFlags(node.subpattern);
            else if (node.type === "Quantifier") collectFlags(node.child);
            else if (node.type === "Lookaround") collectFlags(node.subpattern);
        }
        collectFlags(ast);
        const generator = new JSRegexGenerator(options);
        const jsPattern = generator.generate(ast);
        return { pattern: jsPattern, inlineFlags, groupNames: parser.groupNames };
    }

    // Return all parser classes and functions for testing
    return {
        parseAndConvert,
        RegexParser,
        JSRegexGenerator,
        Tokenizer,
        // AST nodes for testing
        RegexNode,
        Literal,
        Escape,
        Dot,
        Anchor,
        CharacterClass,
        Group,
        Backreference,
        Lookaround,
        Quantifier,
        Alternation,
        Sequence,
        InlineFlags,
    };
}

// ========================================================================
// Skulpt Module Definition
// ========================================================================

function $builtinmodule(name) {
    const {
        builtin: {
            dict: pyDict,
            str: pyStr,
            list: pyList,
            int_: pyInt,
            type: pyType,
            tuple: pyTuple,
            mappingproxy: pyMappingProxy,
            slice: pySlice,
            none: { none$: pyNone },
            NotImplemented: { NotImplemented$: pyNotImplemented },
            Exception,
            OverflowError,
            IndexError,
            TypeError,
            ValueError,
            checkInt,
            checkString,
            checkCallable,
            hex,
        },
        abstr: { buildNativeClass, typeName, checkOneArg, numberBinOp, copyKeywordToNamedArgs, setUpModuleMethods },
        misceval: { iterator: pyIterator, objectRepr, asIndexSized, isIndex, callsimArray: pyCall },
    } = Sk;

    const re = {
        __name__: new pyStr("re"),
        __all__: new pyList(
            [
                "match",
                "fullmatch",
                "search",
                "sub",
                "subn",
                "split",
                "findall",
                "finditer",
                "compile",
                "purge",
                "template",
                "escape",
                "error",
                "Pattern",
                "Match",
                "A",
                "I",
                "L",
                "M",
                "S",
                "X",
                "U",
                "ASCII",
                "IGNORECASE",
                "LOCALE",
                "MULTILINE",
                "DOTALL",
                "VERBOSE",
                "UNICODE",
            ].map((x) => new pyStr(x))
        ),
    };

    // cached flags
    const _value2member = {};

    const RegexFlagMeta = buildNativeClass("RegexFlagMeta", {
        constructor: function RegexFlagMeta() {},
        base: pyType,
        slots: {
            tp$iter() {
                const members = Object.values(_members)[Symbol.iterator]();
                return new pyIterator(() => members.next().value);
            },
            sq$contains(flag) {
                if (!(flag instanceof this)) {
                    throw new TypeError(
                        "unsupported operand type(s) for 'in': '" + typeName(flag) + "' and '" + typeName(this) + "'"
                    );
                }
                return Object.values(_members).includes(flag);
            },
        },
    });

    re.RegexFlag = buildNativeClass("RegexFlag", {
        meta: RegexFlagMeta,
        base: pyInt,
        constructor: function RegexFlag(value) {
            const member = _value2member[value];
            if (member) {
                return member;
            }
            this.v = value;
            _value2member[value] = this;
        },

        slots: {
            tp$new(args, kwargs) {
                checkOneArg("RegexFlag", args, kwargs);
                const value = args[0].valueOf();
                if (!checkInt(value)) {
                    throw new ValueError(objectRepr(value) + " is not a valid RegexFlag");
                }
                return new re.RegexFlag(value);
            },
            $r() {
                let value = this.valueOf();
                const neg = value < 0;
                value = neg ? ~value : value;
                const members = [];
                Object.entries(_members).forEach(([name, m]) => {
                    // we're not supporting bigints here seems sensible not to
                    const m_value = m.valueOf();
                    if (value & m_value) {
                        value &= ~m_value;
                        members.push("re." + name);
                    }
                });
                if (value) {
                    members.push(hex(value).toString());
                }
                let res = members.join("|");

                if (neg) {
                    res = members.length > 1 ? "~(" + res + ")" : "~" + res;
                }
                return new pyStr(res);
            },
            sq$contains(flag) {
                if (!(flag instanceof re.RegexFlag)) {
                    throw new TypeError("'in' requires a RegexFlag not " + typeName(flag));
                }
                return this.nb$and(flag) === flag;
            },
            nb$and: flagBitSlot((v, w) => v & w, JSBI.bitwiseAnd),
            nb$or: flagBitSlot((v, w) => v | w, JSBI.bitwiseOr),
            nb$xor: flagBitSlot((v, w) => v ^ w, JSBI.bitwiseXor),
            nb$invert: function () {
                const v = this.v;
                if (typeof v === "number") {
                    return new re.RegexFlag(~v);
                }
                return new re.RegexFlag(JSBI.bitwiseNot(v));
            },
        },
        proto: {
            valueOf() {
                return this.v;
            },
        },
        flags: {
            sk$unacceptableBase: true,
        },
    });

    re.TEMPLATE = re.T = new re.RegexFlag(1);
    re.IGNORECASE = re.I = new re.RegexFlag(2);
    re.LOCALE = re.L = new re.RegexFlag(4);
    re.MULTILINE = re.M = new re.RegexFlag(8);
    re.DOTALL = re.S = new re.RegexFlag(16);
    re.UNICODE = re.U = new re.RegexFlag(32);
    re.VERBOSE = re.X = new re.RegexFlag(64);
    re.DEBUG = new re.RegexFlag(128);
    re.ASCII = re.A = new re.RegexFlag(256);

    const _members = {
        ASCII: re.A,
        IGNORECASE: re.I,
        LOCALE: re.L,
        UNICODE: re.U,
        MULTILINE: re.M,
        DOTALL: re.S,
        VERBOSE: re.X,
        TEMPLATE: re.T,
        DEBUG: re.DEBUG,
    };

    function flagBitSlot(number_func, bigint_func) {
        return function (other) {
            if (other instanceof re.RegexFlag || other instanceof pyInt) {
                let v = this.v;
                let w = other.v;
                if (typeof v === "number" && typeof w === "number") {
                    let tmp = number_func(v, w);
                    if (tmp < 0) {
                        tmp = tmp + 4294967296; // convert back to unsigned
                    }
                    return new re.RegexFlag(tmp);
                }
                v = JSBI.BigUp(v);
                w = JSBI.BigUp(w);
                return new re.RegexFlag(JSBI.numberIfSafe(bigint_func(v, w)));
            }
            return pyNotImplemented;
        };
    }

    const jsFlags = {
        i: re.I,
        m: re.M,
        s: re.S,
        u: re.U,
    };
    const jsInlineFlags = {
        i: re.I,
        a: re.A,
        s: re.S,
        L: re.L,
        m: re.M,
        u: re.U,
        x: re.X,
    };

    if (!RegExp.prototype.hasOwnProperty("sticky")) {
        delete jsFlags["s"];
    }
    if (!RegExp.prototype.hasOwnProperty("unicode")) {
        delete jsFlags["u"];
    }

    const flagFails = Object.entries({
        "cannot use LOCALE flag with a str pattern": re.L,
        "ASCII and UNICODE flags are incompatible": new re.RegexFlag(re.A.valueOf() | re.U.valueOf()),
    });

    // These flags can be anywhere in the pattern, (changed in 3.11 so that it has to be at the start)
    const inline_regex = /\(\?([isamux]+)\)/g;

    function adjustFlags(pyPattern, pyFlag) {
        let jsPattern = pyPattern.toString();
        let jsFlag = "g";
        // currently not worrying about bytes;
        // need to check compatibility of auL - also L not valid for str patterns
        let inlineFlags = 0;
        jsPattern = jsPattern.replace(inline_regex, (match, inline) => {
            for (let i of inline) {
                const inlineFlag = jsInlineFlags[i];
                inlineFlags = inlineFlags | inlineFlag.valueOf();
            }
            return "";
        });

        // check if inlineFlags (it throws a different error)
        flagFails.forEach(([msg, flag]) => {
            if ((flag.valueOf() & inlineFlags) === flag.valueOf()) {
                throw new re.error("bad bad inline flags: " + msg);
            }
        });

        pyFlag = numberBinOp(new re.RegexFlag(inlineFlags), pyFlag, "BitOr");

        // check compatibility of flags
        flagFails.forEach(([msg, flag]) => {
            if (numberBinOp(flag, pyFlag, "BitAnd") === flag) {
                throw new ValueError(msg);
            }
        });

        // use unicode?
        if (numberBinOp(re.A, pyFlag, "BitAnd") !== re.A) {
            pyFlag = numberBinOp(re.U, pyFlag, "BitOr");
        }

        Object.entries(jsFlags).forEach(([flag, reFlag]) => {
            if (numberBinOp(reFlag, pyFlag, "BitAnd") === reFlag) {
                jsFlag += flag;
            }
        });
        pyFlag = new re.RegexFlag(pyFlag.valueOf()); // just incase we're an integer

        return [jsPattern, jsFlag, pyFlag];
    }

    // Get parser from module-level getReParser() function
    const { parseAndConvert } = getReParser();

    const quantifierErrors = /Incomplete quantifier|Lone quantifier/g;
    const _compiled_patterns = Object.create(null);

    function compile_pattern(pyPattern, pyFlag) {
        let jsPattern, jsFlags;
        [jsPattern, jsFlags, pyFlag] = adjustFlags(pyPattern, pyFlag);

        const cacheKey = pyPattern.toString() + "|" + pyFlag.valueOf();
        const _cached = _compiled_patterns[cacheKey];
        if (_cached) {
            return _cached;
        }

        // Use the parser to convert Python regex to JavaScript regex
        // Check if ASCII mode is enabled (re.A flag)
        const asciiMode = numberBinOp(re.A, pyFlag, "BitAnd") === re.A;
        let convertedPattern;
        try {
            const result = parseAndConvert(jsPattern, {
                unicodeMode: jsFlags.includes("u"),
                asciiMode: asciiMode,
            });
            convertedPattern = result.pattern;
        } catch (e) {
            throw new re.error(e.message + " in pattern: " + pyPattern.toString(), pyPattern);
        }

        let regex;
        let msg;
        try {
            regex = new RegExp(convertedPattern, jsFlags);
        } catch (e) {
            if (quantifierErrors.test(e.message)) {
                try {
                    // try without the unicode flag since unicode mode is stricter
                    regex = new RegExp(convertedPattern, jsFlags.replace("u", ""));
                } catch (e) {
                    msg = e.message.substring(e.message.lastIndexOf(":") + 2) + " in pattern: " + pyPattern.toString();
                    throw new re.error(msg, pyPattern);
                }
            } else {
                msg = e.message.substring(e.message.lastIndexOf(":") + 2) + " in pattern: " + pyPattern.toString();
                throw new re.error(msg, pyPattern);
            }
        }
        const ret = new re.Pattern(regex, pyPattern, pyFlag);
        _compiled_patterns[cacheKey] = ret;
        return ret;
    }

    function _compile(pattern, flag) {
        if (pattern instanceof re.Pattern) {
            if (flag !== zero || flag.valueOf()) {
                throw new ValueError("cannot process flags argument with compiled pattern");
            }
            return pattern;
        }
        if (!checkString(pattern)) {
            throw new TypeError("first argument must be string or compiled pattern");
        }
        return compile_pattern(pattern, flag); // compile the pattern to javascript Regex
    }

    re.error = buildNativeClass("re.error", {
        base: Exception,
        constructor: function error(msg, pattern, pos) {
            this.$pattern = pattern;
            this.$msg = msg;
            this.$pos = pos || pyNone;
            Exception.call(this, msg);
        },
        slots: {
            tp$doc: "Exception raised for invalid regular expressions.\n\n    Attributes:\n\n        msg: The unformatted error message\n        pattern: The regular expression pattern\n",
            tp$init(args, kwargs) {
                const [msg, pattern, pos] = copyKeywordToNamedArgs(
                    "re.error",
                    ["msg", "pattern", "pos"],
                    args,
                    kwargs,
                    [pyNone, pyNone]
                );
                this.$pattern = pattern;
                this.$pos = pos;
                this.$msg = msg;
            },
        },
        getsets: {
            msg: {
                $get() {
                    return this.$msg;
                },
            },
            pattern: {
                $get() {
                    return this.$pattern;
                },
            },
            pos: {
                $get() {
                    return this.$pos;
                },
            },
        },
    });

    const zero = new pyInt(0);
    const maxsize = Number.MAX_SAFE_INTEGER;

    re.Pattern = buildNativeClass("re.Pattern", {
        constructor: function (regex, str, flags) {
            this.v = regex;
            this.str = str;
            this.$flags = flags;
            this.$groups = null;
            this.$groupindex = null;
        },
        slots: {
            $r() {
                const patrepr = objectRepr(this.str).slice(0, 200);
                const flagrepr = objectRepr(this.$flags.nb$and(re.U.nb$invert())); // re.U is not included in the repr here
                return new pyStr("re.compile(" + patrepr + (flagrepr ? ", " + flagrepr : "") + ")");
            },
            tp$richcompare(other, op) {
                if ((op !== "Eq" && op !== "NotEq") || !(other instanceof re.Pattern)) {
                    return pyNotImplemented;
                }
                const res = this.str === other.str && this.$flags === other.$flags;
                return op === "Eq" ? res : !res;
            },
            tp$hash() {},
            tp$doc: "Compiled regular expression object.",
        },
        methods: {
            match: {
                $meth: function match(string, pos, endpos) {
                    return this.$match(string, pos, endpos);
                },
                $flags: { NamedArgs: ["string", "pos", "endpos"], Defaults: [zero, maxsize] },
                $textsig: "($self, /, string, pos=0, endpos=sys.maxsize)",
                $doc: "Matches zero or more characters at the beginning of the string.",
            },
            fullmatch: {
                $meth: function fullmatch(string, pos, endpos) {
                    return this.full$match(string, pos, endpos);
                },
                $flags: { NamedArgs: ["string", "pos", "endpos"], Defaults: [zero, maxsize] },
                $textsig: "($self, /, string, pos=0, endpos=sys.maxsize)",
                $doc: "Matches against all of the string.",
            },
            search: {
                $meth: function search(string, pos, endpos) {
                    return this.$search(string, pos, endpos);
                },
                $flags: { NamedArgs: ["string", "pos", "endpos"], Defaults: [zero, maxsize] },
                $textsig: "($self, /, string, pos=0, endpos=sys.maxsize)",
                $doc: "Scan through string looking for a match, and return a corresponding match object instance.\n\nReturn None if no position in the string matches.",
            },
            sub: {
                $meth: function sub(repl, string, count) {
                    return this.$sub(repl, string, count);
                },
                $flags: { NamedArgs: ["repl", "string", "count"], Defaults: [zero] },
                $textsig: "($self, /, repl, string, count=0)",
                $doc: "Return the string obtained by replacing the leftmost non-overlapping occurrences of pattern in string by the replacement repl.",
            },
            subn: {
                $meth: function (repl, string, count) {
                    return this.$subn(repl, string, count);
                },
                $flags: { NamedArgs: ["repl", "string", "count"], Defaults: [zero] },
                $textsig: "($self, /, repl, string, count=0)",
                $doc: "Return the tuple (new_string, number_of_subs_made) found by replacing the leftmost non-overlapping occurrences of pattern with the replacement repl.",
            },
            findall: {
                $meth: function findall(string, pos, endpos) {
                    return this.find$all(string, pos, endpos);
                },
                $flags: { NamedArgs: ["string", "pos", "endpos"], Defaults: [zero, maxsize] },
                $textsig: "($self, /, string, pos=0, endpos=sys.maxsize)",
                $doc: "Return a list of all non-overlapping matches of pattern in string.",
            },
            split: {
                $meth: function split(string, maxsplit) {
                    return this.$split(string, maxsplit);
                },
                $flags: { NamedArgs: ["string", "maxsplit"], Defaults: [zero] },
                $textsig: "($self, /, string, maxsplit=0)",
                $doc: "Split string by the occurrences of pattern.",
            },
            finditer: {
                $meth: function finditer(string, pos, endpos) {
                    return this.find$iter(string, pos, endpos);
                },
                $flags: { NamedArgs: ["string", "pos", "endpos"], Defaults: [zero, maxsize] },
                $textsig: "($self, /, string, pos=0, endpos=sys.maxsize)",
                $doc: "Return an iterator over all non-overlapping matches for the RE pattern in string.\n\nFor each match, the iterator returns a match object.",
            },
            scanner: {
                $meth: function scanner(string, pos, endpos) {
                    return this.$scanner(string, pos, endpos);
                },
                $flags: { NamedArgs: ["string", "pos", "endpos"], Defaults: [zero, maxsize] },
                $textsig: "($self, /, string, pos=0, endpos=sys.maxsize)",
                $doc: null,
            },
            __copy__: {
                $meth: function copy() {
                    return this;
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: null,
            },
            __deepcopy__: {
                $meth: function () {
                    return this;
                },
                $flags: { OneArg: true },
                $textsig: "($self, memo, /)",
                $doc: null,
            },
        },
        getsets: {
            pattern: {
                $get() {
                    return this.str;
                },
                $doc: "The pattern string from which the RE object was compiled.",
            },
            flags: {
                $get() {
                    return this.$flags;
                },
                $doc: "The regex matching flags.",
            },
            groups: {
                $get() {
                    if (this.$groups === null) {
                        // we know we have a compiled expression so we just need to check matching brackets
                        // bracket characters that are not inside [] not followed by ? but could be followed by ?P<
                        const num_matches = (this.str.v.match(this.group$regex) || []).length;
                        this.$groups = new pyInt(num_matches);
                    }
                    return this.$groups;
                },
                $doc: "The number of capturing groups in the pattern.",
            },
            groupindex: {
                $get() {
                    if (this.$groupindex === null) {
                        const matches = this.str.v.matchAll(this.group$regex);
                        const arr = [];
                        let i = 1;
                        for (const match of matches) {
                            if (match[1]) {
                                arr.push(new pyStr(match[1]));
                                arr.push(new pyInt(i));
                            }
                            i++;
                        }
                        this.$groupindex = new pyMappingProxy(new pyDict(arr));
                    }
                    return this.$groupindex;
                },
                $doc: "A dictionary mapping group names to group numbers.",
            },
        },
        proto: {
            // Any opening bracket not inside [] Not followed by ? but might could be followed by ?P<foo>
            // if it's a group like (?P<foo>) then we need to capture the foo
            group$regex: /\((?!\?(?!P<).*)(?:\?P<([^\d\W]\w*)>)?(?![^\[]*\])/g,
            get$count(count) {
                count = asIndexSized(count, OverflowError);
                return count ? count : Number.POSITIVE_INFINITY;
            },
            get$jsstr(string, pos, endpos) {
                if (!checkString(string)) {
                    throw new TypeError("expected string or bytes-like object");
                }
                if ((pos === zero && endpos === maxsize) || (pos === undefined && endpos === undefined)) {
                    return { jsstr: string.toString(), pos: zero.valueOf(), endpos: string.sq$length() };
                }
                const { start, end } = pySlice.startEnd$wrt(string, pos, endpos);
                return { jsstr: string.toString().slice(start, end), pos: start, endpos: end };
            },
            find$all(string, pos, endpos) {
                let { jsstr } = this.get$jsstr(string, pos, endpos);
                const regex = this.v;
                const matches = jsstr.matchAll(regex);
                const ret = [];
                for (let match of matches) {
                    // do we have groups?
                    ret.push(
                        match.length === 1
                            ? new pyStr(match[0])
                            : match.length === 2
                            ? new pyStr(match[1])
                            : new pyTuple(match.slice(1).map((x) => new pyStr(x)))
                    );
                }
                return new pyList(ret);
            },
            $split(string, maxsplit) {
                maxsplit = asIndexSized(maxsplit);
                maxsplit = maxsplit ? maxsplit : Number.POSITIVE_INFINITY;
                let { jsstr } = this.get$jsstr(string);
                const regex = this.v;
                const split = [];
                let match;
                let num_splits = 0;
                let idx = 0;
                while ((match = regex.exec(jsstr)) !== null && num_splits < maxsplit) {
                    split.push(new pyStr(jsstr.substring(idx, match.index)));
                    if (match.length > 1) {
                        split.push(...match.slice(1).map((x) => (x === undefined ? pyNone : new pyStr(x))));
                    }
                    num_splits++;
                    idx = regex.lastIndex;
                    if (match.index === regex.lastIndex) {
                        if (jsstr) {
                            jsstr = jsstr.slice(match.index);
                            // need to reset the regex.lastIndex;
                            idx = 0;
                            regex.lastIndex = 1;
                        } else {
                            break; // check this;
                        }
                    }
                }
                regex.lastIndex = 0;
                split.push(new pyStr(jsstr.slice(idx)));
                return new pyList(split);
            },
            match$from_repl(args, string, pos, endpos) {
                let match_like;
                const named_groups = args[args.length - 1];
                if (typeof named_groups === "object") {
                    match_like = args.slice(0, args.length - 3);
                    Object.assign(match_like, { groups: named_groups });
                    match_like.index = args[args.length - 3];
                } else {
                    match_like = args.slice(0, args.length - 2);
                    match_like.groups = undefined;
                    match_like.index = args[args.length - 2];
                }
                return new re.Match(match_like, this.str, string, pos, endpos);
            },
            do$sub(repl, string, count) {
                const { jsstr, pos, endpos } = this.get$jsstr(string);
                let matchRepl;
                if (checkCallable(repl)) {
                    matchRepl = (matchObj) => {
                        const rep = pyCall(repl, [matchObj]);
                        if (!checkString(rep)) {
                            throw new TypeError("expected str instance, " + typeName(rep) + " found");
                        }
                        return rep.toString();
                    };
                } else {
                    repl = this.get$jsstr(repl).jsstr;
                    matchRepl = (matchObj) => matchObj.template$repl(repl);
                }
                count = this.get$count(count);
                let num_repl = 0;
                const ret = jsstr.replace(this.v, (...args) => {
                    if (num_repl >= count) {
                        return args[0];
                    }
                    num_repl++;
                    const matchObj = this.match$from_repl(args, string, pos, endpos);
                    return matchRepl(matchObj);
                });
                return [new pyStr(ret), new pyInt(num_repl)];
            },
            $sub(repl, string, count) {
                const [ret] = this.do$sub(repl, string, count);
                return ret;
            },
            $subn(repl, string, count) {
                return new pyTuple(this.do$sub(repl, string, count));
            },
            do$match(regex, string, pos, endpos) {
                let jsstr;
                ({ jsstr, pos, endpos } = this.get$jsstr(string, pos, endpos));
                const match = jsstr.match(regex);
                if (match === null) {
                    return pyNone;
                }
                return new re.Match(match, this, string, pos, endpos);
            },
            $search(string, pos, endpos) {
                var regex = new RegExp(this.v.source, this.v.flags.replace("g", "")); // keep all flags except 'g';
                return this.do$match(regex, string, pos, endpos);
            },
            $match(string, pos, endpos) {
                let source = this.v.source;
                let flags = this.v.flags.replace("g", "").replace("m", "");
                source = "^" + source;
                var regex = new RegExp(source, flags);
                return this.do$match(regex, string, pos, endpos);
            },
            full$match(string, pos, endpos) {
                let source = this.v.source;
                let flags = this.v.flags.replace("g", "").replace("m", "");
                source = "^(?:" + source + ")$";
                var regex = new RegExp(source, flags);
                return this.do$match(regex, string, pos, endpos);
            },
            find$iter(string, pos, endpos) {
                let jsstr;
                ({ jsstr, pos, endpos } = this.get$jsstr(string, pos, endpos));
                const matchIter = jsstr.matchAll(this.v);
                return new pyIterator(() => {
                    const match = matchIter.next().value;
                    if (match === undefined) {
                        return undefined;
                    }
                    return new re.Match(match, this, string, pos, endpos);
                });
                // could adjust this to use exec.
            },
        },
        flags: {
            sk$unacceptableBase: true,
        },
    });

    re.Match = buildNativeClass("re.Match", {
        constructor: function (match, re, str, pos, endpos) {
            this.v = match; // javascript match object;
            this.$match = new pyStr(this.v[0]);
            this.str = str;
            this.$re = re;
            this.$pos = pos;
            this.$endpos = endpos;
            // only calculate these if requested
            this.$groupdict = null;
            this.$groups = null;
            this.$lastindex = null;
            this.$lastgroup = null;
            this.$regs = null;
        },
        slots: {
            tp$doc: "The result of re.match() and re.search().\nMatch objects always have a boolean value of True.",
            $r() {
                //e.g. <re.Match object; span=(4, 21), match='see chapter 1.4.5'>
                let ret = "<re.Match object; ";
                ret += "span=(" + this.v.index + ", " + (this.v.index + this.$match.sq$length()) + "), ";
                ret += "match=" + objectRepr(this.$match) + ">";
                return new pyStr(ret);
            },
            tp$as_squence_or_mapping: true,
            mp$subscript(item) {
                const ret = this.get$group(item);
                return ret === undefined ? pyNone : new pyStr(ret);
            },
        },
        methods: {
            group: {
                $meth: function group(...gs) {
                    let ret;
                    if (gs.length <= 1) {
                        ret = this.get$group(gs[0]);
                        return ret === undefined ? pyNone : new pyStr(ret);
                    }
                    ret = [];
                    gs.forEach((g) => {
                        g = this.get$group(g);
                        ret.push(g === undefined ? pyNone : new pyStr(g));
                    });
                    return new pyTuple(ret);
                },
                $flags: { MinArgs: 0 },
                $textsig: null,
                $doc: "group([group1, ...]) -> str or tuple.\n    Return subgroup(s) of the match by indices or names.\n    For 0 returns the entire match.",
            },
            start: {
                $meth: function start(g) {
                    const group = this.get$group(g);
                    if (group === undefined) {
                        return new pyInt(-1);
                    }
                    return new pyInt(this.str.v.indexOf(group, this.v.index + this.$pos));
                },
                $flags: { MinArgs: 0, MaxArgs: 1 },
                $textsig: "($self, group=0, /)",
                $doc: "Return index of the start of the substring matched by group.",
            },
            end: {
                $meth: function end(g) {
                    const group = this.get$group(g);
                    if (group === undefined) {
                        return new pyInt(-1);
                    }
                    return new pyInt(this.str.v.indexOf(group, this.v.index + this.$pos) + [...group].length);
                },
                $flags: { MinArgs: 0, MaxArgs: 1 },
                $textsig: "($self, group=0, /)",
                $doc: "Return index of the end of the substring matched by group.",
            },
            span: {
                $meth: function span(g) {
                    return this.$span(g);
                },
                $flags: { MinArgs: 0, MaxArgs: 1 },
                $textsig: "($self, group=0, /)",
                $doc: "For match object m, return the 2-tuple (m.start(group), m.end(group)).",
            },
            groups: {
                $meth: function groups(d) {
                    if (this.$groups !== null) {
                        return this.$groups;
                    }
                    this.$groups = Array.from(this.v.slice(1), (x) => (x === undefined ? d : new pyStr(x)));
                    this.$groups = new pyTuple(this.$groups);
                    return this.$groups;
                },
                $flags: { NamedArgs: ["default"], Defaults: [pyNone] },
                $textsig: "($self, /, default=None)",
                $doc: "Return a tuple containing all the subgroups of the match, from 1.\n\n  default\n    Is used for groups that did not participate in the match.",
            },
            groupdict: {
                $meth: function groupdict(d) {
                    if (this.$groupdict !== null) {
                        return this.$groupdict;
                    }
                    if (this.v.groups === undefined) {
                        this.$groupdict = new pyDict();
                    } else {
                        const arr = [];
                        Object.entries(this.v.groups).forEach(([name, val]) => {
                            arr.push(new pyStr(name));
                            arr.push(val === undefined ? d : new pyStr(val));
                        });
                        this.$groupdict = new pyDict(arr);
                    }
                    return this.$groupdict;
                },
                $flags: { NamedArgs: ["default"], Defaults: [pyNone] },
                $textsig: "($self, /, default=None)",
                $doc: "Return a dictionary containing all the named subgroups of the match, keyed by the subgroup name.\n\n  default\n    Is used for groups that did not participate in the match.",
            },
            expand: {
                $meth: function expand(template) {
                    if (!checkString(template)) {
                        throw new TypeError("expected str instance got " + typeName(template));
                    }
                    template = template.toString();
                    template = this.template$repl(template);
                    return new pyStr(template);
                },
                $flags: { OneArg: true },
                $textsig: "($self, /, template)",
                $doc: "Return the string obtained by doing backslash substitution on the string template, as done by the sub() method.",
            },
            __copy__: {
                $meth: function __copy__() {
                    return this;
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: null,
            },
            __deepcopy__: {
                $meth: function __deepcopy__() {
                    return this;
                },
                $flags: { OneArg: true },
                $textsig: "($self, memo, /)",
                $doc: null,
            },
        },
        getsets: {
            lastindex: {
                $get() {
                    if (this.$lastindex !== null) {
                        return this.$lastindex;
                    }
                    let li = 0;
                    let lval;
                    this.v.forEach((val, i) => {
                        if (i && val !== undefined && lval !== val) {
                            li = i;
                            lval = val;
                        }
                    });
                    this.$lastindex = li ? new pyInt(li) : pyNone;
                    return this.$lastindex;
                },
                $doc: "The integer index of the last matched capturing group.",
            },
            lastgroup: {
                $get() {
                    if (this.$lastgroup !== null) {
                        return this.$lastgroup;
                    }
                    if (this.v.groups === undefined) {
                        this.$lastgroup = pyNone;
                    } else {
                        let lg;
                        Object.entries(this.v.groups).forEach(([name, val]) => {
                            if (val !== undefined) {
                                lg = name;
                            }
                        });
                        this.$lastgroup = lg === undefined ? pyNone : new pyStr(lg);
                    }
                    return this.$lastgroup;
                },
                $doc: "The name of the last matched capturing group.",
            },
            regs: {
                $get() {
                    if (this.$regs !== null) {
                        return this.$regs;
                    }
                    const arr = [];
                    this.v.forEach((x, i) => {
                        arr.push(this.$span(i));
                    });
                    this.$regs = new pyTuple(arr);
                    return this.$regs;
                },
            },
            string: {
                $get() {
                    return this.str;
                },
                $doc: "The string passed to match() or search().",
            },
            re: {
                $get() {
                    return this.$re;
                },
                $doc: "The regular expression object.",
            },
            pos: {
                $get() {
                    return new pyInt(this.$pos);
                },
                $doc: "The index into the string at which the RE engine started looking for a match.",
            },
            endpos: {
                $get() {
                    return new pyInt(this.$endpos);
                },
                $doc: "The index into the string beyond which the RE engine will not go.",
            },
        },
        proto: {
            get$group(g) {
                if (g === undefined) {
                    return this.v[0];
                } else if (checkString(g)) {
                    g = g.toString();
                    if (this.v.groups && Object.prototype.hasOwnProperty.call(this.v.groups, g)) {
                        return this.v.groups[g];
                    }
                } else if (isIndex(g)) {
                    g = asIndexSized(g);
                    if (g >= 0 && g < this.v.length) {
                        return this.v[g];
                    }
                }
                throw new IndexError("no such group");
            },
            $span(g) {
                const group = this.get$group(g);
                if (group === undefined) {
                    return new pyTuple([new pyInt(-1), new pyInt(-1)]);
                }
                let idx;
                if (group === "" && this.v[0] === "") {
                    idx = new pyInt(this.v.index);
                    return new pyTuple([idx, idx]);
                }
                idx = this.str.v.indexOf(group, this.v.index + this.$pos);
                return new pyTuple([new pyInt(idx), new pyInt(idx + [...group].length)]); // want char length
            },
            hasOwnProperty: Object.prototype.hasOwnProperty,
            // Matches: \g<num>, \g<name>, \0XX (octal), \1XX (3-digit octal), \1-\99 (group ref), \n, \t, etc.
            // 3 valid octal digits (1-3 followed by two 0-7) = octal
            // 2 digits (1-9 followed by 0-9) = group reference
            // Note: \400+ is out of range octal (handled below)
            template$regex: /\\g<([1-9][0-9]*)>|\\g<([^\d\W]\w*)>|\\g<?.*>?|\\(0[0-7]{0,2})|\\([1-3][0-7]{2})|\\([1-9][0-9]?)|\\(.)/g,
            template$escapes: {
                'n': '\n',
                't': '\t',
                'r': '\r',
                'f': '\f',
                'v': '\v',
                'a': '\x07',
                'b': '\b',
                '\\': '\\'
            },
            template$repl(template) {
                // Capture groups: (idxg), (name), (octal0), (octal3), (groupRef), (escape)
                // octal0 = \0, \00, \000-\077 (starts with 0)
                // octal3 = \100-\377 (3-digit octal in range, all digits 0-7)
                // groupRef = \1-\99 (1-2 digits, may contain 8/9)
                return template.replace(this.template$regex, (match, idxg, name, octal0, octal3, groupRef, escape, offset, orig) => {
                    // Handle octal escapes starting with 0: \0, \00, \000-\077
                    if (octal0 !== undefined) {
                        const octalVal = parseInt(octal0, 8);
                        return String.fromCharCode(octalVal);
                    }

                    // Handle 3-digit octal: \100-\377
                    if (octal3 !== undefined) {
                        const octalVal = parseInt(octal3, 8);
                        return String.fromCharCode(octalVal);
                    }

                    // Handle group references \1-\99
                    if (groupRef !== undefined) {
                        const num = parseInt(groupRef, 10);
                        const ret = num < this.v.length ? this.v[num] || "" : undefined;
                        if (ret === undefined) {
                            throw new re.error(
                                "invalid group reference " + num + " at position " + offset
                            );
                        }
                        return ret;
                    }

                    // Handle character escapes like \n, \t, etc.
                    if (escape !== undefined) {
                        const replacement = this.template$escapes[escape];
                        if (replacement !== undefined) {
                            return replacement;
                        }
                        // Invalid escape
                        throw new re.error("bad escape \\" + escape + " at position " + offset);
                    }

                    // Handle group references \g<num> and \g<name>
                    let ret;
                    if (idxg !== undefined) {
                        const idx = parseInt(idxg, 10);
                        ret = idx < this.v.length ? this.v[idx] || "" : undefined;
                        if (ret === undefined) {
                            throw new re.error(
                                "invalid group reference " + idx + " at position " + (offset + 1)
                            );
                        }
                        return ret;
                    } else if (name !== undefined) {
                        // Handle named groups \g<name>
                        if (this.v.groups && this.hasOwnProperty.call(this.v.groups, name)) {
                            ret = this.v.groups[name] || "";
                            return ret;
                        }
                        throw new IndexError("unknown group name '" + name + "'");
                    }
                    // Malformed \g<...> - this shouldn't happen with our regex, but just in case
                    throw new re.error("bad escape " + match + " at position " + offset);
                });
            },
        },
        flags: {
            sk$unacceptableBase: true,
        },
    });

    setUpModuleMethods("re", re, {
        match: {
            $meth: function match(pattern, string, flags) {
                return _compile(pattern, flags).$match(string);
            },
            $flags: { NamedArgs: ["pattern", "string", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, string, flags=0)",
            $doc: "Try to apply the pattern at the start of the string, returning\n    a Match object, or None if no match was found.",
        },
        fullmatch: {
            $meth: function fullmatch(pattern, string, flags) {
                return _compile(pattern, flags).full$match(string);
            },
            $flags: { NamedArgs: ["pattern", "string", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, string, flags=0)",
            $doc: "Try to apply the pattern to all of the string, returning\n    a Match object, or None if no match was found.",
        },
        search: {
            $meth: function search(pattern, string, flags) {
                return _compile(pattern, flags).$search(string);
            },
            $flags: { NamedArgs: ["pattern", "string", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, string, flags=0)",
            $doc: "Scan through string looking for a match to the pattern, returning\n    a Match object, or None if no match was found.",
        },
        sub: {
            $meth: function sub(pattern, repl, string, count, flags) {
                return _compile(pattern, flags).$sub(repl, string, count);
            },
            $flags: { NamedArgs: ["pattern", "repl", "string", "count", "flags"], Defaults: [zero, zero] },
            $textsig: "($module, / , pattern, string, count=0, flags=0)",
            $doc: "Return the string obtained by replacing the leftmost\n    non-overlapping occurrences of the pattern in string by the\n    replacement repl.  repl can be either a string or a callable;\n    if a string, backslash escapes in it are processed.  If it is\n    a callable, it's passed the Match object and must return\n    a replacement string to be used.",
        },
        subn: {
            $meth: function subn(pattern, repl, string, count, flags) {
                return _compile(pattern, flags).$subn(repl, string, count);
            },
            $flags: { NamedArgs: ["pattern", "repl", "string", "count", "flags"], Defaults: [zero, zero] },
            $textsig: "($module, / , pattern, string, count=0, flags=0)",
            $doc: "Return a 2-tuple containing (new_string, number).\n    new_string is the string obtained by replacing the leftmost\n    non-overlapping occurrences of the pattern in the source\n    string by the replacement repl.  number is the number of\n    substitutions that were made. repl can be either a string or a\n    callable; if a string, backslash escapes in it are processed.\n    If it is a callable, it's passed the Match object and must\n    return a replacement string to be used.",
        },
        split: {
            $meth: function split(pattern, string, maxsplit, flags) {
                return _compile(pattern, flags).$split(string, maxsplit);
            },
            $flags: { NamedArgs: ["pattern", "string", "maxsplit", "flags"], Defaults: [zero, zero] },
            $textsig: "($module, / , pattern, string, maxsplit=0, flags=0)",
            $doc: "Split the source string by the occurrences of the pattern,\n    returning a list containing the resulting substrings.  If\n    capturing parentheses are used in pattern, then the text of all\n    groups in the pattern are also returned as part of the resulting\n    list.  If maxsplit is nonzero, at most maxsplit splits occur,\n    and the remainder of the string is returned as the final element\n    of the list.",
        },
        findall: {
            $meth: function findall(pattern, string, flags) {
                return _compile(pattern, flags).find$all(string);
            },
            $flags: { NamedArgs: ["pattern", "string", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, string, flags=0)",
            $doc: "Return a list of all non-overlapping matches in the string.\n\n    If one or more capturing groups are present in the pattern, return\n    a list of groups; this will be a list of tuples if the pattern\n    has more than one group.\n\n    Empty matches are included in the result.",
        },
        finditer: {
            $meth: function finditer(pattern, string, flags) {
                return _compile(pattern, flags).find$iter(string);
            },
            $flags: { NamedArgs: ["pattern", "string", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, string, flags=0)",
            $doc: "Return an iterator over all non-overlapping matches in the\n    string.  For each match, the iterator returns a Match object.\n\n    Empty matches are included in the result.",
        },
        compile: {
            $meth: function compile(pattern, flags) {
                return _compile(pattern, flags);
            },
            $flags: { NamedArgs: ["pattern", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, flags=0)",
            $doc: "Compile a regular expression pattern, returning a Pattern object.",
        },
        purge: {
            $meth: function purge() {
                Object.keys(_compiled_patterns).forEach((key) => {
                    delete _compiled_patterns[key];
                });
                return pyNone;
            },
            $flags: { NoArgs: true },
            $textsig: "($module, / )",
            $doc: "Clear the regular expression caches",
        },
        template: {
            $meth: function template(pattern, flags) {
                return _compile(pattern, numberBinOp(re.T, flags, "BitOr"));
            },
            $flags: { NamedArgs: ["pattern", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, flags=0)",
            $doc: "Compile a template pattern, returning a Pattern object",
        },
        escape: {
            $meth: function (pattern) {
                if (!checkString(pattern)) {
                    throw new TypeError("expected a str instances, got " + typeName(pattern));
                }
                pattern = pattern.toString();
                pattern = pattern.replace(escape_chrs, "\\$&");
                return new pyStr(pattern);
            },
            $flags: { NamedArgs: ["pattern"], Defaults: [] },
            $textsig: "($module, / , pattern)",
            $doc: "\n    Escape special characters in a string.\n    ",
        },
    });
    const escape_chrs = /[\&\~\#.*+\-?^${}()|[\]\\\t\r\v\f\n ]/g;

    return re;
}

// Node.js exports for testing
if (typeof module !== "undefined" && module.exports) {
    module.exports = getReParser();
}
