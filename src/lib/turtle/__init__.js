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

    //
    // Define TurtleCanvas
    // 

    function TurtleCanvas(options) {
	this.canvasID = TurtleGraphics.defaults.canvasID;
	if ( options.canvasID ) {
	    this.canvasID = options.canvasID;
	}
	this.canvas = document.getElementById(this.canvasID);
	this.context = this.canvas.getContext('2d');

	this.lineScale = 1.0;

	this.llx = -this.canvas.width/2;  
	this.lly = -this.canvas.height/2;
        this.urx = this.canvas.width/2;
        this.ury = this.canvas.height/2;

	this.tlist = []
	
	this.delay = 50;
    }

    TurtleCanvas.prototype.addToCanvas = function(t) {
	this.tlist.push(t);
    }

    TurtleCanvas.prototype.onCanvas = function(t) {
	return (this.tlist.indexOf(t) >= 0);
    }

    TurtleCanvas.prototype.isAnimating = function() {
	return (this.tlist.length > 0)
    }

    TurtleCanvas.prototype.startAnimating = function(t) {
	this.intervalId = setInterval(render,this.delay);
	this.addToCanvas(t);
    }

    TurtleCanvas.prototype.doneAnimating = function(t) {
	var idx = this.tlist.indexOf(t);
	if(idx > -1)
	    this.tlist.splice(idx,1);
	if (this.tlist.length == 0) {
	    clearInterval(this.intervalId);
	}

    }

    TurtleCanvas.prototype.cancelAnimation = function() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        for (var t in this.tlist) {
            this.tlist[t].aCount = this.tlist[t].drawingEvents.length -1;
        }
        render();
    }

    TurtleCanvas.prototype.setDelay = function(s) {
	    var df = 10 - (s % 11) + 1;
	    this.delay = df * 10;
    }

    TurtleCanvas.prototype.setworldcoordinates = function(llx,lly,urx,ury) {
	this.context.restore();
	this.context.scale(this.canvas.width/(urx-llx),-this.canvas.height/(ury-lly));
	if (lly == 0)
	    this.context.translate(-llx,lly-(ury-lly));
	else if (lly > 0)
	    this.context.translate(-llx,-lly*2);
	else
	    this.context.translate(-llx,lly);

	this.lineScale = (urx-llx)/this.canvas.width;
	this.context.save();

	this.llx = llx;
	this.lly = lly;
	this.urx = urx;
	this.ury = ury;

    }

    TurtleCanvas.prototype.bgcolor = function(c) {
	this.background_color = c;
	this.canvas.style.setProperty("background-color",c.v);
    }

    //
    //  This is the function that provides the animation
    //
    render = function () {
	var context = document.getElementById(TurtleGraphics.defaults.canvasID).getContext('2d');
	var currentHeadInfo;
	with ( context ) {
	    with (TurtleGraphics.turtleCanvas) {
   		clearRect(llx,lly,(urx-llx),(ury-lly));
		//canvas.style.setProperty("background-color",TurtleGraphics.turtleCanvas.bgcolor.v);
	    }
	    for (var tix in TurtleGraphics.turtleList) {
		var t = TurtleGraphics.turtleList[tix]
		if (t.aCount >= t.drawingEvents.length)
		    t.aCount = t.drawingEvents.length-1;
		moveTo(0,0);
		lineWidth = t.get_pen_width();
		lineCap = 'round';
		lineJoin = 'round';
        strokeStyle = 'black';
		var filling = false;
		for (var i = 0; i <= t.aCount; i++ ) {
		    var oper = t.drawingEvents[i];
		    if (oper[0] == "LT") {
			if (! filling ) {
			    beginPath();
			    moveTo(oper[1],oper[2]);
			}
			lineTo(oper[3],oper[4]);
			strokeStyle = oper[5];
			stroke();
			currentHeadInfo = oper;
			if (! filling )
			    closePath();
		    }
		    else if (oper[0] == "MT") {
			moveTo(oper[3],oper[4]);
			currentHeadInfo = oper;
		    }
		    else if (oper[0] == "BF") {
			beginPath();
			moveTo(oper[1], oper[2]);
			filling = true;
		    }
		    else if (oper[0] == "EF") {
			fillStyle = oper[3];
			stroke();
			fill();
			closePath();
			filling = false;
		    }
		    else if (oper[0] == "FC") {
			fillStyle = oper[1];
		    }
		    else if (oper[0] == "TC") {
			strokeStyle = oper[1];
		    }
		    else if (oper[0] == "PW") {
			lineWidth = oper[1];
		    }
		    else if (oper[0] == "DT") {
			var col = fillStyle;
			fillStyle = oper[2];
			var size = oper[1];
			fillRect(oper[3]-size/2, oper[4]-size/2, size, size);
			fillStyle = col;
		    }
		    else if (oper[0] == "CI") {
			arc(oper[1], oper[2], Math.abs(oper[3]), 0, oper[4], (oper[3] > 0));
			stroke();
		    }
		    else if (oper[0] == "WT") {
			if (font)
			    font = oper[2];
			scale(1,-1);
			fillText(oper[1],oper[3], -oper[4]);
			scale(1,-1);
		    } else if (oper[0] == "ST") {  // stamp
                t.drawturtle(oper[3],new Vector(oper[1],oper[2],0));
		    }
		    else {
			console.log("unknown op");
		    }
		}
		t.aCount++;
		if (t.visible && currentHeadInfo) {
		    // draw the turtle
		    var tsize = 5 * t.turtleCanvas.lineScale;
		    var oldp = new Vector(currentHeadInfo[1], currentHeadInfo[2], 0);
		    var newp = new Vector(currentHeadInfo[3], currentHeadInfo[4], 0);
		    var head = newp.sub(oldp).normalize();
		    t.drawturtle(head.toAngle(),newp);
		}
		if (t.aCount >= t.drawingEvents.length) {
		    t.turtleCanvas.doneAnimating(t);
		}
	    }
	}
    }


    function drawSimpleTurtle(newp, endPt,head) {
		    // draw line to 30 degrees left and 5 units long
		    // draw line to 30 degrees right and 5 units long
		    var portWing = head.rotateNormal(t.normal.cross(head),t.normal,-30*Degree2Rad);
		    var endPt = newp.linear(1,tsize,portWing);
		    beginPath();
		    moveTo(newp[0],newp[1]);
		    lineTo(endPt[0],endPt[1]);
		    var starWing = head.rotateNormal(t.normal.cross(head),t.normal,30*Degree2Rad);		    
		    endPt = newp.linear(1,tsize,starWing);
		    moveTo(newp[0],newp[1]);
		    lineTo(endPt[0],endPt[1]);
		    closePath();
		    stroke();
    }

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
		if (! TurtleGraphics.turtleCanvas )
		    TurtleGraphics.turtleCanvas = new TurtleCanvas(options);
		TurtleGraphics.canvasInit = true;
	    } else {
		clear_canvas(this.canvasID);
	    }

	    this.turtleCanvas = TurtleGraphics.turtleCanvas;
	    this.home = new Vector([0.0, 0.0, 0.0]);
	    this.visible = true;
	    this.shapeStore = {};
	    this.shapeStore['turtle'] = turtleShapePoints();
        this.shapeStore['arrow'] = defaultShapePoints();
        this.shapeStore['circle'] = circleShapePoints();
        this.shapeStore['classic'] = classicShapePoints();
        this.currentShape = 'classic';
	    this.drawingEvents = [];

	    this.filling = false;
	    this.pen = true; 
	    this.penStyle = 'black';
	    this.penWidth = 2;
	    this.fillStyle = 'black';
	    this.position = [ ]; 
	    this.heading = [ ]; 
	    this.normal = [ ]; 
	    this.go_home();
	    this.aCount = 0;
	}
    }
    function turtleShapePoints() {
	var pl = [[0,16], [-2,14], [-1,10], [-4,7],
                  [-7,9], [-9,8], [-6,5], [-7,1], [-5,-3], [-8,-6],
                  [-6,-8], [-4,-5], [0,-7], [4,-5], [6,-8], [8,-6],
                  [5,-3], [7,1], [6,5], [9,8], [7,9], [4,7], [1,10],
	          [2,14]];
	res = [];
	for (p in pl) {
	    res.push(new Vector(pl[p]));
	}
	return res;
    }

    function defaultShapePoints() {
        var pl = [[-10,0], [10,0], [0,10]];
        res = [];
        for (p in pl) {
            res.push(new Vector(pl[p]));
        }
        return res;
    }

    function circleShapePoints() {
        var pl = [[10,0], [9.51,3.09], [8.09,5.88],
                              [5.88,8.09], [3.09,9.51], [0,10], [-3.09,9.51],
                              [-5.88,8.09], [-8.09,5.88], [-9.51,3.09], [-10,0],
                              [-9.51,-3.09], [-8.09,-5.88], [-5.88,-8.09],
                              [-3.09,-9.51], [-0.00,-10.00], [3.09,-9.51],
                              [5.88,-8.09], [8.09,-5.88], [9.51,-3.09]];
        res = [];
        for (p in pl) {
            res.push(new Vector(pl[p]));
        }
        return res;
    }

    function classicShapePoints() {
        var pl = [[0,0],[-5,-9],[0,-7],[5,-9]];

        res = [];
        for (p in pl) {
            res.push(new Vector(pl[p]));
        }
        return res;

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
		    lineWidth = get_pen_width();
		    strokeStyle = penStyle;
		    lineTo(newposition[0], newposition[1]);
		    stroke();
		    if (! filling)
			closePath();
		} else {
		    var r = segmentLine(position,newposition,10,pen);
		    for(var s in r) {
			r[s].push(penStyle);
			drawingEvents.push(r[s]);
		    }
		    if (! turtleCanvas.isAnimating()) {
			turtleCanvas.startAnimating(this);
		    } else {
			if (! turtleCanvas.onCanvas(this))
			    turtleCanvas.addToCanvas(this);
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
    
    Turtle.prototype.backward = function(d) {
	this.forward(-d);
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
		    var r = segmentLine(position,newposition,10,pen);
		    for(var s in r)
			drawingEvents.push(r[s]);
		    if (! turtleCanvas.isAnimating()) {
			turtleCanvas.startAnimating(this);
		    } else {
			if (! turtleCanvas.onCanvas(this))
			    turtleCanvas.addToCanvas(this);
		    }
		}
	    }
	    position = newposition;
	    
	}
    }

    Turtle.prototype.speed = function(s) {
	if (s > 0) {
	    this.animate = true;
	    this.turtleCanvas.setDelay(s);
	}
	else
	    this.animate = false;
        this.turtleCanvas.cancelAnimation();
    }




    Turtle.prototype.turn = function (phi) {
	with ( this ) {
	    var alpha = phi * Degree2Rad;
	    var left = normal.cross(heading);
	    var newheading = heading.rotateNormal(left, normal, alpha);
	    heading = newheading;
	}
    }

    Turtle.prototype.right = Turtle.prototype.turn;

    Turtle.prototype.left = function(phi) {
	this.turn(-phi);
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
	size = size * this.turtleCanvas.lineScale;
	with (this) {
	    with ( context ) {
		var color = penStyle;
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
	this.turtleCanvas.setworldcoordinates(llx,lly,urx,ury);
    }

//
// Pen and Style functions
//
    Turtle.prototype.pen_down = function () {
	this.pen = true;
    }
    
    Turtle.prototype.down = Turtle.prototype.pen_down;

    Turtle.prototype.pen_up = function () {
	this.pen = false;
    }

    Turtle.prototype.up = Turtle.prototype.pen_up;

    Turtle.prototype.get_pen = function () {
	return this.pen;
    }

    Turtle.prototype.set_pen_width = function (w) {
	if (this.animate)
	    this.drawingEvents.push(["PW", w*this.turtleCanvas.lineScale]);
	else
	    this.penWidth = w;
    }

    Turtle.prototype.get_pen_width = function() {
	return this.penWidth * this.turtleCanvas.lineScale;
    }

    Turtle.prototype.set_pen_color = function (c,g,b) {
    if (typeof(c) == "string") {
        this.penStyle = c;
    } else {
        var rs = c.toString(16);
        var gs = g.toString(16);
        var bs = b.toString(16);
        while (rs.length < 2) rs = "0" + rs;
        while (gs.length < 2) gs = "0" + gs;
        while (bs.length < 2) bs = "0" + bs;

        this.penStyle = "#"+rs+gs+bs;
    }

	this.context.strokeStyle = c;
	if ( this.animate )
	    this.drawingEvents.push(["TC", c]);
    }

    Turtle.prototype.set_fill_color = function (c) {
	this.fillStyle = c;
	this.context.fillStyle = c;
	if ( this.animate )
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
	    this.drawingEvents.push(["EF", this.position[0], this.position[1], this.fillStyle]);
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

    // 
    // Appearance
    //

    Turtle.prototype.shape = function(s) {
        if (this.shapeStore[s])
            this.currentShape = s;
        else {
        }
    }

    Turtle.prototype.drawturtle = function(heading,position) {
        var rtPoints = [];
        var plist = this.shapeStore[this.currentShape];
        var head;
        if (! (heading === undefined))
            head = heading -90.0;
        else
            head = this.heading.toAngle() - 90.0;
        if (! position)
            position = this.position
        for (p in plist) {
            rtPoints.push(plist[p].rotate(head).add(position));
        }
        this.context.beginPath();
        this.context.moveTo(rtPoints[0][0],rtPoints[0][1]);
        for (var i = 1; i<rtPoints.length; i++) {
            this.context.lineTo(rtPoints[i][0],rtPoints[i][1]);
        }
        this.context.closePath();
        this.context.stroke();
        if (this.fillStyle) {
            this.context.fill();
        }
    }

    Turtle.prototype.stamp = function() {
	// either call drawTurtle or just add a DT with current position and heading to the drawingEvents list.
        if (this.animate) {
            this.drawingEvents.push(["ST",this.position[0],this.position[1],this.heading.toAngle()]);
        } else
            t.drawturtle();
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

    Vector.prototype.rotate = function(angle) {
	// Rotate this counter clockwise by angle.
	var perp = new Vector(-this[1], this[0], 0);
	angle = angle * Degree2Rad;
	var c = Math.cos(angle);
        var s = Math.sin(angle);
	return new Vector(this[0]*c+perp[0]*s, this[1]*c+perp[1]*s, 0);
    }

    Vector.prototype.rotateNormal = function( v, w, alpha) {
	// Return rotation of this in direction of v about w over alpha
	// Requires: v, w are vectors; alpha is angle in radians
	//   this, v, w are orthonormal
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

    Vector.prototype.add = function(v) {
	res = new Vector(0,0,0);
	res[0] = this[0] + v[0];
	res[1] = this[1] + v[1];
	res[2] = this[2] + v[2];
	return res;
    }

    Vector.prototype.len = function() {
	return Math.sqrt(this[0]*this[0] + this[1]*this[1] + this[2]*this[2]);
    }


    TurtleGraphics.defaults = { canvasID: 'mycanvas', degrees: true, animate: true }
    TurtleGraphics.turtleList = [];
    TurtleGraphics.Turtle = Turtle;
    TurtleGraphics.TurtleCanvas = TurtleCanvas;
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
    Sk.tg = TurtleGraphics;
    
    var turtle = function($gbl, $loc) {
	$loc.__init__ = new Sk.builtin.func(function(self) {
	    TurtleGraphics.defaults = {canvasID: Sk.canvas, animate: true, degrees: true};
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
        if (color) {
            color = color.v || self.theTurtle.penStyle;
        }
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

	$loc.color = new Sk.builtin.func(function(self, color, green, blue) {
	    if (color) {
            if (blue) {
                self.theTurtle.set_pen_color(color,green,blue);
            } else {
                color = color.v || self.theTurtle.context.fillStyle;
                self.theTurtle.set_pen_color(color);
            }
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

    $loc.stamp = new Sk.builtin.func(function(self) {
            self.theTurtle.stamp();
        });

    $loc.shape = new Sk.builtin.func(function(self,s) {
        self.theTurtle.shape(s.v);
    });


	// todo the move, align, and font parameters should be kwargs...
	$loc.write = new Sk.builtin.func(function(self,mystr,move,align,font) {
	    self.theTurtle.write(mystr.v,move,align,font);
	});

	// todo clean  -- again multiple turtles

	$loc.setworldcoordinates = new Sk.builtin.func(function(self,llx,lly,urx,ury) {
	    self.theTurtle.setworldcoordinates(llx,lly,urx,ury);
	});
	
    }
    
    mod.Turtle = Sk.misceval.buildClass(mod, turtle, 'Turtle', []);

    var screen = function($gbl, $loc) {
	$loc.__init__ = new Sk.builtin.func(function(self) {
	    TurtleGraphics.defaults = {canvasID: Sk.canvas, animate: true, degrees: true};
	    if (! TurtleGraphics.turtleCanvas) {
		self.theScreen = new TurtleGraphics.TurtleCanvas(TurtleGraphics.defaults);
	    } else {
		self.theScreen = TurtleGraphics.turtleCanvas;
	    }
	    TurtleGraphics.turtleCanvas = self.theScreen;
	});

	$loc.bgcolor = new Sk.builtin.func(function(self,c) {
	    self.theScreen.bgcolor(c);
	});
    }

    mod.Screen = Sk.misceval.buildClass(mod, screen, 'Screen', []);

    

    return mod
}