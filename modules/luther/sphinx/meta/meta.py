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
    app.add_directive('shortname',Meta)
    app.add_directive('description',Meta)


class Meta(Directive):
    required_arguments = 1
    optional_arguments = 50

    def run(self):
        """
        process the video directive and generate html for output.
        :param self:
        :return:
        """
        return [nodes.raw('','', format='html')]



source = """\
This is some text.

.. shortname:: divid
.. description::  foo bar baz

This is some more text.
"""

if __name__ == '__main__':
    from docutils.core import publish_parts

    directives.register_directive('shortname',Meta)
    directives.register_directive('description',Meta)

    doc_parts = publish_parts(source,
            settings_overrides={'output_encoding': 'utf8',
            'initial_header_level': 2},
            writer_name="html")

    print doc_parts['html_body']
