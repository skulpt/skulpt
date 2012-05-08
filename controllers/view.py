import json
import datetime


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