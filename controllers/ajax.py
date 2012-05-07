from sphinx.websupport import WebSupport
import json
import datetime
import logging

logger = logging.getLogger("web2py.app.eds")
logger.setLevel(logging.DEBUG)

web_support = WebSupport(datadir=settings.sphinx_datadir,
                staticdir=settings.sphinx_staticdir,
                docroot=settings.sphinx_docroot,
                storage=settings.database_uri)

response.headers['Access-Control-Allow-Origin'] = '*'

@auth.requires_login()
def get_comments():
    #moderator = g.user.moderator if g.user else False
    username = auth.user.username
    moderator = False
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

    return {'comment':comment}


@auth.requires_login()
def hsblog():
    sid = auth.user.username
    act = request.vars.act
    div_id = request.vars.div_id
    event = request.vars.event
    course = request.vars.course
    ts = datetime.datetime.now()

    db.useinfo.insert(sid=sid,act=act,div_id=div_id,event=event,timestamp=ts,course_id=course)


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
    print 'in getuser'
    response.headers['content-type'] = 'application/json'
    print request.env.http_cookie

    if  auth.user:
        print 'logged in!!!'
        res = {'email':auth.user.email,'nick':auth.user.username}
    else:
        print auth.settings.login_url
        res = dict(redirect=auth.settings.login_url) #?_next=....
        print response.cookies
    logging.debug("returning login info: %s",res)
    return json.dumps([res])

