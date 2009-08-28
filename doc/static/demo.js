window.addEvent('domready', function() {
    var term = initTerminal(80, 20);

    // set up demo typers
    $('codeexample1').addEvent('click', (function(e)
            {
                e.stop();
                term.doClear();
                term.writeStr("print \"Hello, World!\"     # natch", false, true);
                term.doEnter();
            }));
    $('codeexample2').addEvent('click', (function(e)
            {
                e.stop();
                term.doClear();
                term.writeStr("for i in range(5):", false, true); term.doEnter();
                term.writeStr("    print i", false, true); term.doEnter();
                term.doEnter();
            }));
    $('codeexample3').addEvent('click', (function(e)
            {
                e.stop();
                term.doClear();
                term.writeStr("[x*x for x in range(20) if x % 2 == 0]", false, true);
                term.doEnter();
            }));
    $('codeexample4').addEvent('click', (function(e)
            {
                e.stop();
                term.doClear();
                term.writeStr("45**123", false, true);
                term.doEnter();
            }));

    term.writeStr("Skulpt demo REPL - " + new Date().toLocaleString() + "\n");
    term.writeStr(term.PS1, true);
});

