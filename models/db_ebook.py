# Files in the model directory are loaded in alphabetical order.  This one needs to be loaded after db.py

db.define_table('useinfo',
  Field('timestamp','datetime'),
  Field('sid','string'),
  Field('event','string'),
  Field('act','string'),
  Field('div_id','string'),
  Field('course_id','string'),
  migrate=settings.migrate
)

db.define_table('code',
  Field('acid','string'),
  Field('code','text'),
  Field('course_id','string'),
  Field('grade','double'),
  Field('sid','string'),
  Field('timestamp','datetime'),
  migrate=settings.migrate
)
