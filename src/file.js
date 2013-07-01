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
	if ( Sk.inBrowser ) {  // todo:  Maybe provide a replaceable function for non-import files
        var elem = document.getElementById(name.v);
        if ( elem == null) {
            throw new Sk.builtin.IOError("[Errno 2] No such file or directory: '"+name.v+"'");
        } else {
           if( elem.nodeName.toLowerCase() == "textarea") {
               this.data$ = elem.value;
           }
           else {
	           this.data$ = elem.textContent;
	       }
	    }
	} else {
  		this.data$ = Sk.read(name.v);
	}
	this.lineList = this.data$.split("\n");
	this.lineList = this.lineList.slice(0,-1);
	for(var i in this.lineList) {
		this.lineList[i] = this.lineList[i]+'\n';
	}
	this.currentLine = 0;
    this.pos$ = 0;

	this.__class__ = Sk.builtin.file;

    return this;
};

Sk.builtin.file.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('file', Sk.builtin.file);

Sk.builtin.file.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

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

Sk.builtin.file.prototype.tp$iter = function()
{
    var allLines = this.lineList;

    var ret =
    {
        tp$iter: function() { return ret; },
        $obj: this,
        $index: 0,
        $lines: allLines,
        tp$iternext: function()
        {
            if (ret.$index >= ret.$lines.length) return undefined;
            return new Sk.builtin.str(ret.$lines[ret.$index++]);
        }
    };
    return ret;
};


Sk.builtin.file.prototype['close'] = new Sk.builtin.func(function(self)
{
    self.closed = true;
});


Sk.builtin.file.prototype['flush'] = new Sk.builtin.func(function(self) {});
Sk.builtin.file.prototype['fileno'] = new Sk.builtin.func(function(self) { return 10; }); // > 0, not 1/2/3
Sk.builtin.file.prototype['isatty'] = new Sk.builtin.func(function(self) { return false; });


Sk.builtin.file.prototype['read'] = new Sk.builtin.func(function(self, size)
{
    if (self.closed) throw new Sk.builtin.ValueError("I/O operation on closed file");
    var len = self.data$.length;
    if (size === undefined) size = len;
    var ret = new Sk.builtin.str(self.data$.substr(self.pos$, size));
    self.pos$ += size;
    if (self.pos$ >= len) self.pos$ = len;
    return ret;
});

Sk.builtin.file.prototype['readline'] = new Sk.builtin.func(function(self, size)
{
	var line = "";
	if (self.currentLine < self.lineList.length) {
		line = self.lineList[self.currentLine];
    	self.currentLine++;
	}
	return new Sk.builtin.str(line);
});

Sk.builtin.file.prototype['readlines'] = new Sk.builtin.func(function(self, sizehint)
{
    var arr = [];
    for(var i = self.currentLine; i < self.lineList.length; i++) {
		arr.push(new Sk.builtin.str(self.lineList[i]));
    }
	return new Sk.builtin.list(arr);
});

Sk.builtin.file.prototype['seek'] = new Sk.builtin.func(function(self, offset, whence)
{
    if (whence === undefined ) whence = 1;
    if (whence == 1) {
		self.pos$ = offset;
	} else {
		self.pos$ = self.data$ + offset;
	}
});

Sk.builtin.file.prototype['tell'] =  new Sk.builtin.func(function(self)
{
    return self.pos$;
});


Sk.builtin.file.prototype['truncate'] = new Sk.builtin.func(function(self, size)
{
    goog.asserts.fail();
});

Sk.builtin.file.prototype['write'] = new Sk.builtin.func(function(self, str)
{
    goog.asserts.fail();
});


goog.exportSymbol("Sk.builtin.file", Sk.builtin.file);
