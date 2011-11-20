Working with Data Files
=======================

So far, the data we have used in this book have all been either coded right into the program, or have been entered by the user.  In real life data reside in files.  For example the images we worked with in the image processing unit ultimately live in files on your hard drive.  Web pages, and word processing documents, and music are other examples of data that live in files.  In this short chapter we will introduce the Python concepts necessary to use data from files in our programs.

For our purposes, we will assume that our data files are text files--that is, files filled with characters. The Python programs that you write are stored as text files.  We can create these files in any of a number of ways. For example, we could use a text editor to type in and save the data.  We could also download the data from a website and then save it in a file. Regardless of how the file is created, Python will allow us to manipulate the contents.

In Python, we must **open** files before we can use them and **close** them when we are done with them. As you might expect, once a file is opened it becomes a Python object just like all other data. :ref:`Table 1<filemethods1a>` shows the methods that can be used to open and close files.

.. _filemethods1a:

================ ======================== =====================================================
**Method Name**   **Use**                  **Explanation**
================ ======================== =====================================================
``open``          ``open(filename,'r')``    Open a file called filename and use it for reading.  This will return a reference to a file object. 
``open``          ``open(filename,'w')``    Open a file called filename and use it for writing.  This will also return a reference to a file object. 
``close``        ``filevariable.close()``   File use is complete. 
================ ======================== =====================================================

Finding a File on your Disk
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Opening a file requires that you, as a programmer, and Python agree about the location of the file on your disk.  The way that files are located on disk is by their **path**  You can think of the filename as the short name for a file, and the path as the full name.  For example on a Mac if you save the file ``hello.txt`` in your home directory the path to that file is ``/Users/yourname/hello.txt``  On a Windows machine the path looks a bit different but the same principles are in use.  For example on windows the path might be ``C:\Users\yourname\My Documents\hello.txt``

You can access files in folders, also called directories, under your home directory by adding a slash and the name of the folder.  For example we have been storing files to use with PyCharm in the CS150 folder inside the PyCharmProjects folder under your home directory.  The full name for ``hello.py`` stored in the CS150 folder would be ``/Users/yourname/PyCharmProjects/CS150/hello.py``

Here's the important rule to remember:  If your file and your Python program are in the same directory you can simply use the filename. ``open('myfile.txt','r')`` If your file and your Python program are in different directories then you should use the path to the file ``open(/Users/joebob01/myfile.txt)``.

Reading a File
~~~~~~~~~~~~~~

As an example, suppose we have a text file called ``qbdata.txt`` that contains
the following data representing statistics about NFL quarterbacks. Although it
would be possible to consider entering this data by hand each time it is used,
you can imagine that it would be time-consuming and error-prone to do this. In
addition, it is likely that there could be data from more quarterbacks and
other years. The format of the data file is as follows
::

    First Name, Last Name, Position, Team, Completions, Attempts, Yards, TDs Ints, Comp%, Rating

.. raw:: html

	<pre id="qbdata.txt">
    Colt McCoy QB, CLE  135 222 1576    6   9   60.8%   74.5
    Josh Freeman QB, TB 291 474 3451    25  6   61.4%   95.9
    Michael Vick QB, PHI    233 372 3018    21  6   62.6%   100.2
    Matt Schaub QB, HOU 365 574 4370    24  12  63.6%   92.0
    Philip Rivers QB, SD    357 541 4710    30  13  66.0%   101.8
    Matt Hasselbeck QB, SEA 266 444 3001    12  17  59.9%   73.2
    Jimmy Clausen QB, CAR   157 299 1558    3   9   52.5%   58.4
    Joe Flacco QB, BAL  306 489 3622    25  10  62.6%   93.6
    Kyle Orton QB, DEN  293 498 3653    20  9   58.8%   87.5
    Jason Campbell QB, OAK  194 329 2387    13  8   59.0%   84.5
    Peyton Manning QB, IND  450 679 4700    33  17  66.3%   91.9
    Drew Brees QB, NO   448 658 4620    33  22  68.1%   90.9
    Matt Ryan QB, ATL   357 571 3705    28  9   62.5%   91.0
    Matt Cassel QB, KC  262 450 3116    27  7   58.2%   93.0
    Mark Sanchez QB, NYJ    278 507 3291    17  13  54.8%   75.3
    Brett Favre QB, MIN 217 358 2509    11  19  60.6%   69.9
    David Garrard QB, JAC   236 366 2734    23  15  64.5%   90.8
    Eli Manning QB, NYG 339 539 4002    31  25  62.9%   85.3
    Carson Palmer QB, CIN   362 586 3970    26  20  61.8%   82.4
    Alex Smith QB, SF   204 342 2370    14  10  59.6%   82.1
    Chad Henne QB, MIA  301 490 3301    15  19  61.4%   75.4
    Tony Romo QB, DAL   148 213 1605    11  7   69.5%   94.9
    Jay Cutler QB, CHI  261 432 3274    23  16  60.4%   86.3
    Jon Kitna QB, DAL   209 318 2365    16  12  65.7%   88.9
    Tom Brady QB, NE    324 492 3900    36  4   65.9%   111.0   
    Ben Roethlisberger QB, PIT  240 389 3200    17  5   61.7%   97.0
    Kerry Collins QB, TEN   160 278 1823    14  8   57.6%   82.2
    Derek Anderson QB, ARI  169 327 2065    7   10  51.7%   65.9
    Ryan Fitzpatrick QB, BUF    255 441 3000    23  15  57.8%   81.8
    Donovan McNabb QB, WAS  275 472 3377    14  15  58.3%   77.1
    Kevin Kolb QB, PHI  115 189 1197    7   7   60.8%   76.1
    Aaron Rodgers QB, GB    312 475 3922    28  11  65.7%   101.2
    Sam Bradford QB, STL    354 590 3512    18  15  60.0%   76.5
    Shaun Hill QB, DET  257 416 2686    16  12  61.8%   81.3
    </pre>

To open this file, we would call the ``open`` function. The variable,
``fileref``, now holds a reference to the file object returned by
``open``. When we are finished with the file, we can close it by using
the ``close`` method. After the file is closed any further attempts to
use ``fileref`` will result in an error.

    ::

            >>>fileref = open("qbdata.txt","r")
            >>>
            >>>fileref.close()
            >>>

Iterating over lines in a file
------------------------------


We will now use this file as input in a program that will do some data
processing. In the program, we will **read** each line of the file and
print it with some additional text. Because text files are sequences of
lines of text, we can use the *for* loop to iterate through each line of
the file.

A **line** of a file is defined to be a sequence of characters up to and
including a special character called the **newline** character. If you
evaluate a string that contains a newline character you will see the
character represented as ``\n``. If you print a string that contains a
newline you will not see the ``\n``, you will just see its effects. When
you are typing a Python program and you press the enter or return key on
your keyboard, the editor inserts a newline character into your text at
that point.

As the *for* loop iterates through each line of the file the loop
variable will contain the current line of the file as a string of
characters. The general pattern for processing each line of a text file
is as follows:

::

        for line in myFile:
            statement1
            statement2
            ...

To process all of our quarterback data, we will use a *for* loop to iterate over the lines of the file. Using
the ``split`` method, we can break each line into a list containing all the fields of interest about the
quarterback. We can then take the values corresponding to first name, lastname, and passer rating to
construct a simple sentence as shown in :ref:`Listing 1 <readingfile1>`. 

.. _readingfile1:

.. activecode:: files_for

    qbfile = open("qbdata.txt","r")

    for aline in qbfile:
        values = aline.split()
        print('QB ', values[0], values[1], 'had a rating of ', values[-1] )

    qbfile.close()



Alternative File Reading Methods
--------------------------------


In addition to the ``for`` loop, Python provides three methods to read data
from the input file. The ``readline`` method reads one line from the file and
returns it as a string. The string returned by ``readline`` will contain the
newline character at the end. This method returns the empty string when it
reaches the end of the file. The ``readlines`` method returns the contents of
the entire file as a list of strings, where each item in the list represents
one line of the file. It is also possible to read the entire file into a
single string with ``read``. :ref:`Table 2 <filemethods2a>` summarizes these methods
and :ref:`Session 2 <filesession>` shows them in action.

Note that we need to reopen the file before each read so that we start from
the beginning. Each file has a marker that denotes the current read position
in the file. Any time one of the read methods is called the marker is moved to
the character immediately following the last character returned. In the case
of ``readline`` this moves the marker to the first character of the next line
in the file. In the case of ``read`` or ``readlines`` the marker is moved to
the end of the file.

.. _filesession:

::

    >>> infile = open("qbdata.txt","r")
    >>> aline = infile.readline()
    >>> aline
    'Colt McCoy QB, CLE\t135\t222\t1576\t6\t9\t60.8%\t74.5\n'
    >>> 
    >>> infile = open("qbdata.txt","r")
    >>> linelist = infile.readlines()
    >>> print(len(linelist))
    34
    >>> print(linelist[0:4])
    ['Colt McCoy QB, CLE\t135\t222\t1576\t6\t9\t60.8%\t74.5\n',
     'Josh Freeman QB, TB\t291\t474\t3451\t25\t6\t61.4%\t95.9\n',
     'Michael Vick QB, PHI\t233\t372\t3018\t21\t6\t62.6%\t100.2\n',
     'Matt Schaub QB, HOU\t365\t574\t4370\t24\t12\t63.6%\t92.0\n']
    >>> 
    >>> infile = open("qbdata.txt","r")
    >>> filestring = infile.read()
    >>> print(len(filestring))
    1708
    >>> print(filestring[:256])
    Colt McCoy QB, CLE	135	222	1576	6	9	60.8%	74.5
    Josh Freeman QB, TB	291	474	3451	25	6	61.4%	95.9
    Michael Vick QB, PHI	233	372	3018	21	6	62.6%	100.2
    Matt Schaub QB, HOU	365	574	4370	24	12	63.6%	92.0
    Philip Rivers QB, SD	357	541	4710	30	13	66.0%	101.8
    Matt Ha
    >>>

.. _filemethods2a:

======================== =========================== ===================================== 
**Method Name**           **Use**                     **Explanation**
======================== =========================== ===================================== 
``write``                 ``filevar.write(astring)``  Add astring to the end of the file. 
                                                      filevar must refer to a file that has 
                                                      been  opened for writing. 
``read(n)``               ``filevar.read()``          Reads and returns a string of ``n`` 
                                                      characters, or the entire file as a 
                                                      single string if  n is not provided. 
``readline(n)``           ``filevar.readline()``      Returns the next line of the file with
                                                      all text up to and including the 
                                                      newline character. If n is provided as 
                                                      a parameter than only n characters 
                                                      will be returned if the line is longer 
                                                      than ``n``. 
``readlines(n)``          ``filevar.readlines()``     Returns a list of ``n`` strings, each 
                                                      representing a single line of the file. 
                                                      If n is not provided then all lines of
                                                      the file are returned. 
======================== =========================== ===================================== 

Now lets look at another method of reading our file using a ``while`` loop.  This important because many other programming languages do not support the ``for`` loop style for reading file but they do support the pattern we'll show you here.

.. activecode:: files_while

    infile = open("qbdata.txt","r")
    line = infile.readline()
    while line:
        values = line.split()
        print('QB ', values[0], values[1], 'had a rating of ', values[-1] )
        line = infile.readline()

    infile.close()

The important thing to notice is that on line two we have the statement ``line = infile.readline()``  This is very important because the while condition needs to have a value for the ``line`` variable.  We call this initial read the **priming read**.

Glossary
--------

.. glossary::


   open
      You must open a file before you can read its contents.

   close
      When you are done with a file, you should close it.

   read
	  Will read the entire contents of a file as a string.  This is often used in an assignment statement 
	  so that a variable can reference the contents of the file.
	
   readline
      Will read a single line from the file, up to and including the first instance of the newline character.

   readlines
     Will read the entire contents of a file into a list where each line of the file is a string and is an element in the list.

Exercises
---------

The following sample file contains one line for each student in an imaginary class the students name is the first thing on each line, followed by some exam scores.

.. raw:: html

    <pre id="student_data.dat">
    joe 10 15 20 30 40
    bill 23 16 19 22
    sue 8 22 17 14 32 17 24 21 2 9 11 17
    grace 12 28 21 45 26 10
    john 14 32 25 16 89
    </pre>

#. Using the text file ``student_data.dat`` write a program that prints out the names of
   students that have more than six quiz scores.

   .. actex:: ex_10_1
   
#. Using the text file ``student_data.dat`` write a program that calculates the average grade
   for each student, and print out the student's name along with their average grade.

   .. actex:: ex_10_2

#. Using the text file ``student_data.dat`` write a program that calculates the minimum
   and maximum grade grade for each student.  Print out the students name along with their    
   minimum and maximum scores.

   .. actex:: ex_10_3

Here is a file called ``lab_data.dat`` that contains some sample data from a lab experiment.

.. raw:: html

	<pre id='lab_data.dat'>
    44 71
    79 37
    78 24
    41 76
    19 12
    19 32
    28 36
    22 58
    89 92
    91 6
    53 7
    27 80
    14 34
    8 81
    80 19
    46 72
    83 96
    88 18
    96 48
    77 67
	</pre>
	
4. 	Using the data file ``lab_data.data`` each line contains a an x,y coordinate pair. 
    Write a function called ``plotRegression`` that reads the data from this file
    and uses a turtle to plot those points and a best fit line according to the following 
    formulas:
    
	.. math::

	   y = \bar{y} + m(x - \bar{x})
	   
	   m = \frac{\sum{x_iy_i - n\bar{x}\bar{y}}}{\sum{x_i^2}-n\bar{x}^2}

	Where :math:`\bar{x}` is the mean of the x-values, :math:`\bar{y}` is the mean of the y-
	values and :math:`n` is the number of points.  If you are not familiar with the 
	mathematical :math:`\sum` it is the sum operation.  For example :math:`\sum{x_i}`
	means to add up all the x values.

	Your program should analyze the points and correctly scale the window using 
	``setworldcoordinates`` so that that each point can be plotted.  Then you should
	draw the best fit line, in a different color, through the points.	

    .. actex:: ex_10_4
    
5.  At the end of this chapter is a very long file called ``mystery.dat`` The lines of this 
    file contain either the word UP or DOWN or a pair of numbers.  UP and DOWN are instructions
    for a turtle to lift up or put down its tail.  The pair of numbers are some x,y coordinates.
    Write a program that reads the file ``mystery.dat`` and uses the turtle to draw the picture
    described by the commands and the set of points.
    
    .. actex:: ex_10_5
    
.. raw:: html

   <pre id="mystery.dat">
   UP
   32 435
   DOWN
   10 439
   4 438
   2 433
   4 428
   6 425
   10 420
   15 416
   21 413
   30 408
   42 406
   47 403
   56 398
   63 391
   71 383
   79 369
   84 356
   87 337
   89 316
   88 302
   86 294
   83 278
   79 256
   78 235
   79 220
   85 204
   94 190
   98 183
   98 182
   UP
   116 189
   DOWN
   105 184
   98 172
   98 156
   93 141
   93 132
   99 122
   104 115
   104 114
   UP
   153 116
   DOWN
   152 112
   153 107
   154 93
   154 81
   152 67
   146 56
   140 47
   136 39
   133 30
   130 17
   128 7
   127 3
   93 2
   93 10
   96 16
   96 20
   97 21
   101 24
   104 27
   105 31
   107 36
   108 40
   109 47
   111 51
   114 58
   118 66
   120 71
   118 79
   117 88
   116 97
   112 105
   107 113
   107 118
   108 126
   112 138
   116 146
   118 148
   UP
   153 95
   DOWN
   158 99
   159 103
   161 108
   161 115
   160 121
   160 122
   UP
   156 80
   DOWN
   167 79
   182 76
   203 73
   220 78
   235 79
   239 80
   UP
   262 154
   DOWN
   259 141
   259 123
   257 110
   255 93
   259 86
   272 74
   287 46
   290 41
   299 30
   305 21
   307 15
   307 12
   300 11
   299 9
   301 2
   303 1
   313 5
   320 7
   307 1
   312 0
   321 0
   325 0
   331 0
   336 2
   336 8
   334 18
   335 24
   331 29
   327 39
   323 45
   317 54
   312 63
   308 70
   301 79
   297 86
   296 97
   300 109
   303 120
   304 126
   307 138
   306 148
   305 152
   UP
   298 86
   DOWN
   304 92
   310 104
   314 114
   314 119
   UP
   255 98
   DOWN
   251 100
   246 105
   242 112
   236 122
   231 131
   233 126
   UP
   271 73
   DOWN
   264 74
   257 76
   244 76
   236 80
   231 84
   230 86
   UP
   242 77
   DOWN
   242 70
   245 61
   246 49
   248 39
   249 30
   248 19
   245 12
   242 9
   241 6
   243 1
   256 3
   259 2
   266 3
   271 4
   274 9
   277 16
   277 24
   277 31
   277 41
   277 48
   278 57
   278 62
   278 66
   UP
   190 73
   DOWN
   191 64
   193 51
   194 39
   191 25
   189 17
   185 7
   184 5
   177 4
   169 4
   166 4
   159 5
   159 6
   162 19
   163 25
   165 32
   165 39
   165 47
   165 57
   162 65
   161 70
   159 75
   158 78
   157 80
   UP
   96 157
   DOWN
   93 163
   88 176
   82 184
   78 193
   75 201
   72 212
   72 224
   72 238
   73 254
   75 267
   78 277
   82 286
   89 298
   89 300
   UP
   33 428
   DOWN
   33 428
   33 427
   35 426
   36 425
   30 427
   27 428
   27 428
   28 428
   UP
   2 435
   DOWN
   5 434
   10 432
   13 431
   16 429
   19 427
   21 426
   22 425
   24 424
   26 423
   27 423
   30 422
   33 422
   34 421
   36 420
   36 419
   UP
   32 436
   DOWN
   55 423
   67 415
   75 409
   86 401
   92 395
   98 389
   105 378
   107 372
   111 362
   112 355
   116 345
   119 338
   121 328
   124 317
   125 312
   125 304
   126 294
   125 288
   124 280
   125 277
   125 258
   124 255
   125 241
   128 235
   135 225
   141 218
   147 211
   155 208
   166 205
   178 203
   194 202
   209 203
   219 204
   232 205
   249 206
   259 207
   284 205
   300 198
   317 189
   333 182
   345 170
   362 153
   392 135
   430 118
   450 104
   477 91
   509 75
   539 65
   567 61
   599 60
   625 59
   635 58
   632 54
   616 51
   602 46
   593 46
   580 45
   565 41
   546 38
   526 36
   502 42
   487 48
   468 53
   452 57
   434 63
   414 71
   397 77
   378 82
   366 86
   352 90
   338 92
   328 91
   319 88
   307 86
   306 85
   301 85
   UP
   318 106
   DOWN
   333 107
   346 109
   359 111
   369 104
   391 100
   411 95
   431 87
   445 81
   458 71
   473 63
   491 59
   497 57
   499 56
   UP
   244 109
   DOWN
   235 104
   221 100
   208 96
   199 97
   190 98
   190 98
   UP
   160 116
   DOWN
   165 119
   171 122
   172 127
   170 135
   168 144
   170 149
   174 149
   UP
   169 118
   DOWN
   174 120
   179 124
   178 126
   UP
   293 132
   DOWN
   294 125
   297 115
   291 94
   287 90
   290 84
   297 79
   297 79
   UP
   144 97
   DOWN
   143 83
   144 72
   141 58
   136 52
   134 49
   </pre>
   mystery.dat
   