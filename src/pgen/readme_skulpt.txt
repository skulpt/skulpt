The parser is from 'lib2to3/pgen2' in Python-3.1.

pgen is modified to spit out parse tables for JS that are usable by our
implementation of the parser engine.


The ast node generator is ported to output js rather than C from the CPython
generator in 2.6.5.
