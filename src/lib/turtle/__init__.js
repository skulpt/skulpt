//
//
// Turtle Graphics Module for Skulpt
//
// Brad Miller
//
//
//


var TurtleGraphics; // the single identifier needed in the global scope

if (! TurtleGraphics) {
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
        if (options.canvasID) {
            this.canvasID = options.canvasID;
        }

        this.canvas = document.getElementById(this.canvasID);
        this.context = this.canvas.getContext('2d');
        //this.canvas.style.display = 'block';
        $(this.canvas).fadeIn();

        this.lineScale = 1.0;
        this.xptscale = 1.0;
        this.yptscale = 1.0

        this.llx = -this.canvas.width / 2;
        this.lly = -this.canvas.height / 2;
        this.urx = this.canvas.width / 2;
        this.ury = this.canvas.height / 2;
        this.setup(this.canvas.width,this.canvas.height);
        TurtleGraphics.canvasInit = true;
        this.tlist = []

		this.timeFactor = 5;
        if (TurtleGraphics.defaults.animate) {
            this.delay = 5 * this.timeFactor;
        } else {
            this.delay = 0;
        }
        this.segmentLength = 10;
        this.renderCounter = 1;
        this.clearPoint = 0;
        TurtleGraphics.canvasLib[this.canvasID] = this;
		Sk.tg.fadeOnExit = true;	//	This can be set to false AFTER the program completes to turn off the fade out on the canvas as a result of exitonclick
    }

    TurtleCanvas.prototype.setup = function(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.lineScale = 1.0;
        this.xptscale = 1.0;
        this.yptscale = 1.0;

        this.llx = -this.canvas.width / 2;
        this.lly = -this.canvas.height / 2;
        this.urx = this.canvas.width / 2;
        this.ury = this.canvas.height / 2;
        this.renderCounter = 1;
        this.clearPoint = 0;
		this.timeFactor = 5;
        if (TurtleGraphics.defaults.animate ) {
            this.delay = 5 * this.timeFactor;
        } else {
            this.delay = 0;
        }

        if (TurtleGraphics.canvasInit == false) {
            this.context.save();
            this.context.translate(this.canvas.width / 2, this.canvas.height / 2); // move 0,0 to center.
            this.context.scale(1, -1); // scaling like this flips the y axis the right way.
            TurtleGraphics.canvasInit = true;
            TurtleGraphics.eventCount = 0;
            TurtleGraphics.renderClock = 0;
            TurtleGraphics.renderTime = 0;	// RNL
        } else {
            this.context.restore();
            this.context.translate(this.canvas.width / 2, this.canvas.height / 2); // move 0,0 to center.
            this.context.scale(1, -1); // scaling like this flips the y axis the right way.
            this.context.clearRect(-this.canvas.width / 2, -this.canvas.height / 2,
                                    this.canvas.width, this.canvas.height);
        }
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
		if (! this.isAnimating()) {
        	this.intervalId = setTimeout(render, this.delay);	//	setInterval(render, this.delay);
		}
    	if (!this.onCanvas(t))	//	Added by RNL in case startAnimating is called after it's already been added
       		this.addToCanvas(t);
        Sk.isTurtleProgram = true;
    }

    TurtleCanvas.prototype.doneAnimating = function(t) {
        this.tlist.splice(0,this.tlist.length)
        clearTimeout(this.intervalId)   
        $(Sk.runButton).removeAttr('disabled');
    }

    TurtleCanvas.prototype.cancelAnimation = function() {
        if (this.intervalId) {
            clearTimeout(this.intervalId)	//	clearInterval(this.intervalId);
        }

        for (var t in this.tlist) {
            this.tlist[t].aCount = this.tlist[t].drawingEvents.length - 1;
        }
        render();
    }

    TurtleCanvas.prototype.setSpeedDelay = function(s) {	// RNL
        var df = 10 - (s % 11) + 1;
        this.delay = df * this.timeFactor;	//	RNL was 10;
    }

    TurtleCanvas.prototype.setDelay = function(d) {
        this.delay = d;
    }

    TurtleCanvas.prototype.getDelay = function(s) { // RNL
        return this.delay;
    }

    TurtleCanvas.prototype.setCounter = function(s) {
		if (!s || s <= 0)	//	Don't let this be less than 1
			s = 1;
        this.renderCounter = s;
    }

    TurtleCanvas.prototype.getCounter = function() {
        return this.renderCounter;
    }

    TurtleCanvas.prototype.setworldcoordinates = function(llx, lly, urx, ury) {
        this.context.restore();
        this.context.scale(this.canvas.width / (urx - llx), -this.canvas.height / (ury - lly));
        if (lly == 0)
            this.context.translate(-llx, lly - (ury - lly));
        else if (lly > 0)
            this.context.translate(-llx, -lly * 2);
        else
            this.context.translate(-llx, -ury);

        var xlinescale = (urx - llx) / this.canvas.width;
        var ylinescale = (ury - lly) / this.canvas.height;
        this.xptscale = xlinescale;
        this.yptscale = ylinescale;
        this.lineScale = Math.min(xlinescale,ylinescale)
        this.context.save();

        this.llx = llx;
        this.lly = lly;
        this.urx = urx;
        this.ury = ury;

    }

    TurtleCanvas.prototype.window_width = function() {
        return this.canvas.width;
    }

    TurtleCanvas.prototype.window_height = function() {
        return this.canvas.height;
    }

    TurtleCanvas.prototype.bgcolor = function(c) {
        this.background_color = c;
        //this.canvas.style.setProperty("background-color", c.v);
        $(this.canvas).css("background-color",c.v);
    }

    TurtleCanvas.prototype.setSegmentLength = function(s) {
        this.segmentLength = s;
    }

    TurtleCanvas.prototype.getSegmentLength = function() {
        return this.segmentLength;
    }
    
    // todo: if animating, this should be deferred until the proper time
    TurtleCanvas.prototype.exitonclick = function () {
        var canvas_id = this.canvasID;
        var theCanvas = this;
        $(this.canvas).click(function() {
            if (! theCanvas.isAnimating()) {
				if (Sk.tg.fadeOnExit)	//	Let's this be configurable
                	$("#"+canvas_id).hide();
                $("#"+canvas_id).unbind('click');
                Sk.tg.canvasInit = false;
                delete Sk.tg.canvasLib[canvas_id];
            }
        });
    }

    TurtleCanvas.prototype.turtles = function() {
        return TurtleGraphics.turtleList;
    }

	TurtleCanvas.prototype.tracer = function(t, d) {	//	New version NOT attached to a turtle (as per real turtle)
        this.setCounter(t);
		if (t == 0) {
			for (var i in this.turtleList)
				this.turtleList[i].animate = false;
			this.cancelAnimation();
		}
		if (d !== undefined)
			this.setDelay(d);
	}

    // check if all turtles are done
    allDone = function() {
        var allDone = true;
        for (var tix in TurtleGraphics.turtleList) {
            var theT = TurtleGraphics.turtleList[tix];
            allDone = allDone && (theT.aCount >= theT.drawingEvents.length);
        }
        return allDone;
    }
    //
    //  This is the function that provides the animation
    //
    render = function () {
        var context = document.getElementById(TurtleGraphics.defaults.canvasID).getContext('2d');
        with (context) {
            with (TurtleGraphics.canvasLib[TurtleGraphics.defaults.canvasID]) {
                clearRect(llx, lly, (urx - llx), (ury - lly));
                //canvas.style.setProperty("background-color",TurtleGraphics.turtleCanvas.bgcolor.v);
            }
            var incr = TurtleGraphics.canvasLib[TurtleGraphics.defaults.canvasID].getCounter();
            var lastCanvas = null

            TurtleGraphics.renderClock += incr;

            for (var tix in TurtleGraphics.turtleList) {
                var t = TurtleGraphics.turtleList[tix]
                lastCanvas = t.turtleCanvas 
                if (t.aCount >= t.drawingEvents.length)
                    t.aCount = t.drawingEvents.length - 1;
                moveTo(0, 0);
                var currentPos = new Vector(0,0,0);
                var currentHead = new Vector(1,0,0);
                lineWidth = t.get_pen_width();
                lineCap = 'round';
                lineJoin = 'round';
                strokeStyle = 'black';
                var filling = false;
                if (isNaN(t.turtleCanvas.delay))
                	t.turtleCanvas.delay = 0
//				console.log(tix + " : " + t.clearPoint + " to " + t.aCount)
                for (var i = t.clearPoint; (i <= t.aCount || t.turtleCanvas.delay == 0) && i < t.drawingEvents.length; i++) {
                	if (i > t.aCount)	//	If se jump past aCount, jump it ahead
                		t.aCount = i
                    var oper = t.drawingEvents[i];
                    var ts = oper[oper.length-1];
//					console.log(i + "/" + ts + oper [0] + "{" + oper [1] + "}" + t.turtleCanvas.delay)
                    if (ts <= TurtleGraphics.renderClock || t.turtleCanvas.delay == 0) {
                    	if (ts > TurtleGraphics.renderClock)	//	If we go past the render clock, jump it ahead
                    		TurtleGraphics.renderClock = ts
//						console.log("<==")
                        if (oper[0] == "LT") {  //  line to
                            if (! filling) {
                                beginPath();
                                moveTo(oper[1], oper[2]);
                            }
                            lineTo(oper[3], oper[4]);
                            strokeStyle = oper[5];
                            stroke();
                            currentPos = new Vector(oper[3],oper[4],0);
                            if (! filling)
                                closePath();
                        }
                        else if (oper[0] == "MT") {  // move to
                            moveTo(oper[3], oper[4]);
                            currentPos = new Vector(oper[3],oper[4],0);
                        }
                        else if (oper[0] == "BF") {  // begin fill
                            beginPath();
                            moveTo(oper[1], oper[2]);
                            filling = true;
                        }
                        else if (oper[0] == "EF") {  // end fill
                            fillStyle = oper[3];
                            stroke();
                            fill();
                            closePath();
                            filling = false;
                        }
                        else if (oper[0] == "FC") {  // fill color
                            fillStyle = oper[1];
                        }
                        else if (oper[0] == "TC") {  // turtle color
                            strokeStyle = oper[1];
                        }
                        else if (oper[0] == "PW") {  // Pen width
                            lineWidth = oper[1];
                        }
                        else if (oper[0] == "DT") {  // Dot
                            var col = fillStyle;
                            fillStyle = oper[2];
                            var size = oper[1];
                            fillRect(oper[3] - size / 2, oper[4] - size / 2, size, size);
                            fillStyle = col;
                        }
                        else if (oper[0] == "CI") {  // Circle
                            if (!filling)
								beginPath();
                            arc(oper[1], oper[2], oper[3], oper[4], oper[5], oper[6]);
                            currentPos = new Vector(oper[1]+Math.cos(oper[5])*oper[3],
                                oper[2]+Math.sin(oper[5])*oper[3],0);
                            stroke();
                            if (! filling) {
                                closePath();
                            }
                        }
                        else if (oper[0] == "WT") { // write
                            if (font)
                                font = oper[2];
                            scale(1, -1);
                            fillText(oper[1], oper[3], -oper[4]);
                            scale(1, -1);
                        } else if (oper[0] == "ST") {  // stamp
                            t.drawturtle(oper[3], new Vector(oper[1], oper[2], 0));
                        } else if (oper[0] == "HT") { // hide turtle
                            t.visible = false;
                        } else if (oper[0] == "SH") { // show turtle
                            t.visible = true;
                        } else if (oper[0] == "TT") {
                            currentHead = oper[1];
                        } else if (oper[0] == "CL") { // RNL clear
                        	clear_canvas(t.canvasID);
                        	t.clearPoint = i;	// Different from reset that calls clear because it leaves the turtles where they are
                        } else if (oper[0] == "DL") { // RNL delay
                        	var df = oper[1]
//                      	console.log("animated delay set " + df)
                        	t.turtleCanvas.delay = df
                        } else if (oper[0] == "SC") { // RNL speed change
                        	var s = oper[1]
                        	if (s < 0)
                        		s = 0
                        	if (s > 10)
                        		s = 10
       						var df = (10 - (s % 11) + 1) * t.turtleCanvas.timeFactor	//	10
       						if (s == 0) {
       							df = 0
       						}
	                        //	t.turtleCanvas.intervalId = clearInterval(t.turtleCanvas.intervalId);
	       					t.turtleCanvas.delay = df;
	       					//	t.turtleCanvas.intervalId = setInterval(render, t.turtleCanvas.delay)
       						if (oper[2]) {
       							t.turtleCanvas.setSegmentLength(oper[2]);
       						}
       					} else if (oper[0] == "NO") { // RNL no op                	
                        } else {
							console.log("unknown op: " + oper[0]);
                        } // end of oper[0] test
                    } // end of if ts < render clock
                } // end of for
//				console.log(TurtleGraphics.renderClock + " / " + t.aCount)
//				console.log("------------------------------")
                t.aCount += incr;
                if (t.visible) {
                    // draw the turtle
                    t.drawturtle(currentHead.toAngle(), currentPos); // just use currentHead
                }
            }
            //if (t.aCount >= t.drawingEvents.length) {
            if (TurtleGraphics.renderClock > TurtleGraphics.eventCount ){ // && allDone() ){
//              t.turtleCanvas.doneAnimating(t);
//				console.log("done animating")
                if (lastCanvas) lastCanvas.doneAnimating(t);
            } else {
//    			t.turtleCanvas.intervalId = setTimeout(render, t.turtleCanvas.delay)
    			if (lastCanvas) {
    				lastCanvas.intervalId = setTimeout(render, lastCanvas.delay)
    			}
            }
        }
    }



    // Constructor for Turtle objects
    function Turtle() {
        if (arguments.length >= 1) {
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
        with (this) {
            position = home;
            context.moveTo(home[0], home[1]);
            heading = new Vector([1.0, 0.0, 0.0]); // to the right; in turtle space x+ direction
            normal = new Vector([0.0, 0.0, -1.0]); // in z- direction
        }
    };

    Turtle.prototype.initialize = function () {
        // Initialize the turtle.
        var options = { };

        if (arguments.length >= 1) {
            options = arguments[0];
        }

        this.canvasID = TurtleGraphics.defaults.canvasID;
        if (options.canvasID) {
            this.canvasID = options.canvasID;
        }
        this.context = document.getElementById(this.canvasID).getContext('2d');

        this.animate = TurtleGraphics.defaults.animate;

        with (this.context) {
            if (TurtleGraphics.canvasInit == false) {   // This is a workaround until I understand skulpt re-running better
                // the downside is that this limits us to a single turtle...
                save();
                translate(canvas.width / 2, canvas.height / 2); // move 0,0 to center.
                scale(1, -1); // scaling like this flips the y axis the right way.
                if (! TurtleGraphics.canvasLib[this.canvasID]) {
                    TurtleGraphics.canvasLib[this.canvasID] = new TurtleCanvas(options);
                }
                TurtleGraphics.canvasInit = true;
            } else {
                clear_canvas(this.canvasID);
            }

            this.turtleCanvas = TurtleGraphics.canvasLib[this.canvasID];
            this.home = new Vector([0.0, 0.0, 0.0]);
            this.visible = true;
            this.shapeStore = {};
            this.shapeStore['turtle'] = turtleShapePoints();
            this.shapeStore['arrow'] = defaultShapePoints();
            this.shapeStore['circle'] = circleShapePoints();
            this.shapeStore['square'] = squareShapePoints();
            this.shapeStore['triangle'] = triangleShapePoints();
            this.shapeStore['blank'] = [new Vector(0,0)];
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
            this.clearPoint = 0;	// RNL for clear/clearScreen
        }
    }
    function turtleShapePoints() {
        var pl = [
            [0,16],
            [-2,14],
            [-1,10],
            [-4,7],
            [-7,9],
            [-9,8],
            [-6,5],
            [-7,1],
            [-5,-3],
            [-8,-6],
            [-6,-8],
            [-4,-5],
            [0,-7],
            [4,-5],
            [6,-8],
            [8,-6],
            [5,-3],
            [7,1],
            [6,5],
            [9,8],
            [7,9],
            [4,7],
            [1,10],
            [2,14]
        ];
        res = [];
        for (p in pl) {
            res.push(new Vector(pl[p]));
        }
        return res;
    }

    function defaultShapePoints() {
        var pl = [
            [-10,0],
            [10,0],
            [0,10]
        ];
        res = [];
        for (p in pl) {
            res.push(new Vector(pl[p]));
        }
        return res;
    }

    function circleShapePoints() {
        var pl = [
            [10,0],
            [9.51,3.09],
            [8.09,5.88],
            [5.88,8.09],
            [3.09,9.51],
            [0,10],
            [-3.09,9.51],
            [-5.88,8.09],
            [-8.09,5.88],
            [-9.51,3.09],
            [-10,0],
            [-9.51,-3.09],
            [-8.09,-5.88],
            [-5.88,-8.09],
            [-3.09,-9.51],
            [-0.00,-10.00],
            [3.09,-9.51],
            [5.88,-8.09],
            [8.09,-5.88],
            [9.51,-3.09]
        ];
        res = [];
        for (p in pl) {
            res.push(new Vector(pl[p]));
        }
        return res;
    }

    function triangleShapePoints() {
        var pl = [
            [10,-5.77],
            [0,11.55],
            [-10,-5.77]
        ];

        res = [];
        for (p in pl) {
            res.push(new Vector(pl[p]));
        }
        return res;

    }

    function squareShapePoints() {
        var pl = [
            [10,-10],
            [10,10],
            [-10,10],
            [-10,-10]
        ];

        res = [];
        for (p in pl) {
            res.push(new Vector(pl[p]));
        }
        return res;

    }

    function classicShapePoints() {
        var pl = [
            [0,0],
            [-5,-9],
            [0,-7],
            [5,-9]
        ];

        res = [];
        for (p in pl) {
            res.push(new Vector(pl[p]));
        }
        return res;

    }

    Turtle.prototype.clean = function () {
        // Clean the canvas
        // Optional second argument is color
        with (this) {
            if (arguments.length >= 1) {
                clear_canvas(canvasID, arguments[0]);
            }
            else {
                clear_canvas(canvasID);
            }
            initialize();
        }
    }

    Turtle.prototype.addDrawingEvent = function(eventList) {
        TurtleGraphics.eventCount += 1;
        eventList.push(TurtleGraphics.eventCount);
        this.drawingEvents.push(eventList);
    }
//  
//  Drawing Functions
//

    // break a line into segments
    // sp:  Vector of starting position
    // ep:  Vector of ending position
    // sl:  int length of segments
    segmentLine = function(sp, ep, sL, pen) {
        var head = ep.sub(sp).normalize();
        var numSegs = Math.floor(ep.sub(sp).len() / sL);
        var res = [];
        var oldp = sp;
        var newp;
        var op = ""
        if (pen)
            op = "LT"
        else
            op = "MT"
        for (var i = 0; i < numSegs; i++) {
            newp = oldp.linear(1, sL, head);
            res.push([op,oldp[0],oldp[1],newp[0],newp[1]]);
            oldp = newp;
        }
        if (! ((oldp[0] == ep[0]) && (oldp[1] == ep[1])))
            res.push([op, oldp[0], oldp[1], ep[0], ep[1]]);
        return res;
    }

    Turtle.prototype.draw_line = function(newposition) {
        with (this) {
            with (context) {
                if (! animate) {
                    if (! filling) {
                        beginPath();
                        moveTo(position[0], position[1]);
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
                    var r = segmentLine(position, newposition, turtleCanvas.getSegmentLength(), pen);
                    for (var s in r) {
                        r[s].push(penStyle);
                        addDrawingEvent(r[s]);
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
        with (this) {
            var newposition = position.linear(1, d, heading);
            goto(newposition);
        }
    }

    Turtle.prototype.backward = function(d) {
        this.forward(-d);
    }

//	This is an internal function that sets the position without doing any drawing
    Turtle.prototype.teleport_to = function(nx, ny) {
        if (nx instanceof Vector)
            var newposition = nx;
        else
            var newposition = new Vector([nx,ny,0]);
        this.context.moveTo(newposition[0], newposition[1]);
		this.position = newposition;
	}

    Turtle.prototype.goto = function(nx, ny) {
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
                    var r = segmentLine(position, newposition, turtleCanvas.getSegmentLength(), pen);
                    for (var s in r)
                        addDrawingEvent(r[s]);
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

    Turtle.prototype.delay = function(d) {	// RNL
    	if (d != null) {
    		if (d < 0)
    			d = -d
    		if (!this.animate) 
    			this.turtleCanvas.setDelay(d)
    		else {
    			this.turtleCanvas.setDelay(d)
	    		this.addDrawingEvent(["DL", d])
	    		this.addDrawingEvent(["NO"])
    		}
    	}
        return this.turtleCanvas.getDelay();
    }

    Turtle.prototype.speed = function(s,t) {
        if (s > 0 && !this.animate) {
            this.animate = true;
            this.turtleCanvas.setSpeedDelay(s)
        } else if (s == 0 && !this.animate) {
        	this.turtleCanvas.setSpeedDelay(s)
        } else {
//          this.animate = false;
//          this.turtleCanvas.cancelAnimation();
			this.addDrawingEvent(["SC", s, t])
			this.addDrawingEvent(["NO"])
        }
        if (t) {
            this.turtleCanvas.setSegmentLength(t);
            // set the number of units to divide a segment into
        } else {
            this.turtleCanvas.setSegmentLength(10);
        }
    }

    Turtle.prototype.tracer = function(t, d) {
        this.turtleCanvas.setCounter(t);
		if (t == 0) {
			this.animate=false;
			this.turtleCanvas.cancelAnimation();
		}
		if (d !== undefined)
			this.turtleCanvas.setDelay(d);
    }

    Turtle.prototype.getRenderCounter = function() {
        return this.turtleCanvas.getCounter();
    }

    Turtle.prototype.turn = function (phi) {
        with (this) {
            var alpha = phi * Degree2Rad;
            var left = normal.cross(heading);
            var newheading = heading.rotateNormal(left, normal, alpha);
            heading = newheading;

            if (animate) {
                addDrawingEvent(["TT",heading]);
            }
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

    Turtle.prototype.towards = function(to, y) {
        // set heading vector to point towards another point.
        if ((typeof(to)).toLowerCase() === 'number')
            to = new Vector(to, y, 0);
        else if (! (to instanceof Vector)) {
            to = new Vector(to);
        }
        var res = to.sub(this.position);
        res = res.normalize();
        if (TurtleGraphics.defaults.degrees) {
            return res.toAngle();
        }
        else {
            return res;
        }
    }

    Turtle.prototype.distance = function(to, y) {
        if ((typeof(to)).toLowerCase() === 'number')
            to = new Vector(to, y, 0);
        return this.position.sub(new Vector(to)).len();
    }

    Turtle.prototype.dot = function() {
        var size = 2;
        if (arguments.length >= 1) size = arguments[0];
        size = size * this.turtleCanvas.lineScale;
        with (this) {
            with (context) {
                var color = penStyle;
                var nc = arguments[1] || color;
                if (! animate) {
                    fillStyle = nc;
                    fillRect(position[0] - size / 2, position[1] - size / 2, size, size);
                    fillStyle = color;
                } else {
                    addDrawingEvent(["DT", size, nc, position[0], position[1]]);
                }
            }
        }

    }

    Turtle.prototype.circle = function(radius, extent) {
        if (extent === undefined) {
            extent = 360
        }
		if (this.animate) {
			var arcLen = Math.abs(radius * Math.PI * 2.0  * extent / 360);
			var segLen = this.turtleCanvas.getSegmentLength();
			if (arcLen <= segLen)
				this.arc(radius,extent);
			else {
				//	Break the arc into segments for animation
				var extentPart = (segLen / arcLen) * extent;
				var extentLeft = extent;
				while (Math.abs(extentLeft) > Math.abs(extentPart)) {
					this.arc(radius, extentPart);
					extentLeft = extentLeft - extentPart;
				}
				if (Math.abs(extentLeft) > 0.01)
					this.arc(radius, extentLeft);
			}
		} else {
			this.arc(radius,extent);
		}
	}
	
    Turtle.prototype.arc = function(radius, extent) {
		//	Figure out where the turtle is and which way it's facing
		var turtleHeading = this.get_heading()
		var tx = this.position[0]
		var ty = this.position[1]

		//	Figure out the circle center
		var cx = tx + (radius * Math.cos((turtleHeading + 90) * Degree2Rad));
		var cy = ty + (radius * Math.sin((turtleHeading + 90) * Degree2Rad));

		//	Canvas arc angles go CLOCKWISE, not COUNTERCLOCKWISE like Turtle

		//	Figure out our arc angles
		var startAngleDeg;
		if (radius >= 0)
			startAngleDeg = turtleHeading - 90;
		else
			startAngleDeg = turtleHeading + 90;

		var endAngleDeg;
        if (extent) {
			if (radius >= 0)
	            endAngleDeg = startAngleDeg + extent;
			else
	            endAngleDeg = startAngleDeg - extent;
        } else {
			if (radius >= 0)
	            endAngleDeg = startAngleDeg + 360;
			else
				endAngleDeg = startAngleDeg - 360;
		}

		//	Canvas angles are opposite
		startAngleDeg = 360 - startAngleDeg
		endAngleDeg   = 360 - endAngleDeg

		//	Becuase the y axis has been flipped in HTML5 Canvas with a tanslation, we need to adjust the angles
		startAngleDeg = -startAngleDeg
		endAngleDeg   = -endAngleDeg

		//	Convert to radians
		var startAngle = startAngleDeg * Degree2Rad;
		var endAngle   = endAngleDeg   * Degree2Rad;


		//	Do the drawing
        if (! this.animate) {
			if (!this.filling)
				this.context.beginPath();
            this.context.arc(cx, cy, Math.abs(radius), startAngle, endAngle, (radius * extent <= 0));
            this.context.stroke();
			if (!this.filling)
				this.context.closePath();
        } else {
            this.addDrawingEvent(["CI", cx, cy, Math.abs(radius), startAngle, endAngle, (radius * extent <= 0)]);
        }

		//	Move the turtle only if we have to
		if (extent && (extent % 360) != 0) {
			var turtleArc;
			if (radius >= 0)
				turtleArc = extent;
			else 
				turtleArc = -extent;
			var newTurtleHeading = (turtleHeading + turtleArc) % 360;
			if (newTurtleHeading < 0)
				newTurtleHeading = newTurtleHeading + 360;

			var nx = cx + (radius * Math.cos((newTurtleHeading - 90) * Degree2Rad));
			var ny = cy + (radius * Math.sin((newTurtleHeading - 90) * Degree2Rad));	//	y coord is inverted in turtle

			//	Move it internally
			this.set_heading(newTurtleHeading);
			this.teleport_to(nx,ny);

			//	If we're animating the turtle, move it on the screen
			if (this.animate) {
				this.addDrawingEvent(["TT", this.heading]);
			}
		}

    }

    Turtle.prototype.write = function(theText, move, align, font) {
        if (! this.animate) {
            if (font)
                this.context.font = font.v;
            this.context.scale(1, -1);
            this.context.fillText(theText, this.position[0], -this.position[1]);
            this.context.scale(1, -1);
        } else {
            var fontspec;
            if (font)
                fontspec = font.v
            this.addDrawingEvent(["WT", theText, fontspec, this.position[0], this.position[1]]);
        }
    }

    Turtle.prototype.setworldcoordinates = function(llx, lly, urx, ury) {
        this.turtleCanvas.setworldcoordinates(llx, lly, urx, ury);
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
            this.addDrawingEvent(["PW", w * this.turtleCanvas.lineScale]);
        else
            this.penWidth = w;
    }

    Turtle.prototype.get_pen_width = function() {
        return this.penWidth * this.turtleCanvas.lineScale;
    }

    Turtle.prototype.set_pen_color = function (c, g, b) {
        if (typeof(c) == "string") {
            this.penStyle = c;
        } else {
        	var rs
        	var gs
        	var bs
        	if (typeof( c) == "object" && c.length == 3) {
				var c0 = Sk.builtin.asnum$(c[0]);
				var c1 = Sk.builtin.asnum$(c[1]);
				var c2 = Sk.builtin.asnum$(c[2]);
        	} else {
                var c0 = Sk.builtin.asnum$(c);
                var c1 = Sk.builtin.asnum$(g);
                var c2 = Sk.builtin.asnum$(b);
        	}
            rs = c0.toString(16);
            gs = c1.toString(16);
            bs = c2.toString(16);
            while (rs.length < 2) rs = "0" + rs;
            while (gs.length < 2) gs = "0" + gs;
            while (bs.length < 2) bs = "0" + bs;
            c = "#" + rs + gs + bs;
            this.penStyle = c;
        }

        this.context.strokeStyle = c;
        if (this.animate)
            this.addDrawingEvent(["TC", c]);
    }

    Turtle.prototype.set_fill_color = function (c, g, b) {
        if (typeof(c) == "string") {
            this.fillStyle = c;
        } else {
        	var rs
        	var gs
        	var bs
        	if (typeof( c) == "object" && c.length == 3) {
				var c0 = Sk.builtin.asnum$(c[0]);
				var c1 = Sk.builtin.asnum$(c[1]);
				var c2 = Sk.builtin.asnum$(c[2]);
        	} else {
                var c0 = Sk.builtin.asnum$(c);
                var c1 = Sk.builtin.asnum$(g);
                var c2 = Sk.builtin.asnum$(b);
        	}
            rs = c0.toString(16)
            gs = c1.toString(16)
            bs = c2.toString(16)
            while (rs.length < 2) rs = "0" + rs;
            while (gs.length < 2) gs = "0" + gs;
            while (bs.length < 2) bs = "0" + bs;
            c = "#" + rs + gs + bs;
            this.fillStyle = c;
        }

        this.context.fillStyle = c;
        if (this.animate)
            this.addDrawingEvent(["FC", c]);
    }

    Turtle.prototype.begin_fill = function () {
        if (! this.animate) {
            this.filling = true;
            this.context.beginPath();
            this.context.moveTo(this.position[0], this.position[1]);
        } else
            this.addDrawingEvent(["BF", this.position[0], this.position[1]]);

    }

    Turtle.prototype.end_fill = function () {
        if (! this.animate) {
            this.context.stroke();
            this.context.fill();
            this.context.closePath();
            this.filling = false;
        } else
            this.addDrawingEvent(["EF", this.position[0], this.position[1], this.fillStyle]);
    }


    Turtle.prototype.showturtle = function() {
        if (this.animate) {
            this.addDrawingEvent(["SH"]);
        }
        this.visible = true;
    }

    Turtle.prototype.hideturtle = function() {
        if (this.animate) {
            this.addDrawingEvent(["HT"]);
        }
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

    Turtle.prototype.drawturtle = function(heading, position) {
        var rtPoints = [];
        var plist = this.shapeStore[this.currentShape];
        var head;
        if (! (heading === undefined))
            head = heading - 90.0;
        else
            head = this.heading.toAngle() - 90.0;
        if (! position)
            position = this.position
        for (p in plist) {
            rtPoints.push(plist[p].scale(this.turtleCanvas.xptscale,this.turtleCanvas.yptscale).rotate(head).add(position));
        }
        this.context.beginPath();
        this.context.moveTo(rtPoints[0][0], rtPoints[0][1]);
        for (var i = 1; i < rtPoints.length; i++) {
            this.context.lineTo(rtPoints[i][0], rtPoints[i][1]);
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
            this.addDrawingEvent(["ST",this.position[0],this.position[1],this.heading.toAngle()]);
        } else
            this.drawturtle();
    }
    
    Turtle.prototype.clear = function () {
    	if (this.animate) {
    		this.addDrawingEvent(["CL"])
    	} else {
    		clear_canvas(this.canvasID);
    	}
    }

    function clear_canvas(canId) {
        with (document.getElementById(canId).getContext('2d')) {
            if (arguments.length >= 2) {
//		fillStyle = arguments[1];
//		fillRect(0, 0, canvas.width, canvas.height);
            }
            clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        }
    }


    // Create a 3d Vector class for manipulating turtle heading, and position.

    function Vector(x, y, z) {
        if ((typeof(x)).toLowerCase() === 'number') {
            Array.prototype.push.call(this, x);
            Array.prototype.push.call(this, y);
            Array.prototype.push.call(this, z);
        }
        else {
            for (var i in x) {
                Array.prototype.push.call(this, x[i]);
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
    Vector.prototype.addItem = function(item) {
        Array.prototype.push.call(this, item);
    }

    Vector.prototype.linear = function(a, b, v) {
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
            result[c] = this[(c + 1) % 3] * v[(c + 2) % 3] - this[(c + 2) % 3] * v[(c + 1) % 3];
        }
        return new Vector(result);
    }

    Vector.prototype.rotate = function(angle) {
        // Rotate this counter clockwise by angle.
        var perp = new Vector(-this[1], this[0], 0);
        angle = angle * Degree2Rad;
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        return new Vector(this[0] * c + perp[0] * s, this[1] * c + perp[1] * s, 0);
    }

    Vector.prototype.rotateNormal = function(v, w, alpha) {
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
        res[0] = this[0] / n;
        res[1] = this[1] / n;
        res[2] = this[2] / n;
        return new Vector(res);
    }

    // subtract one vector from another
    Vector.prototype.sub = function(v) {
        res = new Vector(0, 0, 0);
        res[0] = this[0] - v[0];
        res[1] = this[1] - v[1];
        res[2] = this[2] - v[2];
        return res;
    }

    Vector.prototype.add = function(v) {
        res = new Vector(0, 0, 0);
        res[0] = this[0] + v[0];
        res[1] = this[1] + v[1];
        res[2] = this[2] + v[2];
        return res;
    }

    Vector.prototype.smul = function(k) {  // scalar multiplication
        res = new Vector(0, 0, 0);
        res[0] = this[0] * k;
        res[1] = this[1] * k;
        res[2] = this[2] * k;
        return res;
    }

    Vector.prototype.scale = function(xs,ys) {
        res = new Vector(0,0,0);
        res[0] =  this[0] * ys;
        res[1] =  this[1] * xs;
        res[2] = 1.0;
        return res;
    }

    Vector.prototype.len = function() {
        return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2]);
    }


    TurtleGraphics.defaults = { canvasID: 'mycanvas', degrees: true, animate: true }
    TurtleGraphics.turtleList = [];
    TurtleGraphics.Turtle = Turtle;
    TurtleGraphics.TurtleCanvas = TurtleCanvas;
    TurtleGraphics.canvasLib = {}
    TurtleGraphics.clear_canvas = clear_canvas;
    TurtleGraphics.Vector = Vector;
    TurtleGraphics.canvasInit = false;
    TurtleGraphics.eventCount = 0;
    TurtleGraphics.renderClock = 0;
    TurtleGraphics.renderTime  = 0; // RNL

})();


//
// Wrapper around the Turtle Module starts here.
//
//
var $builtinmodule = function(name) {
    var mod = {};
    // First we create an object, this will end up being the class
    // class
    Sk.tg = TurtleGraphics;

    var checkArgs = function(expected, actual, func) {
        if (actual != expected ) {
            throw new Sk.builtin.TypeError(func + " takes exactly " + expected +
                    " positional argument (" + actual + " given)")
        }
    }

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
			dist = Sk.builtin.asnum$(dist);
            checkArgs(2,arguments.length,"forward()");
            self.theTurtle.forward(dist);
        });

        $loc.fd = $loc.forward;

        $loc.backward = new Sk.builtin.func(function(self, dist) {
			dist = Sk.builtin.asnum$(dist);
            checkArgs(2,arguments.length,"backward()");
            self.theTurtle.forward(-dist);
        });

        $loc.back = $loc.backward;
        $loc.bk = $loc.backward;

        $loc.right = new Sk.builtin.func(function(self, angle) {
			angle = Sk.builtin.asnum$(angle);
            checkArgs(2,arguments.length,"right()");
            self.theTurtle.turn(angle);
        });

        $loc.rt = $loc.right;

        $loc.left = new Sk.builtin.func(function(self, angle) {
			angle = Sk.builtin.asnum$(angle);
            checkArgs(2,arguments.length,"left()");
            self.theTurtle.turn(-angle);
        });

        $loc.lt = $loc.left;

        $loc.goto_$rw$ = new Sk.builtin.func(function(self, nx, ny) {
			nx = Sk.builtin.asnum$(nx);
			ny = Sk.builtin.asnum$(ny);
            checkArgs(3,arguments.length,"goto()");
            self.theTurtle.goto(nx, ny);
        });

        $loc.setposition = new Sk.builtin.func(function(self,nx,ny) {
			nx = Sk.builtin.asnum$(nx);
			ny = Sk.builtin.asnum$(ny);
            checkArgs(3,arguments.length,"setposition()");
            self.theTurtle.up();
            self.theTurtle.goto(nx,ny);
            self.theTurtle.down();
        });
        $loc.setpos = $loc.setposition;

        $loc.setx = new Sk.builtin.func(function(self, nx) {
			nx = Sk.builtin.asnum$(nx);
            checkArgs(2,arguments.length,"setx()");
            self.theTurtle.goto(nx, self.theTurtle.GetY());
        });

        $loc.sety = new Sk.builtin.func(function(self, ny) {
			ny = Sk.builtin.asnum$(ny);
            checkArgs(2,arguments.length,"sety()");
            self.theTurtle.goto(self.theTurtle.GetX(), ny);
        });

        $loc.setheading = new Sk.builtin.func(function(self, newhead) {
			newhead = Sk.builtin.asnum$(newhead);
            checkArgs(2,arguments.length,"setheading()");
            return self.theTurtle.set_heading(newhead);
        });

        $loc.seth = $loc.setheading;

        $loc.home = new Sk.builtin.func(function(self) {
            self.theTurtle.go_home();
        });

        $loc.dot = new Sk.builtin.func(function(self, /*opt*/ size, color) {
			size = Sk.builtin.asnum$(size);
            size = size || 1;
            if (color) {
                color = color.v || self.theTurtle.penStyle;
            }
            self.theTurtle.dot(size, color);
        });

        $loc.circle = new Sk.builtin.func(function(self, radius, extent) {
			radius = Sk.builtin.asnum$(radius);
			extent = Sk.builtin.asnum$(extent);
            self.theTurtle.circle(radius, extent);
        });

        $loc.delay = new Sk.builtin.func(function(self, d) {
			d = Sk.builtin.asnum$(d);
            return self.theTurtle.delay(d);
        });

        $loc.speed = new Sk.builtin.func(function(self, s, t) {
			s = Sk.builtin.asnum$(s);
			t = Sk.builtin.asnum$(t);
            self.theTurtle.speed(s,t);
        });

        $loc.tracer = new Sk.builtin.func(function(self, t, d) {
			t = Sk.builtin.asnum$(t);
			d = Sk.builtin.asnum$(d);
            self.theTurtle.tracer(t, d);
        });

		$loc.update = new Sk.builtin.func(function(self) {
			//	Dummy function to emulate update... when not animating, we don't save the drawing operations, so this is pointless for us
		});

        // todo:  stamp, clearstamp, clearstamps, undo, speed

        //
        // Tell Turtle's state
        //
        $loc.heading = new Sk.builtin.func(function(self) {
            checkArgs(1,arguments.length,"heading()");
            return Sk.builtin.assk$(self.theTurtle.get_heading(),Sk.builtin.nmber.float$);
        });

        $loc.position = new Sk.builtin.func(function(self) {
            checkArgs(1,arguments.length,"position()");
            var res = self.theTurtle.get_position();
            var x = new Sk.builtin.tuple([Sk.builtin.assk$(res[0],Sk.builtin.nmber.float$),
                                          Sk.builtin.assk$(res[1],Sk.builtin.nmber.float$) ]);
            return x;
        });

        $loc.pos = $loc.position;

        $loc.xcor = new Sk.builtin.func(function(self) {
            checkArgs(1,arguments.length,"xcor()");
            var res = self.theTurtle.getx();
            return Sk.builtin.assk$(res,Sk.builtin.nmber.float$);
        });

        $loc.ycor = new Sk.builtin.func(function(self) {
            checkArgs(1,arguments.length,"ycor()");
            var res = self.theTurtle.gety();
            return Sk.builtin.assk$(res,Sk.builtin.nmber.float$);
        });

        $loc.towards = new Sk.builtin.func(function(self, tx, ty) {
			tx = Sk.builtin.asnum$(tx);
			ty = Sk.builtin.asnum$(ty);
            if ((typeof(tx)).toLowerCase() === 'number') {
                tx = [tx, ty, 0];
            } else {
                tx = [Sk.builtin.asnum$(tx.theTurtle.getx()),Sk.builtin.asnum$(tx.theTurtle.gety()),Sk.builtin.asnum$(0)]
            }
            return Sk.builtin.assk$(self.theTurtle.towards(tx),Sk.builtin.nmber.float$);
        });

        // tx can be either a number or a vector position.
        // tx can not be a turtle at this time as multiple turtles have not been implemented yet.
        $loc.distance = new Sk.builtin.func(function(self, tx, ty) {
			tx = Sk.builtin.asnum$(tx);
			ty = Sk.builtin.asnum$(ty);
            if ((typeof(tx)).toLowerCase() === 'number') {
                tx = [tx, ty, 0];
            } else {
                tx = [tx.theTurtle.getx(), tx.theTurtle.gety(), 0];
            }
            return Sk.builtin.assk$(self.theTurtle.distance(tx),Sk.builtin.nmber.float$);
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
            checkArgs(1,arguments.length,"up()");
            self.theTurtle.pen_up();
        });

        $loc.penup = $loc.up;
        $loc.pu = $loc.up;

        $loc.down = new Sk.builtin.func(function(self) {
            checkArgs(1,arguments.length,"down()");
            self.theTurtle.pen_down();
        });

        $loc.pendown = $loc.down;
        $loc.pd = $loc.down;

        $loc.width = new Sk.builtin.func(function(self, w) {
			w = Sk.builtin.asnum$(w);
            checkArgs(2,arguments.length,"width()");
            self.theTurtle.set_pen_width(w);
        });

        $loc.pensize = $loc.width;

        $loc.isdown = new Sk.builtin.func(function(self) {
            checkArgs(1,arguments.length,"isdown()");
            return self.theTurtle.get_pen();
        });

        // todo:  pen  -- return a dictionary full of pen stuff

        //
        // Color Control
        //

        $loc.fillcolor = new Sk.builtin.func(function(self, color, green, blue) {
            if (color) {
                if (blue) {
                    self.theTurtle.set_fill_color(color, green, blue);
                } else {
                    color = color.v || self.theTurtle.context.fillStyle;
                    self.theTurtle.set_fill_color(color);
                }
            } else
                return self.theTurtle.fillStyle;
        });

        $loc.pencolor = new Sk.builtin.func(function(self, color, green, blue) {
            if (color) {
                if (blue) {
					color = Sk.builtin.asnum$(color);
					green = Sk.builtin.asnum$(green);
					blue = Sk.builtin.asnum$(blue);
                    self.theTurtle.set_pen_color(color, green, blue);
                } else {
                    color = color.v || self.theTurtle.context.fillStyle;
                    self.theTurtle.set_pen_color(color);
                }
            } else
                return self.theTurtle.penStyle;
        });

        $loc.color = new Sk.builtin.func(function(self, color, green, blue) {
            if(color) {
                if (blue) {
                    self.theTurtle.set_pen_color(color, green, blue);
                    self.theTurtle.set_fill_color(color, green, blue);
                } else {
                    color = color.v || self.theTurtle.context.fillStyle;
                    self.theTurtle.set_pen_color(color);
                    self.theTurtle.set_fill_color(color);
                }
            } else 
                return [self.theTurtle.penStyle, self.theTurtle.fillStyle];            
        });

        //
        //  Filling
        //

        $loc.begin_fill = new Sk.builtin.func(function(self) {
            checkArgs(1,arguments.length,"begin_fill()");
            self.theTurtle.begin_fill();
        });

        $loc.end_fill = new Sk.builtin.func(function(self) {
            checkArgs(1,arguments.length,"end_fill()");
            self.theTurtle.end_fill();
        });

        $loc.fill = new Sk.builtin.func(function(self, fillt) {
			if (fillt === undefined)
				return self.theTurtle.filling;
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
            checkArgs(1,arguments.length,"showturtle()");
            self.theTurtle.showturtle();
        });
        $loc.st = $loc.showturtle;

        $loc.hideturtle = new Sk.builtin.func(function(self) {
            checkArgs(1,arguments.length,"hideturtle()");
            self.theTurtle.hideturtle();
        });
        $loc.ht = $loc.hideturtle;

        $loc.isvisible = new Sk.builtin.func(function(self) {
            checkArgs(1,arguments.length,"isvisible()");
            self.theTurtle.isvisible()
        });

        $loc.stamp = new Sk.builtin.func(function(self) {
            checkArgs(1,arguments.length,"stamp()");
            self.theTurtle.stamp();
        });

        $loc.shape = new Sk.builtin.func(function(self, s) {
            checkArgs(2,arguments.length,"shape()");
            self.theTurtle.shape(s.v);
        });


        // todo the move, align, and font parameters should be kwargs...
        $loc.write = new Sk.builtin.func(function(self, mystr, move, align, font) {
            self.theTurtle.write(mystr.v, move, align, font);
        });

        // todo clean  -- again multiple turtles

        $loc.setworldcoordinates = new Sk.builtin.func(function(self, llx, lly, urx, ury) {
			llx = Sk.builtin.asnum$(llx);
			lly = Sk.builtin.asnum$(lly);
			urx = Sk.builtin.asnum$(urx);
			ury = Sk.builtin.asnum$(ury);
            self.theTurtle.setworldcoordinates(llx, lly, urx, ury);
        });

		//	Added by RNL

		$loc.clear = new Sk.builtin.func(function(self) {
			self.theTurtle.clear()
		});

    }

    mod.Turtle = Sk.misceval.buildClass(mod, turtle, 'Turtle', []);

    var screen = function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self) {
            TurtleGraphics.defaults = {canvasID: Sk.canvas, animate: true, degrees: true};
            var currentCanvas = TurtleGraphics.canvasLib[TurtleGraphics.defaults.canvasID];
            if (currentCanvas === undefined) {
                self.theScreen = new TurtleGraphics.TurtleCanvas(TurtleGraphics.defaults);
            } else {
                self.theScreen = currentCanvas;
            }
        });

        $loc.bgcolor = new Sk.builtin.func(function(self, c) {
            self.theScreen.bgcolor(c);
        });

        $loc.setworldcoordinates = new Sk.builtin.func(function(self, llx,lly,urx,ury) {
			llx = Sk.builtin.asnum$(llx);
			lly = Sk.builtin.asnum$(lly);
			urx = Sk.builtin.asnum$(urx);
			ury = Sk.builtin.asnum$(ury);
            self.theScreen.setworldcoordinates(llx,lly,urx,ury);
        });

        $loc.exitonclick = new Sk.builtin.func(function(self) {
            self.theScreen.exitonclick();
        });

        $loc.title = new Sk.builtin.func(function(self,titlestring) {
            // no op....
        });

        $loc.window_width = new Sk.builtin.func(function(self) {
                
            return Sk.builtin.assk$(self.theScreen.window_width(), Sk.builtin.nmber.int$);
        });

        $loc.window_height = new Sk.builtin.func(function(self) {
            return Sk.builtin.assk$(self.theScreen.window_height(), Sk.builtin.nmber.int$);
        });

        $loc.turtles = new Sk.builtin.func(function(self) {
            return self.theScreen.turtles();
        });

		$loc.colormode = new Sk.builtin.func(function(self) {
			//	Empty function to emulate compatibility
		});
        
//        $loc.clear = new Sk.builtin.func(function(self) {
//        	
//        });

        var myfunc = function(self, width, height, startx, starty) {
			width = Sk.builtin.asnum$(width);
			height = Sk.builtin.asnum$(height);
            self.theScreen.setup(width,height);
        }
        // this should allow for named parameters
        myfunc.co_varnames = ['self','width','height','startx','starty'];
        myfunc.$defaults = [null,500,500,0,0];
        $loc.setup = new Sk.builtin.func(myfunc);
    }

    mod.Screen = Sk.misceval.buildClass(mod, screen, 'Screen', []);

    mod.tracer = new Sk.builtin.func(function(t, d) {
		t = Sk.builtin.asnum$(t);
		d = Sk.builtin.asnum$(d);
		for (var i in Sk.tg.canvasLib)
			Sk.tg.canvasLib[i].tracer(t, d);
    });

	mod.update = new Sk.builtin.func(function(self) {
		//	Dummy function to emulate update... when not animating, we don't save the drawing operations, so this is pointless for us
	});


    return mod
}
