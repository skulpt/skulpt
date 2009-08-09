wrapper.py is a niceifier around jslint (see comments at top of file)

d8.js is a wrapper to run jslint in d8 (the v8 shell).

jslint itself (fulljslint.js) is unchanged except to disable erroring out when
50 warnings are reached.
