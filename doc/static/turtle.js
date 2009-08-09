window.addEvent('domready', function() {
    var term = initTerminal(80, 20);
    term.writeStr("Welcome to Skulpt Turtle. Type 'help' for more information.\n");
    term.writeStr(term.PS1, true);
    var field = $('field');
    if (field.getContext)
    {
        ctx = field.getContext('2d');
    }
    else
    {
        field.setHTML("Sorry, it doesn't seem like your browser can handle the turtle (needs <canvas>).");
    }
    reset();
});

var w = 640;
var h = 480;
var ctx;
var T;
var SX = function(x) { return x + w/2; }
var SY = function(y) { return -y + h/2; }

var d2r = function(deg) { return deg * Math.PI / 180.0; }

var go = function(dist)
{
    console.log(T.rot);
    T.x += Math.cos(d2r(T.rot)) * dist;
    T.y += Math.sin(d2r(T.rot)) * dist;
    if (T.p)
    {
        ctx.lineTo(SX(T.x), SY(T.y));
        ctx.stroke();
        ctx.beginPath();
    }
    else
    {
        ctx.moveTo(SX(T.x), SY(T.y));
    }
};

var turn = function(deg)
{
    T.rot += deg;
};

var color;
var colour;
color = colour = function(name)
{
    fillStyle = name;
    strokeStyle = name;
};

var width = function(num)
{
    ctx.lineWidth = num;
};

var pen_up = function()
{
    T.p = false;
};

var pen_down = function()
{
    ctx.beginPath();
    T.p = true;
};

var invisible = function()
{
    T.v = false;
};

var visible = function()
{
    T.v = true;
};

var reset = function()
{
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.strokeStyle = "rgb(255,255,255)";
    T = {
        x: 0,
        y: 0,
        rot: 0,
        p: true,
        v: true
    };
    ctx.beginPath();
    ctx.moveTo(SX(0), SY(0));
};

var help = "todo; docs. Here's some functions:\n" +
    "  go(dist)\n" +
    "  turn(deg)\n" +
    "  color/colour(str)\n" +
    "  width(num)\n" +
    "  pen_up()\n" +
    "  pen_down()\n" +
    "  invisible()\n" +
    "  visible()\n" +
    "  reset()";
