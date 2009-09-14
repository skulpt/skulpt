function initTerminal(w, h)
{
    var screen = [];
    var cx = 0;
    var cy = 0;
    var promptx = 0;
    var prompty = 0;
    var curInput = '';
    var ctx = new Skulpt.InteractiveContext();
    var PS1 = ">>> ";
    var PS2 = "... ";

    var makeRow = function(y)
        {
            screen[y] = [];
            var row = new Element('tr').inject(term);
            screen[y].row = row;
            for (var x = 0; x < w; ++x)
            {
                screen[y][x] = new Element('td', { 'class': 'termcell' }).inject(row);
                screen[y][x].set('html', '&nbsp;');
            }
        };

    // create a grid of spans
    var term = new Element('table').inject($('isk'));
    for (var y = 0; y < h; ++y)
    {
        makeRow(y);
    }
    var cursor = screen[0][0];

    (function() {
        cursor.fade('toggle');
    }).periodical(500);


    var writeStr = function(s, tagprompt, isInput)
    {
        for (var i = 0; i < s.length; ++i) writeChar(s.substr(i,1), isInput);
        if (tagprompt)
        {
            promptx = cx;
            prompty = cy;
        }
    };

    var writeChar = function(c, isInput)
    {
        deCursor();

        if (c === '\n')
        {
            cx = 0;
            cy += 1;
        }
        else
        {
            screen[cy][cx].set('text', c[0]);
            cx += 1;
            if (cx === w)
            {
                cx = 0;
                cy += 1;
            }
        }
        if (cy === h)
        {
            var x;
            cy = h - 1;
            screen[0].row.destroy();
            for (var y = 0; y < h - 1; ++y)
                screen[y] = screen[y + 1];
            makeRow(h - 1);
        }
        if (isInput) curInput += c.substr(0, 1);

        reCursor();
    };

    var deCursor = function()
    {
        cursor.setStyle('background-color', 'black');
        cursor.get('tween').cancel();
        cursor.setStyle('opacity', 1);
    };
    var reCursor = function()
    {
        cursor = screen[cy][cx];
        cursor.setStyle('opacity', 0);
    };

    var doEnter = function(e)
    {
        var input = curInput.substring();
        curInput = '';

        if (e) e.stop();

        writeStr("\n");

        var got = '';
        var evaled = false;
        sk$output = function(str) { got += str; }

        try
        {
            var js = ctx.evalLine(input + "\n");
            if (js === false)
            {
                writeStr(PS2, true);
            }
            else
            {
                evaled = true;
                //console.log(js);
                var evret = eval.call(window, js);
                if (evret)
                {
                    if (evret.__repr__ !== undefined)
                        got += evret.__repr__().v + "\n";
                    else if (typeof evret === "number")
                        got += evret.toString() + "\n";
                }
            }
        }
        catch (e)
        {
            evaled = true;
            got = e.toString() + "\n";
        }

        if (evaled)
        {
            ctx = new Skulpt.InteractiveContext();
            writeStr(got);
            writeStr(PS1, true);
        }
    }

    var doClear = function()
    {
        writeStr("\n");
        curInput = '';
        writeStr(PS1, true);
    };

    // This is f'n ridiculous. keycode in keydown seems the only semi-reliable
    // one, and this is totally hardcoded for an en-US keyb, I think. (?)
    // charCode seems like what it ought to be, but IE and Opera don't believe
    // in that idea.

    var unshifted = {
32: ' ',
48: '0', 49: '1', 50: '2', 51: '3', 52: '4',
53: '5', 54: '6', 55: '7', 56: '8', 57: '9',

65: 'a', 66: 'b', 67: 'c', 68: 'd', 69: 'e',
70: 'f', 71: 'g', 72: 'h', 73: 'i', 74: 'j',
75: 'k', 76: 'l', 77: 'm', 78: 'n', 79: 'o',
80: 'p', 81: 'q', 82: 'r', 83: 's', 84: 't',
85: 'u', 86: 'v', 87: 'w', 88: 'x', 89: 'y',
90: 'z',

109: '-', 189: '-',
61: '=', 187: '=',

188: ',',
190: '.',
191: '/',
192: '`',
219: '[',
221: ']',
186: ';', 59: ';',
220: '\\',
222: "'"
    };
    var shifted = {
32: ' ',
48: ')', 49: '!', 50: '@', 51: '#', 52: '$',
53: '%', 54: '^', 55: '&', 56: '*', 57: '(',

65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E',
70: 'F', 71: 'G', 72: 'H', 73: 'I', 74: 'J',
75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O',
80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T',
85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y',
90: 'Z',

109: '_', 189: '_',
61: '+', 187: '+',

188: '<',
190: '>',
191: '?',
192: '~',
219: '{',
221: '}',
186: ':', 59: ':',
220: '|',
222: '"'
    };

    document.addEvent('keydown',
        function(e)
        {
            if (e.control && !e.meta && !e.alt && !e.shift && e.code == 67) // ctrl-c
            {
                doClear();
            }
            else if (!e.meta && !e.control && !e.alt)
            {
                deCursor();
                //console.log(e.code);

                if (!e.shift && e.code in unshifted)
                {
                    e.stop();
                    writeChar(unshifted[e.code], true);
                }
                else if (e.shift && e.code in shifted)
                {
                    e.stop();
                    writeChar(shifted[e.code], true);
                }
                else if (e.key === "tab")
                {
                    e.stop();
                    do
                    {
                        writeChar(" ", true);
                    } while(cx % 4 != 0);
                }
                else if (e.key === "backspace")
                {
                    e.stop();
                    if (cy !== prompty || cx !== promptx)
                    {
                        cx -= 1;
                        if (cx === -1)
                        {
                            cx = w - 1;
                            cy -= 1;
                            if (cy < 0) cy = 0;
                        }
                        screen[cy][cx].set('text', ' ');
                        curInput = curInput.substring(0, curInput.length - 1);
                    }
                    reCursor();
                }
                else if (e.key === "enter")
                {
                    doEnter(e);
                }
            }



        });

    return {
        doClear: doClear,
        doEnter: doEnter,
        writeStr: writeStr,
        PS1: PS1,
        PS2: PS2
    };
}
