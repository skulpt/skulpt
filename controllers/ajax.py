from sphinx.websupport import WebSupport
import json
import datetime

#web_support = WebSupport(datadir='/Users/bmiller/src/eds/applications/eds/data',staticdir='/Users/bmiller/src/eds/applications/eds/static',docroot='/eds/view')
web_support = WebSupport(datadir='/Users/bmiller/src/eds/applications/eds/data',
                        staticdir='/Users/bmiller/src/eds/applications/eds/static',
                        docroot='/eds/view',
                        storage='postgresql://bmiller:grouplens@localhost/eds')

@auth.requires_login()
def get_comments():
    #username = g.user.name if g.user else None
    #moderator = g.user.moderator if g.user else False
    username = auth.user.username
    moderator = None
    node_id = request.vars.node
    try:
        data = web_support.get_data(node_id, username, moderator)
    except:
        data = {'comments':[]}
    return data

@auth.requires_login()
def add_comment():
    parent_id = request.vars.parent
    node_id = request.vars.node
    text = request.vars.text
    proposal = request.vars.proposal
    username = auth.user.username if auth.user.username is not None else 'Anonymous'

    comment = web_support.add_comment(text, node_id=node_id,
                                  parent_id=parent_id,
                                  username=username, proposal=proposal)

    return comment


@auth.requires_login()
def hsblog():
    sid = auth.user.username
    act = request.vars.act
    div_id = request.vars.div_id
    event = request.vars.event
    ts = datetime.datetime.now()

    db.useinfo.insert(sid=sid,act=act,div_id=div_id,event=event,timestamp=ts)


## Sample DB statements 
## >>> db.mytable.insert(myfield='value')
## >>> rows=db(db.mytable.myfield=='value').select(db.mytable.ALL)
## >>> for row in rows: print row.id, row.myfield

#
#  Ajax Handlers for saving and restoring active code blocks
#

def saveprog():
    acid = request.vars.acid
    code = request.vars.code
    print 'acid = ', acid
    # now check to see if there is an object for this user,acid pair
    # if not create a new Code object and store it

    codetbl = db.code
    query = codetbl.sid==auth.user.username and codetbl.acid==acid
    result = db(query)

    # student.filter("student = ", user)
    # if student.count() == 0:
    #     theStudent = Student()
    #     theStudent.student = user
    #     theStudent.sid = user.email()
    #     theStudent.put()
    # else:
    #     theStudent = student[0]

    if result.isempty():
#        logging.debug("creating new code object")
        print 'inserting new', acid
        db.code.insert(sid=auth.user.username,acid=acid,code=code)
    else:
#        logging.debug("updating old code object")
        row = result.select().first()
        row.code = code
        row.update_record()
    return acid
#    response.headers.add_header('content-type','application/json')
#    response.out.write(simplejson.dumps([acid]))


def getprog():
    '''
    return the program code for a particular acid
    :Parameters:
        - `acid`: id of the active code block
        - `user`: optional identifier for the owner of the code
    :Return:
        - json object containing the source text
    '''
    codetbl = db.code
    acid = request.vars.acid
    sid = request.vars.sid
    if sid:
        query = codetbl.sid == sid and codetbl.acid == acid
    else:
        query = codetbl.sid == auth.user.username and codetbl.acid == acid

    result = db(query)
    res = {}
    if not result.isempty():
        res['acid'] = acid
        res['source'] = result.select().first().code
        if sid:
            res['sid'] = sid
    else:
        logging.debug("Did not find anything to load for %s"%sid)
    response.headers['content-type'] = 'application/json'
    return json.dumps([res])


def getuser():

    if  auth.user.username:
        res = {'email':auth.user.email,'nick':auth.user.username}
        response.headers['content-type'] = 'application/json'
        return json.dumps([res])

