from gluon.storage import Storage
settings = Storage()
from os import uname

settings.migrate = True
settings.title = 'Data Structures'
settings.subtitle = 'powered by web2py'
settings.author = 'Brad Miller'
settings.author_email = 'you@example.com'
settings.keywords = ''
settings.description = ''
settings.layout_theme = 'Default'
settings.security_key = '0b734ebc-7a50-4167-99b1-2df09062fde8'
settings.email_server = 'localhost'
settings.email_sender = 'you@example.com'
settings.email_login = ''
settings.login_method = 'local'
settings.login_config = ''
settings.course_id = 'book'
settings.plugins = []
if 'local' in uname()[1]:
	settings.database_uri = 'postgres://bmiller:grouplens@localhost/eds'
	settings.sphinx_datadir = '/Users/bmiller/src/eds/applications/eds/data'
	settings.sphinx_staticdir = '/Users/bmiller/src/eds/applications/eds/static'
	settings.sphinx_docroot = '/eds/view'
	settings.sphinx_sourcedir = '/Users/bmiller/src/eds/applications/eds/source'
	settings.sphinx_builddir = '/Users/bmiller/src/eds/applications/eds/'
elif 'webfaction' in uname()[1]:
	settings.database_uri = 'postgres://bnmnetp_eds:grouplens@web318.webfaction.com/bnmnetp_eds'
	settings.sphinx_datadir = '/home/bnmnetp/webapps/web2py/web2py/applications/eds/data'
	settings.sphinx_staticdir = '/home/bnmnetp/webapps/web2py/web2py/applications/eds/static'
	settings.sphinx_docroot = '/eds/view'
	settings.sphinx_sourcedir = '/home/bnmnetp/webapps/web2py/web2py/applications/eds/source'
	settings.sphinx_builddir = '/home/bnmnetp/webapps/web2py/web2py/applications/eds/'
else:
	raise RuntimeError('Host unknown, senttings not configured')	
