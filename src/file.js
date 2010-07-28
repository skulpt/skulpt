(function() {

var $ = Sk.builtin.file = function(name, mode, buffering)
{
    this.mode = mode;
    this.name = name;
    this.closed = false;
    this.data$ = Sk.load(name.v);
    this.pos$ = 0;
    this.__class__ = this.nativeclass$ = $;
    return this;
};
$.prototype.__class__ = new Sk.builtin.type('file', [Sk.types.object], {});
$.prototype.__repr__ = function()
{
    return new Sk.builtin.str("<"
        + (this.closed ? "closed" : "open")
        + "file '"
        + this.name
        + "', mode '"
        + this.mode
        + "'>");
};

$.close = function(self)
{
    self.closed = true;
};

$.flush = function(self) {};

$.fileno = function(self) { return 10; }; // > 0, not 1/2/3
$.isatty = function(self) { return false; };
$.next = function(self) { throw "todo; file.next"; };
$.read = function(self, size)
{
    if (self.closed) throw new Sk.builtin.ValueError("I/O operation on closed file");
    var len = self.data$.length;
    if (size === undefined) size = len;
    var ret = new Sk.builtin.str(self.data$.substr(self.pos$, size));
    self.pos$ += size;
    if (self.pos$ >= len) self.pos$ = len;
    return ret;
};

$.readline = function(self, size)
{
    throw "todo;";
};
$.readlines = function(self, sizehint)
{
    throw "todo;";
};
$.seek = function(self, offset, whence)
{
    throw "todo;";
};
$.tell = function(self)
{
    throw "todo;";
};
$.truncate = function(self, size)
{
    throw "todo;";
};
$.write = function(self, str)
{
    throw "todo;";
};
$.writelines = function(self, sequence)
{
    throw "todo;";
};


}());
