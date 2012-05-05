from sphinx.websupport import WebSupport
import json
import datetime

web_support = WebSupport(datadir=settings.sphinx_datadir,
                staticdir=settings.sphinx_staticdir,
                docroot=settings.sphinx_docroot,
                storage=settings.database_uri)

@auth.requires_login()
def chapter():

    doc = request.args[0]
    contents = web_support.get_document(doc)
    # build seems to create a script entry with duplicates due to different extensions.
    # need to remove the duplicates.
    script = contents['script'].split('\n')
    contents['css'] = contents['css'].replace('/static/','/eds/static/')
    newl = []
    for l in script:
        if l.strip() == '</script>':
            newl.append(l)
        elif l not in newl:
            newl.append(l)
    contents['script'] = "\n".join(newl).replace('/static/','/eds/static/')
    contents['script'] = contents['script'].replace('/eds/view/_get_comments','/eds/ajax/get_comments.json')
    contents['script'] = contents['script'].replace('/eds/view/_add_comment','/eds/ajax/add_comment.json')    
    contents['body'] = contents['body'].replace('/static/','/eds/static/')
    return contents

def index():
    redirect('/eds/static/index.html')
#    redirect(URL(r=request,f='index',c='default'))

#@auth.requires_login()
def private():
    import os
    file = os.path.join(request.folder, 'private', "/".join(request.args))
    if file[-2:].lower() == 'js':
        response.headers['Content-Type'] = 'application/javascript'
    elif file[-3:].lower() == 'css':
        response.headers['Content-Type'] = 'text/css'
    elif file[-3:].lower() == 'png':
        response.headers['Content-Type'] = 'image/png'
    elif file[-3:].lower() == 'jpg':
        response.headers['Content-Type'] = 'image/jpg'
    elif file[-4:].lower() == 'html':
        if auth.user:
            sid = auth.user.username
        else:
            sid = 'anonymous'
        ts = datetime.datetime.now()
        db.useinfo.insert(sid=sid,act='load',div_id=request.args(0),event='getpage',timestamp=ts)

    return response.stream(open(file,'rb'))