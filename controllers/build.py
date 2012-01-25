from sphinx.websupport import WebSupport
import json


def builddoc():
#    support = WebSupport(srcdir='/Users/bmiller/src/eds/applications/eds/source',builddir='/Users/bmiller/src/eds/applications/eds/',docroot='/eds/view')
    support = WebSupport(srcdir='/Users/bmiller/src/eds/applications/eds/source',
                         builddir='/Users/bmiller/src/eds/applications/eds/',
                         datadir='/Users/bmiller/src/eds/applications/eds/data',
                         staticdir='/Users/bmiller/src/eds/applications/eds/static',
                         docroot='/eds/view',
                         storage='postgresql://bmiller:grouplens@localhost/eds')

    support.build()
    return 'Success'

