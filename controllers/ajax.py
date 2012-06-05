import json
import datetime
import logging

logger = logging.getLogger("web2py.app.eds")
logger.setLevel(logging.DEBUG)

response.headers['Access-Control-Allow-Origin'] = '*'

def hsblog():
    if auth.user:
        sid = auth.user.username
    else:
        sid = request.client+"@anon.user"
    act = request.vars.act
    div_id = request.vars.div_id
    event = request.vars.event
    course = request.vars.course
    ts = datetime.datetime.now()

    db.useinfo.insert(sid=sid,act=act,div_id=div_id,event=event,timestamp=ts,course_id=course)


#
#  Ajax Handlers for saving and restoring active code blocks
#

def saveprog():
    acid = request.vars.acid
    code = request.vars.code

    # codetbl = db.code
    # query = codetbl.sid==auth.user.username and codetbl.acid==acid
    # result = db(query)

    print 'inserting new', acid
    db.code.insert(sid=auth.user.username,
                   acid=acid,code=code,
                   timestamp=datetime.datetime.now(),
                   course_id=auth.user.course_id)

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
        res['source'] = result.select(orderby=~codetbl.timestamp).first().code
        if sid:
            res['sid'] = sid
    else:
        logging.debug("Did not find anything to load for %s"%sid)
    response.headers['content-type'] = 'application/json'
    return json.dumps([res])


@auth.requires_membership('instructor')
def savegrade():
    res = db(db.code.id == request.vars.id)
    res.update(grade = int(request.vars.grade))


#@auth.requires_login()
def getuser():
    response.headers['content-type'] = 'application/json'

    if  auth.user:
        res = {'email':auth.user.email,'nick':auth.user.username}
    else:
        res = dict(redirect=auth.settings.login_url) #?_next=....
    logging.debug("returning login info: %s",res)
    return json.dumps([res])

