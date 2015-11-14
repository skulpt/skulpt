var $builtinmodule = function (name) {
    var request = {};


    //~ Classes .................................................................

    // Response class
    //
    // Response objects are returned by the request, get, post, etc.
    // methods, allowing the user to access the response text, status
    // code, and other information.

    // ------------------------------------------------------------
    var response = function ($gbl, $loc) {

        // ------------------------------------------------------------
        $loc.__init__ = new Sk.builtin.func(function (self, xhr) {
            self.data$ = xhr.responseText;
            self.lineList = self.data$.split("\n");
            self.lineList = self.lineList.slice(0, -1);
            for (var i = 0; i < self.lineList.length; i++) {
                self.lineList[i] = self.lineList[i] + '\n';
            }
            self.currentLine = 0;
            self.pos$ = 0;
        });


        // ------------------------------------------------------------
        $loc.__str__ = new Sk.builtin.func(function (self) {
            return Sk.ffi.remapToPy('<Response>');
        });


        // ------------------------------------------------------------
        $loc.__iter__ = new Sk.builtin.func(function (self) {
            var allLines = self.lineList;

            return Sk.builtin.makeGenerator(function () {
                if (this.$index >= this.$lines.length) {
                    return undefined;
                }
                return new Sk.builtin.str(this.$lines[this.$index++]);
            }, {
                $obj  : self,
                $index: 0,
                $lines: allLines
            });
        });


        // ------------------------------------------------------------
        $loc.read = new Sk.builtin.func(function (self, size) {
            if (self.closed) {
                throw new Sk.builtin.ValueError("I/O operation on closed file");
            }
            var len = self.data$.length;
            if (size === undefined) {
                size = len;
            }
            var ret = new Sk.builtin.str(self.data$.substr(self.pos$, size));
            self.pos$ += size;
            if (self.pos$ >= len) {
                self.pos$ = len;
            }
            return ret;
        });


        // ------------------------------------------------------------
        $loc.readline = new Sk.builtin.func(function (self, size) {
            var line = "";
            if (self.currentLine < self.lineList.length) {
                line = self.lineList[self.currentLine];
                self.currentLine++;
            }
            return new Sk.builtin.str(line);
        });


        // ------------------------------------------------------------
        $loc.readlines = new Sk.builtin.func(function (self, sizehint) {
            var arr = [];
            for (var i = self.currentLine; i < self.lineList.length; i++) {
                arr.push(new Sk.builtin.str(self.lineList[i]));
            }
            return new Sk.builtin.list(arr);
        });

    };

    request.Response =
        Sk.misceval.buildClass(request, response, 'Response', []);


    //~ Module functions ........................................................

    // ------------------------------------------------------------
    /**
     * Constructs and sends a Request. Returns Response object.
     *
     * http://docs.python-requests.org/en/latest/api/#requests.request
     *
     * For now, this implementation doesn't actually construct a Request
     * object; it just makes the request through jQuery.ajax and then
     * constructs a Response.
     */
    request.urlopen = new Sk.builtin.func(function (url, data, timeout) {
        var xmlhttp = new XMLHttpRequest();

        if (!data) {
          xmlhttp.open("GET", url.v, false);
          xmlhttp.send(null);
        } else {
          xmlhttp.open("POST", url.v, false);
          xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
          xmlhttp.setRequestHeader("Content-length", data.v.length);
          xmlhttp.send(data.v);
        }

        return Sk.misceval.callsim(request.Response, xmlhttp)
    });


    return request;
};
