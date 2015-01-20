Sk.builtin.str.prototype["format"] = new Sk.builtin.func(function (self) {

    // implementation of pythons str.format() function
    // step1: pull out {}"s
    // step2: process {}"s
    // step3: replace {}"s

    var replacement_field;
    var input;
    // var arguments;
    var args;
    var fields;
    var field_dict = {};

    Sk.builtin.pyCheckArgs("format", arguments, 1);
    // print
    if (arguments[1] === undefined) {
        // print(JSON.stringify(arguments));
        return self;
    }
    args = Sk.misceval.arrayFromArguments(arguments);


    input = self.v;

    fields = input.match(/{(.*?)}/g);
    // print(fields.length)
    for (var i = 0; i < fields.length; i ++) {
        // var number = parseInt(number)
        var match = fields[i];
        var place = i;
        var place_str = String(place);
        var arg_value;
        var match_int;
        var field_name;
        var result;
        // print(JSON.stringify(args))
        // print(i)

        match = match.replace(/[{|}]/g, "");
        // place = parseInt(place)
        // print(place)
        // print(place)
        // print(JSON.stringify(args))
        if (match.length === 0) {
            field_name = place_str;
            result = args[i + 1].v;
            // print(place)
            // print(match)
            // place = place;
            //field_dict[place_str] = {
            //    orig: match,
            //    result: arg_value,
            //    field_name: place_str,
            //
            //
            //}
            initiate_field_dict(field_name, place_str, result, place);
        }
        else if (isInt(match)) {
            field_name = parseInt(match);
            match_int = parseInt(match);
            result = args[match_int + 1].v;
            // print(place)
            // print(match)


            //field_dict[match] = {
            //    orig: match,
            //    result: arg_value
            //}

            initiate_field_dict(match, field_name, result, place);
        }
        // }
        else {
            // need to process into actual result here
            // eek
            // print(place)

            result = "";
            initiate_field_dict(match, match, result, place);
            parse_replacement_field(match);
            //field_dict[match] = {
            //    orig: match,
            //    result: match
            //}
        }
    }

    // print(fields)
    // print(JSON.stringify(field_dict))

    // parse_replacement_field(fields)

    function initiate_field_dict(key, original, result, place){
        field_dict[key] = {
            replacement_field: original,
            key: key,
            field_name: "",
            arg_name: "",
            attribute_name: "",
            index_string: "",
            conversion:"",
            format_spec:"",
            result: result,
            place: place
        }

    }

    function parse_replacement_field(replacement_field) {
        var field_name;
        var arg_name;
        var attribute_name;
        var element_index;
        var conversion;
        var format_spec;
        var repsplit;
        var has_field_name = false;
        // print(replacement_field)
        // replacement_field = replacement_field.replace(/[\{|\}]/g, "")
        // print
        // if(replacement_field.length === 0){
        // 	return "index"
        // }

        // this regex here may be excessive
        var text_before_Colon = replacement_field.match(/(.*?):/g)[0].replace(":", "");
        var text_before_Bang = replacement_field.match(/(.*?)!/g)[0].replace("!", "");
        // if (replacement_field.match(/(.*?):/g))
        // print(JSON.stringify(replacement_field.match(/(.*?):/g)))
        // print(JSON.stringify(replacement_field.match(/(.*?)!/g)))
        var result = replacement_field.match(/(((.*):(.*))|((.*)!(.))|((.*)!(.):(.*)))/g);
        print(JSON.stringify(result));
        print(JSON.stringify(text_before_Bang));
        print(JSON.stringify(text_before_Colon));
        //for (var i = 0; i < match.length; i ++) {
        //    //print(result[i]);
        //    //print(i);
        //    // print(index)
        //    // print("inthething")
        //}

        if(replacement_field.split(":")[0].length === 0 || replacement_field.split("!")[0].length === 0){
            field_dict[replacement_field].field_name = field_dict[replacement_field].place;
            has_field_name = true;
        }

        if (replacement_field.indexOf("!") >= 0 &&
            replacement_field.indexOf(":") >= replacement_field.indexOf("!")) {

            repsplit = replacement_field.split("!");
            field_name = repsplit[0];
            repsplit = repsplit[1].split(":");

            conversion = repsplit[0];
            format_spec = repsplit[1];

            if(!has_field_name) {
                field_dict[replacement_field].field_name = field_name;
            }
            field_dict[replacement_field].conversion = conversion;
            field_dict[replacement_field].format_spec = format_spec;

            parse_field_name(replacement_field);
            parse_conversion(replacement_field);
            parse_format_spec(replacement_field);
        }
        else if (replacement_field.indexOf("!") >= 0) {
            repsplit = replacement_field.split("!");
            field_name = repsplit[0];
            conversion = repsplit[1];

            if(!has_field_name) {
                field_dict[replacement_field].field_name = field_name;
            }
            field_dict[replacement_field].conversion = conversion;

            parse_field_name(replacement_field);
            parse_conversion(replacement_field);
            //parse_format_spec(replacement_field);
        }
        else if (replacement_field.indexOf(":") >= 0) {
            repsplit = replacement_field.split(":");
            field_name = repsplit[0];
            format_spec = repsplit[1];

            if(!has_field_name) {
                field_dict[replacement_field].field_name = field_name;
            }
            field_dict[replacement_field].format_spec = format_spec;

            parse_field_name(replacement_field);
            //parse_conversion(replacement_field);
            parse_format_spec(replacement_field);
        }
        else {
            field_name = replacement_field;
            if(!has_field_name) {
                field_dict[replacement_field].field_name = field_name;
            }
        }


        parse_field_name(replacement_field);
        parse_conversion(replacement_field);
        parse_format_spec(replacement_field);

    }

    function parse_field_name(match_key) {
        // I take field_dict[replacement_field].field_name
        // I then try to assemble a proper field name that can be keyed to an argument
        // or a subset of an argument
        // todo: argument parsing is broke right now. 
        // the simplest way to do this may be simply to eval the field name
        // but if it uses funky pythonic string-subset notation (i[5:7]) it will break
        // maybe we can get Skulpt to eval it for us?


    }

    function parse_conversion(match_key) {
        // I check for an 's' or an 'r', and return a simple single or repr string
        // based on that value.
        // should be as simple as calling JSON.stringify() on the !r values

    }

    function parse_format_spec(match_key) {
        // I am the face or terror in the eye of the programmer. Freakin nutsy, I am.
        // may be able to reuse a bunch of the code from the str modulo function (str %)
        // remains to be seen.

    }

    // I may be the final "main" loop function
    var ret_str = self.v.replace(/\{(.*?)\}/g, function (match, number) {
        number = parseInt(number);
        match = match.replace(/[\{|\}]/g, "");

        // if(match.length === 0){
        // 	number = number +1;
        // }
        // else if(isInt(match)){
        // 	number = parseInt(match) + 1 ;
        // }
        // // }
        // else{
        // 	number = match
        // }

        // print(number)
        // print(match)

        if (field_dict[match] !== "undefined" && field_dict[match].result !== "undefined") {
            // print(match)
            // print(typeof number)
            // print(JSON.stringify(field_dict))
            // print(JSON.stringify(field_dict[match]))
            return field_dict[match].result
        }
        else {
            // print(match)
            return match
        }
    });

    return new Sk.builtin.str(ret_str);

    function isInt(value) {
        return ! isNaN(value) &&
            parseInt(Number(value)) == value && ! isNaN(parseInt(value, 10));
    }

    // segment input


    // return Sk.builtin.str(retstr)

    // var BaseStringFormatter = {
    // 	__init__ : function(values_w, w_valuedict){
    // 		// this.space = space;
    // 		this.fmtpos = 0;
    // 		this.values_w = values_w;
    // 		this.values_pos = 0;
    // 		this.w_valuedict = w_valuedict;
    // 	},
    // 	forward: function(){
    // 		this.fmtpos += 1;
    // 	},
    // 	nextinputvalue: function(){
    // 		var w_result = this.values_w[this.values_pos];
    // 		if(w_result === undefined){
    // 			Sk.builtin.OperationError("not enough arguemnts for format string");
    // 		}
    // 		this.values_pos += 1;
    // 		return w_result;
    // 	},
    // 	checkconsumed: function(){
    // 		if(this.values_pos < this.values_w.length && this.w_valuedict === undefined){
    // 			Sk.builtin.OperationError("not all arguments converted during string formatting");
    // 		}
    // 	},
    // 	std_wp_int: function(r, prefix){
    // 		if(prefix === undefined){
    // 			prefix = "";
    // 		}
    // 		if(this.prec >= 0){
    // 			var sign = r[0] =="-";
    // 			var padding = this.prec - (r.length - parseInt(sign));
    // 			if(padding > 0){
    // 				var padout = new Array(padding).join("0");
    // 				if(sign){

    // 					r = "-" + padding +r.substring(1);
    // 				}
    // 				else {
    // 					r = padout  + r;
    // 				}
    // 			}
    // 			else if (this.prec === 0 && r === "0"){
    // 				r = "";
    // 			}
    // 		}
    // 		this.std_wp_number(r, prefix);
    // 	},
    // 	fmt_d: function(w_value){
    // 		//int formatting
    // 		var r = int_num_helper(w_value);
    // 		this.std_wp_int(r);
    // 	},
    // 	fmt_x: function(w_value){
    // 		//hex formatting
    // 		var r = hex_num_helper(w_value);
    // 		var prefix;
    // 		if( this.f_alt){
    // 			prefix = "0x";
    // 		}
    // 		else{
    // 			prefix = "";
    // 		}
    // 		this.std_wp_int(r, prefix);
    // 	},
    // 	fmt_X: function(w_value){
    // 		//HEX formatting
    // 		var r = hex_num_helper(w_value);
    // 		var prefix;
    // 		if( this.f_alt){
    // 			prefix = "0X";
    // 		}
    // 		else{
    // 			prefix = "";
    // 		}
    // 		this.std_wp_int(r, prefix);
    // 	},
    // 	fmot_o: function(w_value){
    // 	//hex formatting
    // 	var r = oct_num_helper(w_value);
    // 	var prefix;
    // 	if(this.f_alt && (r !== "0" || this.prec === 0)){
    // 		prefix = "0";
    // 	}
    // 	else{
    // 		prefix = "";
    // 	}
    // 	this.std_wp_int(r, prefix);
    // 	},
    // 	fmt_i:this.fmt_d,
    // 	fmt_u:this.fmt_d,
    // 	fmt_e: function(w_value){
    // 		this.format_float(w_value, "e");
    // 	},
    // 	fmt_f: function(w_value){
    // 		this.format_float(w_value, "f");
    // 	},
    // 	fmt_g: function(w_value){
    // 		this.format_float(w_value, "g");
    // 	},
    // 	fmt_E: function(w_value){
    // 		this.format_float(w_value, "E");
    // 	},
    // 	fmt_F: function(w_value){
    // 		this.format_float(w_value, "F");
    // 	},
    // 	fmt_G: function(w_value){
    // 		this.format_float(w_value, "G");
    // 	},
    // 	format_float: function(w_value, chr){
    // 		var x = parseFloat(maybe_float(w_value));
    // 		var r;
    // 		if(isNaN(x)){
    // 			r="nan";
    // 		}
    // 		else if(!isFinite(x)){
    // 			if(x<0){
    // 				r = "-inf";
    // 			}
    // 			else{
    // 				r = "inf";
    // 			}
    // 		}
    // 		else{
    // 			var prec = this.prec;
    // 			if(prec<0){
    // 				prec = 6;
    // 			}
    // 			if("fF".indexOf(chr) > -1 && x/1e25 > 1e26){
    // 				chr = String.fromchrCode(chr.chrCodeAt() + 1); //"f" => "g"
    // 			}
    // 			try{
    // 				r = formatd_overflow(this.f_alt, prec, chr, x);
    // 			} catch (except){
    // 				 Sk.builtin.OverflowError(except);
    // 			}
    // 		}
    // 		this.std_wp_number(r);
    // 	},
    // 	std_wp_number: function(r, prefix){
    // 		if(prefix === undefined){
    // 			prefix = "";
    // 		}
    // 		Sk.builtin.NotImplementedError();
    // 	}

    // };

    // function make_formatter_subclass(do_unicode){
    // 	// var const
    // 	// if(do_unicode){
    // 	// 	const = "unicode"
    // 	// }
    // 	// else{
    // 	// 	const = String
    // 	// }
    // 	var StringFormatter = function(BaseStringFormatter){
    // 		//var self = this; do we need to do this?
    // 		this.__init__ = function(fmt, values_w, w_valuedict){
    // 			BaseStringFormatter.__init__(this, values_w, w_valuedict);
    // 			this.fmt = fmt;
    // 		};

    // 		this.peekchr = function(){
    // 			try{
    // 				return this.fmt[this.fmtpos];
    // 			}
    // 			catch(except){
    // 				Sk.builtin.OperationError("incomplete format");
    // 			}
    // 		};

    // 		this.getmappingkey = function(){
    // 			var fmt = this.fmt;
    // 			var i = this.fmtpos + 1;
    // 			var i0 = i;
    // 			var pcount = 1;
    // 			var c;
    // 			while(true){
    // 				try{
    // 					c = fmt[i];
    // 				}
    // 				catch (except){
    // 					Sk.builtin.OperationError("incomplete format key");
    // 				}
    // 				if(c === ")"){
    // 					pcount -= 1;
    // 					if(pcount === 0){
    // 						break;
    // 					}
    // 				}
    // 				else if(c === "("){
    // 					pcount +=1;
    // 				}
    // 				i += 1;
    // 			}
    // 			this.fmtpos = i +1;
    // 			return fmt.substring(i0,i);
    // 		};

    // 		this.getmappingvalue = function(key){
    // 			var w_key = key;
    // 			if(this.w_valuedict === undefined){
    // 				Sk.builtin.OperationError("format requires a mapping");
    // 			}
    // 			return this.w_valuedict[w_key];
    // 		};

    // 		this.parse_fmt = function(){
    // 			var w_value;
    // 			var c;
    // 			if(this.peekchr === "("){
    // 				w_value = this.getmappingvalue(this.getmappingkey());
    // 			}
    // 			else{
    // 				w_value = null;
    // 			}
    // 			this.peel_flags();
    // 			this.width = this.peel_num();

    // 			if(this.width <0){
    // 				this.f_ljust = true;
    // 				this.width = -this.width;
    // 			}
    // 			if(this.peekchr() === "."){
    // 				this.forward();
    // 				this.prec = this.peel_num();
    // 				if(this.prec<0){
    // 					this.prec = 0;
    // 				}
    // 			}
    // 			else{
    // 				this.prec = -1;
    // 			}
    // 			c = this.peekchr();
    // 			if(c === "h" || c === "l" || c === "L"){
    // 				this.forward();
    // 			}
    // 			return w_value;
    // 		};

    // 		this.peel_flags = function(){
    // 			this.f_ljust = false;
    //             this.f_sign  = false;
    //             this.f_blank = false;
    //             this.f_alt   = false;
    //             this.f_zero  = false;
    //             var c;
    //             while(true){
    //             	c = this.peekchr();
    //             	if(c === "-"){
    //             		this.f_ljust = true;
    //             	}
    //             	else if(c === "+"){
    //             		this.f_sign = true;
    //             	}
    //             	else if(c === " "){
    //             		this.f_blank = true;
    //             	}
    //             	else if(c === "#"){
    //             		this.f_alt = true;
    //             	}
    //             	else if(c === "0"){
    //             		this.f_zero = true;
    //             	}
    //             	else{
    //             		break;
    //             	}
    //             	this.forward();
    //             }
    // 		};

    // 		this.peel_num = function(){
    // 			var c = this.peekchr();
    // 			var w_value;
    // 			var result = 0;
    // 			if(c === "*"){
    // 				this.forward();
    // 				w_value = this.nextinputvalue();
    // 				return parseInt(maybe_int(w_value));
    // 			}
    // 			while(true){
    // 				var n = ord(c) - ord("0");
    // 				if(n>=10 || n<0){
    // 					break;
    // 				}

    // 				try{
    // 					result = (result * 10) + n;
    // 				}
    // 				catch (except) {
    // 					Sk.builtin.OperationError("precision too large");
    // 				}
    // 				this.forward();
    // 				c = this.peekchr();
    // 			}
    // 			return result;
    // 		};

    // 		this.format = function(){
    // 			var lgt = this.fmt.length + 4 * this.values_w.length + 10;
    // 			var result = lgt.toString();

    // 			this.result = result;
    // 			while(true){
    // 				var w_value;
    // 				var c;
    // 				var fmt = this.fmt;
    // 				var i0 = this.fmtpos;
    // 				var i = this.fmtpos;
    // 				if(i < fmt.length){
    // 					while(i<fmt.length){
    // 						if(fmt[i]==="%"){
    // 							break;
    // 						}
    // 						i +=1;
    // 					}
    // 				}
    // 				else{
    // 					result.concat(fmt.substring(i0,fmt.length));
    // 					break;
    // 				}
    // 				result.concat(fmt.substring(i0,fmt.length));
    // 				this.fmtpos = i +1;

    // 				// interpret the next formatter
    // 				w_value = this.parse_fmt();
    // 				c = this.peekchr();
    // 				this.forward();
    // 				if(c=== "%"){
    // 					this.std_wp("%");
    // 					continue;
    // 				}
    // 				if(w_value === null || w_value === undefined){
    // 					w_value = this.nextinputvalue();
    // 				}
    // 				if(FORMATTER_CHARS.length >0){
    // 					for(var c1 = 0; c1 < FORMATTER_CHARS.length; c1++){
    // 						if(c === FORMATTER_CHARS[c1]){
    // 							var do_fmt = this["fmt_"+FORMATTER_CHARS[c1]];
    // 							do_fmt(w_value);
    // 							break;
    // 						}
    // 					}
    // 				}
    // 				else{
    // 					this.unknown_fmtchar();
    // 				}


    // 			}
    // 			this.checkconsumed();
    // 			return result.build();
    // 		};
    // 		this.unknown_fmtchar = function(){
    // 			var c = this.fmt[this.fmtpos -1];
    // 			//would do unicode here; but javascript don"t care
    // 			var s = c;
    // 			var msg = "unsupported format character " + s + " (0x" + ord(c) + ") at index " + this.fmtpos;
    // 			Sk.builtin.OperationError(msg);
    // 		};
    // 		this.std_wp = function(r){
    // 			var length = r.length;
    // 			var prec = this.prec;
    // 			var result = this.result;
    // 			var padding;
    // 			if(prec === -1 && this.width === 0){
    // 				this.result.append(r);
    // 				return;
    // 			}
    // 			if(prec >= 0 && prec < length){
    // 				length = prec;
    // 			}
    // 			padding = this.width - length;
    // 			if(padding < 0){
    // 				padding = 0;
    // 			}

    // 			if(!this.f_ljust && padding >0){
    // 				result.append_multiple_char(" ", padding);
    // 				padding = 0;
    // 			}
    // 			result.concat(r.substring(0, length));
    // 			if(padding > 0){
    // 				result.concat(new Array(padding).join(" "));
    // 			}

    // 		};
    // 		this.std_wp._annspecialcase_ = "specialize:argtype(1)";

    // 		this.std_wp_number = function(r, prefix){
    // 			var sign = r.indexOf("-") === 0;
    // 			var padnumber;
    // 			if(prefix === undefined){
    // 				prefix = "";
    // 			}
    // 			if(!sign){
    // 				if(this.f_sign){
    // 					r = "+" +r;
    // 					sign = true;
    // 				}
    // 				else if(this.f_blank){
    // 					r = " " + r;
    // 					sign = true;
    // 				}
    // 			}
    // 			var result = this.result;
    // 			var padding = this.width - r.length - prefix.length;
    // 			if(padding <= 0){
    // 				padding = 0;
    // 			}

    // 			if(this.f_ljust){
    // 				padnumber = "<";
    // 			}
    // 			else if(this.f_zero){
    // 				padnumber = "0";
    // 			}
    // 			else{
    // 				padnumber = ">";
    // 			}
    // 			if(padnumber == ">"){
    // 				result.concat(new Array(padding).join(" "));
    // 			}
    // 			if(sign){
    // 				result.concat(r[0]);
    // 			}
    // 			result.concat(prefix);
    // 			if(padnumber == "0"){
    // 				result.concat(new Array(padding).join("0"));
    // 			}
    // 			result.concat(r.substring(+sign, r.length));
    // 			if(padnumber == "<"){
    // 				result.concat(new Array(padding).join(" "));
    // 			}
    // 		};
    // 		this.string_formatting = function(w_value){
    // 			// this is supposed to handle edge case alternate strung formatting
    // 			// methods. Not sure if it"s necessary right now. will just stub it out.
    // 			return String(w_value);
    // 		};
    // 		this.fmt_s = function(w_value){
    // 			// we do more unicode handling here.
    // 			// should check if a string is supposed to be unicode or string
    // 			// if mismatch between do_unicode and value, convert or throw error
    // 			// idk if we need this, so it just passes the value.
    // 			this.std_wp(w_value);
    // 		};
    // 		this.fmt_r = function(w_value){
    // 			//convert repr to string
    // 			// probably need to do Sk.builtin magic here
    // 			this.std_wp(String(w_value));
    // 		};
    // 		this.fmt_c = function(w_value){
    // 			this.prec = -1;
    // 			// need to check if str, not sure whether to use Sk.builtins or js
    // 			// should check if unicode, string, unicode chr, or chr
    // 			// js don"t care ())I think), so we can skip all of that
    // 			this.std_wp(w_value);
    // 		};

    // 	};
    // 	return StringFormatter;
    // }
    // function NeedUnicodeFormattingError(exception){

    // }

    // //because this is a mostly 1:1 copy of pypy, We include potentiall unecessary things
    // var StringFormatter = make_formatter_subclass(false);
    // var UnicodeFormatter =  make_formatter_subclass(false);
    // UnicodeFormatter.__name__ = "UnicodeFormatter";

    // function FORMATTER_CHARS_func(){
    // 	var keys = Object.keys(StringFormatter);
    // 	var ret = [];
    // 	for(var i_name = 0; i_name < keys.length; i_name++){
    // 		var key = keys[i_name];
    // 		if(key.length == 5 && key.indexOf("fmt_") === 0){
    // 			ret.push(key);
    // 		}
    // 	}
    // 	return ret;
    // }

    // var FORMATTER_CHARS = FORMATTER_CHARS_func();

    // function is_list_of_chars_or_unichars(ann, bk){
    // 	// should raise exception if it gets a non list of chars
    // 	// Not sure if this is necessary
    // }

    // function format(w_fmt, values_w, w_valuedict, do_unicode){
    // 	// Actual entry point.does the actual work
    // 	var fmt;
    // 	var formatter;
    // 	var result;
    // 	if(w_valuedict === undefined){
    // 		w_valuedict = null;
    // 	}
    // 	if(do_unicode === undefined){
    // 		do_unicode = false;
    // 	}
    // 	if(!do_unicode){
    // 		fmt = String(w_fmt);
    // 		formatter = StringFormatter(fmt, values_w, w_valuedict);
    // 		try{
    // 			result = formatter.format();
    // 		}
    // 		catch(except){
    // 			// catch the unicode case here
    // 			// if we did unicode properly
    // 		}
    // 		finally{
    // 			return result;
    // 		}
    // 	}
    // 	else{
    // 		// should format w_fmt to unicode, not implemented
    // 		fmt = w_fmt;
    // 	}
    // 	formatter = UnicodeFormatter(fmt, values_w, w_valuedict);
    // 	result = formatter.format();
    // 	return result;
    // }
    // function mod_format(w_format, w_values, do_unicode){
    // 	if(do_unicode === undefined){
    // 		do_unicode = false;
    // 	}
    // 	var values_w;
    // 	if(do_unicode === undefined){
    // 		do_unicode = false;
    // 	}
    // 	//check if tuple (how do?)
    // 	if (Sk.builtin.isinstance(w_values, Sk.builtin.tuple)){
    // 		values_w = w_values; // todo: need to convert to array
    // 		return format(w_format, values_w, null, do_unicode);
    // 	}
    // 	else{
    // 		if(Sk.builtin.isinstance(w_values, Sk.builtin.dict) || w_values["__getitem__"] &&
    // !Sk.builtin.isinstance(w_values, Sk.builtin.str)){ return format(w_format, [w_values], w_values, do_unicode); }
    // else{ return format(w_format, [w_values], null, do_unicode); } } }

    // //formatting helpers

    // function maybe_int(w_value){
    // 	return new Sk.builtin.int(w_value);
    // }
    // function maybe_float(w_value){
    // 	return new Sk.builtin.float(w_value);
    // }
    // function format_num_helper_generator(fmt, digits){
    // 	function format_num_helper(w_value){
    // 		var value;
    // 		var num;
    // 		try{
    // 			value = Sk.builtin.int(w_value);
    // 		}
    // 		catch(operr){
    // 			num = Sk.builtin.long(w_value);
    // 			return num.format(digits);
    // 		}
    // 	}

    // 	return format_num_helper;

    // }

    // var int_num_helper = format_num_helper_generator("%d", "0123456789");
    // var oct_num_helper = format_num_helper_generator("%o", "01234567");
    // var hex_num_helper = format_num_helper_generator("%x", "0123456789abcdef");


    // var formatd_max_length = 120;


    // function formatd(fmt, x){
    // 	fmt = new Sk.builtin.str(fmt);
    // 	x = new Sk.builtin.str(x);
    // 	fmt = fmt.nb$remainder(x);
    // }

    // function formatd_overflow(alt, prec, kind, x){
    //    // msvcrt does not support the %F format.
    //    // OTOH %F and %f only differ for "inf" or "nan" numbers
    //    // which are already handled elsewhere
    //    if("F".indexOf(kind)){
    //            kind = "f";
    //    }

    //    if (("gG".indexOf(kind) && formatd_max_length <= 10+prec) ||
    //        ("fF".indexOf(kind) && formatd_max_length <= 53+prec)){
    //                Sk.builtin.OverflowError("formatted float is too long (precision too large?)");
    //        }
    //    if (alt){
    //        alt = "#";
    //    }
    //    else{
    //            alt = "";
    //        }

    //    var fmt = new Sk.builtin.str("%%%s.%d%s");
    //    alt = new Sk.builtin.str(alt);
    //    prec = new Sk.builtin.str(kind);
    //    fmt = fmt.nb$remainder(alt, prec, kind);
    //    fmt = fmt.v;
    //    return formatd(fmt, x);
    // }

    // function ord(string) {

    //     var str = string + "",
    //         code = str.charCodeAt(0);
    //     if (0xD800 <= code && code <= 0xDBFF) {
    //         var hi = code;
    //         if (str.length === 1) {
    //             return code;
    //         }
    //         var low = str.charCodeAt(1);
    //         return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
    //     }
    //     if (0xDC00 <= code && code <= 0xDFFF) {
    //         return code;
    //     }
    //     return code;
    // }
    // return new Sk.builtin.str(format(args[0], args[1]));
});
