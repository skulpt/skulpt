var editor = undefined;

function startup()
{
    var filesBox;

    editor = CodeMirror.fromTextArea("code", {
        parserfile: ["../contrib/python/js/parsepython.js"],
        path: "static/codemirror/js/",
        autoMatchParens: true,
        stylesheet: "static/codemirror/contrib/python/css/pythoncolors.css",
        lineNumbers: true,
        indentUnit: 4,
        height: "100%",
        saveFunction: function() { alert('saved'); },
        });
    editor.grabKeys(function(e) {
            if (e.ctrlKey && e.keyCode == 74)
            {
                filesBox.keyHandler_.element_.focus();
            }
            else if (e.keyIdentifier == "F8")
            {
                runCode();
            }
        }, function(kc, e) {
            return (kc == 74 && e.ctrlKey && !e.altKey && !e.shiftKey)
                    || e.keyIdentifier == "F8";
        });

    function makeMenu(name, items)
    {
        var m = new goog.ui.Menu();
        m.setId(name + "Menu");
        goog.array.forEach(items,
            function(data) {
                var item;
                var label = data[0];
                var cb = data[1];
                if (label)
                {
                    item = new goog.ui.MenuItem(label);
                    item.setId(label);
                    item.setDispatchTransitionEvents(goog.ui.Component.ALL, true);
                }
                else
                {
                    item = new goog.ui.MenuSeparator();
                }
                m.addItem(item);
                goog.events.listen(m, 'action', function(e)
                    {
                        if (e.target === item)
                            cb();
                    });
            });
        var b = new goog.ui.MenuButton(name, m);
        b.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
        b.setId(name + "Button");
        b.render(goog.dom.getElement("menuButtons"));
        return m;
    }

    var fileMenu = makeMenu('File', [
            [ 'New Python File...', function() { alert('new py'); } ],
            [ 'New Vertex Shader...', function() { alert('new vp'); } ],
            [ 'New Fragment Shader...', function() { alert('new fp'); } ],
            [ 'Save All', function() { alert('save'); } ],
            ]);
    var projectMenu = makeMenu('Project', [
            [ 'Save All and Run (F8)', function()
            {
                runCode();
            } ],
            [ null, null ],
            [ 'Delete...', function() { alert('delete'); } ],
            [ null, null ],
            [ 'Share...', function() { alert('share'); } ]
            ]);

    projectMenu.getChildAt(2).setEnabled(false); // since we start with only one item

    var el = goog.dom.getElement('filelist');
    filesBox = new goog.ui.ComboBox();
    filesBox.setMatchFunction(goog.string.contains);
    filesBox.setUseDropdownArrow(true);
    filesBox.setDefaultText('__init__.py');
    filesBox.addItem(new goog.ui.ComboBoxItem('__init__.py'));

    filesBox.render(el);

    var backToCodeButton = new goog.ui.CustomButton("Back to code");
    el = goog.dom.getElement("output_container");
    goog.events.listen(backToCodeButton, goog.ui.Component.EventType.ACTION, function(e) {
            goog.style.showElement(goog.dom.getElement('codeui'), true);
            goog.style.showElement(goog.dom.getElement('output_container'), false);
            setTimeout(function() { editor.focus(); }, 0);
            });
    backToCodeButton.render(el);

    var runOutput = goog.dom.getElement("runoutput");
    function runCode()
    {
        runoutput.innerHTML = "";
        goog.style.showElement(goog.dom.getElement('codeui'), false);
        goog.style.showElement(goog.dom.getElement('output_container'), true);
        var code = editor.getCode();
        Sk.configure({
            output: function(x) { runOutput.innerHTML += x; },
            sysargv: [ '__init__.py' ],
        });
        try
        {
            Sk.importMainWithBody("__init__.py", false, code);
        }
        catch (e)
        {
            runOutput.innerHTML += e.toString();
        }
    }

    goog.net.XhrIo.send("http://localhost:20710/example/env/default/__init__.py", function(e) {
      var xhr = e.target;
      var obj = xhr.getResponseText();
      editor.setCode(obj);
      });

    editor.focus();
}
