DataItem = function(pos, h, col)
{
   this.value = h
   this.position = pos
   this.color = col
}

DataItem.prototype.clone=function()
{
	  var newitem = new DataItem(this.position,this.value,this.color)   //make a copy
	  return newitem
}

DataItem.prototype.getValue=function()
{  
   return this.value
}

DataItem.prototype.getColor=function()
{
   return this.color
}

DataItem.prototype.getPosition=function()
{
   return this.position
}

DataItem.prototype.setValue=function(newh)
{
   this.value = newh
}

DataItem.prototype.setPosition=function(newp)
{
   this.position = newp
}

DataItem.prototype.setColor=function(newc)
{
   this.color = newc
}

BubbleSortModel = function()  //construct the model
{
}
    
BubbleSortModel.prototype.init = function(ctl)
{
	this.mycontroller = ctl

	this.valuelist = new Array()
	var howmany = 15
   
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
		 
		 if (this.valuelist[i].getValue() > this.valuelist[i+1].getValue())
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

BubbleSortModel.prototype.makescene = function()
{
   var newscene = new Array()
   for (var idx=0; idx<this.valuelist.length; idx++)
   {
	  var item = this.valuelist[idx].clone()   //make a copy
	  newscene.push(item)
   }   
   
   return newscene
}

InsertionSortModel = function()
{
}

InsertionSortModel.prototype.init=function(ctl)
{
	this.mycontroller = ctl

	this.valuelist = new Array()
	var howmany = 15
   
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
	
	for (var index=1; index < this.valuelist.length; index = index+1)
	   {
		  this.valuelist[index].setColor("blue")
		  this.script.push(this.makescene())
		  this.valuelist[index].setColor("black")
		  this.script.push(this.makescene())
		  var currentvalue = this.valuelist[index].clone()
		  var position = index
		  while (position>0 && (this.valuelist[position-1].getValue() > currentvalue.getValue()))
		  {
			 this.valuelist[position-1].setColor("red")
			 this.script.push(this.makescene())
			 this.valuelist[position-1].setColor("black")
			 
			 this.valuelist[position] = this.valuelist[position-1].clone()
			 //this.barlist.bars[position-1] = currentvalue
			 this.valuelist[position-1].setValue(0)
			 
	
			 this.script.push(this.makescene())
			 
			 position = position-1
	
		  }
		  
		  this.valuelist[position] = currentvalue
		  this.valuelist[position].setColor("blue")
		  this.script.push(this.makescene())
		  this.valuelist[position].setColor("black")
	   }
 
    this.script.push(this.makescene())
	return this.script
}


InsertionSortModel.prototype.makescene = function()
{
   var newscene = new Array()
   for (var idx=0; idx<this.valuelist.length; idx++)
   {
	  var item = this.valuelist[idx].clone()   //make a copy
	  newscene.push(item)
   }   
   return newscene
}

SelectionSortModel = function()  //construct the model
{
}
    
SelectionSortModel.prototype.init = function(ctl)
{
	this.mycontroller = ctl

	this.valuelist = new Array()
	var howmany = 15
   
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

	
	for (var fillslot=this.valuelist.length-1; fillslot>0; fillslot = fillslot-1)
	{ var positionOfMax=0
	  this.valuelist[positionOfMax].setColor("yellow")
	  this.valuelist[fillslot].setColor("blue")
	  this.script.push(this.makescene())
	  
	  for (var i=1; i<fillslot+1; i=i+1)
	  {
		 this.valuelist[i].setColor("red")
		 
		 this.script.push(this.makescene())
		 
		 if (this.valuelist[i].getValue() > this.valuelist[positionOfMax].getValue())
		 {
		    this.valuelist[positionOfMax].setColor("black")
		    positionOfMax = i
		    this.valuelist[i].setColor("yellow")
		    this.script.push(this.makescene())
		 }
		 else
		 {
		    this.valuelist[i].setColor("black")
		    this.script.push(this.makescene())
		 }
      }
		 
	
      var temp = this.valuelist[fillslot]
      this.valuelist[fillslot] = this.valuelist[positionOfMax]
      this.valuelist[positionOfMax] = temp
			
      this.script.push(this.makescene())
		 
      this.valuelist[fillslot].setColor("black")
		 
      this.script.push(this.makescene())
	  }
	
	return this.script
}

SelectionSortModel.prototype.makescene = function()
{
   var newscene = new Array()
   for (var idx=0; idx<this.valuelist.length; idx++)
   {
	  var item = this.valuelist[idx].clone()   //make a copy
	  newscene.push(item)
   }   
   
   return newscene
}


ShellSortModel = function()  //construct the model
{
}
    
ShellSortModel.prototype.init = function(ctl)
{
	this.mycontroller = ctl

	this.valuelist = new Array()
	var howmany = 15
   
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

    var sublistcount = Math.floor(this.valuelist.length/2)
    while (sublistcount > 0)
    {
       for (var startposition = 0; startposition < sublistcount; 
                                     startposition = startposition+1)
       {  
          var gap = sublistcount
          var start = startposition 
          this.valuelist[start].setColor("red")
          for (var i=start+gap; i<this.valuelist.length; i = i + gap)
          {
             currentvalue = this.valuelist[i].clone()
             currentvalue.setColor("red")
             this.script.push(this.makescene())
             position = i
             while (position>=gap && this.valuelist[position-gap].getValue()>currentvalue.getValue())
             {
                this.valuelist[position] = this.valuelist[position-gap].clone()
                this.valuelist[position-gap].setValue(0)
                position = position-gap
                this.script.push(this.makescene())
             }
             this.valuelist[position]=currentvalue
             this.script.push(this.makescene())
          }
          for (var clearidx=0; clearidx<this.valuelist.length; clearidx++)
             this.valuelist[clearidx].setColor("black")
          this.script.push(this.makescene())
          
       }    
       this.script.push(this.makescene())
       sublistcount = Math.floor(sublistcount/2)
    }

	this.script.push(this.makescene())
	
	return this.script
}

ShellSortModel.prototype.makescene = function()
{
   var newscene = new Array()
   for (var idx=0; idx<this.valuelist.length; idx++)
   {
	  var item = this.valuelist[idx].clone()   //make a copy
	  newscene.push(item)
   }   
   
   return newscene
}


MergeSortModel = function()  //construct the model
{
}
    
MergeSortModel.prototype.init = function(ctl)
{
	this.mycontroller = ctl

	this.valuelist = new Array()
	var howmany = 15
   
	for (var i=0; i<howmany; i++)
	{
	  var min = 5
	  var max = 300
	  var y = Math.floor(Math.random() * (max - min + 1)) + min
   
	  var item = new DataItem(i,y,"black")
	  this.valuelist.push(item)
	}
	
	this.script = new Array()
	this.script.push(this.makescene(this.valuelist))

    this.domergesort(0,this.valuelist.length-1)
    
    this.script.push(this.makescene(this.valuelist))
    return this.script
}

MergeSortModel.prototype.chunkcolor=function(start,end,c)
{
    for (var clearidx=start; clearidx<=end; clearidx++)
         this.valuelist[clearidx].setColor(c)
}

MergeSortModel.prototype.domergesort = function(start,end)
{   len = end-start + 1
    if (len>1)
    {
        var mid = start + Math.floor(len/2)

        this.chunkcolor(start,mid-1,"red")
        this.script.push(this.makescene(this.valuelist))
        this.chunkcolor(start,mid-1,"black")
        this.domergesort(start,mid-1)

        this.chunkcolor(mid,end,"blue")
        this.script.push(this.makescene(this.valuelist))
        this.chunkcolor(mid,end,"black")
        this.domergesort(mid,end)

        var i=start
        var j=mid

        var newlist = Array()
        while (i<mid && j<=end)
        {
            if (this.valuelist[i].getValue()<this.valuelist[j].getValue())
            {
                newlist.push(this.valuelist[i])
                i=i+1
            }
            else
            {
                newlist.push(this.valuelist[j])
                j=j+1
            }

        }
 
        while (i<mid)
        {
            newlist.push(this.valuelist[i])
            i=i+1
        }

        while (j<=end)
        {
            newlist.push(this.valuelist[j])
            j=j+1
        }
        this.copyback(newlist,start)
        this.chunkcolor(start,end,"red")
        this.script.push(this.makescene(this.valuelist))
        this.chunkcolor(start,end,"black")
    }
}

MergeSortModel.prototype.copyback = function(original,i,j) //make copy from i to j excl
{
   var newcopy = new Array()
   for (var idx=0; idx<original.length; idx++)
   {
	  var item = original[idx].clone()   //make a copy
	  this.valuelist[i] = item
	  i=i+1
   }   
}


MergeSortModel.prototype.makecopy = function(original,i) //make copy to i
{

   for (var idx=0; idx<original.length; idx++)
   {
	  var item = original[idx].clone()   //make a copy
	  this.valuelist[i] = item
	  i++
   }   
   
   return newcopy
}

MergeSortModel.prototype.makescene = function(somearray)
{
   var newscene = new Array()
   for (var idx=0; idx<somearray.length; idx++)
   {
	  var item = somearray[idx].clone()   //make a copy
	  newscene.push(item)
   }   
   
   return newscene
}


QuickSortModel = function()  //construct the model
{
}
    
QuickSortModel.prototype.init = function(ctl)
{
	this.mycontroller = ctl

	this.valuelist = new Array()
	var howmany = 15
   
	for (var i=0; i<howmany; i++)
	{
	  var min = 5
	  var max = 300
	  var y = Math.floor(Math.random() * (max - min + 1)) + min
   
	  var item = new DataItem(i,y,"black")
	  this.valuelist.push(item)
	}
	
	this.script = new Array()
	this.script.push(this.makescene(this.valuelist))

    this.quickSort(this.valuelist)
    
    this.script.push(this.makescene(this.valuelist))
    return this.script
}

QuickSortModel.prototype.quickSort=function(alist)
{
   this.quickSortHelper(alist,0,alist.length-1)
}

QuickSortModel.prototype.quickSortHelper=function(alist,first,last)
{
   if (first<last)
   {
       var splitpoint = this.partition(alist,first,last)

       this.chunkcolor(first,splitpoint-1,"red")
       this.script.push(this.makescene(this.valuelist))
       this.chunkcolor(first,splitpoint-1,"black")
       this.script.push(this.makescene(this.valuelist))
      
       this.chunkcolor(splitpoint+1,last,"red")
       this.script.push(this.makescene(this.valuelist))
       this.chunkcolor(splitpoint+1,last,"black")
       this.script.push(this.makescene(this.valuelist))
       this.quickSortHelper(alist,first,splitpoint-1)
       this.quickSortHelper(alist,splitpoint+1,last)
   }
}


QuickSortModel.prototype.partition = function(alist,first,last)
{
   var pivotvalue = alist[first].getValue()
   alist[first].setColor("red")
   this.script.push(this.makescene(this.valuelist))
   

   var leftmark = first+1
   var rightmark = last
   alist[leftmark].setColor("blue")
   alist[rightmark].setColor("blue")
   this.script.push(this.makescene(this.valuelist))
   
   
   var done = false
   while (! done)
   {

       while (leftmark <= rightmark && alist[leftmark].getValue() <= pivotvalue)
       {      
           alist[leftmark].setColor("black")
           leftmark = leftmark + 1
           if (leftmark <= rightmark)
           {
              alist[leftmark].setColor("blue")
              this.script.push(this.makescene(this.valuelist))}
       }
       while (alist[rightmark].getValue() >= pivotvalue && rightmark >= leftmark)
       {
           alist[rightmark].setColor("black")
           rightmark = rightmark - 1
           if (rightmark >= leftmark)
           {
              alist[rightmark].setColor("blue")
              this.script.push(this.makescene(this.valuelist))}
       }
       
       if (rightmark < leftmark)
           done = true
       else
       {   
           temp = alist[leftmark]
           alist[leftmark] = alist[rightmark]
           alist[rightmark] = temp
           this.script.push(this.makescene(this.valuelist))
           alist[leftmark].setColor("black")
           alist[rightmark].setColor("black")
       }
   }

   var temp = alist[first]
   alist[first] = alist[rightmark]
   alist[rightmark] = temp
   
   alist[first].setColor("black")
   alist[rightmark].setColor("red")
   this.script.push(this.makescene(this.valuelist))
   this.chunkcolor(0,this.valuelist.length-1,"black")
   this.script.push(this.makescene(this.valuelist))


   return rightmark
}

QuickSortModel.prototype.chunkcolor=function(start,end,c)
{
    for (var clearidx=start; clearidx<=end; clearidx++)
         this.valuelist[clearidx].setColor(c)
}


QuickSortModel.prototype.makescene = function(somearray)
{
   var newscene = new Array()
   for (var idx=0; idx<somearray.length; idx++)
   {
	  var item = somearray[idx].clone()   //make a copy
	  newscene.push(item)
   }   
   
   return newscene
}

