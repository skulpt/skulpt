/**
 * Internal SenseHat Module for reading and writing values from
 * JavaScript World to the Python World. This modules set ups
 * the commmunication and allows to read and write pixels. If the
 * "Sk.sense_hat_emit" config is present, we emit events when
 * values are changed: Python -> JavaScript
 */
var $builtinmodule = function (name) {
    var mod = {};
    
    function checkNumberAndReturn(val) {
        var parsed = parseFloat(val);
        // only numbers/floats are okay
        var isValid = !isNaN(parsed) && isFinite(val);
        if (isValid) {
            return {
                value: parsed,
                valid: true
            }
        }

        // invalid number, return -1
        return {
            value: -1,
            valid: false
        }
    }

    mod.init = new Sk.builtin.func(function () {
        // check if the pixels array does already exist and or create it
        if(!Sk.sense_hat) {
            throw new Error('SenseHat Browser storage must be set: Sk.sense_hat must exist');
        }
        
        // create 64 (8x8) empty array for the leds
        if (!Sk.sense_hat.pixels || Sk.sense_hat.pixels.length === 0) {
            Sk.sense_hat.pixels = []
            for (var i = 0; i < 64; i++) {
                Sk.sense_hat.pixels.push([0, 0, 0]);
            }
        }
        

        if (!Sk.sense_hat.low_light) {
            Sk.sense_hat.low_light = false;
        }
        
        // gamma is stored as a 32 bit value (so should we store it as a number or array?)
        if (!Sk.sense_hat.gamma) {
            Sk.sense_hat.gamma = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // lookup table (@see https://pythonhosted.org/sense-hat/api/#gamma)
        }
        
        // Sensor stuff, all reads should never fail
        if (!Sk.sense_hat.rtimu) {
            Sk.sense_hat.rtimu = {
                pressure: [1, 0], /* isValid, pressure*/
                temperature: [1, 0], /* isValid, temperature */
                humidity: [1, 0], /* isValid, humidity */
                gyro: [0, 0, 0], /* all 3 gyro values */
                accel: [0, 0, 0], /* all 3 accel values */
                compass: [0, 0, 0], /* all compass values */
                fusionPose: [0, 0, 0] /* fusionpose, accelerometer */
            }
        }
        
        if (Sk.sense_hat_emit) {
            Sk.sense_hat_emit('init');
        }
    });
    
    // _fb_device specific methods
    mod.setpixel = new Sk.builtin.func(function (index, value) {
        var _index;
        var _value;
        
        _index = Sk.ffi.remapToJs(index);
        _value = Sk.ffi.remapToJs(value);
        
        try {
            Sk.sense_hat.pixels[_index] = _value;
        } catch (e) {
            throw new Sk.builtin.ValueError(e.message);
        }

        if (Sk.sense_hat_emit) {
            Sk.sense_hat_emit('setpixel', _index);
        }
    });

    mod.getpixel = new Sk.builtin.func(function (index) {
        var value;
        var _index;
        var _value;
        
        _index = Sk.ffi.remapToJs(index);
        
        try {
            _value = Sk.sense_hat.pixels[_index];
            value = Sk.ffi.remapToPy(_value); // should return a list
            //value = new Sk.builtin.list(value);
        } catch (e) {
            throw new Sk.builtin.ValueError(e.message);
        }
        
        return value;
    });

    mod.setpixels = new Sk.builtin.func(function (values) {
        _values = Sk.ffi.remapToJs(values);
        
        try {
            Sk.sense_hat.pixels = _values;
        } catch (e) {
            throw new Sk.builtin.ValueError(e.message);
        }
        
        if (Sk.sense_hat_emit) {
            Sk.sense_hat_emit('setpixels');
        }
    });

    mod.getpixels = new Sk.builtin.func(function () {
        var values;
        
        try {
            values = Sk.ffi.remapToPy(Sk.sense_hat.pixels); // should return a list
            values = new Sk.builtin.list(values);
        } catch (e) {
            throw new Sk.builtin.ValueError(e.message);
        }
        
        return values;
    });

    mod.getGamma = new Sk.builtin.func(function () {
        var gamma = Sk.ffi.remapToPy(Sk.sense_hat.gamma);
        return gamma;
    });

    mod.setGamma = new Sk.builtin.func(function (gamma) {
        // checks are made in fb_device.py
        var _gamma = Sk.ffi.remapToJs(gamma);
        Sk.sense_hat.gamma = _gamma;
        
        if (Sk.sense_hat_emit) {
            Sk.sense_hat_emit('setGamma');
        }
    });

    mod.setLowlight = new Sk.builtin.func(function (value) {
        var _value = Sk.ffi.remapToJs(value);
        
        Sk.sense_hat.low_light = _value;
        
        if (Sk.sense_hat_emit) {
            Sk.sense_hat_emit('changeLowlight', _value);
        }
    });

    // RTIMU stuff

    /**
     * 260 - 1260 hPa
     */
    mod.pressureRead = new Sk.builtin.func(function () {
        var pyTemperature = Sk.misceval.callsim(mod.temperatureRead); // does the validation for us
        var jsTemperature = Sk.ffi.remapToJs(pyTemperature);

        var jsPressure; // object holding the parsed value

        if (!Sk.sense_hat.rtimu.pressure || Sk.sense_hat.rtimu.pressure.length !== 2) {
            // something was set wrong
            return Sk.ffi.remapToPy([].concat([0, -1], jsTemperature));
        }

        // check type of the temperature
        jsPressure = checkNumberAndReturn(Sk.sense_hat.rtimu.pressure[1]);

        // invalid value provided
        if (jsPressure.valid === false) {
            return Sk.ffi.remapToPy([].concat([0, -1], jsTemperature));
        }

        // now do some range checks
        if (jsPressure.value < 260 || jsPressure.value > 1260) {
            return Sk.ffi.remapToPy([].concat([0, jsPressure.value], jsTemperature));
        }
        
        return Sk.ffi.remapToPy([].concat([1, jsPressure.value], jsTemperature));
    });
    
    /**
     * >= 0%
     */
    mod.humidityRead = new Sk.builtin.func(function () {
        var pyTemperature = Sk.misceval.callsim(mod.temperatureRead); // does the validation for us
        var jsTemperature = Sk.ffi.remapToJs(pyTemperature);

        var jsHumidity;

        if (!Sk.sense_hat.rtimu.humidity || Sk.sense_hat.rtimu.humidity.length !== 2) {
            // something was set wrong
            return Sk.ffi.remapToPy([].concat([0, -1], jsTemperature));
        }

        // check type of the temperature
        jsHumidity = checkNumberAndReturn(Sk.sense_hat.rtimu.humidity[1]);

        // invalid value provided
        if (jsHumidity.valid === false) {
            return Sk.ffi.remapToPy([].concat([0, -1], jsTemperature));
        }

        // now do some range checks
        if (jsHumidity.value < 0) {
            return Sk.ffi.remapToPy([].concat([0, jsHumidity.value], jsTemperature));
        }
        
        return Sk.ffi.remapToPy([].concat([1, jsHumidity.value], jsTemperature));
    });
    
    /**
     * Temperature Range: -40 to +120 degrees celsius
     */
    mod.temperatureRead = new Sk.builtin.func(function () {
        var jsTemperature;

        if (!Sk.sense_hat.rtimu.temperature || Sk.sense_hat.rtimu.temperature.length !== 2) {
            // something was set wrong
            return Sk.ffi.remapToPy([0, -1]);
        }

        // check type of the temperature
        var jsTemperature = checkNumberAndReturn(Sk.sense_hat.rtimu.temperature[1]);

        // invalid value provided
        if (jsTemperature.valid === false) {
            return Sk.ffi.remapToPy([0, -1]);
        }

        // now do some range checks
        if (jsTemperature.value < -40 || jsTemperature.value > 120) {
            return Sk.ffi.remapToPy([0, jsTemperature.value]); // invalid
        }
        
        // return Python Array containing [isValid, temperature]
        return Sk.ffi.remapToPy([1, jsTemperature.value]);
    });
    
    mod.fusionPoseRead = new Sk.builtin.func(function () {
        var fusionPose = Sk.ffi.remapToPy(Sk.sense_hat.rtimu.fusionPose);
        
        return fusionPose;
    });

    mod.accelRead = new Sk.builtin.func(function () {
        var accel = Sk.ffi.remapToPy(Sk.sense_hat.rtimu.accel);
        
        return accel;
    });

    mod.compassRead = new Sk.builtin.func(function () {
        var compass = Sk.ffi.remapToPy(Sk.sense_hat.rtimu.compass);
        
        return compass;
    });

    mod.gyroRead = new Sk.builtin.func(function () {
        var gyro = Sk.ffi.remapToPy(Sk.sense_hat.rtimu.gyro);
        
        return gyro;
    });

    return mod;
};