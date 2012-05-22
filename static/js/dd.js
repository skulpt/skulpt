

function allowDrop(ev)
{
   ev.preventDefault();
}

function drag(ev)
{
   ev.dataTransfer.setData("Text",ev.target.id);
   return true;
}

function drop(ev)
{
   var data=ev.dataTransfer.getData("Text");
   ev.target.appendChild(document.getElementById(data));
   ev.preventDefault();
}

function dragDefine(ev) {
	ev.dataTransfer.effectAllowed = 'move';
	ev.dataTransfer.setData("text/plain", ev.target.getAttribute('id'));
	ev.dataTransfer.setDragImage(ev.target, 0, 0);
	return true;
}

function addModBlock()
{
    var cboxes = document.getElementById("chapterboxes")
    var divelement = document.createElement('div')
    
    divelement.setAttribute("id","box2")
    divelement.setAttribute("class","boxclass")
    divelement.setAttribute("ondrop","drop(event)" )
    divelement.setAttribute("ondragover","allowDrop(event)")
    divelement.innerHTML='<input id="title" type="text" value="Your Section Title Here" name="label" />'
    
    cboxes.appendChild(divelement)
}

function displayContents()
{
   var cdiv = document.getElementById("chapterboxes")
   txt=""
   var cchildren = cdiv.childNodes
   
   var bchildren = cchildren[1].childNodes

   var txt=txt+bchildren[1].value + "<br/>";

   for (var i=3; i<bchildren.length; i++)
      {
        txt=txt + "ID="+bchildren[i].id +" "+ bchildren[i].innerHTML + "<br/>";
      };
   
   for (var c=3; c<cchildren.length; c=c+1)
   {
      var bchildren = cchildren[c].childNodes

      var txt=txt+bchildren[0].value + "<br/>";

      for (var i=1; i<bchildren.length; i++)
      {
        txt=txt + "ID="+bchildren[i].id +" "+ bchildren[i].innerHTML + "<br/>";
      };
   }
   var x=document.getElementById("output");  
   x.innerHTML=txt;
}

function buildIndexFile(projname)
{
   var cdiv = document.getElementById("chapterboxes")
   txt="projectname="+projname+"&toc="
   var cchildren = cdiv.childNodes
   
   var bchildren = cchildren[1].childNodes

   var txt=txt+bchildren[1].value + " ";

   for (var i=3; i<bchildren.length; i++)
      {
        txt=txt + bchildren[i].getAttribute("data-filename") + " ";
      };
   
   for (var c=3; c<cchildren.length; c=c+1)
   {
      var bchildren = cchildren[c].childNodes

      var txt=txt+bchildren[0].value + " ";

      for (var i=1; i<bchildren.length; i++)
      {
        txt=txt + bchildren[i].getAttribute("data-filename") + " ";
      };
   }
   //var x=document.getElementById("output");  
   window.location.href="makefile?"+txt
}

function displayItems(boxid)
{
   var bdiv = document.getElementById(boxid)
   var bchildren = bdiv.childNodes

   var txt=bchildren[1].value + "<br/>";
   console.log(bchildren.length)
   for (var i=3; i<bchildren.length; i++)
   {
     txt=txt + "ID="+bchildren[i].id +" "+ bchildren[i].innerHTML + "<br/>";
   };
   var x=document.getElementById("output");  
   x.innerHTML=txt;
}

function showDetails(dbid)
{
    console.log(dbid)
}

addH1 = function(theText)
{
   var newh1 = document.createElement("h1")
   newh1.innerHTML = theText
   document.body.appendChild(newh1)
}

