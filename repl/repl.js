Sk.configure({
    output: write,
    read: read
});

var compilableLines = [];

print ("Python 2.6(ish) (skulpt, " + new Date() + ")");
print ("[v8: " + version() + "] on a system");
print ('Don\'t type "help", "copyright", "credits" or "license" unless you\'ve assigned something to them');

while (true){
    write('>>> ');
    var lines = [];
    lines.push(readline());
    if (lines[0][lines[0].length - 1] === ':'){

        var additionallines = [];
        var curline = "";
        do{
            write('... ');
            curline = readline()
            lines.push(curline);
        } while (curline != "");
    }

    var linesToCompile = compilableLines.concat(lines);

    if (lines.length == 1){
        if (lines[0].indexOf('=') == -1 && lines[0].indexOf(':') == -1) {
            linesToCompile[linesToCompile.length - 1] = "print " + lines[0];
        }
        if (lines[0].indexOf("quit()") != -1){
            quit(0);
        }
    }

    try{
        Sk.importMainWithBody("repl", false, linesToCompile.join('\n'));
        compilableLines = compilableLines.concat(lines);
    } catch (err) {
        print(err);
        print (linesToCompile);
    }
}