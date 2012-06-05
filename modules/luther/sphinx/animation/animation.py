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
    app.add_directive('animation',Animation)
#    app.add_stylesheet('video.css')
    app.add_javascript('animationbase.js')


SRC = '''
<div id="%(divid)s">
<canvas id="%(divid)s_canvas" width="400" height="400" style="border:4px solid blue"></canvas>
<br />
<button onclick="%(divid)s_anim = %(divid)s_init('%(divid)s')">Initialize</button>
<button onclick="%(divid)s_anim.run('%(divid)s_anim')">Run</button>
<button onclick="%(divid)s_anim.stop()">Stop</button> </br>
<button onclick="%(divid)s_anim.begin()">Beginning</button>
<button onclick="%(divid)s_anim.forward()">Step Forward</button>
<button onclick="%(divid)s_anim.backward()">Step Backward</button>
<button onclick="%(divid)s_anim.end()">End</button>

<script type="text/javascript">
%(divid)s_init = function(divid)
{
   var a = new Animator(new %(model)s(), new %(viewer)s(), divid)
   a.init()
   return a
}
</script>

</div>
'''

SCRIPTTAG = '''<script type="text/javascript" src="../_static/%s"></script>\n'''

class Animation(Directive):
    required_arguments = 1
    optional_arguments = 1
    final_argument_whitespace = True
    has_content = False
    option_spec = {'modelfile':directives.unchanged,
                   'viewerfile':directives.unchanged,
                   'model':directives.unchanged,
                   'viewer':directives.unchanged
                   }

    def run(self):
        """
        process the video directive and generate html for output.
        :param self:
        :return:
        """

        res = ''
        self.options['divid'] = self.arguments[0]

        if 'modelfile' in self.options:
          res = res + SCRIPTTAG % self.options['modelfile']
        if 'viewerfile' in self.options:
          res = res + SCRIPTTAG % self.options['viewerfile']


        res = res + SRC % self.options
        return [nodes.raw('',res , format='html')]


source = '''
.. animation:: testanim
   :modelfile: sortmodels.js
   :viewerfile: sortviewers.js
   :model: SortModel
   :viewer: BarViewer

'''

if __name__ == '__main__':
    from docutils.core import publish_parts

    directives.register_directive('animation',Animation)

    doc_parts = publish_parts(source,
            settings_overrides={'output_encoding': 'utf8',
            'initial_header_level': 2},
            writer_name="html")

    print doc_parts['html_body']
