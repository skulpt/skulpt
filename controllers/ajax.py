from sphinx.websupport import WebSupport
import json

web_support = WebSupport(datadir='/Users/bmiller/src/eds/applications/eds/data',staticdir='/Users/bmiller/src/eds/applications/eds/static',docroot='/eds/view')

@auth.requires_login()
def get_comments():
    #username = g.user.name if g.user else None
    #moderator = g.user.moderator if g.user else False
    username = auth.user.username
    moderator = None
    node_id = request.vars.node
    data = web_support.get_data(node_id, username, moderator)
    print data
#    jdata = json.dumps(data)
#    print jdata
    return data

@auth.requires_login()
def add_comment():
    parent_id = request.vars.parent
    node_id = request.vars.node
    text = request.vars.text
    proposal = request.vars.proposal
    username = auth.user.username if auth.user.username is not None else 'Anonymous'
#    username = 'Anonymous'
    comment = web_support.add_comment(text, node_id=node_id,
                                  parent_id=parent_id,
                                  username=username, proposal=proposal)
    return comment
