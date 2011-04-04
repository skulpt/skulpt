//
//
// Turtle Graphics Module for Skulpt
//
// Brad Miller
//
//
//

//
//
// Turtle Graphics Module for Skulpt
//
// Brad Miller
//
//

var TurtleGraphics; // the single identifier needed in the global scope

if ( ! TurtleGraphics ) {
  TurtleGraphics = { };
}

// Define private constants, variables, and functions via a closure, and
// export public entities to global variable TurtleGraphics.
(function () {

    // Define private constants

    var Degree2Rad = Math.PI / 180.0; // conversion factor for degrees to radians
    var Rad2Degree = 180.0 / Math.PI


    // Constructor for Turtle objects
    function Turtle() {
	if ( arguments.length >= 1 ) {
	    this.initialize(arguments[0]);
	}
	else {
	    this.initialize();
	}
	TurtleGraphics.turtleList.push(this);
    }


    Turtle.prototype.go_home = function () {
	// Put turtle in initial state
        // turtle is headed to the right
        // with location 0,0,0 in the middle of the canvas.
        // x grows to the right
        // y grows towards the top of the canvas
	with ( this ) {
	    position = home;
	    context.moveTo(home[0],home[1]);
	    heading = new Vector([1.0, 0.0, 0.0]); // to the right; in turtle space x+ direction
	    normal = new Vector([0.0, 0.0, -1.0]); // in z- direction
	}
    };

    Turtle.prototype.initialize = function () {
	// Initialize the turtle.
	var options = { };

	if ( arguments.length >= 1 ) {
	    options = arguments[0];
	}
	this.unit = TurtleGraphics.defaults.unit; // position scaling to define the unit length
	if ( options.unit ) {
	    this.unit = options.unit;
	}

	this.canvasID = TurtleGraphics.defaults.canvasID;
	if ( options.canvasID ) {
	    this.canvasID = options.canvasID;
	}
	this.context = document.getElementById(this.canvasID).getContext('2d');

	this.animate = TurtleGraphics.defaults.animate;

	with ( this.context ) {
	    translate(canvas.width/2, canvas.height/2); // move 0,0 to center.
	    scale(1,-1); // scaling like this flips the y axis the right way.
	    this.home = new Vector([0.0, 0.0, 0.0]); 
	    this.position = [ ]; 
	    this.heading = [ ]; 
	    this.normal = [ ]; 
	    this.drawingEvents = [];
	    this.eventLoop = false;
	    this.pen = true; 
	    this.penStyle = 'black';
	    this.penWidth = 2;
	    this.fillStyle = 'white';
	    this.go_home();
	    this.intervalId = 0;
	    this.aCount = 1;
	}
    }

    Turtle.prototype.clean = function () {
	// Clean the canvas
	// Optional second argument is color
	with ( this ) {
	    if ( arguments.length >= 1 ) {
		clear(canvasID, arguments[0]);
	    }
	    else {
		clear(canvasID);
	    }
	    initialize();
	}
    }

//  
//  Drawing Functions
//

    Turtle.prototype.draw_line = function(newposition) {
	with (this ) {
	    with ( context ) {
		if (! animate ) {
		    lineCap = 'round';
		    lineJoin = 'round';
		    lineWidth = penWidth;
		    strokeStyle = penStyle;
		    lineTo(newposition[0], newposition[1]);
		    stroke();
		} else {
		    //drawingEvents.push("lineTo("+newposition[0]+","+newposition[1]+")");
		    drawingEvents.push(["LT", newposition[0], newposition[1]].join(" "));
		    if (! eventLoop) {
			this.intervalId = setInterval(processDrawEvents,500);
			eventLoop = true;
		    }
		}
	    }
	}

    }


    Turtle.prototype.forward = function (d) {
	with ( this ) {
	    var newposition = position.linear(1, d * unit, heading);
	    if ( pen ) {
		draw_line(newposition);
                }
	    else {
		if (animate) {
		    drawingEvents.push(["MT",newposition[0],newposition[1]].join(" "));
		} else
		    this.context.moveTo(newposition[0],newposition[1]);
	    }
	    position = newposition;
	}
    }

    Turtle.prototype.goto = function(nx,ny) {
	var newposition = new Vector([nx,ny,0]);
	with (this) {
	    if (pen) {
		draw_line(newposition);
	    } else {
		if (! animate) {
		    context.moveTo(newposition[0], newposition[1]);
		} else {
		    //drawingEvents.push("moveTo("+newposition[0]+","+newposition[1]+")");
		    drawingEvents.push(["MT",newposition[0],newposition[1]].join(" "));
		    if (! eventLoop) {
			this.intervalId = setInterval(processDrawEvents,500);
			eventLoop = true;
		    }
		}
	    }
	    position = newposition;
	    
	}
    }

    Turtle.prototype.speed = function(s) {
	if (s > 0)
	    this.animate = true;
	else
	    this.animate = false;
    }

    processDrawEvents = function () {
	var context = document.getElementById(TurtleGraphics.defaults.canvasID).getContext('2d');
	with ( context ) {
	    for (var i in TurtleGraphics.turtleList) {
		var t = TurtleGraphics.turtleList[i]
		clearRect(-canvas.width/2,-canvas.height/2,canvas.width,canvas.height);
		moveTo(0,0);
		for (var i = 0; i < t.aCount; i++ ) {
		    var oper = t.drawingEvents[i].split(" ");
		    if (oper[0] == "LT") {
			lineTo(oper[1],oper[2]);
			stroke();
		    }
		    if (oper[0] == "MT")
			moveTo(oper[1],oper[2]);
		}
		t.aCount++;
		if (t.aCount > t.drawingEvents.length) {
		    t.eventLoop = false;
		    clearInterval(t.intervalId);
		}
	    }
	}
    }


    Turtle.prototype.turn = function (phi) {
	with ( this ) {
	    var alpha = phi * Degree2Rad;
	    var left = normal.cross(heading);
	    var newheading = heading.rotateNormal(left, normal, alpha);
	    heading = newheading;
	}
    }

    Turtle.prototype.get_heading = function () {
	if (TurtleGraphics.defaults.degrees)
	    return this.heading.toAngle()
	else
	    return this.heading
    }

    Turtle.prototype.get_position = function () {
	return this.position;
    }

    Turtle.prototype.getx = function () {
	return this.position[0];
    }

    Turtle.prototype.gety = function () {
	return this.position[1];
    }

    Turtle.prototype.set_heading = function(newhead) {
	if ((typeof(newhead)).toLowerCase() === 'number') {
	    this.heading = Vector.angle2vec(newhead);
	} else {
	    this.heading = newhead;
	}
    }

    Turtle.prototype.towards = function(to,y) {
	// set heading vector to point towards another point.
	if ((typeof(to)).toLowerCase() === 'number')
	    to = new Vector(to,y,0);
	else if (! (to instanceof Vector)) {
	    to = new Vector(to);
	}
	console.log("here: " + to);
	var res = to.sub(this.position);
	res = res.normalize();
	if (TurtleGraphics.defaults.degrees)
	    return res.toAngle();
	else
	    return res;
    }

    Turtle.prototype.distance = function(to,y) {
	if ((typeof(to)).toLowerCase() === 'number')
	    to = new Vector(to,y,0);
	return this.position.sub(new Vector(to)).len();
    }

    Turtle.prototype.dot = function() {
	var size = 2;
	if (arguments.length >= 1) size = arguments[0];
	with (this) {
	    with ( context ) {
		if (arguments.length >= 2) {
		    fillStyle = arguments[1];
		}
		fillRect(position[0]-size/2, position[1]-size/2, size, size);
	    }
	}
	    
    }

    // Todo:  fix up the turtle position and heading for a partial circle....
    //        this may be just as easy to do using my own circle drawing
    //        function rather than the builtin arc...
    Turtle.prototype.circle = function(radius, extent) {
	var cx = this.position[0] - Math.abs(radius);
	var cy = this.position[1];
	var endAngle;
	if (extent)
            endAngle = extent * Degree2Rad;
	else
	    endAngle = 360 * Degree2Rad;
	
	this.context.arc(cx, cy, Math.abs(radius), 0, endAngle, (radius > 0));
	this.context.stroke();
    }

    Turtle.prototype.write = function(theText, move, align, font) {
	if (font)
	    this.context.font = font.v;
        this.context.scale(1,-1);
	this.context.fillText(theText,this.position[0], -this.position[1]);
        this.context.scale(1,-1);
    }


//
// Pen and Style functions
//
    Turtle.prototype.pen_down = function () {
	this.pen = true;
    }

    Turtle.prototype.pen_up = function () {
	this.pen = false;
    }

    Turtle.prototype.get_pen = function () {
	return this.pen;
    }

    Turtle.prototype.set_pen_width = function (w) {
	this.penWidth = w;
    }

    Turtle.prototype.set_pen_style = function (c) {
	this.penStyle = c;
    }

    Turtle.prototype.set_fill_style = function (c) {
	    this.fillStyle = c;
	    this.context.fillStyle = c;
    }

    Turtle.prototype.begin_fill = function () {
	    this.context.beginPath();
    }

    Turtle.prototype.end_fill = function () {
	    this.context.closePath();
	    this.context.fill();
    }


    // Define functions to be made public (continued)

    function clear_canvas(canId) {
	// Clear canvas with ID sp.
	// Optional second argument is color.
	with ( document.getElementById(canId).getContext('2d') ) {
	    canvas.width = canvas.width; // clear the canvas
	    if ( arguments.length >= 2 ) {
		fillStyle = arguments[1];
		fillRect(0, 0, canvas.width, canvas.height);
	    }
	}
    }


    // Create a 3d Vector class for manipulating turtle heading, and position.

    function Vector(x,y,z) {
	if ((typeof(x)).toLowerCase() === 'number') {
	    Array.prototype.push.call(this,x);
	    Array.prototype.push.call(this,y);
	    Array.prototype.push.call(this,z);
	}
	else {
	    for (var i in x) {
		Array.prototype.push.call(this,x[i]);
	    }
	}
    }


    // Create a vector object given a direction as an angle.
    Vector.angle2vec = function(phi) {
	var res = new Vector([0.0,0.0,0.0]);
	phi = phi * Degree2Rad;
	res[0] = Math.cos(phi);
	res[1] = Math.sin(phi); 
	return res.normalize();
    }

    // This trick allows you to access a Vector object like an array
    // myVec[0] == x
    // myVec[1] == y
    // myVec[2] == z
    // we really only need the z for the convenience of rotating
    Vector.prototype.addItem = function(item){
	Array.prototype.push.call(this,item);
    }

    Vector.prototype.linear =  function(a, b, v) {
	var result = [ ];
	for (var c = 0; c <= 2; ++c) {
	    result[c] = a * this[c] + b * v[c];
	}
	return new Vector(result);
    }

    Vector.prototype.cross = function(v) {
	// Return cross product of this and v 
	var result = [ ];
	for (var c = 0; c <= 2; ++c) {
	    result[c] = this[(c+1)%3] * v[(c+2)%3] - this[(c+2)%3] * v[(c+1)%3];
	}
	return new Vector(result);
    }

    Vector.prototype.rotateNormal = function( v, w, alpha) {
	// Return rotation of u in direction of v about w over alpha
	// Requires: u, v, w are vectors; alpha is angle in radians
	//   u, v, w are orthonormal
	// Ensures: result = u rotated in direction of v about w over alpha
	return this.linear(Math.cos(alpha), Math.sin(alpha), v);
    }

    Vector.prototype.normalize = function() {
	var n = this.len();
	var res = this.div(n);
	return res;
    }

    Vector.prototype.toAngle = function() {
        // workaround for values getting set to +/i xxx e -16 fooling the +/- checks below
	if (Math.abs(this[1]) < 0.00001) this[1] = 0.0;
	if (Math.abs(this[0]) < 0.00001) this[0] = 0.0;
	var rads = Math.atan(Math.abs(this[1]) / Math.abs(this[0]));
	var deg = rads * Rad2Degree;
	if (this[0] < 0 && this[1] > 0) deg = 180 - deg;
	else if (this[0] < 0 && this[1] <= 0) deg = 180.0 + deg;
        else if (this[0] >= 0 && this[1] < 0) deg = 360 - deg;
	return deg;
    }

    // divide all vector components by the same value
    Vector.prototype.div = function(n) {
	res = []
	res[0] = this[0]/n;
	res[1] = this[1]/n;
	res[2] = this[2]/n;
	return new Vector(res);
    }

    // subtract one vector from another
    Vector.prototype.sub = function(v) {
	res = new Vector(0,0,0);
	res[0] = this[0] - v[0];
	res[1] = this[1] - v[1];
	res[2] = this[2] - v[2];
	return res;
    }

    Vector.prototype.len = function() {
	return Math.sqrt(this[0]*this[0] + this[1]*this[1] + this[2]*this[2]);
    }


    TurtleGraphics.defaults = { canvasID: 'mycanvas', unit: 1, degrees: true, animate: false }
    TurtleGraphics.turtleList = [];
    TurtleGraphics.Turtle = Turtle;
    TurtleGraphics.clear_canvas = clear_canvas;
    TurtleGraphics.Vector = Vector;

})();


//
// Wrapper around the Turtle Module starts here.
//
//
var $builtinmodule = function(name)
{
    var mod = {};
    // First we create an object, this will end up being the class
    // class
    var turtle = function($gbl, $loc) {
	$loc.__init__ = new Sk.builtin.func(function(self) {
	    TurtleGraphics.defaults = {canvasID: Sk.canvas, unit:1, animation: false, degrees: true};
	    self.theTurtle = new TurtleGraphics.Turtle();
	});

//
// Turtle Motion
//
	//
	// Move and Draw
	//
	$loc.forward = new Sk.builtin.func(function(self, dist) {
	    self.theTurtle.forward(dist);
	});

	$loc.fd = $loc.forward;

	$loc.backward = new Sk.builtin.func(function(self, dist) {
	    self.theTurtle.forward(-dist);
	});

	$loc.back = $loc.backward;
	$loc.bk = $loc.backward;

	$loc.right = new Sk.builtin.func(function(self, angle) {
	    self.theTurtle.turn(angle);
	});

	$loc.rt = $loc.right;

	$loc.left = new Sk.builtin.func(function(self, angle) {
	    self.theTurtle.turn(-angle);
	});
	
	$loc.lt = $loc.left;

	$loc.goto = new Sk.builtin.func(function(self,nx,ny) {
	    self.theTurtle.goto(nx,ny);
	});

	$loc.setpos = $loc.goto;
	$loc.setposition = $loc.goto;

	$loc.setx = new Sk.builtin.func(function(self,nx) {
	    self.theTurtle.goto(nx,self.theTurtle.GetY());
	});

	$loc.sety = new Sk.builtin.func(function(self,ny) {
	    self.theTurtle.goto(self.theTurtle.GetX(),ny);
	});

	$loc.setheading = new Sk.builtin.func(function(self,newhead) {
	    return self.theTurtle.set_heading(newhead);
	});

	$loc.seth = $loc.setheading;

	$loc.home = new Sk.builtin.func(function(self) {
	    self.theTurtle.go_home();
	});

	$loc.dot = new Sk.builtin.func(function(self, /*opt*/ size, color) {
	    size = size || 1;
	    if (color)
		color = color.v || self.theTurtle.context.fillStyle;
	    self.theTurtle.dot(size,color);
	});

	$loc.circle = new Sk.builtin.func(function(self, radius, extent) {
	    self.theTurtle.circle(radius, extent);
	});

	// todo:  stamp, clearstamp, clearstamps, undo, speed

	//
	// Tell Turtle's state
	//
	$loc.heading = new Sk.builtin.func(function(self) {
	    return self.theTurtle.get_heading();
	});

	$loc.position = new Sk.builtin.func(function(self) {
	    var res = self.theTurtle.get_position();
	    var x = new Sk.builtin.tuple([res[0],res[1]]);
	    console.log("after to tuple: " + x);
	    return x;
	});

	$loc.pos = $loc.position;

	$loc.xcor = new Sk.builtin.func(function(self) {
	    var res = self.theTurtle.getx();
	    return res;
	});

	$loc.ycor = new Sk.builtin.func(function(self) {
	    var res = self.theTurtle.gety();
	    return res;
	});

	$loc.towards = new Sk.builtin.func(function(self,tx,ty) {
	    if ((typeof(tx)).toLowerCase() === 'number')
		tx = [tx, ty, 0];
	    return self.theTurtle.towards(tx);
	});

	// tx can be either a number or a vector position.
	// tx can not be a turtle at this time as multiple turtles have not been implemented yet.
	$loc.distance = new Sk.builtin.func(function(self,tx,ty) {
	    if ((typeof(tx)).toLowerCase() === 'number')
		tx = [tx, ty, 0];
	    return self.theTurtle.distance(tx);
	});

	//
	// Setting and Measurement
	//

	// todo:  degrees and radians...

//
// Pen Control
//

	//
	// Drawing State
	//

	$loc.up = new Sk.builtin.func(function(self) {
	    self.theTurtle.pen_up();
	});
	
	$loc.penup = $loc.up;
	$loc.pu = $loc.up;

	$loc.down = new Sk.builtin.func(function(self) {
	    self.theTurtle.pen_down();
	});

	$loc.pendown = $loc.down;
	$loc.pd = $loc.down;

	$loc.width = new Sk.builtin.func(function(self,w) {
	    self.theTurtle.set_pen_width(w);
	});
	
	$loc.pensize = $loc.width;

	$loc.isdown = new Sk.builtin.func(function(self) {
	    return self.theTurtle.get_pen();
	});

	// todo:  pen  -- return a dictionary full of pen stuff

	//
	// Color Control
	//

	$loc.fillcolor = new Sk.builtin.func(function(self, color) {
	    if (color) {
		color = color.v || self.theTurtle.context.fillStyle;
		self.theTurtle.set_fill_style(color);
	    } else
		return self.theTurtle.fillStyle;
	});

	$loc.color = new Sk.builtin.func(function(self, color) {
	    if (color) {
		color = color.v || self.theTurtle.context.fillStyle;
		self.theTurtle.set_pen_style(color);
	    } else
		return self.theTurtle.penStyle;
	});

	$loc.pencolor = $loc.color;

	//
	//  Filling
	//

	$loc.begin_fill = new Sk.builtin.func(function(self) {
	    self.theTurtle.begin_fill();
	});

	$loc.end_fill = new Sk.builtin.func(function(self) {
	    self.theTurtle.end_fill();
	});

	$loc.fill = new Sk.builtin.func(function(self,fillt) {
	    if (fillt)
		self.theTurtle.begin_fill();
	    else
		self.theTurtle.end_fill();
	});

	//
	// More drawing control
	//

	$loc.reset = new Sk.builtin.func(function(self) {
	    self.theTurtle.clean();
	});

	// todo the move, align, and font parameters should be kwargs...
	$loc.write = new Sk.builtin.func(function(self,mystr,move,align,font) {
	    self.theTurtle.write(mystr.v,move,align,font);
	});

	// todo clean  -- again multiple turtles
	
    }
    
    mod.Turtle = Sk.misceval.buildClass(mod, turtle, 'Turtle', []);

    return mod
}