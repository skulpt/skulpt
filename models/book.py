from gluon.tools import Auth, Crud, Service, PluginManager, prettydate

if not request.env.web2py_runtime_gae:
    ## if NOT running on Google App Engine use SQLite or other DB
    db = DAL('sqlite://storage.sqlite')
else:
    ## connect to Google BigTable (optional 'google:datastore://namespace')
    db = DAL('google:datastore')
    ## store sessions and tickets there
    session.connect(request, response, db = db)
    ## or store session in Memcache, Redis, etc.
    ## from gluon.contrib.memdb import MEMDB
    ## from google.appengine.api.memcache import Client
    ## session.connect(request, response, db = MEMDB(Client()))


db.define_table('useinfo',
  Field('timestamp','datetime'),
  Field('sid','string'),
  Field('event','string'),
  Field('act','string'),
  Field('div_id','string')
)

db.define_table('code',
  Field('acid','string'),
  Field('code','text'),
  Field('class_group','string'),
  Field('grade','double'),
  Field('sid','string')
)
