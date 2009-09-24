// NOTE: needs to be in sync with src/footer.js

Skulpt = {
compileStr: compileStr,
compileUrlAsync: compileUrlAsync,
InteractiveContext: InteractiveContext,

// internal methods, mostly exposed here for unit tests
Tokenizer: Tokenizer,
_parse: parse,
_transform: transform,
_compile: compile,
_parseTables: SkulptParseTables,
consts$: {}
    };
