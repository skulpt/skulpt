from sphinx.websupport import WebSupport
import json


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
    contents['body'] = contents['body'].replace('/static/','/eds/static/')
    return contents
