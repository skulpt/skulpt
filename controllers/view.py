from sphinx.websupport import WebSupport
import json

@auth.requires_login()
def chapter():

    web_support = WebSupport(datadir='/Users/bmiller/src/eds/applications/eds/data',staticdir='/Users/bmiller/src/eds/applications/eds/static',docroot='/eds/view')
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
