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

   this.script = this.model.init()  //does the animation and sends script back 
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

init1 = function()
{
   a = new Animator(new BubbleSortModel(), new BarViewer())
   a.init()
}

init2 = function()
{
   a = new Animator(new BubbleSortModel(), new ScatterViewer())
   a.init()
}

init3 = function()
{
   a = new Animator(new BubbleSortModel(), new BoxViewer())
   a.init()
}

init4 = function()
{
   a = new Animator(new SelectionSortModel(), new BarViewer())
   a.init()
}

init5 = function()
{
   a = new Animator(new SelectionSortModel(), new ScatterViewer())
   a.init()
}

init6 = function()
{
   a = new Animator(new SelectionSortModel(), new BoxViewer())
   a.init()
}

init7 = function()
{
   a = new Animator(new InsertionSortModel(), new BarViewer())
   a.init()
}

init8 = function()
{
   a = new Animator(new InsertionSortModel(), new ScatterViewer())
   a.init()
}

init9 = function()
{
   a = new Animator(new InsertionSortModel(), new BoxViewer())
   a.init()
}

init10 = function()
{
   a = new Animator(new ShellSortModel(), new BarViewer())
   a.init()
}

init11 = function()
{
   a = new Animator(new ShellSortModel(), new ScatterViewer())
   a.init()
}

init12 = function()
{
   a = new Animator(new ShellSortModel(), new BoxViewer())
   a.init()
}

init13 = function()
{
   a = new Animator(new MergeSortModel(), new BarViewer())
   a.init()
}

init14 = function()
{
   a = new Animator(new MergeSortModel(), new ScatterViewer())
   a.init()
}

init15 = function()
{
   a = new Animator(new MergeSortModel(), new BoxViewer())
   a.init()
}

init16 = function()
{
   a = new Animator(new QuickSortModel(), new BarViewer())
   a.init()
}

init17 = function()
{
   a = new Animator(new QuickSortModel(), new ScatterViewer())
   a.init()
}

init18 = function()
{
   a = new Animator(new QuickSortModel(), new BoxViewer())
   a.init()
}
