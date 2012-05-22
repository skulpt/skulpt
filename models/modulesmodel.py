db = DAL('sqlite://storage.db', migrate=True)

db.define_table('modules',
   Field('shortname','string'),
   Field('description','text'),
   Field('pathtofile','string') )
   
db.define_table('projects',
   Field('projectcode','string'),
   Field('description','string')  )
   