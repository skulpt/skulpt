window.addEvent('domready', function() {
    var editor = CodeMirror.fromTextArea('code', {
        parserfile: ["parsepython.js"],
        stylesheet: "static/env/codemirror/css/pythoncolors.css",
        path: "static/env/codemirror/js/",
        lineNumbers: true,
        textWrapping: false,
        indentUnit: 4,
        height: "160px",
        fontSize: "9pt",
        autoMatchParens: true,
        parserConfig: {'pythonVersion': 2, 'strictErrors': true},
        initCallback: rest
    });

    var quickDocsSlide = new Fx.Slide("quickdocs");
    quickDocsSlide.hide();

    $("toggledocs").addEvent('click', function(e) {
            e.stop();
            quickDocsSlide.toggle();
        });

    var exampleCode = function(id, text)
    {
        $(id).addEvent('click', (function(e)
                {
                    e.stop();
                    editor.setCode(text);
                    editor.focus(); // so that F5 works, hmm
                }));
    };

    exampleCode('codeexample1', "print \"Hello, World!\"     # natch");
    exampleCode('codeexample2', "for i in range(5):\n    print i\n");
    exampleCode('codeexample3', "print [x*x for x in range(20) if x % 2 == 0]");
    exampleCode('codeexample4', "print 45**123");
    exampleCode('codeexample5', "print \"%s:%r:%d:%x\\n%#-+37.34o\" % (\n        \"dog\",\n        \"cat\",\n        23456,\n        999999999999L,\n        0123456702345670123456701234567L)");
    exampleCode('codeexample6', "def genr(n):\n    i = 0\n    while i < n:\n        yield i\n        i += 1\n\nprint list(genr(12))\n");

    $('clearoutput').addEvent('click', function(e)
            {
                e.stop();
                $('edoutput').set('text', '');
            });

    function rest(editor)
    {
        editor.focus();
        editor.grabKeys(function(e)
                {
                    if (e.keyCode === 13)
                    {
                        var output = $('edoutput');
                        sk$output = function(text)
                        {
                            output.set('html', output.get('html') + text.replace("\n", "<br/>"));
                        };
                        if (e.ctrlKey)
                        {
                            e.stop();
                            eval(Skulpt.compileStr("<stdin>", editor.getCode()));
                            new Fx.Scroll('edoutput').toBottom();
                        }
                        else if (e.shiftKey)
                        {
                            e.stop();
                            eval(Skulpt.compileStr("<stdin>", editor.selection()));
                            new Fx.Scroll('edoutput').toBottom();
                        }
                    }
                }, function(e) {
                    return (e.ctrlKey || e.shiftKey) && e.keyCode === 13;
                });
    }
});
