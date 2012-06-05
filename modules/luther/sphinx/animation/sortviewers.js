
BarViewer = function()  //construct the view
{
}

BarViewer.prototype.init = function(c)
{
   this.ctx = c
}

BarViewer.prototype.render = function(ascene)
{
	for (var p=0; p<ascene.length; p++)
	{
       this.ctx.fillStyle=ascene[p].color
       this.ctx.fillRect(p*7 + 2, 
                             this.ctx.canvas.height-ascene[p].getValue(), 
                             3, 
                             ascene[p].getValue())
	}
}

ScatterViewer = function() //contruct a list of numbers view
{
}

ScatterViewer.prototype.init = function(c)
{
   this.ctx = c
}

ScatterViewer.prototype.render = function(ascene)
{
	for (var p=0; p<ascene.length; p++)
	{
       this.ctx.fillStyle=ascene[p].color
       this.ctx.fillText(ascene[p].getValue(), p*7 + 2, 
                             this.ctx.canvas.height-ascene[p].getValue())
	}
}

BoxViewer = function() //contruct an array of boxes view
{
}

BoxViewer.prototype.init = function(c)
{
   this.ctx = c
}

BoxViewer.prototype.render = function(ascene)
{
	for (var p=0; p<ascene.length; p++)
	{
       this.ctx.fillStyle=ascene[p].color
       this.ctx.fillText(ascene[p].getValue(), p*25 + 3, 200)
       this.ctx.strokeStyle = ascene[p].color
       this.ctx.strokeRect(p*25+2,185,25,25)
	}
}

