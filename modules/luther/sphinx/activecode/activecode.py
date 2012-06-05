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
    app.add_directive('activecode',ActiveCode)
    app.add_directive('actex',ActiveExercise)
    app.add_stylesheet('codemirror.css')
    app.add_stylesheet('theme/default.css')

    app.add_javascript('bookfuncs.js')
    app.add_javascript('codemirror.js')
    app.add_javascript('python.js')
    app.add_javascript('skulpt.js')
    app.add_javascript('builtin.js')

EDIT = '''
<div id="%(divid)s" >
<textarea cols="50" rows="12" id="%(divid)s_code" class="active_code">
%(initialcode)s

</textarea>
<p class="ac_caption"><span class="ac_caption_text">%(caption)s (%(divid)s)</span> </p>
<button onclick="runit('%(divid)s',this, %(include)s);">Run</button>
<button class="ac_opt" onclick="saveEditor('%(divid)s');">Save</button>
<button class="ac_opt" onclick="requestCode('%(divid)s');">Load</button>
<br />
'''

CANVAS = '''
<canvas id="%(divid)s_canvas" height="400" width="400" style="border-style: solid; display: none"></canvas>
'''

PRE = '''
<pre id="%(divid)s_pre" class="active_out">

</pre>
'''

END = '''
</div>

'''

class ActiveCode(Directive):
    required_arguments = 1
    optional_arguments = 1
    has_content = True
    option_spec = {
        'nocanvas':directives.flag,
        'nopre':directives.flag,
        'caption':directives.unchanged,
        'include':directives.unchanged
    }

    def run(self):
        self.options['divid'] = self.arguments[0]
        if self.content:
            source = "\n".join(self.content)
        else:
            source = '\n'

        self.options['initialcode'] = source
        if 'caption' not in self.options:
            self.options['caption'] = ''
        res = EDIT
        if 'nocanvas' not in self.options:
            res += CANVAS
        if 'nopre' not in self.options:
            res += PRE
        if 'include' not in self.options:
            self.options['include'] = 'undefined'
        else:
            lst = self.options['include'].split(',')
            lst = [x.strip() for x in lst]
            self.options['include'] = lst
        res += END
        res = res % self.options
        res = res.replace("u'","'")  # hack:  there must be a better way to include the list and avoid unicode strings
        return [nodes.raw('',res ,format='html')]


EXEDIT = '''
<button id="butt_%(divid)s" onclick="createActiveCode('%(divid)s','%(source)s'); $('#butt_%(divid)s').hide();">Open Editor</button>
<div id="%(divid)s"></div>
<br />
'''


class ActiveExercise(Directive):
    required_arguments = 1
    optional_arguments = 0
    has_content = True

    def run(self):
        self.options['divid'] = self.arguments[0]
        if self.content:
            source = "\\n".join(self.content)
        else:
            source = ''
        self.options['source'] = source.replace('"','%22').replace("'",'%27')
        res = EXEDIT

        return [nodes.raw('',res % self.options,format='html')]
        
        
if __name__ == '__main__':
    a = ActiveCode()

