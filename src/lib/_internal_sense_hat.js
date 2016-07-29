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

    /********************************************************/
    /* SenseStick specific functions.
    /*
    /*
     **/

    /**
     * Named InputEvent tuple
     */
    var input_event_fields = {
        "timestamp": "", 
        "direction": "", 
        "action": "", 
    };
    var input_event_f = Sk.builtin.make_structseq('SenseStick', 'InputEvent', input_event_fields);
    mod.InputEvent = Sk.builtin.make_structseq('SenseStick', 'InputEvent', input_event_fields);

    mod._wait = new Sk.builtin.func(function (timeout) {
        var _timeout;
        if (!timeout || timeout instanceof Sk.builtin.none) {
            _timeout = null;
        } else if (Sk.builtin.checkNumber(timeout)) {
            _timeout = Sk.ffi.remapToJs(timeout);
        }

        var timeoutHandle;
        var hasEvent = false;
        var susp = new Sk.misceval.Suspension();
        susp.resume = function () {
            // Should the post image get stuff go here??
            if (susp.data["error"]) {
                if (susp.data.error === 'KeyboardInterrupt') {
                    throw new Error('KeyboardInterrupt');
                } else {
                    throw new Sk.builtin.IOError('SenseStickDevice Error');
                }
            }
            return Sk.builtin.bool(hasEvent);
        };
        susp.data = {
            type: "Sk.promise",
            promise: new Promise(function (resolve, reject) {
                // Listen to new one, once
                function handleKeyInput (event, inputData) {
                    // Clear timeout
                    if (timeoutHandle) {
                        window.clearTimeout(timeoutHandle);
                    }

                    if (inputData.type === 'keyboardinterrupt') {
                        reject('KeyboardInterrupt');
                    }

                    hasEvent = true; // Set return value
                    resolve();
                }

                if (Sk.sense_hat.sensestick._eventQueue.length > 0) {
                    hasEvent = true;
                    resolve();
                } else {
                    Sk.sense_hat.sensestick.once('sensestick.input', handleKeyInput);

                    if (_timeout != null) {
                        timeoutHandle = setTimeout(function() {
                            Sk.sense_hat.sensestick.off('sensestick.input', handleKeyInput);
                            hasEvent = false; // Timeout passed before callback occured
                            resolve()
                        }, _timeout * 1000);
                    }
                }
            })
        };
        return susp;
    });

    mod._inspectFunction = new Sk.builtin.func(function (func) {
        //var kwargs = false;
        var argsLength = 0;

        if (func.im_self && func.im_func) {
            //kwargs = func.im_func.func_code["co_kwargs"] != null;
            argsLength = func.im_func.func_code.length - 1; // -1 for the self
            //console.info('method', func, 'arguments: ', argsLength, 'keywords: ', kwargs);
        } else {
            //kwargs = func.func_code["co_kwargs"] != null;
            argsLength = func.func_code.length;
            //console.info('function', func, 'arguments: ', argsLength, 'keywords: ', kwargs);
        }

        return Sk.builtin.int_(argsLength);
    });

    /**
     * Removes the event handler for simulating threading
     */
    mod._stop_stick_thread = new Sk.builtin.func(function() {
        if (Sk.sense_hat.sensestick._threadHandler != null) {
            Sk.sense_hat.sensestick.off('sensestick.input', _threadHandler);
        }
    });

    /**
     * Adds the event handler for simulating threading for the SenseStick callbacks
     */
    mod._start_stick_thread = new Sk.builtin.func(function(callback) {
        function handleKeyInput (event, inputData) {
            // Store event in the internal queue
            //Sk.sense_hat.sensestick._eventQueue.push(inputData);
            // This may cause, that we are not able to call our interrupt suspension handler
            Sk.misceval.callsimAsync(null, callback);
        }

        Sk.sense_hat.sensestick.on('sensestick.input', handleKeyInput);
        Sk.sense_hat.sensestick._threadHandler = handleKeyInput; // Callback and save closure
    });

    mod._read = new Sk.builtin.func(function () {
        var inputEvent;
        var susp = new Sk.misceval.Suspension();
        susp.resume = function () {
            // We need the 2nd check for the keyboardinterrupt when we push this from the 
            // watching thread
            if (susp.data["error"] || inputEvent.type === 'keyboardinterrupt') {
                if (susp.data.error === 'KeyboardInterrupt' || inputEvent.type === 'keyboardinterrupt') {
                    // throwing now
                    throw new Error('KeyboardInterrupt');
                } else {
                    throw new Sk.builtin.IOError('SenseStickDevice Error');
                }
            }

            var tup = new Sk.builtin.tuple([
                Sk.builtin.int_(inputEvent.timestamp),
                Sk.builtin.int_(inputEvent.key),
                Sk.builtin.int_(inputEvent.state),
                Sk.builtin.int_(inputEvent.type)
            ]);
            return tup;
        };
        susp.data = {
            type: "Sk.promise",
            promise: new Promise(function (resolve, reject) {
                // Read from internal eventQueue
                if (Sk.sense_hat.sensestick._eventQueue.length > 0) {
                    inputEvent = Sk.sense_hat.sensestick._eventQueue.pop();
                    resolve();
                } else {
                    // add eventlistener
                    Sk.sense_hat.sensestick.once('sensestick.input', function (event, inputData) {
                        // Interrupt handling, so that we do not need to wait until the users inputs something
                        if (inputData.type === 'keyboardinterrupt') {
                            reject('KeyboardInterrupt');
                        }

                        inputEvent = inputEvent = Sk.sense_hat.sensestick._eventQueue.pop();
                        resolve();
                    });
                }
            })
        };
        return susp;
    });

    return mod;
};
