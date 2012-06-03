# Copyright (C) 2011  Bradley N. Miller
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
__author__ = 'bmiller'

from docutils import nodes
from docutils.parsers.rst import directives
from docutils.parsers.rst import Directive


def setup(app):
    app.add_directive('multiplechoice',MultipleChoice)
    app.add_directive('mchoicemf',MChoiceMF)
    app.add_directive('mchoicema',MChoiceMA)
    app.add_directive('fillintheblank',FillInTheBlank)

    app.add_javascript('assess.js')


class MultipleChoice(Directive):
    required_arguments = 1
    optional_arguments = 1
    final_argument_whitespace = True
    has_content = True
    option_spec = {'answer_a':directives.unchanged,
                    'answer_b':directives.unchanged,    
                    'answer_c':directives.unchanged,
                    'answer_d':directives.unchanged,
                    'answer_e':directives.unchanged,
                    'correct':directives.unchanged,
                    'feedback':directives.unchanged,
                   'iscode':directives.flag
                   }

    def run(self):
        """
        process the multiplechoice directive and generate html for output.
        :param self:
        :return:
        .. multiplechoice:: qname
           :iscode: boolean
           :answer_a: possible answer  -- what follows _ is label
           :answer_b: possible answer
           ...  
           :answer_e: possible answer                      
           :correct: b
           :feedback: -- displayed if wrong

           Question text
           ...
        """

        TEMPLATE_START = '''
    <div id="%(divid)s">
    <p>%(bodytext)s</p>
    <form name="%(divid)s_form" method="get" action="" onsubmit="return false;">
    '''

        OPTION = '''
    <input type="radio" name="group1" value="%(alabel)s" id="%(divid)s_opt_%(alabel)s" />
    <label for= "%(divid)s_opt_%(alabel)s">  %(alabel)s) %(atext)s</label><br />
    '''

        TEMPLATE_END = '''
    <input type="button" name="do answer" 
           value="Check Me" onclick="checkMe('%(divid)s','%(correct)s','%(feedback)s')"/> 
    </form>
    <div id="%(divid)s_feedback">
    </div>
    </div>
 '''   


        self.options['divid'] = self.arguments[0]
        if self.content:
            if 'iscode' in self.options:
                self.options['bodytext'] = '<pre>' + "\n".join(self.content) + '</pre>'
            else:
                self.options['bodytext'] = "\n".join(self.content)

        res = ""
        res = TEMPLATE_START % self.options
        # Add all of the possible answers
        okeys = self.options.keys()
        okeys.sort()
        for k in okeys:
            if '_' in k:
                x,label = k.split('_')
                self.options['alabel'] = label
                self.options['atext'] = self.options[k]
                res += OPTION % self.options

        res += TEMPLATE_END % self.options
        return [nodes.raw('',res , format='html')]




 ##########


class MChoiceMF(Directive):
    required_arguments = 1
    optional_arguments = 1
    final_argument_whitespace = True
    has_content = True
    option_spec = {'answer_a':directives.unchanged,
                    'answer_b':directives.unchanged,    
                    'answer_c':directives.unchanged,
                    'answer_d':directives.unchanged,
                    'answer_e':directives.unchanged,
                    'correct':directives.unchanged,
                    'feedback_a':directives.unchanged,
                    'feedback_b':directives.unchanged,
                    'feedback_c':directives.unchanged,
                    'feedback_d':directives.unchanged,
                    'feedback_e':directives.unchanged,
                   'iscode':directives.flag
                   }

    def run(self):
        """
        process the multiplechoice directive and generate html for output.
        :param self:
        :return:
        .. mchoicemf:: qname
           :iscode: boolean
           :answer_a: possible answer  -- what follows _ is label
           :answer_b: possible answer
           ...  
           :answer_e: possible answer                      
           :correct: leter of correct answer
           :feedback_a: displayed if a is picked
           :feedback_b: displayed if b is picked
           :feedback_c: displayed if c is picked
           :feedback_d: displayed if d is picked
           :feedback_e: displayed if e is picked

           Question text
           ...
        """
        TEMPLATE_START = '''
    <div id="%(divid)s">
    <p>%(qnumber)s: %(bodytext)s</p>
    <form name="%(divid)s_form" method="get" action="" onsubmit="return false;">
    '''

        OPTION = '''
    <input type="radio" name="group1" value="%(alabel)s" id="%(divid)s_opt_%(alabel)s" />
    <label for= "%(divid)s_opt_%(alabel)s">  %(alabel)s) %(atext)s</label><br />
    '''

        TEMPLATE_END = '''
    <input type="button" name="do answer" 
           value="Check Me" onclick="checkMCMF('%(divid)s','%(correct)s',%(feedback)s)"/> 
    </form>
    <div id="%(divid)s_feedback">
    </div>
    </div>
    '''   


        self.options['divid'] = self.arguments[0] 
        
        # check for question
        questionNum = "";
        index = self.arguments[0].find("question");
        if index >= 0:
            questionNum = self.arguments[0];
            questionNum = questionNum[(index + 8):];
            questionNum = questionNum.replace("_",".");

        self.options['qnumber'] = questionNum;
                     
        if self.content:
            self.options['bodytext'] = "\n".join(self.content)
        else:
            self.options['bodytext'] = "\n"

        res = ""
        res = TEMPLATE_START % self.options
        feedbackStr = "["
        currFeedback = ""
        # Add all of the possible answers
        okeys = self.options.keys()
        okeys.sort()
        for k in okeys:
            if 'answer_' in k:  
                x,label = k.split('_') 
                self.options['alabel'] = label 
                self.options['atext'] = self.options[k]
                res += OPTION % self.options
                currFeedback = "feedback_" + label
                feedbackStr = feedbackStr + "'" + self.options[currFeedback] + "', "
       
        # store the feedback array with key feedback minus last comma
        self.options['feedback'] = feedbackStr[0:-2] + "]"
        res += TEMPLATE_END % self.options
        return [nodes.raw('',res , format='html')]




#####################

class MChoiceMA(Directive):
    required_arguments = 1
    optional_arguments = 1
    final_argument_whitespace = True
    has_content = True
    option_spec = {'answer_a':directives.unchanged,
                    'answer_b':directives.unchanged,    
                    'answer_c':directives.unchanged,
                    'answer_d':directives.unchanged,
                    'answer_e':directives.unchanged,
                    'correct':directives.unchanged,
                    'feedback_a':directives.unchanged,
                    'feedback_b':directives.unchanged,
                    'feedback_c':directives.unchanged,
                    'feedback_d':directives.unchanged,
                    'feedback_e':directives.unchanged,
                   'iscode':directives.flag
                   }

    def run(self):
        """
        process the multiplechoice directive and generate html for output.
        :param self:
        :return:
        .. mchoicemf:: qname
           :iscode: boolean
           :answer_a: possible answer  -- what follows _ is label
           :answer_b: possible answer
           ...  
           :answer_e: possible answer                      
           :correct: comma seperated list of correct values a, b, c
           :feedback_a: displayed if a is picked
           :feedback_b: displayed if b is picked
           :feedback_c: displayed if c is picked
           :feedback_d: displayed if d is picked
           :feedback_e: displayed if e is picked

           Question text
           ...
        """
        TEMPLATE_START = '''
    <div id="%(divid)s">
    <p>%(qnumber)s: %(bodytext)s</p>
    <form name="%(divid)s_form" method="get" action="" onsubmit="return false;">
    '''

        OPTION = '''
    <input type="checkbox" name="group1" value="%(alabel)s" id="%(divid)s_opt_%(alabel)s" />
    <label for= "%(divid)s_opt_%(alabel)s">  %(alabel)s) %(atext)s</label><br />
    '''

        TEMPLATE_END = '''
    <input type="button" name="do answer" 
           value="Check Me" onclick="checkMCMA('%(divid)s','%(correct)s',%(feedback)s)"/> 
    </form>
    <div id="%(divid)s_feedback">
    </div>
    </div>
    '''   

        self.options['divid'] = self.arguments[0] 
        
        # check for question
        questionNum = "";
        index = self.arguments[0].find("question");
        if index >= 0:
            questionNum = self.arguments[0];
            questionNum = questionNum[(index + 8):];
            questionNum = questionNum.replace("_",".");
        
        self.options['qnumber'] = questionNum;

        if self.content:
            self.options['bodytext'] = "\n".join(self.content)

        res = ""
        res = TEMPLATE_START % self.options
        feedbackStr = "["
        currFeedback = ""
        # Add all of the possible answers
        okeys = self.options.keys()
        okeys.sort()
        for k in okeys:
            if 'answer_' in k:  
                x,label = k.split('_') 
                self.options['alabel'] = label 
                self.options['atext'] = self.options[k]
                res += OPTION % self.options
                currFeedback = "feedback_" + label
                feedbackStr = feedbackStr + "'" + self.options[currFeedback] + "', ";
        
        self.options['feedback'] = feedbackStr[0:-2] + "]";
        res += TEMPLATE_END % self.options
        return [nodes.raw('',res , format='html')]


################################

class FillInTheBlank(Directive):
    required_arguments = 1
    optional_arguments = 1
    final_argument_whitespace = True
    has_content = True
    option_spec = {'correct':directives.unchanged,
                   'feedback':directives.unchanged,
                   'iscode':directives.flag,
                   'casei':directives.flag  # case insensitive matching
                   }

    def run(self):
        """
        process the fillintheblank directive and generate html for output.
        :param self:
        :return:
        .. fillintheblank:: qname
           :iscode: boolean
           :correct: somestring
           :feedback: -- displayed if wrong

           Question text
           ...
        """

        TEMPLATE_START = '''
    <div id="%(divid)s">
    <form name="%(divid)s_form" method="get" action="" onsubmit="return false;">
    <p>%(bodytext)s</p>
    '''

        TEMPLATE_END = '''
    <input type="button" name="do answer" 
           value="Check Me" onclick="checkFIB('%(divid)s','%(correct)s','%(feedback)s', %(casei)s)"/> 
    </form>
    <div id="%(divid)s_feedback">
    </div>
    </div>
 '''   

        BLANK = '''<input type="text" name="blank" />'''

        self.options['divid'] = self.arguments[0]
        if self.content:
            if 'iscode' in self.options:
                self.options['bodytext'] = '<pre>' + "\n".join(self.content) + '</pre>'
            else:
                self.options['bodytext'] = "\n".join(self.content)

        self.options['bodytext'] = self.options['bodytext'].replace('___',BLANK)

        if 'feedback' not in self.options:
            self.options['feedback'] = 'No Hints'

        if 'casei' in self.options:
            self.options['casei'] = 'true'
        else:
            self.options['casei'] = 'false'

        res = ""
        res = TEMPLATE_START % self.options
        # Add all of the possible answers

        res += TEMPLATE_END % self.options
        return [nodes.raw('',res , format='html')]


