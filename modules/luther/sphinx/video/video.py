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
    app.add_directive('video',Video)
    app.add_stylesheet('video.css')
    app.add_javascript('simplemodal.js')

CODE = """\
<a id="%(divid)s_thumb" > <img src="%(thumb)s" /></a>
<div id="%(divid)s" class="video_popup" >
<video %(controls)s %(loop)s >
    %(sources)s
    No supported video types
</video>
</div>
"""

POPUP = """\
<script>
    jQuery(function ($) {
       $('#%(divid)s_thumb').click(function (e) {
                $('#%(divid)s').modal();
                return false;
        });
    });
</script>

"""

INLINE = """\
<script>
   jQuery(function($) {
      $('#%(divid)s_thumb').click(function(e) {
         $('#%(divid)s').show();
         $('#%(divid)s_thumb').hide();
         logBookEvent({'event':'video','act':'play','div_id': '%(divid)s'});
         // Log the run event
      });
   });
</script>
"""
SOURCE = """<source src="%s" type="video/%s"></source>"""


class Video(Directive):
    required_arguments = 1
    optional_arguments = 1
    final_argument_whitespace = True
    has_content = True
    option_spec = {'controls':directives.flag,
                   'loop': directives.flag,
                   'thumb': directives.uri
                   }

    def run(self):
        """
        process the video directive and generate html for output.
        :param self:
        :return:
        """
        mimeMap = {'mov':'mp4','webm':'webm', 'm4v':'m4v'}

        sources = [SOURCE % (directives.uri(line),mimeMap[line[line.rindex(".")+1:]]) for line in self.content]
        self.options['divid'] = self.arguments[0]
        if 'controls' in self.options:
            self.options['controls'] = 'controls'
        if 'loop' in self.options:
            self.options['loop'] = 'loop'
        else:
            self.options['loop'] = ''

        self.options['sources'] = "\n    ".join(sources)
        res = CODE % self.options
        if 'popup' in self.options:
            res += POPUP % self.options
        else:
            res += INLINE % self.options
        return [nodes.raw('',res , format='html')]



source = """\
This is some text.

.. video:: divid
   :controls:
   :thumb: _static/turtlestill.png
   :loop:

   http://knuth.luther.edu/~bmiller/foo.mov
   http://knuth.luther.edu/~bmiller/foo.webm

This is some more text.
"""

if __name__ == '__main__':
    from docutils.core import publish_parts

    directives.register_directive('video',Video)

    doc_parts = publish_parts(source,
            settings_overrides={'output_encoding': 'utf8',
            'initial_header_level': 2},
            writer_name="html")

    print doc_parts['html_body']
