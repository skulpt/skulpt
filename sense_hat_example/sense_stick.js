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
    function sendSignalToSkulpt(signal, data) {
        // Now trigger the signal, w00t
        if (Sk.signals != null && Sk.signals.signal != null) {
            Sk.signals.signal(signal, data);
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
            fusionPose: [0, 0, 0] /* fusionpose, accelerometer */
        },
        sensestick: new SenseStickDevice(sendSignalToSkulpt)
    }; // create sense_hat value placeholder
    
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
        sendSignalToSkulpt('SIGTERM', {});

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

    // Now trigger the signal, w00t
    if (shouldTriggerSignal) {
        this.sendSignalToSkulpt('sensestick.input');
    }
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
