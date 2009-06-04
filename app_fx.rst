


Recommendations for further reading
===================================

So where do you go from here? There are many directions to pursue,
extending your knowledge of Python specifically and computer science
in general.

The examples in this book have been deliberately simple, but they may
not have shown off Python's most exciting capabilities. Here is a
sampling of extensions to Python and suggestions for projects that use
them.


#. GUI (graphical user interface) programming lets your program use a
   windowing environment to interact with the user and display graphics.
#. The oldest graphics package for Python is Tkinter, which is based
   on Jon Ousterhout's Tcl and Tk scripting languages. Tkinter comes
   bundled with the Python distribution.
#. Another popular platform is wxPython, which is essentially a Python
   veneer over wxWindows, a C++ package which in turn implements windows
   using native interfaces on Windows and Unix (including Linux)
   platforms. The windows and controls under wxPython tend to have a more
   native look and feel than those of Tkinter and are somewhat simpler to
   program.
#. Any type of GUI programming will lead you into event-driven
   programming, where the user and not the programmer determines the flow
   of execution. This style of programming takes some getting used to,
   sometimes forcing you to rethink the whole structure of a program.
#. Web programming integrates the Python with the Internet. For
   example, you can build web client programs that open and read a remote
   web page (almost) as easily as you can open a file on disk. There are
   also Python modules that let you access remote files via ftp, and
   modules to let you send and receive email. Python is also widely used
   for web server programs to handle input forms.
#. Databases are a bit like super files where data is stored in
   predefined schemas, and relationships between data items let you
   access the data in various ways. Python has several modules to enable
   users to connect to various database engines, both free and
   proprietary.
#. Thread programming lets you run several threads of execution within
   a single program. If you have had the experience of using a web
   browser to scroll the beginning of a page while the browser continues
   to load the rest of it, then you have a feel for what threads can do.
#. When speed is paramount Python extensions may be written in a
   compiled language like C or C++. Such extensions form the base of many
   of the modules in the Python library. The mechanics of linking
   functions and data is somewhat complex. SWIG (Simplified Wrapper and
   Interface Generator) is tool to make the process much simpler.



Python-related web sites and books
----------------------------------

Here are the authors' recommendations for Python resources on the web:


#. The Python home page at `www.python.org` is the place to start your
   search for any Python related material. You will find help,
   documentation, links to other sites and SIG (Special Interest Group)
   mailing lists that you can join.
#. The Open Book Project `www.ibiblio.com/obp` contains not only this
   book online but also similar books for Java and C++ by Allen Downey.
   In addition there are *Lessons in Electric Circuits* by Tony R.
   Kuphaldt, *Getting down with ...*, a set of tutorials on a range of
   computer science topics, written and edited by high school students,
   *Python for Fun*, a set of case studies in Python by Chris Meyers, and
   *The Linux Cookbook* by Michael Stultz, with 300 pages of tips and
   techniques.
#. Finally if you go to Google and use the search string python -snake
   -monty you will get about 750,000 hits.


And here are some books that contain more material on the Python
language:


#. *Core Python Programming* by Wesley Chun is a large book at about
   750 pages. The first part of the book covers the basic Python language
   features. The second part provides an easy-paced introduction to more
   advanced topics including many of those mentioned above.
#. *Python Essential Reference* by David M. Beazley is a small book,
   but it is packed with information both on the language itself and the
   modules in the standard library. It is also very well indexed.
#. *Python Pocket Reference* by Mark Lutz really does fit in your
   pocket. Although not as extensive as *Python Essential Reference* it
   is a handy reference for the most commonly used functions and modules.
   Mark Lutz is also the author of *Programming Python*, one of the
   earliest (and largest) books on Python and not aimed at the beginning
   programmer. His later book *Learning Python* is smaller and more
   accessible.
#. *Python Programming on Win32* by Mark Hammond and Andy Robinson is
   a must have for anyone seriously using Python to develop Windows
   applications. Among other things it covers the integration of Python
   and COM, builds a small application with wxPython, and even uses
   Python to script windows applications such as Word and Excel.



Recommended general computer science books
------------------------------------------

The following suggestions for further reading include many of the
authors' favorite books. They deal with good programming practices and
computer science in general.


#. *The Practice of Programming* by Kernighan and Pike covers not only
   the design and coding of algorithms and data structures, but also
   debugging, testing and improving the performance of programs. The
   examples are mostly C++ and Java, with none in Python.
#. *The Elements of Java Style* edited by Al Vermeulen is another
   small book that discusses some of the finer points of good
   programming, such as good use of naming conventions, comments, and
   even whitespace and indentation (somewhat of a nonissue in Python).
   The book also covers programming by contract, using assertions to
   catch errors by testing preconditions and postconditions, and proper
   programming with threads and their synchronization.
#. *Programming Pearls* by Jon Bentley is a classic book. It consists
   of case studies that originally appeared in the author's column in the
   *Communications of the ACM*. The studies deal with tradeoffs in
   programming and why it is often an especially bad idea to run with
   your first idea for a program. The book is a bit older than those
   above (1986), so the examples are in older languages. There are lots
   of problems to solve, some with solutions and others with hints. This
   book was very popular and was followed by a second volume.
#. *The New Turing Omnibus* by A.K Dewdney provides a gentle
   introduction to 66 topics of computer science ranging from parallel
   computing to computer viruses, from cat scans to genetic algorithms.
   All of the topics are short and entertaining. An earlier book by
   Dewdney *The Armchair Universe* is a collection from his column
   *Computer Recreations* in *Scientific American*. Both books are rich
   source of ideas for projects.
#. *Turtles, Termites and Traffic Jams* by Mitchel Resnick is about
   the power of decentralization and how complex behavior can arise from
   coordinated simple activity of a multitude of agents. It introduces
   the language StarLogo, which allows the user to write programs for the
   agents. Running the program demonstrates complex aggregate behavior,
   which is often counterintuitive. Many of the programs in the book were
   developed by students in middle school and high school. Similar
   programs could be written in Python using simple graphics and threads.
#. *Godel, Escher and Bach* by Douglas Hofstadter. Put simply, if you
   found magic in recursion you will also find it in this bestselling
   book. One of Hofstadter's themes involves strange loops where patterns
   evolve and ascend until they meet themselves again. It is Hofstadter's
   contention that such strange loops are an essential part of what
   separates the animate from the inanimate. He demonstrates such
   patterns in the music of Bach, the pictures of Escher and Godel's
   incompleteness theorem.



