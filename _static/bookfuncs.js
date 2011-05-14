/**
 * Created by IntelliJ IDEA.
 * User: bmiller
 * Date: 4/20/11
 * Time: 2:01 PM
 * To change this template use File | Settings | File Templates.
 */


function handleEdKeys(ed, e) {
    if (e.keyCode === 13) {
        if (e.ctrlKey) {
            e.stop();
            runit(ed.parentDiv);
        }
        else if (e.shiftKey) {
            e.stop();
            eval(Sk.importMainWithBody("<stdin>", false, ed.selection()));
        }
    }
}

cm_editors = {}


function outf(text) {
    var mypre = document.getElementById(Sk.pre);
    mypre.innerHTML = mypre.innerHTML + text;
}

function createEditors() {
    var edList = new Array();
    edList = document.getElementsByClassName("active_code");
    for (var i = 0; i < edList.length; i++) {
        newEdId = edList[i].id;
        cm_editors[newEdId] = CodeMirror.fromTextArea(edList[i], {
            mode: {name: "python",
                version: 2,
                singleLineStringErrors: false},
            lineNumbers: true,
            indentUnit: 4,
            tabMode: "indent",
            matchBrackets: true,
            onKeyEvent:handleEdKeys
        }
                );
        cm_editors[newEdId].parentDiv = edList[i].parentNode.id;
        //requestCode(edList[i].parentNode.id) // populate with user's code
    }

}

function builtinRead(x) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
        throw "File not found: '" + x + "'";
    return Sk.builtinFiles["files"][x];
}

function runit(myDiv) {
    //var prog = document.getElementById(myDiv + "_code").value;
    var editor = cm_editors[myDiv+"_code"];
    var prog = editor.getValue();
    var mypre = document.getElementById(myDiv + "_pre");
    mypre.innerHTML = '';
    Sk.canvas = myDiv + "_canvas";
    Sk.pre = myDiv + "_pre";
    var can = document.getElementById(Sk.canvas);
    // The following lines reset the canvas so that each time the run button
    // is pressed the turtle(s) get a clean canvas.
    if (can) {
        can.width = can.width;
        if (Sk.tg) {
            Sk.tg.canvasInit = false;
            Sk.tg.turtleList = [];
        }
    }
    // configure Skulpt output function, and module reader
    Sk.configure({output:outf,
                read: builtinRead
            });
    try {
        Sk.importMainWithBody("<stdin>", false, prog);
    } catch (e) {
        alert(e);
    }
}

function saveEditor(divName) {
    // get editor from div name
    var editor = cm_editors[divName+"_code"];
    var data = {acid:divName, code:editor.getValue()};
    jQuery.post("/saveprog",data);

}

function requestCode(divName) {
    var editor = cm_editors[divName+"_code"];
    var url = "/getprog"
    var data = {acid: divName}
    jQuery.get(url,data, loadEditor);
}

function loadEditor(data, status, whatever) {
    // function called when contents of database are returned successfully
    var res = eval(data)[0];
    var editor = cm_editors[res.acid+"_code"];
    if (res.source) {
        editor.setValue(res.source);
    }
    // need to get the divId back with the result...
}

function createActiveCode(divid) {
    var edNode = document.getElementById(divid);
    //edNode.style.display = 'none';
    edNode.style.backgroundColor = "white";
    var editor;
    editor = CodeMirror(edNode, {
                mode: {name: "python",
                    version: 2,
                    singleLineStringErrors: false},
                lineNumbers: true,
                indentUnit: 4,
                tabMode: "indent",
                matchBrackets: true,
                onKeyEvent:handleEdKeys
            });
    var myRun = function() {
        runit(divid);
    }
    var mySave = function() {
        saveEditor(divid);
    }
    var myLoad = function() {
        requestCode(divid);
    }
    cm_editors[divid+"_code"] = editor;
    var runButton = document.createElement("input");
    runButton.setAttribute('type','button');
    runButton.setAttribute('value','run');
    runButton.onclick = myRun;
    edNode.appendChild(runButton);
    var saveButton = document.createElement("input");
    saveButton.setAttribute('type','button');
    saveButton.setAttribute('value','save');
    saveButton.onclick = mySave;
    edNode.appendChild(saveButton);

    var loadButton = document.createElement("input");
    loadButton.setAttribute('type','button');
    loadButton.setAttribute('value','load');
    loadButton.onclick = myLoad;
    edNode.appendChild(loadButton);
    edNode.appendChild(document.createElement('br'));
    var newCanvas = edNode.appendChild(document.createElement("canvas"));
    newCanvas.id = divid+"_canvas";
    newCanvas.height = 400;
    newCanvas.width = 400;
    newCanvas.style.border = '2px solid black';
    var newPre = edNode.appendChild(document.createElement("pre"));
    newPre.id = divid + "_pre";
    newPre.className = "active_out";

    myLoad();
    $('#'+divid).modal({minHeight:700, minWidth: 410, maxWidth:450, containerCss:{width:420, height:750}});
}

function whilestep() {
    whileanimid = setInterval(animateWhile,500)
}

function animateWhile() {
    var lineEl = document.getElementById('linenum');
    line = lineEl.innerText;
    lnum = Number(line[line.length-1]);
    var prev = 'line'+(lnum-1);
    var ycond = document.getElementById('whilecond');
    if (ycond.innerText == 'false' && lnum == 1) {
        document.getElementById('line1').style.backgroundColor = '#d00';
        document.getElementById('whilecond').style.backgroundColor = '#d00';
        document.getElementById('line4').style.backgroundColor = '#fff';
        lineEl.innerText = 'line2'
        return;
    } else if  (ycond.innerText == 'false' && lnum == 2) {
        document.getElementById('line1').style.backgroundColor = "#fff";
        document.getElementById('line5').style.backgroundColor = "#ddd";
        clearInterval(whileanimid);
        return;
    }
    var pline;
    if (lnum-1 < 1) {
        pline = document.getElementById('line4');
    } else {
        pline = document.getElementById(prev)
    }
    if (pline) {
        pline.style.backgroundColor = '#fff';
    }
    document.getElementById(line).style.backgroundColor = '#ddd';
    if (Number(lnum)+1 > 4) {
        line = 'line1';
    } else
        line = 'line'+(lnum+1);
    lineEl.innerText = line;
    if (lnum == 2) {
        var xpos = document.getElementById('xcorval');
        var xposn = Number(xpos.innerText) + 10;
        xpos.innerHTML = xposn;
        if (xposn >=100) {
            ycond.innerHTML = 'false';
        }
    }

    
}


function comment(blockid) {
    $.modal('<iframe width="600" height="400" src="/getcomment?id='+blockid+'" style="background-color: white">', {
    //$.modal('<form><textarea name="content"></textarea><input type="submit" name="submit" > </form>', {
    overlayClose: true,
    closeHTML:"",
    containerCss:{
        width:600,
        height:400,
        backgroundColor: "#fff"
    }
            });
}

function checkBool(exp,selId,feedback,summary) {
    var res = eval(exp);
    var ans = eval(document.getElementById(selId).value);
    var sumEl = document.getElementById(summary);
    var sumTot = Number(sumEl.innerText);
    if (ans == res) {
        document.getElementById(feedback).innerHTML = 'correct';
        $("#"+feedback).html('correct');
        sumTot = sumTot + 1;
        sumEl.innerText = sumTot;
    } else {
        document.getElementById(feedback).innerHTML = 'incorrect';
    }
}

$(document).ready(createEditors);
