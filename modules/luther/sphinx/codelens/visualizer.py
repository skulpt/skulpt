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
from pg_logger import exec_script_str, web_finalizer
import json

def setup(app):
    app.add_directive('codelens',Codelens)
    app.add_stylesheet('edu-python.css')

    app.add_javascript('jquery.textarea.js')
    app.add_javascript('edu-python.js')



VIS = '''
<table border="1" id="pyOutputPane_%(divid)s" class="pyOutputPane">
<tr>
<td valign="top">
Source Code
<br />

<div id="pyCodeOutputDiv_%(divid)s" class="pyCodeOutputDiv">
<table id="pyCodeOutput_%(divid)s" class="pyCodeOutput"></table>

</div>

<div id="vcrControls_%(divid)s" class="vcrControls">
  <button id="jmpFirstInstr_%(divid)s", type="button">&lt;&lt; First</button>
  <button id="jmpStepBack_%(divid)s", type="button">&lt; Back</button>
  Step <span id="curInstr_%(divid)s">?</span> of <span id="totalInstrs_%(divid)s">?</span>
  <button id="jmpStepFwd_%(divid)s", type="button">Forward &gt;</button>
  <button id="jmpLastInstr_%(divid)s", type="button">Last &gt;&gt;</button>

  <p><span id="warningOutput_%(divid)s" class="warningOutput"></span></p>
</div>
</td></tr>
<tr>
<td valign="top">

<div id="dataViz_%(divid)s"></div>

</td>
</tr>
<tr>
<td>
<div id="errorOutput_%(divid)s" class="errorOutput"></div>

Program output:
<br/>
<pre id="pyStdout_%(divid)s" class="active_out"></pre>
</td>
</tr>
</table>
<p class="cl_caption"><span class="ac_caption_text"> %(caption)s</span></p>

'''

DATA = '''
<script type="text/javascript">
$(document).ready(function() {
    myvis = new PythonTutor.Visualizer(%(pycode)s,%(tracedata)s,'%(divid)s');
});

</script>
'''

class Codelens(Directive):
    required_arguments = 1
    optional_arguments = 1
    option_spec = {
        'tracedata':directives.unchanged,
        'caption':directives.unchanged,
    }

    has_content = True

    def run(self):
        self.options['divid'] = self.arguments[0]
        if self.content:
            source = "\n".join(self.content)
        else:
            source = '\n'

        tdata = exec_script_str(source,web_finalizer)
        self.options['tracedata'] = tdata
        self.options['pycode'] = json.dumps(source)
        res = VIS
        if 'caption' not in self.options:
            self.options['caption'] = ''
        if 'tracedata' in self.options:
            res += DATA

        return [nodes.raw('',res % self.options,format='html')]

