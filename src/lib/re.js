// ========================================================================
// Python regular expression parser
// Converts Python regex patterns to JavaScript regex patterns
// ========================================================================

// Tokenization, repetition validation, and group-width tracking follow CPython 3.7
// Lib/sre_parse.py. The AST and emitter translate the supported subset to JavaScript.
function getReParser(makeError) {
    const MAXREPEAT = 0xffffffff;
    // Pre-compiled regex patterns for performance
    const RE_CHAR_CLASS_ESCAPES = /^[dDwWsS]$/;
    const RE_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/;
    const RE_HEX_DIGIT = /^[0-9a-fA-F]$/;
    const RE_OCTAL_DIGIT = /^[0-7]$/;
    const RE_ALPHA = /^[a-zA-Z]$/;
    const RE_DIGIT = /^[0-9]$/;
    const RE_INLINE_FLAGS_START = /^[aiLmsux-]$/;
    const RE_INLINE_FLAGS = /^[aiLmsux]$/;
    const RE_INCOMPATIBLE_FLAGS = /[auL]/;

    // Access Unicode character classes from Sk.builtin.str._unicode (set in str.js)
    // Build Python-compatible character classes lazily
    let _unicodeClasses = null;
    function getUnicodeClasses() {
        if (_unicodeClasses) {
            return _unicodeClasses;
        }
        const U = Sk.builtin.str._unicode;
        _unicodeClasses = {
            // Python \d: Only decimal digits (Nd), not all numeric (N)
            d: U.Nd,
            // Python \w is alphanumeric plus underscore, not connector punctuation.
            w: U.L + U.N + "_",
            // Python \s: Whitespace including Unicode space separators
            s: "\\t\\n\\r\\f\\v\\x1c-\\x1f\\x85" + U.Zs + U.Zl + U.Zp,
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
    // Like CPython 3.7, restart parsing if a global (?x) enables verbose mode.
    class VerboseFlag extends Error {}

    // CPython's tokenizer keeps escaped pairs together and indexes codepoints.
    class Tokenizer {
        constructor(pattern) {
            this.pattern = pattern;
            this.chars = Array.from(pattern);
            this.pos = 0;
            this.length = this.chars.length;
        }

        peek(offset = 0) {
            let index = this.pos;
            for (let i = 0; i < offset && index < this.length; i++) {
                index += this.chars[index] === "\\" ? 2 : 1;
            }
            if (index >= this.length) {
                return null;
            }
            const char = this.chars[index];
            if (char !== "\\") {
                return char;
            }
            if (index + 1 === this.length) {
                this.error("bad escape (end of pattern)", index);
            }
            return char + this.chars[index + 1];
        }

        get() {
            const token = this.peek();
            if (token !== null) {
                this.pos += this.chars[this.pos] === "\\" ? 2 : 1;
            }
            return token;
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
                if (!char || !predicate(char)) {
                    break;
                }
                result += this.get();
            }
            return result;
        }

        getUntil(char) {
            let result = "";
            while (this.pos < this.length) {
                const next = this.peek();
                if (!next || next === char) {
                    break;
                }
                result += this.get();
            }
            return result;
        }

        error(msg, pos) {
            throw makeError(msg, this.pattern, pos !== undefined ? pos : this.pos);
        }
    }

    // CPython stores closed-group widths and the first group in a lookbehind.
    // Names resolve to numbers here, so named and numeric references share checks.
    class PatternState {
        constructor() {
            this.groupNames = new Map();
            this.groupWidths = [null];
            this.lookbehindGroups = null;
        }

        openGroup(name, source) {
            const group = this.groupWidths.length;
            if (name !== null) {
                if (this.groupNames.has(name)) {
                    source.error(`redefinition of group name '${name}'`);
                }
                this.groupNames.set(name, group);
            }
            this.groupWidths.push(null);
            return group;
        }

        closeGroup(group, node) {
            this.groupWidths[group] = this.getWidth(node);
        }

        checkReference(group, source, pos) {
            if (group >= this.groupWidths.length) {
                source.error(`invalid group reference ${group}`, pos);
            }
            if (this.groupWidths[group] === null) {
                source.error("cannot refer to an open group", pos);
            }
            if (this.lookbehindGroups !== null && group >= this.lookbehindGroups) {
                source.error("cannot refer to group defined in the same lookbehind subpattern", pos);
            }
        }

        getWidth(node) {
            switch (node.type) {
                case "Literal":
                case "Escape":
                case "Dot":
                case "CharacterClass":
                    return [1, 1];
                case "Anchor":
                case "Lookaround":
                    return [0, 0];
                case "Backreference":
                    return this.groupWidths[node.ref];
                case "Group":
                    return this.getWidth(node.subpattern);
                case "Quantifier": {
                    const [min, max] = this.getWidth(node.child);
                    return [
                        Math.min(min * node.min, MAXREPEAT - 1),
                        Math.min(max === 0 ? 0 : max * (node.max === null ? Infinity : node.max), MAXREPEAT),
                    ];
                }
                case "Sequence":
                    return node.elements.reduce(
                        ([min, max], item) => {
                            const width = this.getWidth(item);
                            return [Math.min(min + width[0], MAXREPEAT - 1), Math.min(max + width[1], MAXREPEAT)];
                        },
                        [0, 0]
                    );
                case "Alternation": {
                    const widths = node.branches.map((branch) => this.getWidth(branch));
                    return [Math.min(...widths.map((w) => w[0])), Math.max(...widths.map((w) => w[1]))];
                }
            }
        }
    }

    // Parser
    class RegexParser {
        constructor(pattern, verbose) {
            this.verbose = verbose;
            this.inlineFlags = "";
            this.tokenizer = new Tokenizer(pattern);
            this.state = new PatternState();
        }

        parse() {
            const result = this.parseAlternation();
            if (this.tokenizer.peek() !== null) {
                this.tokenizer.error("unbalanced parenthesis");
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
                this.skipIgnored();
                const next = this.tokenizer.peek();
                if (next === null || next === "|" || next === ")") {
                    break;
                }
                if ("*+?{".includes(next)) {
                    const last = elements.length - 1;
                    const repeated = this.parseQuantified(elements[last]);
                    if (repeated === null) {
                        this.tokenizer.get();
                        elements.push(new Literal("{"));
                    } else {
                        elements[last] = repeated;
                    }
                } else {
                    const atom = this.parseAtom();
                    if (atom !== null) {
                        elements.push(atom);
                    }
                }
            }
            if (elements.length === 0) {
                return new Sequence([]);
            }
            if (elements.length === 1) {
                return elements[0];
            }
            return new Sequence(elements);
        }

        skipIgnored() {
            if (!this.verbose) {
                return;
            }
            while (this.tokenizer.peek() !== null) {
                const char = this.tokenizer.peek();
                if (" \t\n\r\v\f".includes(char)) {
                    this.tokenizer.get();
                } else if (char === "#") {
                    this.tokenizer.getUntil("\n");
                } else {
                    break;
                }
            }
        }

        parseQuantified(atom) {
            const start = this.tokenizer.pos;
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
                } else {
                    return null;
                }
            }

            if (!atom || atom.type === "Anchor") {
                this.tokenizer.error("nothing to repeat", start);
            }
            if (atom.type === "Quantifier") {
                this.tokenizer.error("multiple repeat", start);
            }
            if (this.tokenizer.peek() === "?") {
                this.tokenizer.get();
                greedy = false;
            }
            return new Quantifier(min, max, greedy, atom);
        }

        parseRepetition() {
            const start = this.tokenizer.pos;
            this.tokenizer.get();
            const lo = this.tokenizer.getwhile((c) => RE_DIGIT.test(c));
            const comma = this.tokenizer.match(",");
            const hi = comma ? this.tokenizer.getwhile((c) => RE_DIGIT.test(c)) : lo;
            if (!this.tokenizer.match("}") || (!lo && !comma)) {
                this.tokenizer.pos = start;
                return null;
            }
            const min = lo ? Number(lo) : 0;
            const max = hi ? Number(hi) : null;
            if (min >= MAXREPEAT || max >= MAXREPEAT) {
                throw new Sk.builtin.OverflowError("the repetition number is too large");
            }
            if (max !== null && max < min) {
                this.tokenizer.error("min repeat greater than max repeat", start + 1);
            }
            return { min, max };
        }

        parseAtom() {
            const char = this.tokenizer.peek();
            if (char === "(") {
                return this.parseGroup();
            }
            if (char === "[") {
                return this.parseCharacterClass();
            }
            if (char !== null && char.startsWith("\\")) {
                return this.parseEscape();
            }
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
            if (char !== null && !"|)*+?".includes(char)) {
                this.tokenizer.get();
                return new Literal(char);
            }
            this.tokenizer.error(`Unexpected character '${char}'`);
        }

        parseGroup() {
            const start = this.tokenizer.pos;
            this.tokenizer.get();
            let capturing = true;
            let name = null;
            if (this.tokenizer.match("?")) {
                const extension = this.tokenizer.get();
                if (extension === ":") {
                    capturing = false;
                } else if (extension === "P") {
                    if (this.tokenizer.match("<")) {
                        name = this.parseGroupName(">");
                    } else if (this.tokenizer.match("=")) {
                        const refPos = this.tokenizer.pos;
                        const refName = this.parseGroupName(")");
                        const group = this.state.groupNames.get(refName);
                        if (group === undefined) {
                            this.tokenizer.error(`unknown group name '${refName}'`, refPos);
                        }
                        this.state.checkReference(group, this.tokenizer, refPos);
                        return new Backreference(group);
                    } else {
                        this.tokenizer.error("unknown extension ?P", start + 1);
                    }
                } else if (extension === "=" || extension === "!") {
                    return this.parseLookaround(extension === "=", true, start);
                } else if (extension === "<") {
                    const direction = this.tokenizer.get();
                    if (direction !== "=" && direction !== "!") {
                        this.tokenizer.error("unknown extension ?<", start + 1);
                    }
                    return this.parseLookaround(direction === "=", false, start);
                } else if (extension === "#") {
                    this.tokenizer.getUntil(")");
                    if (!this.tokenizer.match(")")) {
                        this.tokenizer.error("missing ), unterminated comment", start);
                    }
                    return null;
                } else if (extension !== null && RE_INLINE_FLAGS_START.test(extension)) {
                    this.tokenizer.pos--;
                    return this.parseFlags();
                } else if (extension === "(") {
                    this.tokenizer.error("conditional groups are not supported", start);
                } else {
                    this.tokenizer.error(`unknown extension ?${extension}`, start + 1);
                }
            }
            const group = capturing ? this.state.openGroup(name, this.tokenizer) : null;
            const subpattern = this.parseAlternation();
            if (!this.tokenizer.match(")")) {
                this.tokenizer.error("missing ), unterminated subpattern", start);
            }
            if (capturing) {
                this.state.closeGroup(group, subpattern);
            }
            return new Group(capturing, name, subpattern);
        }

        parseGroupName(end) {
            const start = this.tokenizer.pos;
            const name = this.tokenizer.getUntil(end);
            if (!this.tokenizer.match(end)) {
                this.tokenizer.error(`missing ${end}, unterminated name`, start);
            }
            if (!name) {
                this.tokenizer.error("missing group name", start);
            }
            if (!Sk.token.isIdentifier(name)) {
                this.tokenizer.error(`bad character in group name '${name}'`, start);
            }
            return name;
        }

        parseLookaround(positive, forward, start) {
            const previous = this.state.lookbehindGroups;
            if (!forward && previous === null) {
                this.state.lookbehindGroups = this.state.groupWidths.length;
            }
            const subpattern = this.parseAlternation();
            this.state.lookbehindGroups = previous;
            if (!this.tokenizer.match(")")) {
                this.tokenizer.error("missing ), unterminated subpattern", start);
            }
            if (!forward) {
                const [min, max] = this.state.getWidth(subpattern);
                if (min !== max) {
                    this.tokenizer.error("look-behind requires fixed-width pattern", start);
                }
            }
            return new Lookaround(positive, forward, subpattern);
        }

        parseFlags() {
            const onFlags = this.tokenizer.getwhile((c) => RE_INLINE_FLAGS.test(c));
            if ([...new Set(onFlags)].filter((c) => RE_INCOMPATIBLE_FLAGS.test(c)).length > 1) {
                this.tokenizer.error("bad inline flags: flags 'a', 'u' and 'L' are incompatible");
            }
            if (this.tokenizer.match(")")) {
                this.inlineFlags += onFlags;
                if (onFlags.includes("x") && !this.verbose) {
                    throw new VerboseFlag();
                }
                return null;
            }
            if (this.tokenizer.match("-")) {
                const offFlags = this.tokenizer.getwhile((c) => RE_INLINE_FLAGS.test(c));
                if (!offFlags) {
                    this.tokenizer.error("missing flag");
                }
                if (RE_INCOMPATIBLE_FLAGS.test(offFlags)) {
                    this.tokenizer.error("bad inline flags: cannot turn off flags 'a', 'u' and 'L'");
                }
                if ([...offFlags].some((c) => onFlags.includes(c))) {
                    this.tokenizer.error("bad inline flags: flag turned on and off");
                }
            }
            if (!this.tokenizer.match(":")) {
                this.tokenizer.error("missing -, : or )");
            }
            // JS modifier groups are not available on all supported engines.
            this.tokenizer.error("scoped flags are not supported");
        }

        parseCharacterClass() {
            const start = this.tokenizer.pos;
            this.tokenizer.get();
            const negated = this.tokenizer.match("^");
            const items = [];
            while (this.tokenizer.peek() !== null) {
                if (this.tokenizer.peek() === "]" && items.length) {
                    break;
                }
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
                } else {
                    items.push(item);
                }
            }
            if (!this.tokenizer.match("]")) {
                this.tokenizer.error("unterminated character set", start);
            }
            return new CharacterClass(negated, items);
        }

        parseCharacterClassItem() {
            const node = this.tokenizer.peek().startsWith("\\")
                ? this.parseEscape(true)
                : new Literal(this.tokenizer.get());
            return node.type === "Escape"
                ? { type: "escape", sequence: node.sequence }
                : { type: "literal", char: node.char };
        }

        parseEscape(inClass = false) {
            const startPos = this.tokenizer.pos;
            const next = this.tokenizer.get().slice(1);

            if (!inClass) {
                const anchors = { A: "string_start", Z: "string_end", b: "word_boundary", B: "not_word_boundary" };
                if (anchors[next]) {
                    return new Anchor(anchors[next]);
                }
            } else if (next === "b") {
                return new Literal("\b");
            }

            const escapes = { n: "\n", r: "\r", t: "\t", f: "\f", v: "\v", a: "\x07" };
            if (escapes[next] !== undefined) {
                return new Literal(escapes[next]);
            }
            if (RE_CHAR_CLASS_ESCAPES.test(next)) {
                return new Escape(next);
            }

            if (next === "x" || next === "u" || next === "U") {
                const length = { x: 2, u: 4, U: 8 }[next];
                let hex = "";
                while (
                    hex.length < length &&
                    this.tokenizer.peek() !== null &&
                    RE_HEX_DIGIT.test(this.tokenizer.peek())
                ) {
                    hex += this.tokenizer.get();
                }
                if (hex.length !== length) {
                    this.tokenizer.error(`incomplete escape \\${next}${hex}`, startPos);
                }
                const codePoint = parseInt(hex, 16);
                if (codePoint > 0x10ffff) {
                    this.tokenizer.error(`bad escape \\${next}${hex}`, startPos);
                }
                return new Literal(String.fromCodePoint(codePoint));
            }

            if (RE_DIGIT.test(next)) {
                let digits = next;
                let octal = inClass || next === "0";
                if (octal) {
                    if (!RE_OCTAL_DIGIT.test(next)) {
                        this.tokenizer.error(`bad escape \\${next}`, startPos);
                    }
                    while (digits.length < 3 && RE_OCTAL_DIGIT.test(this.tokenizer.peek())) {
                        digits += this.tokenizer.get();
                    }
                } else {
                    if (RE_DIGIT.test(this.tokenizer.peek())) {
                        digits += this.tokenizer.get();
                    }
                    if (/^[0-7]{2}$/.test(digits) && RE_OCTAL_DIGIT.test(this.tokenizer.peek())) {
                        digits += this.tokenizer.get();
                        octal = true;
                    }
                }
                if (octal) {
                    const value = parseInt(digits, 8);
                    if (value > 0o377) {
                        this.tokenizer.error(`octal escape value \\${digits} outside of range 0-0o377`, startPos);
                    }
                    return new Literal(String.fromCharCode(value));
                }
                const groupNum = parseInt(digits, 10);
                this.state.checkReference(groupNum, this.tokenizer, startPos);
                return new Backreference(groupNum);
            }
            if (RE_ALPHA.test(next)) {
                this.tokenizer.error(`bad escape \\${next}`, startPos);
            }
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
            if (this[method]) {
                return this[method](node);
            }
            throw new Error(`Unknown node type: ${node.type}`);
        }

        visitLiteral(node) {
            if (RE_SPECIAL_CHARS.test(node.char)) {
                return "\\" + node.char;
            }
            if (this.unicodeMode) {
                const escapeMap = { "\t": "\\t", "\n": "\\n", "\r": "\\r", "\v": "\\v", "\f": "\\f" };
                if (escapeMap[node.char]) {
                    return escapeMap[node.char];
                }
            }
            return node.char;
        }

        characterClasses() {
            return this.asciiMode ? { w: "a-zA-Z0-9_", d: "0-9", s: "\\t\\n\\r\\f\\v " } : getUnicodeClasses();
        }

        visitEscape(node) {
            const chars = this.characterClasses()[node.sequence.toLowerCase()];
            return "[" + (node.sequence === node.sequence.toUpperCase() ? "^" : "") + chars + "]";
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
                case "not_word_boundary":
                    return this.wordBoundary(node.anchorType === "not_word_boundary");
                default:
                    throw new Error(`Unknown anchor type: ${node.anchorType}`);
            }
        }

        wordBoundary(negated) {
            if (!hasLookbehindSupport) {
                // Preserve master's native JS boundaries on older browsers. These
                // have limited Unicode semantics, but keep existing patterns usable.
                return negated ? "\\B" : "\\b";
            }
            const word = "[" + this.characterClasses().w + "]";
            const boundary = `(?:(?<!${word})(?=${word})|(?<=${word})(?!${word}))`;
            // In Python 3.7, \B does not match the empty string.
            return negated ? `(?!${boundary})(?:(?=[\\s\\S])|(?<=[\\s\\S]))` : boundary;
        }

        escapeClassLiteral(char) {
            return /[\\\]\[\^-]/.test(char) ? "\\" + char : char;
        }

        visitCharacterClass(node) {
            let chars = "";
            const alternatives = [];
            const classes = this.characterClasses();
            for (const item of node.items) {
                if (item.type === "literal") {
                    chars += this.escapeClassLiteral(item.char);
                } else if (item.type === "range") {
                    chars += this.escapeClassLiteral(item.start) + "-" + this.escapeClassLiteral(item.end);
                } else if (item.sequence === item.sequence.toLowerCase()) {
                    chars += classes[item.sequence];
                } else {
                    alternatives.push(this.visitEscape(item));
                }
            }
            if (!alternatives.length) {
                return "[" + (node.negated ? "^" : "") + chars + "]";
            }
            if (chars) {
                alternatives.push("[" + chars + "]");
            }
            const union = "(?:" + alternatives.join("|") + ")";
            return node.negated ? `(?!${union})[\\s\\S]` : union;
        }

        visitGroup(node) {
            const inner = this.visit(node.subpattern);
            if (node.capturing) {
                return node.name ? `(?<${node.name}>${inner})` : `(${inner})`;
            }
            return `(?:${inner})`;
        }

        visitBackreference(node) {
            // A following decoded digit must not become part of this reference.
            return `(?:\\${node.ref})`;
        }

        visitLookaround(node) {
            const inner = this.visit(node.subpattern);
            if (node.forward) {
                return node.positive ? `(?=${inner})` : `(?!${inner})`;
            }
            return node.positive ? `(?<=${inner})` : `(?<!${inner})`;
        }

        visitQuantifier(node) {
            const inner = this.visit(node.child);
            let quantifier;
            if (node.min === 0 && node.max === null) {
                quantifier = "*";
            } else if (node.min === 1 && node.max === null) {
                quantifier = "+";
            } else if (node.min === 0 && node.max === 1) {
                quantifier = "?";
            } else if (node.max === null) {
                quantifier = `{${node.min},}`;
            } else if (node.min === node.max) {
                quantifier = `{${node.min}}`;
            } else {
                quantifier = `{${node.min},${node.max}}`;
            }
            if (!node.greedy) {
                quantifier += "?";
            }
            // Keep the generated expression atomic, including expanded character classes.
            return `(?:${inner})${quantifier}`;
        }

        visitAlternation(node) {
            return node.branches.map((b) => this.visit(b)).join("|");
        }
        visitSequence(node) {
            return node.elements.map((e) => this.visit(e)).join("");
        }
    }

    function parse(pattern, verbose) {
        let parser = new RegexParser(pattern, verbose);
        let ast;
        try {
            ast = parser.parse();
        } catch (e) {
            if (!(e instanceof VerboseFlag)) {
                throw e;
            }
            parser = new RegexParser(pattern, true);
            ast = parser.parse();
        }
        return { ast, inlineFlags: parser.inlineFlags };
    }

    function generate(ast, options) {
        return new JSRegexGenerator(options).generate(ast);
    }

    return { parse, generate };
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
        abstr: { buildNativeClass, typeName, checkOneArg, numberBinOp, copyKeywordsToNamedArgs, setUpModuleMethods },
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

    function adjustFlags(pyFlag, parsedFlags) {
        let jsFlag = "g";
        let inlineFlags = 0;
        for (const flag of parsedFlags) {
            inlineFlags |= jsInlineFlags[flag].valueOf();
        }

        // check if inlineFlags (it throws a different error)
        flagFails.forEach(([msg, flag]) => {
            if ((flag.valueOf() & inlineFlags) === flag.valueOf()) {
                throw new re.error("bad inline flags: " + msg);
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

        return [jsFlag, pyFlag];
    }

    // Get parser from module-level getReParser() function
    const { parse, generate } = getReParser(
        (msg, pattern, pos) => new re.error(msg, new pyStr(pattern), new pyInt(pos))
    );

    const _compiled_patterns = Object.create(null);

    function compile_pattern(pyPattern, pyFlag) {
        const cacheKey = pyPattern.toString() + "|" + pyFlag.valueOf();
        const cached = _compiled_patterns[cacheKey];
        if (cached) {
            return cached;
        }

        const parsed = parse(pyPattern.toString(), (pyFlag.valueOf() & re.X.valueOf()) !== 0);
        let jsFlags;
        [jsFlags, pyFlag] = adjustFlags(pyFlag, parsed.inlineFlags);
        let convertedPattern;
        try {
            convertedPattern = generate(parsed.ast, {
                unicodeMode: jsFlags.includes("u"),
                asciiMode: (pyFlag.valueOf() & re.A.valueOf()) !== 0,
            });
        } catch (e) {
            throw new re.error(e.message, pyPattern);
        }

        let regex;
        try {
            regex = new RegExp(convertedPattern, jsFlags);
        } catch (e) {
            const msg = e.message.substring(e.message.lastIndexOf(":") + 2);
            throw new re.error(msg, pyPattern);
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
        constructor: function error(msg = pyNone, pattern = pyNone, pos = pyNone) {
            Exception.call(this);
            this.$init(msg, pattern, pos);
        },
        slots: {
            tp$doc: "Exception raised for invalid regular expressions.\n\n    Attributes:\n\n        msg: The unformatted error message\n        pattern: The regular expression pattern\n",
            tp$init(args, kwargs) {
                const [msg, pattern, pos] = copyKeywordsToNamedArgs(
                    "re.error",
                    ["msg", "pattern", "pos"],
                    args,
                    kwargs,
                    [pyNone, pyNone]
                );
                this.$init(msg, pattern, pos);
            },
        },
        proto: {
            $init(msg, pattern, pos) {
                this.$msg = typeof msg === "string" ? new pyStr(msg) : msg;
                this.$pattern = pattern;
                this.$pos = pos;
                this.$lineno = this.$colno = pyNone;
                let formatted = this.$msg;
                if (pattern !== pyNone && pos !== pyNone) {
                    const index = pos.valueOf();
                    const chars = Array.from(pattern.toString());
                    const before = chars.slice(0, index);
                    const line = before.filter((c) => c === "\n").length + 1;
                    const column = index - before.lastIndexOf("\n");
                    this.$lineno = new pyInt(line);
                    this.$colno = new pyInt(column);
                    let text = this.$msg.toString() + " at position " + index;
                    if (chars.includes("\n")) {
                        text += ` (line ${line}, column ${column})`;
                    }
                    formatted = new pyStr(text);
                }
                this.args = new pyTuple([formatted]);
            },
        },
        getsets: {
            lineno: {
                $get() {
                    return this.$lineno;
                },
            },
            colno: {
                $get() {
                    return this.$colno;
                },
            },
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
            template$regex:
                /\\g<([1-9][0-9]*)>|\\g<([^\d\W]\w*)>|\\g<?.*>?|\\(0[0-7]{0,2})|\\([1-3][0-7]{2})|\\([1-9][0-9]?)|\\(.)/g,
            template$escapes: {
                n: "\n",
                t: "\t",
                r: "\r",
                f: "\f",
                v: "\v",
                a: "\x07",
                b: "\b",
                "\\": "\\",
            },
            template$repl(template) {
                // Capture groups: (idxg), (name), (octal0), (octal3), (groupRef), (escape)
                // octal0 = \0, \00, \000-\077 (starts with 0)
                // octal3 = \100-\377 (3-digit octal in range, all digits 0-7)
                // groupRef = \1-\99 (1-2 digits, may contain 8/9)
                return template.replace(
                    this.template$regex,
                    (match, idxg, name, octal0, octal3, groupRef, escape, offset, orig) => {
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
                                throw new re.error("invalid group reference " + num + " at position " + offset);
                            }
                            return ret;
                        }

                        // Handle character escapes like \n, \t, etc.
                        if (escape !== undefined) {
                            const replacement = this.template$escapes[escape];
                            if (replacement !== undefined) {
                                return replacement;
                            }
                            if (/[a-zA-Z]/.test(escape)) {
                                throw new re.error("bad escape \\" + escape + " at position " + offset);
                            }
                            return match;
                        }

                        // Handle group references \g<num> and \g<name>
                        let ret;
                        if (idxg !== undefined) {
                            const idx = parseInt(idxg, 10);
                            ret = idx < this.v.length ? this.v[idx] || "" : undefined;
                            if (ret === undefined) {
                                throw new re.error("invalid group reference " + idx + " at position " + (offset + 1));
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
                    }
                );
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
