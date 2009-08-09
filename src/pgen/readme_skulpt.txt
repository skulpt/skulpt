This code is adapted from 'lib2to3/pgen2' in Python-3.1.

pgen is modified to spit out parse tables for JS that are usable by our
implementation of the parser engine.

astgen.py is from Python-2.6.2, it's part of a now-defunct-as-of-3k compiler
module implemented in Python. We use astgen to generate a higher-level ast
description from the low-level concrete parse tree that that parser.js
generates. It's modified to generate js of course.
