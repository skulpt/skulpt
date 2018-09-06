var format = function (kwa) {
    // following PEP 3101

    var a, args, key, kwargs;
    var ret;
    var regex;
    var index;
    var replFunc;
    var arg_dict = {};

    Sk.builtin.pyCheckArgs("format", arguments, 0, Infinity, true, true);


    args = new Sk.builtins["tuple"](Array.prototype.slice.call(arguments, 1)); /*vararg*/
    kwargs = new Sk.builtins["dict"](kwa);

    if (arguments[1] === undefined) {
        return args.v;
    }
    index = 0;
    regex = /{(((?:\d+)|(?:\w+))?((?:\.(\w+))|(?:\[((?:\d+)|(?:\w+))\])?))?(?:\!([rs]))?(?:\:((?:(.)?([<\>\=\^]))?([\+\-\s])?(#)?(0)?(\d+)?(,)?(?:\.(\d+))?([bcdeEfFgGnosxX%])?))?}/g;
    // ex: {o.name!r:*^+#030,.9b}
    // Field 1, Field_name, o.name
    // Field 2, arg_name, o
    // Field 3, attribute_name/Element_index , .name
    // Field 4, Attribute name, name
    // Field 5, element_index, [0]
    // Field 6, conversion, r
    // Field 7, format_spec,*^+#030,.9b
    // Field 9, fill_character,*
    // Field 10, fill_align, ^
    // Field 11, sign, +
    // Field 12, 0x, #
    // Filed 13, sign-aware 0 padding, 0
    // Field 14, width, 30
    // Field 15, comma, ,
    // Field 16, precision, .9
    // Field 17, conversionType, b

    // Detect empty/int/complex name
    // retrive field value
    // hand off format spec
    // return resulting spec to function


    if(kwargs.size !== 0){

        var kwItems = Sk.misceval.callsim(Sk.builtin.dict.prototype["items"], kwargs);

        for (var n in kwItems.v){

            arg_dict[kwItems.v[n].v[0].v] = kwItems.v[n].v[1].v;
        }
    }
    for(var i in args.v){
        if(i !== "0") {
            arg_dict[i-1] = args.v[i].v;
        }
    }

    replFunc = function (substring, field_name, arg_name, attr_name, attribute_name, element_index, conversion, format_spec, fill_char, fill_align, sign, zero_pad, sign_aware, fieldWidth, comma, precision, conversionType,
                            offset, str_whole){
        var return_str;
        var formatNumber;
        var formatFormat;
        var result;
        var base;
        var value;
        var handleWidth;
        var alternateForm;
        var precedeWithSign;
        var blankBeforePositive;
        var leftAdjust;
        var centerAdjust;
        var zeroPad;
        var convName;
        var convValue;
        var percent;
        fieldWidth = Sk.builtin.asnum$(fieldWidth);
        precision = Sk.builtin.asnum$(precision);

        if(element_index !== undefined && element_index !== ""){
            value = arg_dict[arg_name][element_index].v;
            index++;
        } else if(attribute_name !== undefined && attribute_name !== ""){
            value = arg_dict[arg_name][attribute_name].v;
            index++;
        } else if(arg_name !== undefined && arg_name !== ""){
            value = arg_dict[arg_name];
            index++;
        } else if(field_name === undefined || field_name === ""){
            return_str = arg_dict[index];
            index++;
            value = return_str;
        } else if(field_name instanceof Sk.builtin.int_ ||
                  field_name instanceof Sk.builtin.float_ ||
                  field_name instanceof Sk.builtin.lng || !isNaN(parseInt(field_name, 10))){
            return_str = arg_dict[field_name];
            index++;
            value = return_str;
        }

        if (precision === "") { // ff passes '' here aswell causing problems with G,g, etc.
            precision = undefined;
        }
        if(fill_char === undefined || fill_char === ""){
            fill_char = " ";
        }

        zeroPad = false;
        leftAdjust = false;
        centerAdjust = false;
        blankBeforePositive = false;
        precedeWithSign = false;
        alternateForm = false;
        if (format_spec) {
            if(sign !== undefined && sign !== ""){
                if ("-".indexOf(sign) !== -1) {
                    leftAdjust = true;
                } else if ("+".indexOf(sign) !== -1) {
                    precedeWithSign = true;
                } else if (" ".indexOf(sign) !== -1) {
                    blankBeforePositive = true;
                }
            }
            if(zero_pad){
                alternateForm = "#".indexOf(zero_pad) !== -1;
            }
            if(fieldWidth !== undefined && fieldWidth !== ""){
                if(fill_char === undefined || fill_char === ""){
                    fill_char = " ";
                }
            }
            if("%".indexOf(conversionType) !== -1){
                percent = true;
            }
        }
        if (precision) {
            precision = parseInt(precision, 10);
        }

        formatFormat = function(value){
            var r;
            var s;
            if(conversion === undefined || conversion === ""){
                return value;
            } else if( conversion == "r"){
                s = new Sk.builtin.str(value);
                r = Sk.builtin.repr(s);
                return r.v;
            } else if(conversion == "s"){
                r = new Sk.builtin.str(value);
                return r.v;
            }

        };

        handleWidth = function (prefix, r) {
            // print(prefix);
            var totLen;

            var j;
            if(percent){
                r = r +"%";
            }
            if (fieldWidth !== undefined && fieldWidth !== "") {
                fieldWidth = parseInt(fieldWidth, 10);
                totLen = r.length + prefix.length;
                if (zeroPad) {
                    for (j = totLen; j < fieldWidth; ++j) {
                        r = "0" + r;
                    }
                } else if (leftAdjust) {
                    for (j = totLen; j < fieldWidth; ++j) {
                        r = r + fill_char;
                    }
                } else if(">".indexOf(fill_align) !== -1){
                    for (j = totLen; j < fieldWidth; ++j) {
                        prefix = fill_char + prefix;
                    }
                } else if("^".indexOf(fill_align) !== -1){
                    for (j = totLen; j < fieldWidth; ++j) {
                        if(j % 2 === 0){
                            prefix = fill_char + prefix;
                        } else if ( j % 2 === 1){
                            r = r + fill_char;
                        }
                    }
                } else if("=".indexOf(fill_align) !== -1){
                    for (j = totLen; j < fieldWidth; ++j) {
                        r =  fill_char + r;
                    }
                } else{
                    for (j = totLen; j < fieldWidth; ++j) {
                        r = r + fill_char;
                    }
                }
            }
            return formatFormat(prefix + r);
        };

        formatNumber = function(n, base){
            var precZeroPadded;
            var prefix;
            var neg;
            var r;

            base = Sk.builtin.asnum$(base);
            neg = false;

            if(format_spec === undefined){
                return formatFormat(value);
            }

            if (typeof n === "number" && !(precision)) {
                if (n < 0) {
                    n = -n;
                    neg = true;
                }
                r = n.toString(base);
            } else if (precision) {
                if (n < 0) {
                    n = -n;
                    neg = true;
                }
                n = Number(n.toString(base));
                r = n.toFixed(precision);
            } else if (n instanceof Sk.builtin.float_) {
                r = n.str$(base, false);
                if (r.length > 2 && r.substr(-2) === ".0") {
                    r = r.substr(0, r.length - 2);
                }
                neg = n.nb$isnegative();
            } else if (n instanceof Sk.builtin.int_) {
                r = n.str$(base, false);
                neg = n.nb$isnegative();
            } else if (n instanceof Sk.builtin.lng) {
                r = n.str$(base, false);
                neg = n.nb$isnegative();    //  neg = n.size$ < 0;  RNL long.js change
            } else{
                r = n;
            }

            precZeroPadded = false;
            prefix = "";

            if (neg) {
                prefix = "-";
            } else if (precedeWithSign) {
                prefix = "+" ;
            } else if (blankBeforePositive) {
                prefix = " " ;
            }

            if (alternateForm) {
                if (base === 16) {
                    prefix += "0x";
                } else if (base === 8 && !precZeroPadded && r !== "0") {
                    prefix += "0o";
                } else if (base === 2 && !precZeroPadded && r !== "0"){
                    prefix += "0b";
                }
            }

            if(conversionType === "n"){
                r=r.toLocaleString();
            } else if(",".indexOf(comma) !== -1){
                var parts = r.toString().split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                r = parts.join(".");
            }
            return handleWidth(prefix, r);
        };

        base = 10;
        if(conversionType === "d" || conversionType === "n" || conversionType === "" || conversionType === undefined){
            return formatNumber(value, 10);
        }else if (conversionType === "b") {
            return formatNumber(value, 2);
        }else if (conversionType === "o") {
            return formatNumber(value, 8);
        } else if (conversionType === "x") {
            return formatNumber(value, 16);
        } else if (conversionType === "X") {
            return formatNumber(value, 16).toUpperCase();
        } else if (conversionType === "f" || conversionType === "F" || conversionType === "e" || conversionType === "E" || conversionType === "g" || conversionType === "G") {
            if(alternateForm){
                throw new Sk.builtin.ValueError("Alternate form (#) not allowed in float format specifier");
            }
            convValue = Sk.builtin.asnum$(value);
            if (typeof convValue === "string") {
                convValue = Number(convValue);
            }
            if (convValue === Infinity) {
                return handleWidth("","inf");
            }
            if (convValue === -Infinity) {
                return handleWidth("-","inf");
            }
            if (isNaN(convValue)) {
                return handleWidth("","nan");
            }
            convName = ["toExponential", "toFixed", "toPrecision"]["efg".indexOf(conversionType.toLowerCase())];
            if (precision === undefined || precision === "") {
                if (conversionType === "e" || conversionType === "E" || conversionType === "%") {
                    precision = parseInt(6, 10);
                } else if (conversionType === "f" || conversionType === "F") {
                    precision = parseInt(6, 10);
                }
            }
            result = (convValue)[convName](precision);
            if ("EFG".indexOf(conversionType) !== -1) {
                result = result.toUpperCase();
            }
            return formatNumber(result, 10);
        } else if (conversionType === "c") {
            if (typeof value === "number") {
                return handleWidth("", String.fromCharCode(value));
            } else if (value instanceof Sk.builtin.int_) {
                return handleWidth("", String.fromCharCode(value.v));
            } else if (value instanceof Sk.builtin.float_) {
                return handleWidth("", String.fromCharCode(value.v));
            } else if (value instanceof Sk.builtin.lng) {
                return handleWidth("", String.fromCharCode(value.str$(10, false)[0]));
            } else if (value.constructor === Sk.builtin.str) {
                return handleWidth("", value.v.substr(0, 1));
            } else {
                throw new Sk.builtin.TypeError("an integer is required");
            }
        } else if (percent) {
            if(precision === undefined){precision = parseInt(7,10);}
            return formatNumber(value*100, 10);
        }

    };

    ret = args.v[0].v.replace(regex, replFunc);
    return new Sk.builtin.str(ret);
};

format["co_kwargs"] = true;
Sk.builtin.str.prototype["format"] = new Sk.builtin.func(format);
