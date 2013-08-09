Sk.configure({
    output: print(str),
    sysargv: [ name + '.py' ],
    read: read
});

while (true){
    print('>>>');
    var lines = [];
    lines.push(readline());
    if (line[line.length - 1] === ':'){
        print('...');
        var additionallines = [];
        var curline = "";
        do{
            curline = readline()
            lines.push(curline);
        } while (curline != "");
    }

    if (lines.length == 1){
        lines[0] = "print " + lines[0];
        if (lines[0].indexOf("quit") != -1){
            break;
        }
    }

    Sk.importMain(lines.join('\n'), false);
}