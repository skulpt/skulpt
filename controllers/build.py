from sphinx.websupport import WebSupport
import json


def builddoc():
    support = WebSupport(srcdir='/Users/bmiller/src/eds/applications/eds/source',builddir='/Users/bmiller/src/eds/applications/eds/',docroot='/eds/view')
    support.build()
    return 'Success'

