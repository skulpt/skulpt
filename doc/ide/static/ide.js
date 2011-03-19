var editor = undefined;

function startup()
{
    var filesBox;

    editor = CodeMirror.fromTextArea("code", {
        parserfile: ["../contrib/python/js/parsepython.js"],
        path: "/ide/static/codemirror/js/",
        autoMatchParens: true,
        stylesheet: "/ide/static/codemirror/contrib/python/css/pythoncolors.css",
        lineNumbers: true,
        indentUnit: 4,
        height: "100%",
        saveFunction: function() { alert('saved'); },
        initCallback: function(e) {
            e.grabKeys(function(e) {
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
            e.focus();

            goog.net.XhrIo.send("/ide/static/default/__init__.py", function(e) {
                    var xhr = e.target;
                    var text = xhr.getResponseText();
                    editor.setCode(text);
                    });

            }
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
            [ 'New Python File...', function() { alert('todo;'); } ],
            [ 'New Vertex Shader...', function() { alert('todo;'); } ],
            [ 'New Fragment Shader...', function() { alert('todo;'); } ],
            [ 'Save All', function() { alert('todo;'); } ],
            ]);
    var projectMenu = makeMenu('Project', [
            [ 'Save All and Run (F8)', function()
            {
                runCode();
            } ],
            [ null, null ],
            [ 'Delete...', function() { alert('delete'); } ],
            [ null, null ],
            [ 'Share...', function() { alert('todo;'); } ]
            ]);

    projectMenu.getChildAt(2).setEnabled(false); // since we start with only one item

    var el = goog.dom.getElement('filelist');
    filesBox = new goog.ui.ComboBox();
    filesBox.setMatchFunction(goog.string.contains);
    filesBox.setUseDropdownArrow(true);
    filesBox.setDefaultText('__init__.py');
    filesBox.addItem(new goog.ui.ComboBoxItem('__init__.py'));
    //filesBox.addItem(new goog.ui.ComboBoxItem('simple.vp'));
    //filesBox.addItem(new goog.ui.ComboBoxItem('simple.fp'));

    filesBox.render(el);



    var backToCodeButton = new goog.ui.CustomButton("Back to code");
    el = goog.dom.getElement("output_container");
    goog.events.listen(backToCodeButton, goog.ui.Component.EventType.ACTION, function(e) {
            goog.style.showElement(goog.dom.getElement('codeui'), true);
            goog.style.showElement(goog.dom.getElement('output_container'), false);
            goog.global.shutdownGLContext = true;
            setTimeout(function() { editor.focus(); }, 0);
            });
    backToCodeButton.render(el);

    var runOutput = goog.dom.getElement("runoutput");
    function runCode()
    {
        delete goog.global.shutdownGLContext;
        runoutput.innerHTML = "";
        goog.style.showElement(goog.dom.getElement('codeui'), false);
        goog.style.showElement(goog.dom.getElement('output_container'), true);
        var code = editor.getCode();
        Sk.configure({
            output: function(x) { runOutput.innerHTML += x.replace("<", "&lt;"); },
            debugout: function() { runOutput.innerHTML += "<font color='red'>" + Array.prototype.slice.call(arguments,0).join(' ') + "</font>\n"; },
            read: builtinRead,
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

    var toggleEdit = new goog.ui.CustomButton("Edit...");
    el = goog.dom.getElement("editbutton");
    goog.events.listen(toggleEdit, goog.ui.Component.EventType.ACTION, function(e) {
            goog.style.showElement(goog.dom.getElement('codeoroutput'), true);
            goog.style.showElement(el, false);
            });
    toggleEdit.render(el);

    var hideCodeButton = new goog.ui.CustomButton("Hide code");
    goog.events.listen(hideCodeButton, goog.ui.Component.EventType.ACTION, function(e) {
            goog.style.showElement(goog.dom.getElement('codeoroutput'), false);
            goog.style.showElement(goog.dom.getElement('editbutton'), true);
            });
    hideCodeButton.render(goog.dom.getElement('hidecode'));

    function builtinRead(x)
    {
        if (Sk.builtinFiles === undefined || Sk.builtinFiles[x] === undefined)
            throw "File not found: '" + x + "'";
        return Sk.builtinFiles[x];
    }
}
