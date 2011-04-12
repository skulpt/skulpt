//
//
// Turtle Graphics Module for Skulpt
//
// Brad Miller
//
//
//


var TurtleGraphics; // the single identifier needed in the global scope

if ( ! TurtleGraphics ) {
  TurtleGraphics = { };
}

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

	this.canvasID = TurtleGraphics.defaults.canvasID;
	if ( options.canvasID ) {
	    this.canvasID = options.canvasID;
	}
	this.context = document.getElementById(this.canvasID).getContext('2d');

	this.animate = TurtleGraphics.defaults.animate;

	with ( this.context ) {
	    if (TurtleGraphics.canvasInit == false) {   // This is a workaround until I understand skulpt re-running better
		                                        // the downside is that this limits us to a single turtle...
		save();
		translate(canvas.width/2, canvas.height/2); // move 0,0 to center.
		scale(1,-1); // scaling like this flips the y axis the right way.
//		save();
		TurtleGraphics.canvasInit = true;
	    } else {
		clear_canvas(this.canvasID);
		TurtleGraphics.turtleList = [];
	    }

	    this.home = new Vector([0.0, 0.0, 0.0]);
	    this.visible = true;
	    this.lineScale = 1.0;
	    this.drawingEvents = [];
	    this.eventLoop = false;
	    this.filling = false;
	    this.pen = true; 
	    this.penStyle = 'black';
	    this.penWidth = 2;
	    this.fillStyle = 'white';
	    this.position = [ ]; 
	    this.heading = [ ]; 
	    this.normal = [ ]; 
	    this.go_home();
	    this.delay = 60;
	    this.intervalId = 0;
	    this.aCount = 0;
	}
    }

    Turtle.prototype.clean = function () {
	// Clean the canvas
	// Optional second argument is color
	with ( this ) {
	    if ( arguments.length >= 1 ) {
		clear_canvas(canvasID, arguments[0]);
	    }
	    else {
		clear_canvas(canvasID);
	    }
	    initialize();
	}
    }

//  
//  Drawing Functions
//

    // break a line into segments
    // sp:  Vector of starting position
    // ep:  Vector of ending position
    // sl:  int length of segments
    segmentLine = function(sp, ep, sL,pen) {
	var head = ep.sub(sp).normalize();
	var numSegs = Math.floor(ep.sub(sp).len()/sL);
	var res = [];
	var oldp = sp;
	var newp;
	var op = ""
	if (pen)
	    op = "LT"
	else
	    op = "MT"
	for(var i=0; i < numSegs; i++) {
	    newp = oldp.linear(1,sL,head);
	    res.push([op,oldp[0],oldp[1],newp[0],newp[1]]);
	    oldp = newp;
	}
	if (! ((oldp[0] == ep[0]) && (oldp[1] == ep[1])))
	    res.push([op, oldp[0], oldp[1], ep[0], ep[1]]);
	return res;
    }

    Turtle.prototype.draw_line = function(newposition) {
	with (this ) {
	    with ( context ) {
		if (! animate ) {
		    if (! filling) {
			beginPath();
			moveTo(position[0],position[1]);
		    }
		    lineCap = 'round';
		    lineJoin = 'round';
		    lineWidth = penWidth;
		    strokeStyle = penStyle;
		    lineTo(newposition[0], newposition[1]);
		    stroke();
		    if (! filling)
			closePath();
		} else {
		    var r = segmentLine(position,newposition,10,pen);
		    for(s in r)
			drawingEvents.push(r[s]);
		    if (! eventLoop) {
			this.intervalId = setInterval(render,this.delay);
			eventLoop = true;
		    }
		}
	    }
	}

    }


    Turtle.prototype.forward = function (d) {
	with ( this ) {
	    var newposition = position.linear(1, d, heading);
	    goto(newposition);
	}
    }

    Turtle.prototype.goto = function(nx,ny) {
	if (nx instanceof Vector)
	    var newposition = nx;
	else
	    var newposition = new Vector([nx,ny,0]);
	with (this) {
	    if (pen) {
		draw_line(newposition);
	    } else {
		if (! animate) {
		    context.moveTo(newposition[0], newposition[1]);
		} else {
		    //drawingEvents.push("moveTo("+newposition[0]+","+newposition[1]+")");
		    var r = segmentLine(position,newposition,10,pen);
		    for(s in r)
			drawingEvents.push(r[s]);
		    //drawingEvents.push(["MT",position[0], position[1],newposition[0],newposition[1]]);
		    if (! eventLoop) {
			this.intervalId = setInterval(render,this.delay);
			eventLoop = true;
		    }
		}
	    }
	    position = newposition;
	    
	}
    }

    Turtle.prototype.speed = function(s) {
	if (s > 0) {
	    this.animate = true;
	    var df = 10 - s + 1;
	    this.delay = df * 10;
	}
	else
	    this.animate = false;
    }


    //
    //  This is the function that provides the animation
    //
    render = function () {
	var context = document.getElementById(TurtleGraphics.defaults.canvasID).getContext('2d');
	var currentHeadInfo;
	with ( context ) {
	    for (var i in TurtleGraphics.turtleList) {
		var t = TurtleGraphics.turtleList[i]
		clearRect(-canvas.width/2,-canvas.height/2,canvas.width,canvas.height);
		moveTo(0,0);
		lineWidth = 5 * t.lineScale;
		lineCap = 'round';
		lineJoin = 'round';
		var filling = false;
		for (var i = 0; i < t.aCount; i++ ) {
		    var oper = t.drawingEvents[i];
		    if (oper[0] == "LT") {
			if (! filling ) {
			    beginPath();
			    moveTo(oper[1],oper[2]);
			}
			lineTo(oper[3],oper[4]);
			stroke();
			currentHeadInfo = oper;
			if (! filling )
			    closePath();
		    }
		    if (oper[0] == "MT") {
			moveTo(oper[3],oper[4]);
			currentHeadInfo = oper;
		    }
		    if (oper[0] == "BF") {
			beginPath();
			moveTo(oper[1], oper[2]);
			filling = true;
		    }
		    if (oper[0] == "EF") {
			stroke();
			fill();
			closePath();
			filling = false;
		    }
		    if (oper[0] == "FC") {
			fillStyle = oper[1];
		    }
		    if (oper[0] == "TC") {
			strokeStyle = oper[1]
		    }
		    if (oper[0] == "PW") {
			lineWidth = oper[1]
		    }
		    if (oper[0] == "DT") {
			var col = fillStyle;
			fillStyle = oper[2];
			var size = oper[1];
			fillRect(oper[3]-size/2, oper[4]-size/2, size, size);
			fillStyle = col;
		    }
		    if (oper[0] == "CI") {
			arc(oper[1], oper[2], Math.abs(oper[3]), 0, oper[4], (oper[3] > 0));
			stroke();
		    }
		    if (oper[0] == "WT") {
			if (font)
			    font = oper[2];
			scale(1,-1);
			fillText(oper[1],oper[3], -oper[4]);
			scale(1,-1);
		    }
		}
		t.aCount++;
		if (t.visible && currentHeadInfo) {
		    // draw the turtle
		    var oldp = new Vector(currentHeadInfo[1], currentHeadInfo[2], 0);
		    var newp = new Vector(currentHeadInfo[3], currentHeadInfo[4], 0);
		    var head = oldp.sub(newp).normalize();
		    // draw line to 30 degrees left and 5 units long
		    // draw line to 30 degrees right and 5 units long
		    var portWing = head.rotateNormal(t.normal.cross(head),t.normal,-30*Degree2Rad);
		    var endPt = newp.linear(1,5,portWing);
		    moveTo(newp[0],newp[1]);
		    lineTo(endPt[0],endPt[1]);
		    var starWing = head.rotateNormal(t.normal.cross(head),t.normal,30*Degree2Rad);		    
		    endPt = newp.linear(1,5,starWing);
		    moveTo(newp[0],newp[1]);
		    lineTo(endPt[0],endPt[1]);
		    stroke();
		}
		if (t.aCount >= t.drawingEvents.length) {
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
	size = size * this.lineScale;
	with (this) {
	    with ( context ) {
		var color = fillStyle;
		var nc =  arguments[1] || color;
		if (! animate) {
		    fillStyle = nc;
		    fillRect(position[0]-size/2, position[1]-size/2, size, size);
		    fillStyle = color;
		} else {
		    drawingEvents.push(["DT", size, nc, position[0], position[1]]);
		}
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
	if (! this.animate) {
	    this.context.arc(cx, cy, Math.abs(radius), 0, endAngle, (radius > 0));
	    this.context.stroke();
	} else {
	    this.drawingEvents.push(["CI", cx, cy, radius, endAngle]);
	}
    }

    Turtle.prototype.write = function(theText, move, align, font) {
	if (! this.animate) {
	    if (font)
		this.context.font = font.v;
            this.context.scale(1,-1);
	    this.context.fillText(theText,this.position[0], -this.position[1]);
            this.context.scale(1,-1);
	} else {
	    var fontspec;
	    if (font)
		fontspec = font.v
	    this.drawingEvents.push(["WT", theText, fontspec, this.position[0], this.position[1]]);
	}
    }

    Turtle.prototype.setworldcoordinates = function(llx,lly,urx,ury) {
	this.context.restore();
	this.context.scale(this.context.canvas.width/(urx-llx),-this.context.canvas.height/(ury-lly));
	if (lly == 0)
	    this.context.translate(-llx,lly-(ury-lly));
	else if (lly > 0)
	    this.context.translate(-llx,(ury-lly)-lly);
	else
	    this.context.translate(-llx,lly);
	this.lineScale = (urx-llx)/this.context.canvas.width;
	console.log(this.lineScale);
	this.penWidth = this.penWidth * this.lineScale;
	this.context.save();
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
	w = w * this.lineScale;
	if (this.animate)
	    this.drawingEvents.push(["PW", w]);
	else
	    this.penWidth = w;
    }

    Turtle.prototype.set_pen_color = function (c) {
	if (! this.animate ) {
	    this.penStyle = c;
	    this.context.strokeStyle = c;
	} else
	    this.drawingEvents.push(["TC", c]);
    }

    Turtle.prototype.set_fill_color = function (c) {
	if (! this.animate ) {
	    this.fillStyle = c;
	    this.context.fillStyle = c;
	} else
	    this.drawingEvents.push(["FC", c]);
    }

    Turtle.prototype.begin_fill = function () {
	if (! this.animate) {
	    this.filling = true;
	    this.context.beginPath();
	    this.context.moveTo(this.position[0],this.position[1]);
	} else
	    this.drawingEvents.push(["BF", this.position[0], this.position[1]]);
	    
    }

    Turtle.prototype.end_fill = function () {
	if (! this.animate) {
	    this.context.stroke();
	    this.context.fill();
	    this.context.closePath();
	    this.filling = false;
	} else
	    this.drawingEvents.push(["EF", this.position[0], this.position[1]]);
    }


    Turtle.prototype.showturtle = function() {
	this.visible = true;
    }

    Turtle.prototype.hideturtle = function() {
	this.visible = false;
    }

    Turtle.prototype.isvisible = function() {
	return this.visible;
    }

    function clear_canvas(canId) {
	with ( document.getElementById(canId).getContext('2d') ) {
	    if ( arguments.length >= 2 ) {
//		fillStyle = arguments[1];
//		fillRect(0, 0, canvas.width, canvas.height);
	    }
	    clearRect(-canvas.width/2,-canvas.height/2,canvas.width,canvas.height);
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


    TurtleGraphics.defaults = { canvasID: 'mycanvas', degrees: true, animate: false }
    TurtleGraphics.turtleList = [];
    TurtleGraphics.Turtle = Turtle;
    TurtleGraphics.clear_canvas = clear_canvas;
    TurtleGraphics.Vector = Vector;
    TurtleGraphics.canvasInit = false;

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
	    TurtleGraphics.defaults = {canvasID: Sk.canvas, animation: false, degrees: true};
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

	$loc.speed = new Sk.builtin.func(function(self, s) {
	    self.theTurtle.speed(s);
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
		self.theTurtle.set_fill_color(color);
	    } else
		return self.theTurtle.fillStyle;
	});

	$loc.color = new Sk.builtin.func(function(self, color) {
	    if (color) {
		color = color.v || self.theTurtle.context.fillStyle;
		self.theTurtle.set_pen_color(color);
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

	$loc.showturtle = new Sk.builtin.func(function(self) {
	    self.theTurtle.showturtle();
	});
	$loc.st = $loc.showturtle;

	$loc.hideturtle = new Sk.builtin.func(function(self) {
	    self.theTurtle.hideturtle();
	});
	$loc.ht = $loc.hideturtle;

	$loc.isvisible = new Sk.builtin.func(function(self) {
	    self.theTurtle.isvisible()
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