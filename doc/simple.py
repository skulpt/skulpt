from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
import os
import json
from google.appengine.ext import db

class MainPage(webapp.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/html'
        path = os.path.join(os.path.dirname(__file__), 'index.html')
        self.response.out.write(open(path).read())

class TurtlePage(webapp.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/html'
        path = os.path.join(os.path.dirname(__file__), 'turtle.html')
        self.response.out.write(open(path).read())

class IdePage(webapp.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/html'
        path = os.path.join(os.path.dirname(__file__), 'ide/index.html')
        self.response.out.write(open(path).read())

class TestResult(db.Model):
    browsername = db.StringProperty()
    browserversion = db.StringProperty()
    browseros = db.StringProperty()
    version = db.StringProperty()
    rc = db.StringProperty()
    results = db.TextProperty()
    date = db.DateTimeProperty(auto_now_add=True)

class TestResults(webapp.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        tr = TestResult()
        tr.browsername = str(data['browsername'])
        tr.browserversion = str(data['browserversion'])
        tr.browseros = str(data['browseros'])
        tr.version = str(data['version'])
        tr.rc = str(data['rc'])
        tr.results = str(data['results'])
        tr.put()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write("{result:'ok'}")

application = webapp.WSGIApplication(
        [('/', MainPage),
         ('/testresults', TestResults),
         ('/turtle', TurtlePage),
         ('/ide', IdePage)
         ],
        debug=False)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
