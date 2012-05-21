BarList = function(hm)
{
   this.howmany = hm
   this.bars = new Array()
   
   for (var i=0; i<this.howmany; i++)
   {
      var min = 5
      var max = 300
      var y = Math.floor(Math.random() * (max - min + 1)) + min
   
      abar = new Bar(i,y,"black")
      this.bars.push(abar)
   }
}

BarList.prototype.size = function()
{
   return this.howmany
}

BarList.prototype.show = function(c)
{
	for (var idx=0; idx<this.howmany; idx++)
	{
	   this.bars[idx].show(this.c)
	}
}
      

Bar = function(pos, h, col)
{
   this.height = h
   this.position = pos
   this.color = col
   
}

Bar.prototype.clone=function()
{
	  var newbar = new Bar()   //make a copy
	  newbar.setHeight(this.getHeight())
	  newbar.setPosition(this.getPosition())
	  newbar.setColor(this.getColor())
      return newbar
}

Bar.prototype.getHeight=function()
{  
   return this.height
}

Bar.prototype.setHeight=function(newh)
{
   this.height = newh
}

Bar.prototype.getColor=function()
{
   return this.color
}

Bar.prototype.getPosition=function()
{
   return this.position
}

Bar.prototype.setPosition=function(newp)
{
   this.position = newp
}

Bar.prototype.show = function(c,p)
{
   c.fillStyle=this.color
   c.fillRect(p*7 + 2, c.canvas.height-this.height, 3, this.height)
}

Bar.prototype.unshow = function(c,p)
{
   c.clearRect(p*7 + 2, c.canvas.height-this.height, 3, this.height)
}

Bar.prototype.setColor=function(newc)
{
   this.color = newc
}



SortingAnimation = function()  //Insertion Sort Demo
{
   this.timer = null
   this.framelist = new Array()
   this.cursor = -1
   
   this.sc = document.getElementById("sortingcanvas")
   this.ctx = this.sc.getContext("2d")
   this.sc.width = this.sc.width
   this.speed = 75
   


   //commented out code does insertion sort, code below does bubble sort
/*   for (var index=1; index < this.barlist.bars.length; index = index+1)
   {
      this.barlist.bars[index].setColor("blue")
      this.snapshot()
      this.barlist.bars[index].setColor("black")
      this.snapshot()
      var currentvalue = this.barlist.bars[index].clone()
      var position = index
      while (position>0 && (this.barlist.bars[position-1].getHeight() > currentvalue.getHeight()))
      {
         this.barlist.bars[position-1].setColor("red")
         this.snapshot()
         this.barlist.bars[position-1].setColor("black")
         
         this.barlist.bars[position] = this.barlist.bars[position-1].clone()
         //this.barlist.bars[position-1] = currentvalue
         this.barlist.bars[position-1].setHeight(0)
         

         this.snapshot()
         
         position = position-1

      }
      
      this.barlist.bars[position] = currentvalue
      this.barlist.bars[position].setColor("blue")
      this.snapshot()
      this.barlist.bars[position].setColor("black")
   }
   this.snapshot()*/
   
   this.barlist = new BarList(50)
   this.snapshot()
   for (var passnum=this.barlist.bars.length-1; passnum>0; passnum = passnum-1)
   {
      for (var i=0; i<passnum; i=i+1)
      {
         this.barlist.bars[i].setColor("red")
         this.barlist.bars[i+1].setColor("red")
         
         this.snapshot()
         
         if (this.barlist.bars[i].getHeight() > this.barlist.bars[i+1].getHeight())
         {

            var temp = this.barlist.bars[i]
            this.barlist.bars[i] = this.barlist.bars[i+1]
            this.barlist.bars[i+1] = temp
            
            this.snapshot()
            
         }
         
         this.barlist.bars[i].setColor("black")
         this.barlist.bars[i+1].setColor("black")
         
         this.snapshot()
      }
   }
   
}
   
SortingAnimation.prototype.incCursor=function()
{
   if (this.cursor < this.framelist.length-1)
      this.cursor = this.cursor + 1
}

SortingAnimation.prototype.decCursor=function()
{
   if (this.cursor > 0)
      this.cursor = this.cursor -1
}

SortingAnimation.prototype.getCursor=function()
{
   return this.cursor
}

SortingAnimation.prototype.setCursor=function(newc)
{
   this.cursor = newc
}
   

SortingAnimation.prototype.render = function(framenum)
{
    var currentframe = this.framelist[framenum]
    this.sc.width = this.sc.width
   
	for (var idx=0; idx<currentframe.length; idx++)
	{
	   currentframe[idx].show(this.ctx,idx)
	}
   
}

SortingAnimation.prototype.snapshot = function()
{
   var newframe = new Array()
   for (var idx=0; idx<this.barlist.bars.length; idx++)
   {
	  var newbar = new Bar()   //make a copy
	  newbar.setHeight(this.barlist.bars[idx].getHeight())
	  newbar.setPosition(this.barlist.bars[idx].getPosition())
	  newbar.setColor(this.barlist.bars[idx].getColor())
	  
	  newframe.push(newbar)
   }   
   
   this.framelist.push(newframe)
}
   
   

run = function()
{
   if (sa.timer == null)
      sa.timer = setInterval("forward()",sa.speed)
}

stop = function()
{
   clearInterval(sa.timer)
   sa.timer=null
}

forward = function()
{ 
   sa.incCursor()
   sa.render(sa.getCursor())
   if (sa.getCursor() == sa.framelist.length-1 && sa.timer != null)
   {
      clearInterval(sa.timer)
      sa.timer = null
   }
}

backward = function()
{
   sa.decCursor()
   sa.render(sa.getCursor())
}

end = function()
{
   sa.setCursor(sa.framelist.length-1)
   sa.render(sa.getCursor())

}

begin = function()
{
   sa.setCursor(0)
   sa.render(sa.getCursor())
}

init = function()
{
   sa = new SortingAnimation()
   sa.snapshot()
   sa.render(0)
}
