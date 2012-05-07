# this is for admin links
# use auth.requires_membership('manager')
#
# create a simple index to provide a page of links
# - re build the book
# - list assignments
# - find assignments for a student
# - show totals for all students

# select acid, sid from code as T where timestamp = (select max(timestamp) from code where sid=T.sid and acid=T.acid);
@auth.requires_membership('instructor')
def listassignments():
    sid = request.vars.student
    if sid:
        q = db(db.code.sid == sid & db.code.course_id== auth.user.course_id)
    else:
        q = db(db.code.course_id == auth.user.course_id)

    rset = q.select(db.code.acid,orderby=db.code.acid,distinct=True)
    return dict(exercises=rset)


@auth.requires_membership('instructor')
def gradeassignment():
    sid = request.vars.student
    acid = request.vars.id
    if sid:
        q = db(db.code.sid == sid & db.code.course_id == auth.user.course_id)
    else:
        q = db(db.code.course_id == auth.user.course_id)

    rset = db.executesql('''select acid, sid, grade, id from code as T 
    	where course_id = '%s' and  acid = '%s' and timestamp = 
    	     (select max(timestamp) from code where sid=T.sid and acid=T.acid);''' % 
    	     (auth.user.course_id,acid))
    return dict(solutions=rset)


@auth.requires_membership('instructor')
def showlog():
	r = db(db.useinfo.course_id == auth.user.course_id)
	res = r.select(orderby=db.useinfo.timestamp)

	return dict(log=res)
