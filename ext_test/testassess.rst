Assessment Tests
----------------

This is a test of the assessment tools.  Right now there is only multiple choice.

.. multiplechoice:: test_question
   :iscode:
   :answer_a: __cmp__
   :answer_b: __repr___
   :answer_c: __init__
   :answer_d: None of the above
   :correct: a
   :feedback: -- Remember you need to compare to things to know if they are equal

   If you want test if two instances of a class are equal, which method should 
   you implement in your class definition?


If you got the answer correct, feel free to continue.  If you did not get the answer correct you may want to review the previous section, or watch this video.

Now here's another one:

.. multiplechoice:: test_two
   :iscode:
   :answer_a: __le__
   :answer_b: __gt___
   :answer_c: __eq__
   :answer_d: __gte__
   :answer_e: __ne__
   :correct: d
   :feedback: -- Try again

   Which of the following is NOT a relational operator?

You may want to practice implementing some of these operators in the Fraction class.


**Check your understanding**

.. mchoicema:: test_question6_1_1
   :answer_a: True
   :answer_b: 3 == 4
   :answer_c: 3 + 4
   :answer_d: 3 + 4 == 7
   :answer_e: &quot;False&quot;
   :correct: a,b,d
   :feedback_a: True and False are both Boolean literals.
   :feedback_b: The comparison between two numbers via == results in either True or False (in this case False),  both Boolean values.
   :feedback_c:  3+4 evaluates to 7, which is a number, not a Boolean value.
   :feedback_d: 3+4 evaluates to 7.  7 == 7 then evaluates to True, which is a Boolean value.
   :feedback_e: With the double quotes surrounding it, False is interpreted as a string, not a Boolean value.  If the quotes had not been included, False alone is in fact a Boolean value.

   Which of the following is a Boolean expression?  Select all that apply.


**Check your understanding**

.. mchoicemf:: test_question6_2_1
   :answer_a: x &gt; 0 and &lt; 5
   :answer_b: 0 &lt; x &lt; 5
   :answer_c: x &gt; 0 or x &lt; 5
   :answer_d: x &gt; 0 and x &lt; 5
   :correct: d
   :feedback_a: Each comparison must be between exactly two values.  In this case the right-hand expression &lt; 5 lacks a value on its left.
   :feedback_b: This is not legal syntax in Python.  To make multiple comparisons you must use and or or.
   :feedback_c: Although this is legal Python syntax, the expression is incorrect.  It will evaluate to true for all numbers that are either greater than 0 or less than 5.  Because all numbers are either greater than 0 or less than 5, this expression will always be True.
   :feedback_d: Yes, with an and keyword both expressions must be true so the number must be greater than 0 an less than 5 for this expression to be true.

   What is the correct Python expression for checking to see if a number stored in a variable x is between 0 and 5.
