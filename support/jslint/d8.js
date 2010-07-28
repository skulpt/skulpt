/*extern JSLINT */
/*jslint rhino: true*/

(function (a) {
    if (!a[0]) {
        print("Usage: jslint.js file.js");
        quit(1);
    }
    var input = read(a[0]);
    if (!input) {
        print("jslint: Couldn't open file '" + a[0] + "'.");
        quit(1);
    }
    if (!JSLINT(input, {bitwise: false, eqeqeq: true, immed: true,
            newcap: false, nomen: true, onevar: false, plusplus: false,
            evil: true, sub: false, nomen: false, 
            regexp: true, rhino: true, undef: true, white: false, indent: false, laxbreak:true})) {
        for (var i = 0; i < JSLINT.errors.length; i += 1) {
            var e = JSLINT.errors[i];
            if (e) {
                print('Lint at line ' + (e.line + 1) + ' character ' +
                        (e.character + 1) + ': ' + e.reason);
                print((e.evidence || '').
                        replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1"));
                print('');
            }
        }
        print("---REPORT");
        print(JSLINT.report());
        quit(2);
    } else {
        print("---REPORT");
        print(JSLINT.report());
        quit();
    }
}(arguments));
