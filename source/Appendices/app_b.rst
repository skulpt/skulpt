..  Copyright (C)  Jeffrey Elkner, Peter Wentworth, Allen B. Downey, Chris
    Meyers, and Dario Mitchell.  Permission is granted to copy, distribute
    and/or modify this document under the terms of the GNU Free Documentation
    License, Version 1.3 or any later version published by the Free Software
    Foundation; with Invariant Sections being Forward, Prefaces, and
    Contributor List, no Front-Cover Texts, and no Back-Cover Texts.  A copy of
    the license is included in the section entitled "GNU Free Documentation
    License".

An odds-and-ends Workbook
=========================

*This workbook is still very much under construction.*

The Five Strands of Proficiency
-------------------------------

This was an important study commissioned by the President in the USA. It
looked at what was needed for students to become proficient in maths.  

But it is also an amazingly accurate fit for what we need for proficiency
in Computer Science, or even for proficiency in playing Jazz! 

.. image:: Figures/strands.jpg  

#. **Procedural Fluency:**  Learn the syntax.  Learn to type.  Learn your way around your tools.
   Learn and practice your scales.  Learn to rearrange formulae.
#. **Conceptual Understanding:**  Understand why the bits fit together like they do.   
#. **Strategic Competence:**  Can you see what to do next?  
   Can you formulate this word problem into your
   notation?  Can you take the music where you want it to go?
#. **Adaptive Reasoning:** Can you see how to change what you've learnt for this new problem?
#. A **Productive Disposition:**  We need that *Can Do!* attitude! 
    a. You habitually think it is worthwhile studying this stuff.
    b. You are diligent and disciplined enough to grind through the tough stuff, 
       and to put in your practice hours.
    c. You develop a sense of *efficacy* --- that you can make things happen!

Check out http://mason.gmu.edu/~jsuh4/teaching/strands.htm, or 
Kilpatrick's book at http://www.nap.edu/openbook.php?isbn=0309069955 
    
    
Sending Email
-------------

Sometimes it is fun to do powerful things with Python --- remember
that part of the "productive disposition" we saw under the 
five threads of proficiency included *efficacy* --- the sense of 
being able to accomplish something useful.  Here is a Python
example of how you can send email to someone. 

.. sourcecode:: python
    :linenos:
    
    import smtplib, email.mime.text
    
    me = 'joe@my.org.com'                   # put your own email here
    fred = 'fred@his.org.com'               # and fred's email address here
    your_mail_server = 'mail.my.org.com'    # Ask your system administrator

    # Create a text message containing the body of the email.
    # You could read this from a file, of course.
    msg = email.mime.text.MIMEText("""Hey Fred,

    I'm having a party, please come at 8pm.
    Bring a plate of snacks and your own drinks.

    Joe""" )

    msg['From'] = me              # add some headers to the message object
    msg['To'] = fred
    msg['Subject'] = 'Party on Saturday 23rd'

    # create a connection to your mail server
    svr = smtplib.SMTP(your_mail_server)                
    response = svr.sendmail(me, fred, msg.as_string())  # send the message
    if response != {}:
        print("Sending failed for ", response)
    else:
        print("Message sent.")

    svr.quit()                                         # close the connection

In the context of the course, notice how we use the two objects in
this program: we create a message object on line 9, and set some attributes 
at lines 16-18.  We then create a connection object at line 23, and ask it
to send our message.
    
    
