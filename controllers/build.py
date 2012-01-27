from sphinx.websupport import WebSupport
import json


def builddoc():
#    support = WebSupport(srcdir='/home/bnmnetp/webapps/web2py/web2py/applications/eds/source',builddir='/home/bnmnetp/webapps/web2py/web2py/applications/eds/',docroot='/eds/view')
    support = WebSupport(srcdir='/home/bnmnetp/webapps/web2py/web2py/applications/eds/source',
                         builddir='/home/bnmnetp/webapps/web2py/web2py/applications/eds/',
                         datadir='/home/bnmnetp/webapps/web2py/web2py/applications/eds/data',
                         staticdir='/home/bnmnetp/webapps/web2py/web2py/applications/eds/static',
                         docroot='/eds/view',
                         storage='postgres://bnmnetp_eds:grouplens@web318.webfaction.com/bnmnetp_eds')

    support.build()
    return 'Success'

