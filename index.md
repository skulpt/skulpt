---
layout: default
title: Welcome!
description: This is my site. Welcome.
keywords: github pages, Jekyll, foundation 5
skulpt: true
---

<div class="row">
    <div class="small-12 small-centered column">
    <h1 class="mvl">Python. Client Side.</h1>
        <p>Skulpt is an <em>entirely in-browser</em> implementation of Python.</p>

        <p>No preprocessing, plugins, or server-side support required, just write
            Python and reload.</p>
    </div>

	<div class="medium-11 large-10 small-centered column">
        <div id="quickdocs" style="display: none">
            <ul>
                <li>cut/copy/paste/undo/redo with the usual shortcut keys</li>
                <li>Tab does decent indenting.
                    Thanks to <a href="http://codemirror.net/"
                                 target="_blank">CodeMirror</a> for the text editor.
                </li>
                <li>Ctrl-Enter to run, Shift-Enter to run selected</li>
                <!--
                <li>F9 to toggle breakpoints</li>
                <li>F10 to step over</li>
                <li>F11 to step in</li>
                <li>Shift-F11 to step out.</li>
                <li>You can inspect values with e.g. 'print foo' in the
                &quot;Interactive&quot; box. When debugging, this will
                execute in the debug context.</li>
                -->
            </ul>
        </div>
      </div>
</div>
<div class="row">
    <div class="large-6 small-12 columns">
    <textarea id="code" cols="85" rows="25">
import turtle

t = turtle.Turtle()

for c in ['red', 'green', 'yellow', 'blue']:
    t.color(c)
    t.forward(75)
    t.left(90)
    </textarea>
    <p>
    <button id="skulpt_run">Run</button>
    <a id="toggledocs" href="#">Help</a>, or examples:
        <a href="#" id="codeexample1">1</a>
        <a href="#" id="codeexample2">2</a>
        <a href="#" id="codeexample3">3</a>
        <a href="#" id="codeexample4">4</a>
        <a href="#" id="codeexample5">5</a>
        <a href="#" id="codeexample6">6</a>
        <a href="#" id="codeexample7">7</a>
        <a href="#" id="codeexample8">8</a>.
        Ctrl-Enter to run.
        </p>
    </div>
    <div class="large-6 small-12 columns">
        <div id="mycanvas" height="400" width="400"
                style="border-style: solid;"></div>
        <p><button id="clearoutput">Clear</button></p>
        <pre id="edoutput"></pre>
        </div>

</div>
<div class="row">
<div class="small-12 columns">
    <p>The code is run entirely in your browser, so don't feel
    obligated to &quot;crash the server&quot;, you'll only stub your
    toe. 
    </p>
    <h2>Interactive:</h2>
    <p>This is a very cool new feature that is just getting off the ground.  This would be a great project to jump in and help out on!</p>

    <textarea id="interactive" cols="85" rows="1"></textarea>



 
    
    <h2>What's New?</h2>
    <p>
        <ul>
            <li>Suspensions!  This may not mean a lot to you, but trust me its going to be big.  Suspensions provide the foundation for the asynchronous execution we need to build an interactive debugger, a smoother turtle module, enhanced urllib and other cool features.  For developers you should check out the time module and the suspensions.txt file under doc/.</li>
            <li>Stub implementations of the standard library modules. You will now get an unimplemented exceptions rather than some other file not found error.</li>
            <li>General cleanup and standardization of the code.  See the short description of the coding standards in the CONTRIBUTING file</li>
            <li>Loads of bugfixes: <a href="https://github.com/skulpt/skulpt/compare/0.9.2...0.9.4">see</a></li>
            <li><span style='font-family: "Consolas","Lucida Console","Monaco",monospace;'>slice()</span> function implemented. And improvements to list slicing.</li>
            <li><span style='font-family: "Consolas","Lucida Console","Monaco",monospace;'>string</span> and <span style='font-family: "Consolas","Lucida Console","Monaco",monospace;'>operator</span> module added.</li>
            <li>Keyword arguments for <span style='font-family: "Consolas","Lucida Console","Monaco",monospace;'>sorted()</span></li>
            <li><span style='font-family: "Consolas","Lucida Console","Monaco",monospace;'>text()</span> function in processing</li>
        </ul>
    </p>
    <p>By these awesome people:
            <a href="https://github.com/bnmnetp">Brad Miller</a>,
            <a href="https://github.com/rixner">Scott Rixner</a>,
            <a href="https://github.com/albertjan">Albert-Jan Nijburg</a>,
            <a href="https://github.com/mchat">Marie Chatfield</a>,
            <a href="https://github.com/isaacdontjelindell">Isaac Dontje Lindell</a>,
            <a href="https://github.com/jaspervdg">jaspervdg</a>,
            <a href="https://github.com/Lalaland">Ethan Steinberg</a>,
            <a href="https://github.com/Jeff-Tian">Jeff-Tian</a>,
            <a href="https://github.com/meredydd">Meredydd Luff</a> and
            <a href="https://github.com/LeszekSwirski">Leszek Swirski</a>
        </p>


    <h2>License</h2>

    <p>Skulpt may be licensed under:</p>
    <ol>
        <li>The <a href="http://www.opensource.org/licenses/mit-license.php">MIT license</a>.</li>
        <li>Or, for compatibility with Python, the <a
                href="http://www.opensource.org/licenses/PythonSoftFoundation.php">PSFLv2</a>.
        </li>
    </ol>

    <p> Please note that this dual license only applies to the part of Skulpt that
        is included in the runtime, and not necessarily to surrounding code for build
        processing or testing. Tests are run using <a
                href="http://code.google.com/p/v8/">V8</a>, and <a
                href="http://code.google.com/closure/compiler/">Closure Compiler</a>, and
        some test code is taken from the <a href="http://www.tinypy.org/">tinypy</a>
        and <a href="http://www.python.org/">Python</a> test suites, which may be
        distributed under different licensing terms. </p>

    <h2>About</h2>

    <p>The Father of skulpt is Scott Graham, you can find his blog here: <a href="http://www.h4ck3r.net/">personal page
        (and blog)</a></p>

    <p>My own personal page and blog is <a href="http://reputablejournal.com">Reputable Journal</a></p>

    </div>
</div>

<div class="footer">

    <p>
        Yes, I know how &quot;sculpt&quot; is spelled. The correct spelling was
        thoroughly reserved according to ICANN and search engines.
    </p>

</div>