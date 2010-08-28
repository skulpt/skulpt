
/**
	@constructor
*/
JSDOC.TextStream = function(text) {
	if (typeof(text) == "undefined") text = "";
	text = ""+text;
	this.text = text;
	this.cursor = 0;
}

JSDOC.TextStream.prototype.look = function(n, considerWhitespace) {
	if (typeof n == "undefined") n = 0;
	if (typeof considerWhitespace == "undefined") considerWhitespace = false;
	
	if (this.cursor+n < 0 || this.cursor+n >= this.text.length) {
		var result = new String("");
		result.eof = true;
		return result;
	}
 	else if ( considerWhitespace ) {
 		var count = 0;
 		var i = this.cursor;
 
 		while (true) {
 			if (this.text.charAt(n+i).match(/\s/) ) {
 				if (n < 0) i--; else i++;
 				continue;
 			}
 			else {
 				return this.text.charAt(n+i)
 			}
 		}
 	}
 	else {
 		return this.text.charAt(this.cursor+n);
 	}
}

JSDOC.TextStream.prototype.next = function(n) {
	if (typeof n == "undefined") n = 1;
	if (n < 1) return null;
	
	var pulled = "";
	for (var i = 0; i < n; i++) {
		if (this.cursor+i < this.text.length) {
			pulled += this.text.charAt(this.cursor+i);
		}
		else {
			var result = new String("");
			result.eof = true;
			return result;
		}
	}

	this.cursor += n;
	return pulled;
}