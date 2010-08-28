We use jsdoc-toolkit to parse closure-library's comments and generate an FFI
for Skulpt. Currently, this is just a list of all functions that are
constructors so that we know that we need to call them with new.
