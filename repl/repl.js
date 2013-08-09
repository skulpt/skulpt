Sk.configure({
    output: write,
    read: read
});

var compilableLines = [];
var re = new RegExp("\s*print");

print ("Python 2.6(ish) (skulpt, " + new Date() + ")");
print ("[v8: " + version() + "] on a system");
print ('Don\'t type "help", "copyright", "credits" or "license" unless you\'ve assigned something to them');

while (true){
    var lines = [];
    write('>>> ');

    var removePrints = false;

    lines.push(readline());

    if (lines[0][lines[0].length - 1] === ':'){
        var additionallines = [];
        var curline = "";
        do{
            if (curline == "" && lines[0].indexOf("def") == "-1" && lines[0].indexOf("class") == "-1"){
                //remove print statements in blocks when they don't define something.
                removePrints = true;
            }
            write('... ');
            curline = readline()
            lines.push(curline);
        } while (curline != "");
    }

    var linesToCompile = compilableLines.concat(lines);

    if (lines.length == 1){
        if (lines[0].indexOf('=') == -1 && lines[0].indexOf(':') == -1) {
            linesToCompile[linesToCompile.length - 1] = "print " + lines[0];
            lines.pop();
        } else if (lines[0].indexOf("quit()") != -1){
            quit(0);
        }
    }

    try{
        Sk.importMainWithBody("repl", false, linesToCompile.join('\n'));
        compilableLines = compilableLines.concat(lines.map(function(str){
            if(re.test(str) && removePrints) {
                return str.replace(/print.*/g, "pass");
            } else {
                return str;
            }
        }));
    } catch (err) {
        print(err);
        var index = -1;
        if ((index = err.toString().indexOf("on line")) != -1){
            index = parseInt(err.toString().substr(index + 8), 10);
        }
        var line = 0;
        print (linesToCompile.map(function(str){
            return ++line + (index == line ? ">" : " ") + ": " + str;
        }).join('\n'));
    }
}