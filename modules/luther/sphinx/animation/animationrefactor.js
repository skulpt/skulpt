DataItem = function(pos, h, col)
{
   this.height = h
   this.position = pos
   this.color = col
}

DataItem.prototype.clone=function()
{
	  var newitem = new DataItem(this.position,this.height,this.color)   //make a copy
	  return newitem
}

DataItem.prototype.getHeight=function()
{  
   return this.height
}

DataItem.prototype.getColor=function()
{
   return this.color
}

DataItem.prototype.getPosition=function()
{
   return this.position
}

DataItem.prototype.setHeight=function(newh)
{
   this.height = newh
}

DataItem.prototype.setPosition=function(newp)
{
   this.position = newp
}

DataItem.prototype.setColor=function(newc)
{
   this.color = newc
}

SortModel = function()  //construct the model
{
}
    
SortModel.prototype.init = function(ctl)
{
	this.mycontroller = ctl

	this.valuelist = new Array()
	var howmany = 50
   
	for (var i=0; i<howmany; i++)
	{
	  var min = 5
	  var max = 300
	  var y = Math.floor(Math.random() * (max - min + 1)) + min
   
	  var item = new DataItem(i,y,"black")
	  this.valuelist.push(item)
	}
	
	this.script = new Array()
	this.script.push(this.makescene())
	
	for (var passnum=this.valuelist.length-1; passnum>0; passnum = passnum-1)
	{
	  for (var i=0; i<passnum; i=i+1)
	  {
		 this.valuelist[i].setColor("red")
		 this.valuelist[i+1].setColor("red")
		 
		 this.script.push(this.makescene())
		 
		 if (this.valuelist[i].getHeight() > this.valuelist[i+1].getHeight())
		 {
	
			var temp = this.valuelist[i]
			this.valuelist[i] = this.valuelist[i+1]
			this.valuelist[i+1] = temp
			
			this.script.push(this.makescene())
			
		 }
		 
		 this.valuelist[i].setColor("black")
		 this.valuelist[i+1].setColor("black")
		 
		 this.script.push(this.makescene())
	  }
	}
	
	return this.script
}

SortModel.prototype.makescene = function()
{
   var newscene = new Array()
   for (var idx=0; idx<this.valuelist.length; idx++)
   {
	  var item = this.valuelist[idx].clone()   //make a copy
	  newscene.push(item)
   }   
   
   return newscene
}




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
                             this.ctx.canvas.height-ascene[p].height, 
                             3, 
                             ascene[p].height)
	}
}

ListViewer = function() //contruct a list of numbers view
{
}

ListViewer.prototype.init = function(c)
{
   this.ctx = c
}

ListViewer.prototype.render = function(ascene)
{
	for (var p=0; p<ascene.length; p++)
	{
       this.ctx.fillStyle=ascene[p].color
       this.ctx.fillText(ascene[p].height, p*7 + 2, 
                             this.ctx.canvas.height-ascene[p].height)
	}
}


Animator = function(m, v, divid)
{
   this.model = m
   this.viewer = v
   this.timer = null
   
   this.cursor = -1

   this.sc = document.getElementById(divid+"_canvas")
   this.ctx = this.sc.getContext("2d")
   this.sc.width = this.sc.width
   this.speed = 75

   this.script = this.model.init()  //does the sort and sends script back 
   this.viewer.init(this.ctx)
}

Animator.prototype.getContext=function()
{
   return this.ctx
}

Animator.prototype.incCursor=function()
{
   if (this.cursor < this.script.length-1)
      this.cursor = this.cursor + 1
}

Animator.prototype.decCursor=function()
{
   if (this.cursor > 0)
      this.cursor = this.cursor -1
}

Animator.prototype.getCursor=function()
{
   return this.cursor
}

Animator.prototype.setCursor=function(newc)
{
   this.cursor = newc
}
  
Animator.prototype.run = function(animobj)
{
   if (this.timer == null)
      this.timer = setInterval(animobj+".forward()",this.speed)
}

Animator.prototype.stop = function()
{
   clearInterval(this.timer)
   this.timer=null
}

Animator.prototype.forward = function()
{ 
   this.incCursor()
   this.sc.width = this.sc.width
   this.viewer.render(this.script[this.getCursor()])
   if (this.getCursor() == this.script.length-1 && this.timer != null)
   {
      clearInterval(this.timer)
      this.timer = null
   }
}

Animator.prototype.backward = function()
{
   this.decCursor()
   this.sc.width = this.sc.width
   this.viewer.render(this.script[this.getCursor()])
}

Animator.prototype.end = function()
{
   this.setCursor(this.script.length-1)
   this.sc.width = this.sc.width
   this.viewer.render(this.script[this.getCursor()])

}

Animator.prototype.begin = function()
{
   this.setCursor(0)
   this.sc.width=this.sc.width
   this.viewer.render(this.script[this.getCursor()])
}

Animator.prototype.init = function()
{
   this.setCursor(0)
   this.sc.width = this.sc.width
   this.viewer.render(this.script[0])
}






