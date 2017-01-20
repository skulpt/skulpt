/**
 * Add document on DOMContentLoaded event
 */
document.addEventListener("DOMContentLoaded", onLoad);
function onLoad(event) {

    /**
     * Sends a signal to the Skulpt "Thread". If the thread,
     * is paused using signal.pause(). The execution will be
     * continued.
     * 
     * @param {any} signal
     * @param {any} data
     */
    function sendSignalToSkulpt(signal) {
        // Now trigger the signal, w00t
        if (Sk.signals != null && Sk.signals.signal != null) {
            Sk.signals.signal(signal);
        }
    }

    window.sense_hat = {
        rtimu: {
            pressure: [1, 1160], /* isValid, pressure*/
            temperature: [1, 25.12], /* isValid, temperature */
            humidity: [1, 45.3], /* isValid, humidity */
            gyro: [0, 0, 0],
            accel: [0, 0, 0],
            compass: [0, 0, 0],
            fusionPose: [0, 0, 0] /* fusionpose, accelerometer */,
            timestamp: DeviceOrientation.getTimestamp(),
        },
        sensestick: new SenseStickDevice(sendSignalToSkulpt)
    }; // create sense_hat value placeholder

    var O = new Geometry.Vector(0, 0, 0);
    var X = new Geometry.Vector(1, 0, 0);
    var Y = new Geometry.Vector(0, 1, 0);
    var Z = new Geometry.Vector(0, 0, 1);

     /**
     * Handle device orientation changes (actually we should compute the orientation from compass and accelerometer)
     */
    function deviceOrientationChange(deviceOrientation) {
        // remember the mapping:  yaw: alpha (z), pitch: gamma (y), roll: beta (x)
        var old_orientation = window.sense_hat.rtimu.fusionPose.slice(0); // make shallow copy
        var old_orientation = new Geometry.Vector(old_orientation[0], old_orientation[1], old_orientation[2]);
        var old_timestamp = window.sense_hat.rtimu.timestamp;
        var new_orientation = deviceOrientation.asVector();

        window.sense_hat.rtimu.fusionPose = [
            deviceOrientation.beta,
            deviceOrientation.gamma,
            deviceOrientation.alpha
        ];

        // ToDo: Add calculations to transform the beta, gamma, alpha into gyro and accel
        var new_timestamp = deviceOrientation.timestamp;
        var time_delta = (new_timestamp - old_timestamp) / 1000000;

        // calculate gyro, by reading the rate of change of the orientation
        var _gyro = Geometry.vectorSubstraction(new_orientation, old_orientation);
        _gyro = _gyro.divide(time_delta);
        console.log('new gyro data', _gyro);

        var _gravity = Z.asArray();
        var _north = X.multiply(0.33).asArray();

        var x = Geometry.degToRad(new_orientation.x);
        var y = Geometry.degToRad(new_orientation.y);
        var z = Geometry.degToRad(new_orientation.z);

        var c1 = Math.cos(z);
        var c2 = Math.cos(y);
        var c3 = Math.cos(x);
        var s1 = Math.sin(z);
        var s2 = Math.sin(y);
        var s3 = Math.sin(x);

        var R = [
            [c1 * c2, c1 * s2 * s3 - c3 * s1, s1 * s3 + c1 * c3 * s2],
            [c2 * s1, c1 * c3 + s1 * s2 * s3, c3 * s1 * s2 - c1 * s3],
            [-s2,     c2 * s3,                c2 * c3],
        ];

        /**
         * Transpose a 3 by 3 array matrix 
         */
        function transpose3x3Array(a) {
            return a[0].map(function(x,i) {
                return a.map(function(y,k) {
                    return y[i];
                })
            });
        }

        function dot3x3and3x1(a, b) {
            var rs = [];

            rs[0] = a[0][0]*b[0] + a[0][1] * b[1] + a[0][2] * b[2]; 
            rs[1] = a[1][0]*b[0] + a[1][1] * b[1] + a[1][2] * b[2]; 
            rs[2] = a[2][0]*b[0] + a[2][1] * b[1] + a[2][2] * b[2]; 
            
            return rs;
        }

        var T = transpose3x3Array(R);

        var _accel = dot3x3and3x1(T, _gravity);
        var _compass = dot3x3and3x1(T, _north);

        console.log('accel and compass', _accel, _compass);

        window.sense_hat.rtimu.timestamp = new_timestamp;
    }
    
    function initDeviceOrientationInput(cb) {
        var stageElement = document.querySelector('.orientation-stage');
        var boxElement = document.querySelector('.orientation-box');
        var resetButton = document.getElementById('device-orientation-reset-button');
        var alphaInput = document.getElementById('device-orientation-override-alpha');
        var betaInput = document.getElementById('device-orientation-override-beta');
        var gammaInput = document.getElementById('device-orientation-override-gamma');
        
        var di = new DeviceOrientation(0, 0, 0);
        
        var elements = {
            stageElement: stageElement,
            boxElement: boxElement,
            alphaInput: alphaInput,
            betaInput: betaInput,
            gammaInput: gammaInput,
            resetButton: resetButton
        };
        
        var options = {
            deviceOrientation: di,
            onDeviceOrientationChange: cb
        };
        
        var dii = new DeviceOrientationInput(elements, options);
        dii.bindToEvents();
    }

    // init the deviceOrientationInput, well try to
    try {
        initDeviceOrientationInput(deviceOrientationChange);
    } catch (e) {
        console.error(e);
    }

    function handleKeyInput(e, state) {
        var key = e.target.getAttribute('data-key');
        state = SenseStickDevice.STATE_PRESS;
        window.sense_hat.sensestick.push(key, state);
    }

    /**
     * IMPORTANT: This must be added to the trinket.io key handler
     * 
     * @param {any} state
     * @param {any} e
     * @returns
     */
    function handleRealKeyInput(state, e) {
        var stickKey;
        var key = SenseStickDevice.normalizeKeyEvent(e);

        switch(key) {
            case "ArrowLeft":
                stickKey = SenseStickDevice.KEY_LEFT
                break;
            case "ArrowUp":
                stickKey = SenseStickDevice.KEY_UP;
                break;
            case "ArrowRight":
                stickKey = SenseStickDevice.KEY_RIGHT
                break;
            case "ArrowDown":
                stickKey = SenseStickDevice.KEY_DOWN;
                break;
            case "Enter":
                stickKey = SenseStickDevice.KEY_ENTER;
                break;
            default:
                console.warn('Invalid keyCode in SenseStick handler', key);
                return;
        }

        switch(state) {
            case SenseStickDevice.STATE_PRESS:
                if (Sk.sense_hat.sensestick.isKeyDown(e.key)) {
                    // Change the state to hold if the key is already down
                    state = SenseStickDevice.STATE_HOLD;
                } else {
                    Sk.sense_hat.sensestick.addKeyDownEventToDict(e.key);
                }
                break;
            case SenseStickDevice.STATE_RELEASE:
                Sk.sense_hat.sensestick.removeKeyDownEventFromDict(e.key);
                break;
            default:
                break;
        }

        window.sense_hat.sensestick.push(stickKey, state);
    }

    // hook up sensestick buttons
    document.getElementById('stick-btn-up').addEventListener('click', handleKeyInput);
    document.getElementById('stick-btn-down').addEventListener('click', handleKeyInput);
    document.getElementById('stick-btn-left').addEventListener('click', handleKeyInput);
    document.getElementById('stick-btn-right').addEventListener('click', handleKeyInput);
    document.getElementById('stick-btn-enter').addEventListener('click', handleKeyInput);

    // Create callback functions and bind the right STATE
    var handleKeyDown = handleRealKeyInput.bind(this, SenseStickDevice.STATE_PRESS);
    var handleKeyPress = handleRealKeyInput.bind(this, SenseStickDevice.STATE_HOLD);
    var handleKeyUp = handleRealKeyInput.bind(this, SenseStickDevice.STATE_RELEASE);

    /****************************************************************
     * Here starts the skulpt specific stuff, e.g. run/stop btns input, output...
     ****************************************************************/
    // create ace editor
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/python");
    
    function emit(event, data) { 
        if (event && event === 'setpixel') {
            // change the led
            var ledIndex = data;
            var ledData = window.sense_hat.pixels[ledIndex];
            
            var led = document.getElementById('e' + ledIndex);
            
            if (ledData[0] > lowlightLimit || ledData[1] > lowlightLimit || ledData[2] > lowlightLimit) {
                var colorVal = "rgb(" + ledData[0] + "," + ledData[1] + "," + ledData[2] + ")";
                led.style.fill = colorVal;
            } else {
                led.style.fill = "#F6F6F6";
            }
        } else if (event && event === 'changeLowlight') {
            if (data === true) {
                lowlightLimit = 8;
            } else {
                lowlightLimit = 47;
            }
        } else if (event && event === 'init') {
            for (var i = 0; i < 64; i++) {
                var ledData = window.sense_hat.pixels[i];
                var led = document.getElementById('e' + i);
                led.style.fill = "#F6F6F6";
                window.sense_hat.pixels[i] = [0, 0, 0]; // reset
            }
        }
    }
    
    var runbtn = document.getElementById('runbtn');
    var stopbtn = document.getElementById('stopbtn');
    var output = document.getElementById('output');

    var interrupt = false;
    var lowlightLimit = 47;
    
    function interruptHandler() {
        if (interrupt === true) {
            var newText = output.value + 'Stopping...';
            output.value = newText;
            throw new Error('Stopped the hard way!');
        } else {
            return null;
        }
    }

    function cleanAfterRun() {
        Sk.sense_hat.sensestick.destroy();

        document.body.removeEventListener('keydown', handleKeyDown);
        document.body.removeEventListener('keypress', handleKeyPress);
        document.body.removeEventListener('keyup', handleKeyUp);
    }

    stopbtn.addEventListener('click', function (e) {
        interrupt = true;

        // first raise signal
        sendSignalToSkulpt(0);

        window.sense_hat.sensestick.triggerKeyboardInterrupt(); // Otherwise we need to wait until the suspension resolves!
    });
    
    runbtn.addEventListener('click', function (e) {
        interrupt = false; // reset
        output.value = ""; // reset output window
        
        function builtinRead(x) {
            if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
                throw "File not found: '" + x + "'";
            return Sk.builtinFiles["files"][x];
        }
        (Sk.TurtleGraphics || (Sk.TurtleGraphics = {})).target = 'mycanvas';

        Sk.configure({ 
            read: builtinRead,
            output: function (val) {
                var newText = output.value + val;
                output.value = newText;
            },
            killableWhile: true,
            signals: true
        });
        
        Sk.imageProxy = '';
        Sk.sense_hat = window.sense_hat,
        Sk.sense_hat_emit = emit,

        output.value = output.value + "Starting\n";
        var pr = Sk.misceval.asyncToPromise(function() {
            return Sk.importMainWithBody("<stdin>", false, editor.getValue(), true);
        }, {'*': interruptHandler});

        // Bind key events
        document.body.addEventListener('keydown', handleKeyDown);
        document.body.addEventListener('keypress', handleKeyPress);
        document.body.addEventListener('keyup', handleKeyUp);

        pr.then(function () {
            output.value = output.value + "\nFinished";

            // Remove any listenerer to avoid weird side effects, !IMPORTANT!
            cleanAfterRun();
        }, function (err) {
            console.info('errorHandler', err);
            if (err.nativeError && err.nativeError.message === 'KeyboardInterrupt') {
                output.value = output.value + "\nStopped!";
            } else {
                console.error(err);
                output.value = output.value + "\n" + err.toString();
            }

            // Remove any listenerer to avoid weird side effects, !IMPORTANT!
            cleanAfterRun();
        });
    });
}

/**
 * jQuery based Event Emitter Interface, no need to pull in a EventEmitter lib
 */
(function(jQuery) {
 
  jQuery.eventEmitter = {
    _JQInit: function() {
      this._JQ = jQuery(this);
    },
    emit: function(evt, data) {
      !this._JQ && this._JQInit();
      this._JQ.trigger(evt, data);
    },
    once: function(evt, handler) {
      !this._JQ && this._JQInit();
      this._JQ.one(evt, handler);
    },
    on: function(evt, handler) {
      !this._JQ && this._JQInit();
      this._JQ.bind(evt, handler);
    },
    off: function(evt, handler) {
      !this._JQ && this._JQInit();
      this._JQ.unbind(evt, handler);
    }
  };
 
}($));

/**
 * Handles the sense stick events
 */
function SenseStickDevice(sendSignalToSkulpt) {
    this._eventListeners;
    this._eventQueue = [];
    this._threadHandler = null;
    this._isDownDict = {};
    this.sendSignalToSkulpt = sendSignalToSkulpt;
}

// inheritance, or so :P
$.extend(SenseStickDevice.prototype, jQuery.eventEmitter);

SenseStickDevice.prototype.triggerKeyboardInterrupt = function () {
    this.emit('sensestick.input', { type: 'keyboardinterrupt'});
}

SenseStickDevice.prototype.addKeyDownEventToDict = function (keyStr) {
    this._isDownDict[keyStr] = true;
}

SenseStickDevice.prototype.removeKeyDownEventFromDict = function (keyStr) {
    delete this._isDownDict[keyStr];
}

SenseStickDevice.prototype.isKeyDown = function (keyStr) {
    return this._isDownDict[keyStr] === true;
}

SenseStickDevice.prototype.push = function (key, state, type) {
    var event = {
        type: type != null ? parseInt(type) : SenseStickDevice.EV_KEY,
        key: parseInt(key),
        state: parseInt(state),
        timestamp: Date.now()
    };

    this._enqueue(event);

    var shouldTriggerSignal = false;
    if (Sk.sense_hat.sensestick._threadHandler != null) {
        shouldTriggerSignal = true;
    }

    /*
     * Emit event and let the handler call the callback function.
     * Always call the callback before signaling, we cannot
     */
    this.emit('sensestick.input', event);
}

SenseStickDevice.prototype._enqueue = function (event) {
    this._eventQueue.push(event);
    // Not sure if we need to do this. 
    //this._eventQueue.unshift(event);
}

/**
 * Call this function, after skulpt finished executing or errored out,
 * otherwise there might be still an active event handler
 */
SenseStickDevice.prototype.destroy = function () {
    if (this._threadHandler) {
        this.off('sensestick.input', this._threadHandler);
    }

    // Empty dict
    this._isDownDict = {};

    // Empty queue
    this._eventQueue = [];
}

SenseStickDevice.stateToText = function (state) {
    switch(state) {
        case SenseStickDevice.STATE_RELEASE:
            return "release";
        case SenseStickDevice.STATE_HOLD:
            return "hold";
        case SenseStickDevice.STATE_PRESS:
            return "press"
        default:
            return undefined;
    }
}

SenseStickDevice.normalizeKeyEvent = function (event) {
    if (event.key != null) {
        return event.key;
    }

    var keyCode = e.keyCode ? e.keyCode : e.which;

    switch (keyCode) {
        case 37:
            return "ArrowLeft";
        case  38:
            return "ArrowUp";
        case 39:
            return "ArrowRight";
        case 40:
            return "ArrowDown";
        case 13:
            return "Enter";
        default:
            return "NoSenseStickKey";

    }
}

SenseStickDevice.EV_KEY = 0x01;
SenseStickDevice.STATE_RELEASE = 0;
SenseStickDevice.STATE_PRESS = 1;
SenseStickDevice.STATE_HOLD = 2;

SenseStickDevice.KEY_UP = 103;
SenseStickDevice.KEY_LEFT = 105;
SenseStickDevice.KEY_RIGHT = 106;
SenseStickDevice.KEY_DOWN = 108;
SenseStickDevice.KEY_ENTER = 28;
