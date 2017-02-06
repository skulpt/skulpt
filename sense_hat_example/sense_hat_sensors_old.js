/**
 * Add document on DOMContentLoaded event
 */
document.addEventListener("DOMContentLoaded", onLoad);
function onLoad(event) {
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
        sensestick: new SenseStickDevice()
    }; // create sense_hat value placeholder
    
    /**
     * Handle device orientation changes (actually we should compute the orientation from compass and accelerometer)
     */
    function deviceOrientationChange(deviceOrientation) {
        window.sense_hat.rtimu.fusionPose = [
            deviceOrientation.beta,
            deviceOrientation.gamma,
            deviceOrientation.alpha
        ];
    }
    
    // init the deviceOrientationInput, well try to
    try {
        initDeviceOrientationInput(deviceOrientationChange);
    } catch (e) {
        console.error(e);
    }

    // hook up temperature input
    var tempInput = document.getElementById('device-temperature-overide');
    tempInput.addEventListener('input', function (event) {
        event.preventDefault();
        
       var val = event.target.value;
       
       // only numbers/floats are okay
       var isValid = !isNaN(parseFloat(val)) && isFinite(val);
       if (isValid) {
           val = parseFloat(val);
           
           // there are limits:
           //-40 to +120 degrees celsius
           
           Sk.sense_hat.rtimu.temperature = [1, val];
       } else {
           Sk.sense_hat.rtimu.temperature = [0, -1];
       }
    });

    function handleKeyInput(e) {
        var key = e.target.getAttribute('data-key');
        state = SenseStickDevice.STATE_RELEASE;

        window.sense_hat.sensestick.push(key, state);
    }

    // hook up sensestick buttons
    document.getElementById('stick-btn-up').addEventListener('click', handleKeyInput);
    document.getElementById('stick-btn-down').addEventListener('click', handleKeyInput);
    document.getElementById('stick-btn-left').addEventListener('click', handleKeyInput);
    document.getElementById('stick-btn-right').addEventListener('click', handleKeyInput);
    document.getElementById('stick-btn-enter').addEventListener('click', handleKeyInput);

    /****************************************************************
     * Here starts the skulpt specific stuff, e.g. run/stop btns input, output...
     ****************************************************************/
    // create ace editor
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/python");
    
    var interrupt = false;
    var lowlightLimit = 47;
    
    function interruptHandler() {
        if (interrupt === true) {
            throw new Error('Stopped the hard way!');
        } else {
            return null;
        }
    }
    
    function emit(event, data) {
        //console.info(event, data);
        
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
    
    stopbtn.addEventListener('click', function (e) {
        interrupt = true;
    });
    
    runbtn.addEventListener('click', function (e) {
        interrupt = false; // reset
        
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
            } 
        });
        
        Sk.imageProxy = '';
        Sk.sense_hat = window.sense_hat,
        Sk.sense_hat_emit = emit,

        Sk.misceval.asyncToPromise(function() {
            return Sk.importMainWithBody("<stdin>", false, editor.getValue(), true);
        }, {'*': interruptHandler});
    });
}

function initDeviceOrientationInput(cb) {
    var stageElement = document.querySelector('.accelerometer-stage');
    var boxElement = document.querySelector('.accelerometer-box');
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

/**
 * Handles the sense stick events
 */
function SenseStickDevice() {
    this._queue = [];
    this._eventListener;
}

// add new event
SenseStickDevice.prototype.push = function (key, state, type) {
    var event = {
        type: type ||SenseStickDevice.EV_KEY,
        key: parseInt(key),
        state: state,
        timestamp: Date.now()
    };

    this._queue.push(event);

    // notify the listener
    if (this._eventListener) {
        this._eventListener.call(null);
        this._eventListener = null; // remove
    }
}

SenseStickDevice.prototype.addKeyInputListener = function (cb) {
    this._eventListener = cb;
}

SenseStickDevice.prototype.removeKeyInputListener = function (cb) {
    this._eventListener = null;
}

// get oldest event
SenseStickDevice.prototype.pop = function () {
    return this._queue.shift(); // return oldest event
}

SenseStickDevice.prototype.hasEvent = function () {
    return this._queue.length > 0;
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

// Library for geometry operations
var Geometry = {
    _Eps: 1e-5
};

/**
 * Creates a new Transform matrix (Chrome fu, FireFox fu)
 */
Geometry.Matrix = function () {
    if (window.WebKitCSSMatrix) {
        return new WebKitCSSMatrix();
    } else if (window.DOMMatrix) {
        return new DOMMatrix();
    } else if (window.MSCSSMatrix) {
        // IE10
        return new MSCSSMatrix();
    } else {
        // maybe use Polyfill
        throw Error('Matrix not supported by the browser!');
    }
}

Geometry.Vector = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

Geometry.Vector.prototype = {
    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    },
    normalize: function() {
        var length = this.length();
        if (length <= Geometry._Eps)
            return;

        this.x /= length;
        this.y /= length;
        this.z /= length;
    }
}

/**
 * Caclucate angle from 2 vectors
 */
Geometry.calculateAngle = function(u, v) {
    var uLength = u.length();
    var vLength = v.length();
    if (uLength <= Geometry._Eps || vLength <= Geometry._Eps)
        return 0;
    var cos = Geometry.scalarProduct(u, v) / uLength / vLength;
    if (Math.abs(cos) > 1)
        return 0;
    return Geometry.radToDeg(Math.acos(cos));
}

Geometry.radToDeg = function(rad) {
    return rad * 180 / Math.PI;
}

Geometry.scalarProduct = function(u, v) {
    return u.x * v.x + u.y * v.y + u.z * v.z;
}

Geometry.crossProduct = function(u, v) {
    var x = u.y * v.z - u.z * v.y;
    var y = u.z * v.x - u.x * v.z;
    var z = u.x * v.y - u.y * v.x;
    return new Geometry.Vector(x, y, z);
}

Geometry.EulerAngles = function(alpha, beta, gamma) {
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma;
}

/**
 * Caclucate euler angles from a rotation matrix
 */
Geometry.EulerAngles.fromRotationMatrix = function(rotationMatrix) {
    var beta = Math.atan2(rotationMatrix.m23, rotationMatrix.m33);
    var gamma = Math.atan2(-rotationMatrix.m13, Math.sqrt(rotationMatrix.m11 * rotationMatrix.m11 + rotationMatrix.m12 * rotationMatrix.m12));
    var alpha = Math.atan2(rotationMatrix.m12, rotationMatrix.m11);
    return new Geometry.EulerAngles(Geometry.radToDeg(alpha), Geometry.radToDeg(beta), Geometry.radToDeg(gamma));
}

function DeviceOrientation(alpha, beta, gamma) {
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma;
}

/**
 * Validate user input, returns DeviceOrientation or null
 */
DeviceOrientation.parseUserInput = function (alphaString, betaString, gammaString) {
    function isUserInputValid(value) {
        if (!value)
            return true;
        return /^[-]?[0-9]*[.]?[0-9]*$/.test(value);
    }

    if (!alphaString && !betaString && !gammaString) {
        return null;
    }

    var isAlphaValid = isUserInputValid(alphaString);
    var isBetaValid = isUserInputValid(betaString);
    var isGammaValid = isUserInputValid(gammaString);

    if (!isAlphaValid && !isBetaValid && !isGammaValid) {
        return null;
    }

    var alpha = isAlphaValid ? parseFloat(alphaString) : -1;
    var beta = isBetaValid ? parseFloat(betaString) : -1;
    var gamma = isGammaValid ? parseFloat(gammaString) : -1;

    return new DeviceOrientation(alpha, beta, gamma);
}

/**
 * DeviceOrientationInput class
 */
function DeviceOrientationInput(elements, options) {
    this._stageElement = elements.stageElement;
    this._boxElement =  elements.boxElement;
    this._alphaElement =  elements.alphaInput;
    this._betaElement =  elements.betaInput;
    this._gammaElement =  elements.gammaInput;
    
    this._resetButton =  elements.resetButton;
    
    this._boxMatrix;
    this._currentMatrix;
    this._isDragging = false;
    
    var deviceOrientation;
    if (options && options.deviceOrientation && options.deviceOrientation instanceof DeviceOrientation) {
        deviceOrientation = options.deviceOrientation;
    } else {
        deviceOrientation = new DeviceOrientation(0, 0, 0);
    }
    
    this.options = options;
    
    this._setDeviceOrientation(deviceOrientation, 'InitialInput');
}

DeviceOrientationInput.getEventX = function(event) {
    if (event.x) {
        return event.x;
    }
    
    if (event.clientX) {
        return event.clientX;
    }
}

DeviceOrientationInput.getEventY = function(event) {
    if (event.y) {
        return event.y;
    }
    
    if (event.clientY) {
        return event.clientY;
    }
}

DeviceOrientationInput.prototype.bindToEvents = function() {
    //Drag.installDragHandle(this._stageElement, this._onBoxDragStart.bind(this), this._onBoxDrag.bind(this), this._onBoxDragEnd.bind(this), "move");
    this._dragHandle();
    this._resetButton.addEventListener('click', this._resetDeviceOrientation.bind(this));
    
    this._alphaElement.addEventListener('input', this._applyDeviceOrientationUserInput.bind(this));
    this._betaElement.addEventListener('input', this._applyDeviceOrientationUserInput.bind(this));
    this._gammaElement.addEventListener('input', this._applyDeviceOrientationUserInput.bind(this));
}

DeviceOrientationInput.prototype._dragHandle = function() {
    function isMac() {
        return navigator.platform === 'MacIntel' || navigator.platform === 'MacPPC' || navigator.platform === 'Mac68K';
    }

    function mouseDownHandler(event) {
        // Only drag upon left button, not on right button or context menu clicks
        if (event.button || (isMac() && event.ctrlKey))
            return;
            
        // can this happen?
        if (this._isDragging === true) {
            return;
        }
        
        if (this._dragPane) {
            this._dragPane.remove();
        }
        
        this._isDragging = true
        this._onBoxDragStart(event);
    }
    
    function mouseMoveHandler(event) {
        if (this._isDragging === true) {
            //event.preventDefault();
            this._onBoxDrag(event);
        }
    }
    
    function mouseUpHandler(event) {
        if (this._isDragging === true) {
            //event.preventDefault();
            
            this._isDragging = false;
            this._onBoxDragEnd(event);
            
            // clean up dragPane
            if (this._dragPane) {
                this._dragPane.remove();
            }
        }
    }
    
    function mouseOutHandler(event) {
        if (this._isDragging === true) {
            // create a pane, so that you can drag everywhere
            createDragPane.apply(this);
            
            if (this._dragPane) {
                // register events
                this._dragPane.addEventListener('mousemove', mouseMoveHandler.bind(this));    
                this._dragPane.addEventListener('touchmove', mouseMoveHandler.bind(this));  

                this._dragPane.addEventListener('mouseup', mouseUpHandler.bind(this));
                this._dragPane.addEventListener('touchend', mouseUpHandler.bind(this));
            }   
        }
    }
    
    function createDragPane() {
        this._dragPane = document.createElement("div");
        this._dragPane.style.cssText = "position:absolute;top:0;bottom:0;left:0;right:0;background-color:transparent;z-index:1000;overflow:hidden;";
        this._dragPane.id = "drag-pane";
        document.body.appendChild(this._dragPane);
        
        function handlePaneOut(event) {
            mouseUpHandler.apply(this, event);
        }

        this._dragPane.addEventListener('mouseout', handlePaneOut.bind(this));
        this._dragPane.addEventListener('touchcancel', handlePaneOut.bind(this));
    }
    
    this._stageElement.addEventListener('mousedown', mouseDownHandler.bind(this));    
    this._stageElement.addEventListener('touchstart', mouseDownHandler.bind(this));    

    this._stageElement.addEventListener('mousemove', mouseMoveHandler.bind(this));    
    this._stageElement.addEventListener('touchmove', mouseMoveHandler.bind(this));   

    this._stageElement.addEventListener('mouseup', mouseUpHandler.bind(this));
    this._stageElement.addEventListener('touchend', mouseUpHandler.bind(this));

    
    this._stageElement.addEventListener('mouseout', mouseOutHandler.bind(this));
    this._stageElement.addEventListener('touchcancel', mouseOutHandler.bind(this));
}

/**
 * Calculate radius vector after dragging
 */
DeviceOrientationInput.prototype._calculateRadiusVector = function (x, y) {
    var rect = this._stageElement.getBoundingClientRect();
    var radius = Math.max(rect.width, rect.height) / 2;
    var sphereX = (x - rect.left - rect.width / 2) / radius;
    var sphereY = (y - rect.top - rect.height / 2) / radius;
    var sqrSum = sphereX * sphereX + sphereY * sphereY;
    if (sqrSum > 0.5)
        return new Geometry.Vector(sphereX, sphereY, 0.5 / Math.sqrt(sqrSum));

    return new Geometry.Vector(sphereX, sphereY, Math.sqrt(1 - sqrSum));
};

DeviceOrientationInput.prototype._onBoxDragEnd = function() {
    this._boxMatrix = this._currentMatrix;
};

DeviceOrientationInput.prototype._onBoxDragStart = function (event) {
    this._mouseDownVector = this._calculateRadiusVector(DeviceOrientationInput.getEventX(event), DeviceOrientationInput.getEventY(event));

    if (!this._mouseDownVector)
        return false;

    event.preventDefault();
    return true;
};

DeviceOrientationInput._matrixToCSSString = function (matrix) {
    function generateCSSString(matrix){
        var str = '';
        str += matrix.m11.toFixed(20) + ',';
        str += matrix.m12.toFixed(20) + ',';
        str += matrix.m13.toFixed(20) + ',';
        str += matrix.m14.toFixed(20) + ',';
        str += matrix.m21.toFixed(20) + ',';
        str += matrix.m22.toFixed(20) + ',';
        str += matrix.m23.toFixed(20) + ',';
        str += matrix.m24.toFixed(20) + ',';
        str += matrix.m31.toFixed(20) + ',';
        str += matrix.m32.toFixed(20) + ',';
        str += matrix.m33.toFixed(20) + ',';
        str += matrix.m34.toFixed(20) + ',';
        str += matrix.m41.toFixed(20) + ',';
        str += matrix.m42.toFixed(20) + ',';
        str += matrix.m43.toFixed(20) + ',';
        str += matrix.m44.toFixed(20);

        return 'matrix3d(' + str + ')';
    }

    if (window.DOMMatrix && matrix instanceof window.DOMMatrix) {
        var lang = navigator.language;
        if (lang && lang.indexOf("en") >= 0) {
            return matrix.toString(); // save on englisch systems    
        }
        
        return generateCSSString(matrix);
    }
    
    return matrix.toString();
}

DeviceOrientationInput.prototype._onBoxDrag = function(event) {
    var mouseMoveVector = this._calculateRadiusVector(DeviceOrientationInput.getEventX(event), DeviceOrientationInput.getEventY(event));
    if (!mouseMoveVector)
        return true;

    event.preventDefault();
    var axis = Geometry.crossProduct(this._mouseDownVector, mouseMoveVector);
    axis.normalize();
    var angle = Geometry.calculateAngle(this._mouseDownVector, mouseMoveVector);
    
    var matrix = Geometry.Matrix();
    var rotationMatrix = matrix.rotateAxisAngle(axis.x, axis.y, axis.z, angle);
    this._currentMatrix = rotationMatrix.multiply(this._boxMatrix);
    
    // Crossbrowser and cross locale way of outputing the string
    var matrixString = DeviceOrientationInput._matrixToCSSString(this._currentMatrix);
    
    this._boxElement.style.webkitTransform = matrixString;
    this._boxElement.style.mozTransform = matrixString;
    this._boxElement.style.transform = matrixString;
    
    var eulerAngles = Geometry.EulerAngles.fromRotationMatrix(this._currentMatrix);
    
    var newOrientation = new DeviceOrientation(-eulerAngles.alpha, -eulerAngles.beta, eulerAngles.gamma);
    
    this._setDeviceOrientation(newOrientation, "UserDrag");
    return false;
};

/**
 * Update the draggable box position after user input
 */
DeviceOrientationInput.prototype._setBoxOrientation = function(deviceOrientation) {
    var matrix = Geometry.Matrix();
    
    this._boxMatrix = matrix.rotate(-deviceOrientation.beta, deviceOrientation.gamma, -deviceOrientation.alpha);
    
     var matrixString = DeviceOrientationInput._matrixToCSSString(this._boxMatrix);
    this._boxElement.style.webkitTransform = matrixString;
    this._boxElement.style.mozTransform = matrixString;
    this._boxElement.style.transform = matrixString;
};

/**
 * Handle user input
 */
DeviceOrientationInput.prototype._applyDeviceOrientationUserInput = function(event) {
    event.preventDefault();
    this._setDeviceOrientation(DeviceOrientation.parseUserInput(this._alphaElement.value.trim(), this._betaElement.value.trim(), this._gammaElement.value.trim()), "UserInput");
}

/**
 * Resets the orientation to (0, 0, 0)
 */
DeviceOrientationInput.prototype._resetDeviceOrientation = function(event) {
    event.preventDefault();
    this._setDeviceOrientation(new DeviceOrientation(0, 0, 0), "ResetButton");
}

/**
 * Sets the device orientation after a change
 */
DeviceOrientationInput.prototype._setDeviceOrientation = function(deviceOrientation, modificationSource) {
    if (!deviceOrientation)
        return;

    if (modificationSource != "UserInput") {
        this._alphaElement.value = deviceOrientation.alpha;
        this._betaElement.value = deviceOrientation.beta;
        this._gammaElement.value = deviceOrientation.gamma;
    }

    if (modificationSource != "UserDrag")
        this._setBoxOrientation(deviceOrientation);

    if (this.options && this.options.onDeviceOrientationChange) {
        this.options.onDeviceOrientationChange.call(null, deviceOrientation);
    }
};
