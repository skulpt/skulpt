Sk.builtin.str.prototype["format"] = new Sk.builtin.func(function (self) {
    // following PEP 3101
    
    var ret;
    var regex; 
    var index;
    var replFunc;
    var args;
    var arg_dict = {};
    
    Sk.builtin.pyCheckArgs("format", arguments, 0, Infinity, true, true);
    // print
    if (arguments[1] === undefined) {
        // print(JSON.stringify(arguments));
        return self;
    }
    //args = Sk.misceval.arrayFromArguments(arguments);
    
    print(JSON.stringify(arguments));
    
    // if (rhs.constructor !== Sk.builtin.tuple && (rhs.mp$subscript === undefined || rhs.constructor === Sk.builtin.str)) {
    //     rhs = new Sk.builtin.tuple([rhs]);
    // }
    //regex to match all possible permutations of str.format. easier than doing it manually
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
    
    
    
    
    //build arg_dict to make lookup/replacement processing smoother
    
    for(var i in arguments){
        if(i!== 0 && i !== "0")
        {
            arg_dict[i-1] = arguments[i].v;
        }
    }
    // print("arg Dict",JSON.stringify(arg_dict))
    // print(JSON.stringify(arg_dict));
    
    replFunc = function (substring, field_name, arg_name, attr_name, attribute_name, element_index, conversion, format_spec, fill_char, fill_align, sign, zero_pad, sign_aware, fieldWidth, comma, precision, conversionType,
                            offset, str_whole){
        var return_str;
        var formatNumber;
        var formatFormat;
        var result;
        var base;
        var r;
        var mk;
        var value;
        var handleWidth;
        var alternateForm;
        var precedeWithSign;
        var blankBeforePositive;
        var leftAdjust;
        var centerAdjust;
        var zeroPad;
        var i;
        var convName;
        var convValue;
        var percent;
        fieldWidth = Sk.builtin.asnum$(fieldWidth);
        precision = Sk.builtin.asnum$(precision);
        
        
        if (field_name === undefined || field_name === "") {
            i = index;
        } 
        
        if(field_name === undefined || field_name === ""){
            return_str = arg_dict[i];
            index++;
            value = return_str;
        }
        else if(field_name instanceof Sk.builtin.nmber || field_name instanceof Sk.builtin.lng || !isNaN(parseInt(field_name))){
            // print("field_name")
            // print(field_name)
            // print(JSON.stringify(arg_dict))
           return_str = arg_dict[field_name];
           index++;
           value = return_str
        }
    //     print(field_name)
    //     print(value)
        
    //     // Yay! Debugging!
    //     print(substring);
    //     print(field_name);
    //     print(typeof arg_name);
    //     print(typeof parseInt(arg_name, 10));
    //     print(attr_name);
    //     print(attribute_name);
    //     print(element_index);
        // print("conversion ", conversion);
        // print("format_spec", format_spec);
        // print("fill_char", fill_char);
        // print("fill_align", fill_align);
        // print("sign", sign);
        // print("AlternateForm", zero_pad);
        // print("sign_aware", sign_aware);
        // print('width', fieldWidth);
        // print("comma", comma);
        // print("Precision", precision);
        // print("type", conversionType);
        // print("offset", offset);
    //     print(str_whole);
        
        
        if (precision === "") { // ff passes '' here aswell causing problems with G,g, etc.
            precision = undefined;
        }
        if(fill_char === undefined){}
        
        zeroPad = false;
        leftAdjust = false;
        centerAdjust = false;
        blankBeforePositive = false;
        precedeWithSign = false;
        alternateForm = false;
        if (format_spec) {
            if(sign){
            if (sign.indexOf("-") !== -1) {
                leftAdjust = true;
            }
            else if (sign.indexOf("0") !== -1) {
                zeroPad = true;
            }

            if (sign.indexOf("+") !== -1) {
                precedeWithSign = true;
            }
            else if (sign.indexOf(" ") !== -1) {
                blankBeforePositive = true;
            }
            }
            if(zero_pad){
            alternateForm = zero_pad.indexOf("#") !== -1;
            }
            if(fill_align !== undefined || fieldWidth !== undefined){
                if(fill_char === undefined || fill_char === ""){
                    fill_char = " ";
                }
            }
        }

        if (precision) {
            precision = parseInt(precision, 10);
        }

        
        
       
        
        formatFormat = function(value){
            var r;
            if(conversion === undefined){
                // if(precision){
                //     if(percent){
                //         return value.substr(0, precision) +"%";
                //     }
                //     return value.substr(0, precision);
                // }
                return value;
            }
            else if( conversion == "r"){
                r = Sk.builtin.repr(value);
                if (precision) {
                    return r.v.substr(0, precision);
                }
                return r.v;
            }
            else if(conversion == "s"){
                r = Sk.builtin.repr(value);
                if (precision) {
                    return r.v.substr(0, precision);
                    }
                return r.v;
            }
            
        };
        
        handleWidth = function (prefix, r) {
            var totLen;
            
            var j;
            if(percent){
                r = r +"%";
            }
            if (fieldWidth) {
                fieldWidth = parseInt(fieldWidth, 10);
                // print(fieldWidth)
                // print(typeof prefix)
                // print(r)
                // print(typeof r)
                totLen = r.length + prefix.length;
                if (zeroPad) {
                    for (j = totLen; j < fieldWidth; ++j) {
                        r = "0" + r;
                    }
                }
                else if (leftAdjust) {
                    for (j = totLen; j < fieldWidth; ++j) {
                        r = r + " ";
                    }
                }
                else {
                    for (j = totLen; j < fieldWidth; ++j) {
                        prefix = " " + prefix;
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
            var j;
            
            // print("frmt1", n)
            base = Sk.builtin.asnum$(base);
            neg = false;
            
            if(format_spec === undefined){
                return formatFormat(value);
            }
            
            print(n)
            if (precision) {
                n = n.toFixed(precision);
                print(n)
            }
            
            if (typeof n === "number") {
                if (n < 0) {
                    n = -n;
                    neg = true;
                }
                r = n.toString(base);
            }
            
            else if (n instanceof Sk.builtin.nmber) {
                r = n.str$(base, false);
                if (r.length > 2 && r.substr(-2) === ".0") {
                    r = r.substr(0, r.length - 2);
                }
                neg = n.nb$isnegative();
            }
            
            else if (n instanceof Sk.builtin.lng) {
                r = n.str$(base, false);
                neg = n.nb$isnegative();    //  neg = n.size$ < 0;  RNL long.js change
            }
            else{
                r = n;
            }
            // goog.asserts.assert(r !== undefined, "unhandled number format");
            
            precZeroPadded = false;
            print("r.length",r.length,"precision",precision);
            if (precision) {
                r = r.toFixed(precision);
            }
            
            prefix = "";
        
            if (neg) {
                prefix = "-";
            }
            else if (precedeWithSign) {
                prefix = "+" + prefix;
            }
            else if (blankBeforePositive) {
                prefix = " " + prefix;
            }

            if (alternateForm) {
                if (base === 16) {
                    prefix += "0x";
                }
                else if (base === 8 && !precZeroPadded && r !== "0") {
                    prefix += "0";
                }
            }
            
            
            
            if(conversionType === "n"){
                r=r.toLocaleString();
            } else if(",".indexOf(comma) !== -1){
                var parts = r.toString().split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                r = parts.join(".");
            }
            // print("frmt", r)
            return handleWidth(prefix, r);
        };  
        //print("Rhs:",rhs, "ctor", rhs.constructor);
        // if (rhs.constructor === Sk.builtin.tuple) {
        //     value = rhs.v[i];
        // }else if (rhs.mp$subscript !== undefined) {
        //     mk = mappingKey.substring(1, mappingKey.length - 1);
        //     //print("mk",mk);
        //     value = rhs.mp$subscript(new Sk.builtin.str(mk));
        // }
        // else {
        //     throw new Sk.builtin.AttributeError(rhs.tp$name + " instance has no attribute 'mp$subscript'");
        // }
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
                    precision = 6;
                }
                else if (conversionType === "f" || conversionType === "F") {
                    precision = 7;
                }
            }
            result = (convValue)[convName](precision);
            if ("EFG".indexOf(conversionType) !== -1) {
                result = result.toUpperCase();
            }
            return handleWidth(["", result]);
        } else if (conversionType === "c") {
            if (typeof value === "number") {
                return handleWidth("", String.fromCharCode(value));
            }
            else if (value instanceof Sk.builtin.nmber) {
                return handleWidth("", String.fromCharCode(value.v));
            }
            else if (value instanceof Sk.builtin.lng) {
                return handleWidth("", String.fromCharCode(value.str$(10, false)[0]));
            }
            else if (value.constructor === Sk.builtin.str) {
                return handleWidth("", value.v.substr(0, 1));
            }
            else {
                throw new Sk.builtin.TypeError("an integer is required");
            }
        } else if (conversionType === "%") {
            percent = true;
            if(precision === undefined){precision = 7;}
            return formatNumber(value*100, 10);
        }
        
        
        
        
        
        
        
        if(field_name === undefined || field_name === ""){
            return_str = arg_dict[index];
            index++;
            return formatNumber(return_str);
        }
        else if(field_name instanceof Sk.builtin.nmber || field_name instanceof Sk.builtin.lng){
           return_str = arg_dict[field_name];
           index++;
           return formatNumber(return_str);
        }
        
        
        
        
        
        
        // return 0;
    };


   
    ret = self.v.replace(regex, replFunc);
    print(ret);
    return new Sk.builtin.str(ret);
});
