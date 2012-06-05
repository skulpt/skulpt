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

BinarySearchModel = function()  //construct the model
{
}
    
BinarySearchModel.prototype.init = function(ctl)
{
	this.mycontroller = ctl

	this.valuelist = new Array()
	var howmany = 25
    var initvalues=[25,30,46,55,60,78,90,95,101,110,122,134,145,150,166,175,187,200,205,213,240,255,267,299]
	for (var i=0; i<howmany; i++)
	{
	  var item = new DataItem(i,initvalues[i],"black")
	  this.valuelist.push(item)
	}
	
	this.script = new Array()
	//this.script.push(this.makescene(this.valuelist))

    this.binarySearch(this.valuelist,200)
    
    this.script.push(this.makescene(this.valuelist))
    return this.script
}

BinarySearchModel.prototype.binarySearch=function(alist, item)
{     
    var first = 0
    var last = alist.length-1
    var found = false
    var oldmidpoint = null
    
    while (first<=last && !found)
    {                this.chunkcolor(first,last,"black")
                this.script.push(this.makescene(this.valuelist))
                if (oldmidpoint != null)
                   {alist[oldmidpoint].setColor("black")
                    this.script.push(this.makescene(this.valuelist))}
        var midpoint = Math.floor((first + last)/2)
        alist[midpoint].setColor("blue")
        this.script.push(this.makescene(this.valuelist))
        //alist[midpoint].setColor("black")
        //this.script.push(this.makescene(this.valuelist))
        if (alist[midpoint].getValue() == item)
        {
            found = true
            alist[midpoint].setColor("green")
            this.script.push(this.makescene(this.valuelist))
        }   
        else
            if (item < alist[midpoint].getValue())
            {
                last = midpoint-1
                this.chunkcolor(first,midpoint-1,"red")
                this.script.push(this.makescene(this.valuelist))
                oldmidpoint = midpoint
                //alist[midpoint].setColor("black")
                //this.script.push(this.makescene(this.valuelist))
            }
            else
            {
                first = midpoint+1
                this.chunkcolor(midpoint+1,last,"red")
                this.script.push(this.makescene(this.valuelist))
                oldmidpoint = midpoint
                //alist[midpoint].setColor("black")
                //this.script.push(this.makescene(this.valuelist))
            }
                
    }
    return found

}


BinarySearchModel.prototype.chunkcolor=function(start,end,c)
{
    for (var clearidx=start; clearidx<=end; clearidx++)
         this.valuelist[clearidx].setColor(c)
}


BinarySearchModel.prototype.makescene = function(somearray)
{
   var newscene = new Array()
   for (var idx=0; idx<somearray.length; idx++)
   {
	  var item = somearray[idx].clone()   //make a copy
	  newscene.push(item)
   }   
   
   return newscene
}

