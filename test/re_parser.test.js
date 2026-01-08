/**
 * Tests for Python Regex to JavaScript Regex Parser
 *
 * Run with: node test/re_parser.test.js
 */

// Load Skulpt first (sets up global Sk needed for Unicode classes)
const reqskulpt = require('../support/run/require-skulpt').requireSkulpt;
const skulpt = reqskulpt(false);
if (skulpt === null) {
    console.log('Skulpt not built. Run npm run devbuild first.');
    process.exit(1);
}

// Now require re.js which exports parser via module.exports
const {
    parseAndConvert: _parseAndConvert,
    RegexParser,
    JSRegexGenerator,
} = require('../src/lib/re.js');

// Wrapper that defaults to ASCII mode for simpler test expectations
function parseAndConvert(pattern, options = {}) {
    return _parseAndConvert(pattern, { asciiMode: true, ...options });
}

// Simple test framework
let passed = 0;
let failed = 0;
const failures = [];

function describe(name, fn) {
    console.log(`\n${name}`);
    fn();
}

function it(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        failures.push({ name, error: e.message });
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) {
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
            }
        },
        toMatch(regex) {
            if (!regex.test(actual)) {
                throw new Error(`Expected ${JSON.stringify(actual)} to match ${regex}`);
            }
        },
        toBeTruthy() {
            if (!actual) {
                throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
            }
        },
        toContain(expected) {
            if (!actual.includes(expected)) {
                throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`);
            }
        },
        toThrow(pattern) {
            let threw = false;
            let error = null;
            try {
                if (typeof actual === 'function') {
                    actual();
                }
            } catch (e) {
                threw = true;
                error = e;
            }
            if (!threw) {
                throw new Error('Expected function to throw');
            }
            if (pattern && !pattern.test(error.message)) {
                throw new Error(`Expected error message to match ${pattern}, got: ${error.message}`);
            }
        },
        not: {
            toThrow() {
                try {
                    if (typeof actual === 'function') {
                        actual();
                    }
                } catch (e) {
                    throw new Error(`Expected function not to throw, but it threw: ${e.message}`);
                }
            }
        }
    };
}

// ============================================================================
// Basic Literal Tests
// ============================================================================

describe('Literal patterns', () => {
    it('should handle simple literals', () => {
        const result = parseAndConvert('abc');
        expect(result.pattern).toBe('abc');
    });

    it('should escape regex special characters in input', () => {
        const result = parseAndConvert('a.b');
        // Unescaped . should be dot metacharacter, not escaped literal
        expect(result.pattern).toBe('a.b');
    });

    it('should handle escaped special characters', () => {
        const result = parseAndConvert('a\\*b');
        expect(result.pattern).toBe('a\\*b');
    });
});

// ============================================================================
// Named Group Tests - Key Python Feature
// ============================================================================

describe('Named groups (?P<name>...)', () => {
    it('should convert (?P<name>...) to (?<name>...)', () => {
        const result = parseAndConvert('(?P<word>\\w+)');
        expect(result.pattern).toBe('(?<word>\\w+)');
    });

    it('should handle multiple named groups', () => {
        const result = parseAndConvert('(?P<first>\\w+) (?P<second>\\w+)');
        expect(result.pattern).toBe('(?<first>\\w+) (?<second>\\w+)');
    });

    it('should track group names', () => {
        const result = parseAndConvert('(?P<foo>a)(?P<bar>b)');
        expect(result.groupNames.has('foo')).toBe(true);
        expect(result.groupNames.has('bar')).toBe(true);
    });
});

// ============================================================================
// Named Backreference Tests - Key Python Feature
// ============================================================================

describe('Named backreferences (?P=name)', () => {
    it('should convert (?P=name) to \\k<name>', () => {
        const result = parseAndConvert('(?P<word>\\w+) (?P=word)');
        expect(result.pattern).toBe('(?<word>\\w+) \\k<word>');
    });
});

// ============================================================================
// Anchor Tests - \A and \Z
// ============================================================================

describe('Anchors', () => {
    it('should convert \\A to appropriate start anchor', () => {
        const result = parseAndConvert('\\Afoo');
        // Should include lookbehind if supported, or just ^
        expect(result.pattern).toMatch(/^\(\?<!\\n\)\^foo$|^\^foo$/);
    });

    it('should convert \\Z to $(?!\\n)', () => {
        const result = parseAndConvert('foo\\Z');
        expect(result.pattern).toBe('foo$(?!\\n)');
    });

    it('should convert $ to handle trailing newline', () => {
        const result = parseAndConvert('foo$');
        expect(result.pattern).toBe('foo(?:(?=\\n$)|$)');
    });

    it('should handle ^ unchanged', () => {
        const result = parseAndConvert('^foo');
        expect(result.pattern).toBe('^foo');
    });

    it('should handle \\b word boundary', () => {
        const result = parseAndConvert('\\bfoo\\b');
        expect(result.pattern).toBe('\\bfoo\\b');
    });
});

// ============================================================================
// Quantifier Tests - {,n} special case
// ============================================================================

describe('Quantifiers', () => {
    it('should convert {,n} to {0,n}', () => {
        const result = parseAndConvert('a{,5}');
        expect(result.pattern).toBe('a{0,5}');
    });

    it('should handle {n,m} unchanged', () => {
        const result = parseAndConvert('a{2,5}');
        expect(result.pattern).toBe('a{2,5}');
    });

    it('should handle {n} unchanged', () => {
        const result = parseAndConvert('a{3}');
        expect(result.pattern).toBe('a{3}');
    });

    it('should handle {n,} unchanged', () => {
        const result = parseAndConvert('a{3,}');
        expect(result.pattern).toBe('a{3,}');
    });

    it('should handle * quantifier', () => {
        const result = parseAndConvert('a*');
        expect(result.pattern).toBe('a*');
    });

    it('should handle + quantifier', () => {
        const result = parseAndConvert('a+');
        expect(result.pattern).toBe('a+');
    });

    it('should handle ? quantifier', () => {
        const result = parseAndConvert('a?');
        expect(result.pattern).toBe('a?');
    });

    it('should handle non-greedy quantifiers', () => {
        const result = parseAndConvert('a*?');
        expect(result.pattern).toBe('a*?');
    });
});

// ============================================================================
// Character Class Tests - ] at start
// ============================================================================

describe('Character classes', () => {
    it('should handle ] at start of character class', () => {
        const result = parseAndConvert('[]abc]');
        expect(result.pattern).toBe('[]abc]');
    });

    it('should handle ] at start of negated character class', () => {
        const result = parseAndConvert('[^]abc]');
        expect(result.pattern).toBe('[^]abc]');
    });

    it('should handle ranges', () => {
        const result = parseAndConvert('[a-z]');
        expect(result.pattern).toBe('[a-z]');
    });

    it('should handle escape sequences in character class', () => {
        const result = parseAndConvert('[\\d\\w]');
        expect(result.pattern).toBe('[\\d\\w]');
    });

    it('should handle negated class', () => {
        const result = parseAndConvert('[^abc]');
        expect(result.pattern).toBe('[^abc]');
    });
});

// ============================================================================
// Inline Flags Tests
// ============================================================================

describe('Inline flags', () => {
    it('should extract inline flags (?i)', () => {
        const result = parseAndConvert('(?i)foo');
        expect(result.inlineFlags).toContain('i');
    });

    it('should extract multiple inline flags (?im)', () => {
        const result = parseAndConvert('(?im)foo');
        expect(result.inlineFlags).toContain('i');
        expect(result.inlineFlags).toContain('m');
    });

    it('should handle flag-scoped groups (?i:...)', () => {
        const result = parseAndConvert('(?i:foo)');
        // For now, just check it parses without error
        expect(result.pattern).toBeTruthy();
    });
});

// ============================================================================
// Lookaround Tests
// ============================================================================

describe('Lookarounds', () => {
    it('should handle positive lookahead (?=...)', () => {
        const result = parseAndConvert('foo(?=bar)');
        expect(result.pattern).toBe('foo(?=bar)');
    });

    it('should handle negative lookahead (?!...)', () => {
        const result = parseAndConvert('foo(?!bar)');
        expect(result.pattern).toBe('foo(?!bar)');
    });

    it('should handle positive lookbehind (?<=...)', () => {
        const result = parseAndConvert('(?<=foo)bar');
        expect(result.pattern).toBe('(?<=foo)bar');
    });

    it('should handle negative lookbehind (?<!...)', () => {
        const result = parseAndConvert('(?<!foo)bar');
        expect(result.pattern).toBe('(?<!foo)bar');
    });
});

// ============================================================================
// Non-capturing Group Tests
// ============================================================================

describe('Non-capturing groups', () => {
    it('should handle (?:...)', () => {
        const result = parseAndConvert('(?:abc)');
        expect(result.pattern).toBe('(?:abc)');
    });
});

// ============================================================================
// Capturing Group Tests
// ============================================================================

describe('Capturing groups', () => {
    it('should handle simple capturing groups', () => {
        const result = parseAndConvert('(abc)');
        expect(result.pattern).toBe('(abc)');
    });

    it('should handle numeric backreferences', () => {
        const result = parseAndConvert('(\\w+) \\1');
        expect(result.pattern).toBe('(\\w+) \\1');
    });
});

// ============================================================================
// Alternation Tests
// ============================================================================

describe('Alternation', () => {
    it('should handle simple alternation', () => {
        const result = parseAndConvert('foo|bar');
        expect(result.pattern).toBe('foo|bar');
    });

    it('should handle multiple alternatives', () => {
        const result = parseAndConvert('a|b|c');
        expect(result.pattern).toBe('a|b|c');
    });

    it('should handle alternation in groups', () => {
        const result = parseAndConvert('(a|b)');
        expect(result.pattern).toBe('(a|b)');
    });
});

// ============================================================================
// Escape Sequence Tests
// ============================================================================

describe('Escape sequences', () => {
    it('should handle \\d', () => {
        const result = parseAndConvert('\\d+');
        expect(result.pattern).toBe('\\d+');
    });

    it('should handle \\w', () => {
        const result = parseAndConvert('\\w+');
        expect(result.pattern).toBe('\\w+');
    });

    it('should handle \\s', () => {
        const result = parseAndConvert('\\s+');
        expect(result.pattern).toBe('\\s+');
    });

    it('should handle \\D, \\W, \\S', () => {
        const result = parseAndConvert('\\D\\W\\S');
        expect(result.pattern).toBe('\\D\\W\\S');
    });
});

// ============================================================================
// Dot Tests
// ============================================================================

describe('Dot metacharacter', () => {
    it('should handle dot', () => {
        const result = parseAndConvert('a.b');
        expect(result.pattern).toBe('a.b');
    });

    it('should handle escaped dot', () => {
        const result = parseAndConvert('a\\.b');
        expect(result.pattern).toBe('a\\.b');
    });
});

// ============================================================================
// Complex Pattern Tests
// ============================================================================

describe('Complex patterns', () => {
    it('should handle email-like pattern', () => {
        const result = parseAndConvert('[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+');
        expect(result.pattern).toBeTruthy();
        // Should be valid JS regex
        expect(() => new RegExp(result.pattern)).not.toThrow();
    });

    it('should handle URL-like pattern', () => {
        const result = parseAndConvert('https?://[^\\s]+');
        expect(result.pattern).toBeTruthy();
        expect(() => new RegExp(result.pattern)).not.toThrow();
    });

    it('should handle pattern with multiple Python features', () => {
        const result = parseAndConvert('(?P<protocol>https?)://(?P<domain>[^/]+)(?P<path>/.*)?\\Z');
        expect(result.pattern).toContain('(?<protocol>');
        expect(result.pattern).toContain('(?<domain>');
        expect(result.pattern).toContain('(?<path>');
        expect(result.pattern).toContain('$(?!\\n)');
    });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Error handling', () => {
    it('should throw on unclosed group', () => {
        expect(() => parseAndConvert('(abc')).toThrow();
    });

    it('should throw on unclosed character class', () => {
        expect(() => parseAndConvert('[abc')).toThrow();
    });

    it('should throw on unknown group name in backreference', () => {
        expect(() => parseAndConvert('(?P=unknown)')).toThrow(/unknown/i);
    });

    it('should throw on duplicate group name', () => {
        expect(() => parseAndConvert('(?P<name>a)(?P<name>b)')).toThrow(/duplicate/i);
    });

    it('should throw on invalid group name', () => {
        expect(() => parseAndConvert('(?P<123>a)')).toThrow(/invalid/i);
    });
});

// ============================================================================
// Integration Tests - Verify JS regex works correctly
// ============================================================================

describe('Generated regex functionality', () => {
    it('should create working regex for named groups', () => {
        const result = parseAndConvert('(?P<word>\\w+)');
        const regex = new RegExp(result.pattern);
        const match = regex.exec('hello world');
        expect(match).toBeTruthy();
        expect(match.groups.word).toBe('hello');
    });

    it('should create working regex for named backreferences', () => {
        const result = parseAndConvert('(?P<word>\\w+) (?P=word)');
        const regex = new RegExp(result.pattern);
        expect(regex.test('hello hello')).toBe(true);
        expect(regex.test('hello world')).toBe(false);
    });

    it('should create working regex for \\Z', () => {
        const result = parseAndConvert('foo\\Z');
        const regex = new RegExp(result.pattern);
        expect(regex.test('foo')).toBe(true);
        expect(regex.test('foo\n')).toBe(false);
    });

    it('should create working regex for {,n}', () => {
        const result = parseAndConvert('a{,3}');
        const regex = new RegExp(result.pattern);
        expect(regex.test('')).toBe(true);
        expect(regex.test('a')).toBe(true);
        expect(regex.test('aaa')).toBe(true);
    });
});

// ============================================================================
// Run tests and report
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log(`Tests: ${passed} passed, ${failed} failed`);

if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => {
        console.log(`  - ${f.name}: ${f.error}`);
    });
}

process.exit(failed > 0 ? 1 : 0);
