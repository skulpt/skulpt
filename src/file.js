/**
 * @constructor
 * @param {Sk.builtin.str} name
 * @param {Sk.builtin.str} mode
 * @param {Object} buffering
 */
Sk.builtin.file = function(name, mode, buffering)
{
    this.mode = mode;
    this.name = name;
    this.closed = false;
    this.data$ = Sk.read(name.v);
    this.pos$ = 0;
    return this;
};
Sk.builtin.file.prototype['$r'] = function()
{
    return new Sk.builtin.str("<"
        + (this.closed ? "closed" : "open")
        + "file '"
        + this.name
        + "', mode '"
        + this.mode
        + "'>");
};

Sk.builtin.file.close = function(self)
{
    self.closed = true;
};

Sk.builtin.file.flush = function(self) {};

Sk.builtin.file.fileno = function(self) { return 10; }; // > 0, not 1/2/3
Sk.builtin.file.isatty = function(self) { return false; };
Sk.builtin.file.next = function(self) { throw "todo; file.next"; };
Sk.builtin.file.read = function(self, size)
{
    if (self.closed) throw new Sk.builtin.ValueError("I/O operation on closed file");
    var len = self.data$.length;
    if (size === undefined) size = len;
    var ret = new Sk.builtin.str(self.data$.substr(self.pos$, size));
    self.pos$ += size;
    if (self.pos$ >= len) self.pos$ = len;
    return ret;
};

Sk.builtin.file.readline = function(self, size)
{
    goog.asserts.fail();
};
Sk.builtin.file.readlines = function(self, sizehint)
{
    goog.asserts.fail();
};
Sk.builtin.file.seek = function(self, offset, whence)
{
    goog.asserts.fail();
};
Sk.builtin.file.tell = function(self)
{
    goog.asserts.fail();
};
Sk.builtin.file.truncate = function(self, size)
{
    goog.asserts.fail();
};
Sk.builtin.file.write = function(self, str)
{
    goog.asserts.fail();
};
Sk.builtin.file.writelines = function(self, sequence)
{
    goog.asserts.fail();
};

