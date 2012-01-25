# Files in the model directory are loaded in alphabetical order.  This one needs to be loaded after db.py

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
