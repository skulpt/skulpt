// Library for geometry operations
window.Geometry = {
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

/**
 * transpose matrix a and return t
 */
Geometry.Matrix.T = function(a) {
    var t = Geometry.Matrix();

    // first row
    t.m11 = a.m11;
    t.m12 = a.m21;
    t.m13 = a.m31;
    t.m14 = a.m41;

    // 2nd row
    t.m21 = a.m12;
    t.m22 = a.m22;
    t.m23 = a.m32;
    t.m24 = a.m42;

    // 3rd row
    t.m31 = a.m13;
    t.m32 = a.m23;
    t.m33 = a.m33;
    t.m34 = a.m43;

    // 4th row
    t.m41 = a.m14;
    t.m42 = a.m24;
    t.m43 = a.m34;
    t.m44 = a.m44;

    return t;
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
    },
    multiply: function (scalar) {
        return new Geometry.Vector(this.x * scalar, this.y * scalar, this.z * scalar);
    },
    divide: function (scalar) {
        return new Geometry.Vector(this.x / scalar, this.y / scalar, this.z / scalar);
    },
    toString: function () {
        return "(" + this.x + ", " + this.y + ", " + this.z + ")";
    },
    asArray: function () {
        return [this.x, this.y, this.z];
    }
}

Geometry.Vector.fromArray = function (arr) {
    if (arr == null || arr.length !== 3) {
        throw new Error("Expected an array with 3 elements");
    }
    return new Geometry.Vector(arr[0], arr[1], arr[2]);
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

Geometry.vectorSubstraction = function(u, v) {
    var x = u.x - v.x;
    var y = u.y - v.y;
    var z = u.z - v.z;

    return new Geometry.Vector(x, y, z);
}

Geometry.degToRad = function(deg) {
    if (deg instanceof Geometry.Vector) {
        return new Geometry.Vector(
            Geometry.degToRad(deg.x),
            Geometry.degToRad(deg.y),
            Geometry.degToRad(deg.z)
        );
    } else {
        return deg * (Math.PI / 180); // we could use constants here
    }
}

Geometry.radToDeg = function(rad) {
    return rad * 180 / Math.PI; // we could use constants here
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

Geometry.EulerAngles = function(yaw, roll, pitch) {
    this.yaw = yaw;
    this.roll = roll;
    this.pitch = pitch;
}

/**
 * Caclucate euler angles from a rotation matrix
 */
Geometry.EulerAngles.fromRotationMatrix = function(rotationMatrix) {
    var roll = Math.atan2(rotationMatrix.m23, rotationMatrix.m33);
    var pitch = Math.atan2(-rotationMatrix.m13, Math.sqrt(rotationMatrix.m11 * rotationMatrix.m11 + rotationMatrix.m12 * rotationMatrix.m12));
    var yaw = Math.atan2(rotationMatrix.m12, rotationMatrix.m11);
    return new Geometry.EulerAngles(Geometry.radToDeg(yaw), Geometry.radToDeg(roll), Geometry.radToDeg(pitch));
}

        /**
         * Transpose a 3 by 3 array matrix 
         */
Geometry.transpose3x3Array = function(a) {
    return a[0].map(function(x,i) {
        return a.map(function(y,k) {
            return y[i];
        })
    });
}

Geometry.dot3x3and3x1 = function(a, b) {
    var rs = [];

    rs[0] = a[0][0]*b[0] + a[0][1] * b[1] + a[0][2] * b[2]; 
    rs[1] = a[1][0]*b[0] + a[1][1] * b[1] + a[1][2] * b[2]; 
    rs[2] = a[2][0]*b[0] + a[2][1] * b[1] + a[2][2] * b[2]; 
    
    return rs;
}

Geometry.clamp = function(value, min_value, max_value) {
    return Math.min(max_value, Math.max(min_value, value))
}

Geometry.int = function(value) {
    return value | 0;
}

// Default "vectors" that are used multiple times
Geometry.Defaults = {};
Geometry.Defaults.O = new Geometry.Vector(0, 0, 0);
Geometry.Defaults.X = new Geometry.Vector(1, 0, 0);
Geometry.Defaults.Y = new Geometry.Vector(0, 1, 0);
Geometry.Defaults.Z = new Geometry.Vector(0, 0, 1);

Geometry.Defaults.NORTH = Geometry.Defaults.X.multiply(0.33);

/**
 * Stores the alpha, beta, gamma (yaw, pitch, roll) values
 * and creates a timestamp on object creation
 */
window.IMUData = function() {
    // Init with defaults
    this._orientation = Geometry.Defaults.O;
    this._compass = Geometry.Defaults.O;
    this._gyro = Geometry.Defaults.O;
    this._accel = Geometry.Defaults.O;
    this._position = Geometry.Defaults.O;

    this._gravity = Geometry.Defaults.Z;
    this._north = Geometry.Defaults.NORTH;

    this.timestamp = IMUData.getTimestamp(); // always create a timestamp
}

IMUData.ACCEL_FACTOR = 4081.6327;
IMUData.GYRO_FACTOR = 57.142857;
IMUData.COMPASS_FACTOR = 7142.8571;
IMUData.ORIENT_FACTOR = 5214.1892;

/**
 * Updates the orientation and calculates the compass, gyro and accel
 * 
 * @param {Object} orientation with alpha, beta, gamma keys
 * @param {any} position
 */
IMUData.prototype.setOrientation = function(orientation, position) {
    if (position == null) {
        position = Geometry.Defaults.O;
    }

    if (!(orientation instanceof Geometry.Vector)) {
        orientation = new Geometry.Vector(orientation.x, orientation.y, orientation.z);
    }

    var oldOrientation = this._orientation;
    var oldPosition = this._position;
    var oldTimestamp = this.timestamp;

    this._orientation = orientation;
    this._position = position;

    var newTimestamp = IMUData.getTimestamp();

    var timeDelta = (newTimestamp - oldTimestamp) / 1000000;

    // calculate gyro, by reading the rate of change of the orientation
    this._gyro = Geometry.vectorSubstraction(this._orientation, oldOrientation).divide(timeDelta);

    var x = Geometry.degToRad(this._orientation.x);
    var y = Geometry.degToRad(this._orientation.y);
    var z = Geometry.degToRad(this._orientation.z);

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
    ]

    var T = Geometry.transpose3x3Array(R);

    this._accel = Geometry.dot3x3and3x1(T, this._gravity.asArray());
    this._accel = new Geometry.Vector(this._accel[0], this._accel[1], this._accel[2]);
    this._compass = Geometry.dot3x3and3x1(T, this._north.asArray());
    this._compass = new Geometry.Vector(this._compass[0], this._compass[1], this._compass[2]);
}

/**
 * Returns the current imudata in an object as array values and with a timestamp
 * 
 * @returns
 */
IMUData.prototype.read = function() {
    var orient = Geometry.degToRad(this._orientation).asArray();
    var accel = this._accel.asArray();
    var gyro = this._gyro.asArray();
    var compass = this._compass.asArray();

    accel=[
        Geometry.int(Geometry.clamp(this._accel[0], -8, 8) * IMUData.ACCEL_FACTOR),
        Geometry.int(Geometry.clamp(this._accel[1], -8, 8) * IMUData.ACCEL_FACTOR),
        Geometry.int(Geometry.clamp(this._accel[2], -8, 8) * IMUData.ACCEL_FACTOR),
    ];
    gyro=[
        Geometry.int(Geometry.clamp(this._gyro[0], -500, 500) * IMUData.GYRO_FACTOR),
        Geometry.int(Geometry.clamp(this._gyro[1], -500, 500) * IMUData.GYRO_FACTOR),
        Geometry.int(Geometry.clamp(this._gyro[2], -500, 500) * IMUData.GYRO_FACTOR),
    ];
    compass=[
        Geometry.int(Geometry.clamp(this._compass[0], -4, 4) * IMUData.COMPASS_FACTOR),
        Geometry.int(Geometry.clamp(this._compass[1], -4, 4) * IMUData.COMPASS_FACTOR),
        Geometry.int(Geometry.clamp(this._compass[2], -4, 4) * IMUData.COMPASS_FACTOR),
    ];
    orient=[
        Geometry.int(Geometry.clamp(orient[0], -180, 180) * IMUData.ORIENT_FACTOR),
        Geometry.int(Geometry.clamp(orient[1], -180, 180) * IMUData.ORIENT_FACTOR),
        Geometry.int(Geometry.clamp(orient[2], -180, 180) * IMUData.ORIENT_FACTOR),
    ];

    return {
        accel: accel,
        gyro: gyro,
        compass: compass,
        orient: orient,
        timestamp: this.timestamp
    };
}

/**
 * Returns the current orientation in yaw, pitch, beta
 * 
 * @returns
 */
IMUData.prototype.getOrientation = function() {
    // ToDo: yaw: alpha (z), pitch: gamma (y), roll: beta (x)
    return {
        yaw: this._orientation.z / Geometry.Defaults.ORIENT_FACTOR,
        pitch: this._orientation.y / Geometry.Defaults.ORIENT_FACTOR,
        roll: this._orientation.x / Geometry.Defaults.ORIENT_FACTOR
    };
}

IMUData.YRP2ZXYObj = function (yrp) {
    return {
        x: yrp.roll,
        y: yrp.pitch,
        z: yrp.yaw
    };
}

/**
 * Validate user input, returns IMUData or null
 */
IMUData.parseUserInput = function (yawString, rollString, pitchString) {
    function isUserInputValid(value) {
        if (!value)
            return true;
        return /^[-]?[0-9]*[.]?[0-9]*$/.test(value);
    }

    if (!yawString && !rollString && !pitchString) {
        return null;
    }

    var isYawValid = isUserInputValid(yawString);
    var isRollValid = isUserInputValid(rollString);
    var isPitchValid = isUserInputValid(pitchString);

    if (!isYawValid && !isRollValid && !isPitchValid) {
        return null;
    }

    var yaw = isYawValid ? parseFloat(yawString) : -1;
    var roll = isRollValid ? parseFloat(rollString) : -1;
    var pitch = isPitchValid ? parseFloat(pitchString) : -1;

    // Return object with the values
    return {
        yaw: yaw, 
        roll: roll, 
        pitch: pitch
    };
}

IMUData.getTimestamp = function () {
    // Return a common timestamp in microseconds
    var time = Date.now(); // millis
    var timestamp = (time * 1000) | 0; // microseconds and forced int
    return timestamp;
}

/**
 * IMUInput class
 */
function IMUInput(elements, options) {
    this._stageElement = elements.stageElement;
    this._boxElement =  elements.boxElement;
    this._yawElement =  elements.yawInput;
    this._rollElement =  elements.rollInput;
    this._pitchElement =  elements.pitchInput;
    
    this._resetButton =  elements.resetButton;
    
    this._boxMatrix;
    this._currentMatrix;
    this._isDragging = false;
    
    if (options && options.imuData && options.imuData instanceof IMUData) {
        this.imuData = options.imuData;
    } else {
        this.imuData = new IMUData();
    }
    
    this.options = options;
    
    this._setIMUValues(this.imuData, 'InitialInput');
}

IMUInput.getEventX = function(event) {
    if (event.x) {
        return event.x;
    }
    
    if (event.clientX) {
        return event.clientX;
    }
}

IMUInput.getEventY = function(event) {
    if (event.y) {
        return event.y;
    }
    
    if (event.clientY) {
        return event.clientY;
    }
}

IMUInput.prototype.bindToEvents = function() {
    //Drag.installDragHandle(this._stageElement, this._onBoxDragStart.bind(this), this._onBoxDrag.bind(this), this._onBoxDragEnd.bind(this), "move");
    this._dragHandle();
    this._resetButton.addEventListener('click', this._resetOrientation.bind(this));
    
    this._yawElement.addEventListener('input', this._applyDeviceOrientationUserInput.bind(this));
    this._rollElement.addEventListener('input', this._applyDeviceOrientationUserInput.bind(this));
    this._pitchElement.addEventListener('input', this._applyDeviceOrientationUserInput.bind(this));
}

IMUInput.prototype._dragHandle = function() {
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
        
        if (this._dragPane && this._dragPane.remove) {
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
            if (this._dragPane && this._dragPane.remove) {
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
IMUInput.prototype._calculateRadiusVector = function (x, y) {
    var rect = this._stageElement.getBoundingClientRect();
    var radius = Math.max(rect.width, rect.height) / 2;
    var sphereX = (x - rect.left - rect.width / 2) / radius;
    var sphereY = (y - rect.top - rect.height / 2) / radius;
    var sqrSum = sphereX * sphereX + sphereY * sphereY;
    if (sqrSum > 0.5)
        return new Geometry.Vector(sphereX, sphereY, 0.5 / Math.sqrt(sqrSum));

    return new Geometry.Vector(sphereX, sphereY, Math.sqrt(1 - sqrSum));
};

IMUInput.prototype._onBoxDragEnd = function() {
    this._boxMatrix = this._currentMatrix;
};

IMUInput.prototype._onBoxDragStart = function (event) {
    this._mouseDownVector = this._calculateRadiusVector(IMUInput.getEventX(event), IMUInput.getEventY(event));

    if (!this._mouseDownVector)
        return false;

    event.preventDefault();
    return true;
};

IMUInput._matrixToCSSString = function (matrix) {
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

IMUInput.prototype._onBoxDrag = function(event) {
    var mouseMoveVector = this._calculateRadiusVector(IMUInput.getEventX(event), IMUInput.getEventY(event));
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
    var matrixString = IMUInput._matrixToCSSString(this._currentMatrix);
    
    this._boxElement.style.webkitTransform = matrixString;
    this._boxElement.style.mozTransform = matrixString;
    this._boxElement.style.transform = matrixString;
    
    var eulerAngles = Geometry.EulerAngles.fromRotationMatrix(this._currentMatrix);
    
    this.imuData.setOrientation(IMUData.YRP2XYZObj(-eulerAngles.yaw, -eulerAngles.roll, eulerAngles.pitch));

    this._setIMUValues(this.imuData, "UserDrag");
    return false;
};

/**
 * Update the draggable box position after user input
 */
IMUInput.prototype._setBoxOrientation = function(orientation) {
    var matrix = Geometry.Matrix();
    
    this._boxMatrix = matrix.rotate(-orientation.roll, orientation.pitch, -orientation.alpha);
    
     var matrixString = IMUInput._matrixToCSSString(this._boxMatrix);
    this._boxElement.style.webkitTransform = matrixString;
    this._boxElement.style.mozTransform = matrixString;
    this._boxElement.style.transform = matrixString;
};

/**
 * Handle user input
 */
IMUInput.prototype._applyDeviceOrientationUserInput = function(event) {
    event.preventDefault();
    var yrp = IMUData.parseUserInput(this._yawElement.value.trim(), this._rollElement.value.trim(), this._pitchElement.value.trim());
    this.imuData.setOrientation(IMUData.YRP2ZXYObj(yrp));

    this._setIMUValues(this.imuData, "UserInput");
}

/**
 * Resets the orientation to (0, 0, 0)
 */
IMUInput.prototype._resetOrientation = function(event) {
    event.preventDefault();
    this.imuData.setOrientation({
        x: 0,
        y: 0,
        z: 0
    });
    this._setIMUValues(this.imuData, "ResetButton");
}

/**
 * Sets the device orientation after a change
 */
IMUInput.prototype._setIMUValues = function(imuData, modificationSource) {
    if (imuData == null)
        // This should never happen, basically
        return;

    var orientation = imuData.getOrientation();

    if (modificationSource != "UserInput") {
        this._yawElement.value = orientation.yaw;
        this._rollElement.value = orientation.roll;
        this._pitchElement.value = orientation.pitch;
    }

    if (modificationSource != "UserDrag")
        this._setBoxOrientation(orientation);

    if (this.options && this.options.onIMUDataChange) {
        this.options.onIMUDataChange.call(null, imuData);
    }
};