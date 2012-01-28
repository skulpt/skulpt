from sphinx.websupport import WebSupport
import json


def builddoc():
    support = WebSupport(srcdir=settings.sphinx_sourcedir,
                         builddir=settings.sphinx_builddir,
                         datadir=settings.sphinx_datadir,
                         staticdir=settings.sphinx_staticdir,
                         docroot=settings.sphinx_docroot,
                         storage=settings.database_uri)

    support.build()
    return 'Success'

