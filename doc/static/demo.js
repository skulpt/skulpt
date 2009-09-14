window.addEvent('domready', function() {
    var term = initTerminal(80, 20);

    var exampleCode = function(id, lines)
    {
        $(id).addEvent('click', (function(e)
                {
                    e.stop();
                    term.doClear();
                    for (var i = 0; i < lines.length; ++i)
                    {
                        term.writeStr(lines[i], false, true);
                        term.doEnter();
                    }
                    if (lines.length > 1) term.doEnter();
                }));
    };

    // set up demo typers
    exampleCode('codeexample1', ["print \"Hello, World!\"     # natch"]);
    exampleCode('codeexample2', [
        "for i in range(5):",
        "    print i"
        ]);
    exampleCode('codeexample3', ["[x*x for x in range(20) if x % 2 == 0]"]);
    exampleCode('codeexample4', ["45**123"]);
    exampleCode('codeexample5', ["print \"%s:%r:%d:%x\\n%#-+37.34o\" % (\"dog\", \"cat\", 23456, 999999999999L, 0123456702345670123456701234567L)"]);
    exampleCode('codeexample6', ["def genr(n):",
            "    i = 0",
            "    while i < n:",
            "        yield i",
            "        i += 1",
            "",
            "list(genr(12))"]);

    term.writeStr("Skulpt demo REPL - " + new Date().toLocaleString() + "\n");
    term.writeStr(term.PS1, true);
});

