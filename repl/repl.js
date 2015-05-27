Sk.configure({ 
	output: write, 
	read: read, 
	systemexit: true, 
	retainglobals: true,
	inputfun: readline
});

var compilableLines = [],
    //finds lines starting with "print"
    re = new RegExp("\\s*print"),
    //finds import statements
    importre = new RegExp("\\s*import"),
    //finds multuline string constants
    mls = new RegExp("'''"),
    //finds defining statements
    defre = new RegExp("def.*|class.*"),
    //test for empty line.
    emptyline = new RegExp("^\\s*$"),
    //a regex to check if a line is an assignment
    //this regex checks whether or not a line starts with 
    //an identifier followed with some whitspace and then an = and then some more white space.
    //it also checks if the identifier is a tuple.
    assignment= /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))=/,
        
    lines = [];

print("Python 2.6(ish) (skulpt, " + new Date() + ")");
print("[v8: " + version() + "] on a system");
print('Don\'t type "help", "copyright", "credits" or "license" unless you\'ve assigned something to them');

function isBalanced(lines) {
    'use strict';
	var depth = 0,
        mlsopened = false,
		l;
    
    for (l = 0; l < lines.length; l = l + 1) {
		if (lines[l] !== undefined) {
			if (lines[l].match(/'''/) !== null && lines[l].match(/'''/).length === 1) {
				mlsopened = !mlsopened;
			}
			if (!mlsopened && lines[l].substr(lines[l].length - 1) === ":") {
				depth = depth + 1;
			}
			if (!mlsopened && lines[l] === "" && depth > 0) {
				depth = 0;
			}
		}
    }
    return depth === 0 && !mlsopened;
}

//Loop
while (true) {
    write(isBalanced(lines) ? '>>> ' : '... ');

    //Read
    lines.push(readline());
	
    //See if it is ready to be evaluated;
    if (!isBalanced(lines)) { continue; }

    //it's a onliner
    if (lines.length === 1) {
        //if it's a statement that should be printed (not containing an = or def or class or an empty line)
        if (!assignment.test(lines[0]) && !defre.test(lines[0]) && !importre.test(lines[0]) && lines[0].length > 0) {
            //if it doesn't contain print make sure it doesn't print None
            if (!re.test(lines[0])) {
				//remove the statement
                //evaluate it if nessecary
                lines.push("evaluationresult = " + lines.pop());
                //print the result if not None
                lines.push("if not evaluationresult == None: print repr(evaluationresult)");
            }
        }
    }

    try {
        //Evaluate
        if (!lines || /^\s*$/.test(lines)) {
            continue
        }
        else {
            Sk.importMainWithBody("repl", false, lines.join('\n'));            
        }
    } catch (err) {
        if (err instanceof Sk.builtin.SystemExit) {
            quit();
        }
		
        print(err);

        var index = -1;
        //find the line number
        if ((index = err.toString().indexOf("on line")) !== -1) {
            index = parseInt(err.toString().substr(index + 8), 10);
        }
        var line = 0;
        //print the accumulated code with a ">" before the broken line.
        //Don't add the last statement to the accumulated code
        print(lines.map(function (str) {
            return ++line + (index === line ? ">" : " ") + ": " + str;
        }).join('\n'));
    } finally {
		lines = [];
	}
}