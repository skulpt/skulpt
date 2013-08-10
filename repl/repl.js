Sk.configure({ output: write, read: read, systemexit: true });

var compilableLines = [];
//finds lines starting with "print"
var re = new RegExp("\s*print");

print ("Python 2.6(ish) (skulpt, " + new Date() + ")");
print ("[v8: " + version() + "] on a system");
print ('Don\'t type "help", "copyright", "credits" or "license" unless you\'ve assigned something to them');

//Loop
while (true){
    var lines = [];
    write('>>> ');

    var removePrints = false;

    //Read
    lines.push(readline());

    if (lines[0] == "") { continue; }
    //if line ends with a colon it's a block
    if (lines[0][lines[0].length - 1] === ':') {
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
            //Print
            if (!re.test(lines[0])){
                linesToCompile.pop();
                linesToCompile.push( "evaluationresult = " + lines[0]);
                linesToCompile.push("if not evaluationresult == None: print evaluationresult");
            }
            lines.pop();
        }
    }

    try{
        //Evaluate
        Sk.importMainWithBody("repl", false, linesToCompile.join('\n'));
        //remove print statements when a block is created that doesn't define anything
        compilableLines = compilableLines.concat(lines.map(function(str){
            if(re.test(str) && removePrints) {
                return str.replace(/print.*/g, "pass");
            } else {
                return str;
            }
        }));
    } catch (err) {
        if (err instanceof Sk.builtin.SystemExit)
        {
            quit();
        }
        print(err);

        var index = -1;
        //find the line number
        if ((index = err.toString().indexOf("on line")) != -1){
            index = parseInt(err.toString().substr(index + 8), 10);
        }
        var line = 0;
        //print the accumulated code with a ">" before the broken line.
        //Don't add the last statement to the accumulated code
        print (linesToCompile.map(function(str){
            return ++line + (index == line ? ">" : " ") + ": " + str;
        }).join('\n'));
    }
}