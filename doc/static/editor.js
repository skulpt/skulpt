var TestFile = [
    '#!skulpt',
    '',
    'def func(n):',
    '    for i in range(n):',
    '        print "in func", i',
    '',
    'print "Hello World!"',
    'func(10)',
    '',
    ];


/*
 * sub-editor interface. internal api that controls the buffer and provides
 * lower-level commands on it. separate from the rendering of the buffer and
 * the editor ui that's presented to the user.
 *
 * definitions
 * world: the whole context, contains a list of buffers
 * buffer: roughly a file. represented as a list of lines plus some state info
 * point: the current insertion location
 */
function World()
{
    this.buffers = [];
    this.CreateBuffer("*scratch*");
    return this;
};

World.prototype.CreateBuffer(name)
{
    this.buffers.push(
    throw;
};
World.prototype.DeleteBuffer(name)
{
    throw;
};
World.prototype.SetCurrentBuffer(name)
{
    throw;
};
World.prototype.SetNextBuffer()
{
    throw;
};



function seSetMode(mode)
{
    CurrentMode = mode;
}

function sePointMove(dx, dy)
{
}


var WIDTH = 80;
var HEIGHT = 25;
var stat;
var cx = 0;
var cy = 0;
var CurrentMode = NormalMode;

function cmdInsertKey(e) { seInsert(e.key); }
var InsertMode =
{
    'enter': function() { seInsert('\n'); },
    'backspace': function() { seDelete(-1); },
    'delete': function() { seDelete(1); },
    'esc': function() { seSetMode(NormalMode); },
    'a': cmdInsertKey, 'b': cmdInsertKey, 'c': cmdInsertKey, 'd': cmdInsertKey, 'e': cmdInsertKey, 'f': cmdInsertKey, 'g': cmdInsertKey, 'h': cmdInsertKey, 'i': cmdInsertKey, 'j': cmdInsertKey, 'k': cmdInsertKey, 'l': cmdInsertKey, 'm': cmdInsertKey, 'n': cmdInsertKey, 'o': cmdInsertKey, 'p': cmdInsertKey, 'q': cmdInsertKey, 'r': cmdInsertKey, 's': cmdInsertKey, 't': cmdInsertKey, 'u': cmdInsertKey, 'v': cmdInsertKey, 'w': cmdInsertKey, 'x': cmdInsertKey, 'y': cmdInsertKey, 'z': cmdInsertKey,
    'A': cmdInsertKey, 'B': cmdInsertKey, 'C': cmdInsertKey, 'D': cmdInsertKey, 'E': cmdInsertKey, 'F': cmdInsertKey, 'G': cmdInsertKey, 'H': cmdInsertKey, 'I': cmdInsertKey, 'J': cmdInsertKey, 'K': cmdInsertKey, 'L': cmdInsertKey, 'M': cmdInsertKey, 'N': cmdInsertKey, 'O': cmdInsertKey, 'P': cmdInsertKey, 'Q': cmdInsertKey, 'R': cmdInsertKey, 'S': cmdInsertKey, 'T': cmdInsertKey, 'U': cmdInsertKey, 'V': cmdInsertKey, 'W': cmdInsertKey, 'X': cmdInsertKey, 'Y': cmdInsertKey, 'Z': cmdInsertKey
};

var NormalMode =
{
    'i': function() { seSetMode(InsertMode); },
    'h': function() { sePointMove(-1, 0); },
    'j': function() { sePointMove(0, 1); },
    'k': function() { sePointMove(0, -1); },
    'l': function() { sePointMove(1, 0); },
    'H': function() { seStartOfLine(); },
    'L': function() { seEndOfLine(); },
    'w': function() { sePointMoveWordForward(charsWord); },
    'W': function() { sePointMoveWordForward(charsWORD); },
    'b': function() { sePointMoveWordBackward(charsWord); },
    'B': function() { sePointMoveWordBackward(charsWORD); },
    'e': function() { sePointMoveEndOfWordForward(charsWord); },
    'E': function() { sePointMoveEndOfWordForward(charsWORD); },
    'd': function() { seSetMode(NormalModeD); },
    'y': function() { seSetMode(NormalModeY); },
};


function getMaskText(e)
{
    var ret = '';
    if (e.control) ret += "C";
    if (e.shift) ret += "S";
    if (e.alt) ret += "A";
    return ret;
}

function handleKeyDown(e)
{
    $('line_14').set('text', e.key + getMaskText(e));
    if (e.key === "backspace"
            || e.key === "tab"
            || e.key === "esc"
            || (e.key === "F" && e.control)
            || (e.key === "B" && e.control)
            )
    {
        // doesn't seem to work in ie7, can't stop ctrl-f from opening find it
        // seems?
        $('line_17').set('text', 'stopped ' + e.key + ' in keydown');
        e.stop();
        e.preventDefault();
        e.stopPropagation();
        handleKeyPress(e);
    }
}

function updateCursor()
{
    var pos = $('line_' + cy).getPosition();
    pos.x += cx * 8;
    $('cursor').setPosition(pos);
}

function dispatch(e)
{
    
}

function handleKeyPress(e)
{
    $('line_15').set('text', e.key + getMaskText(e));
    $('line_18').set('text', String.fromCharCode(e.code) + getMaskText(e))
    // don't swallow these, it's more irritating than lacking the
    // functionality in the editor
    if ((e.key === "T" && e.control)
            || (e.key === "N" && e.control))
        return;

    dispatch(e);
    if (e.key === 'j' && getMaskText(e) === "")
    {
        cy += 1;
        if (cy > HEIGHT - 1) cy = HEIGHT - 1;
        updateCursor();
    }
    else if (e.key === 'k' && getMaskText(e) === "")
    {
        cy -= 1;
        if (cy < 0) cy = 0;
        updateCursor();
    }
    else if (e.key === 'h' && getMaskText(e) === "")
    {
        cx -= 1;
        if (cx < 0) cx = 0;
        updateCursor();
    }
    else if (e.key === 'l' && getMaskText(e) === "")
    {
        cx += 1;
        if (cx > WIDTH - 1) cx = WIDTH - 1;
        updateCursor();
    }


    e.stop();
    e.preventDefault();
    e.stopPropagation();
}

function handleKeyUp(e)
{
    $('line_16').set('text', e.key + getMaskText(e));
    e.stop();
    e.preventDefault();
    e.stopPropagation();
}

function main()
{
    // must be document on ie7 even though window is what we want
    document.addEvent('keydown', handleKeyDown);
    document.addEvent('keypress', handleKeyPress);
    document.addEvent('keyup', handleKeyUp);

    (function() {
        $('cursor').fade('toggle');
    }).periodical(500);

    var ed = $('ed');
    for (var h = 0; h < HEIGHT; ++h)
    {
        var line = new Element("pre", { id: "line_" + h, 'class': 'edline' });
        if (h < TestFile.length)
        {
            line.set('text', TestFile[h]);
        }
        else
        {
            line.set('text', '~');
        }
        line.inject(ed);
    }
    stat = $('line_' + (HEIGHT - 1));
    stat.set('text', '-- INSERT --');
}

window.addEvent('domready', main);
