from sphinx.websupport import WebSupport
import json

web_support = WebSupport(datadir='/Users/bmiller/src/eds/applications/eds/data',staticdir='/Users/bmiller/src/eds/applications/eds/static',docroot='/eds/view')

def get_comments():
    #username = g.user.name if g.user else None
    #moderator = g.user.moderator if g.user else False
    username = None
    moderator = None
    node_id = request.vars.node
    data = web_support.get_data(node_id, username, moderator)
    print data
#    jdata = json.dumps(data)
#    print jdata
    return data

def add_comment():
    parent_id = request.vars.parent
    node_id = request.vars.node
    text = request.vars.text
    proposal = request.vars.proposal
    #username = g.user.name if g.user is not None else 'Anonymous'
    username = 'Anonymous'
    comment = web_support.add_comment(text, node_id=node_id,
                                  parent_id=parent_id,
                                  username=username, proposal=proposal)
    return comment
