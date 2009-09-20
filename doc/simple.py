from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
import os
from django.utils import simplejson

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

from google.appengine.ext import db

class TestResult(db.Model):
    browser = db.StringProperty()
    platform = db.StringProperty()
    version = db.StringProperty()
    results = db.TextProperty()
    date = db.DateTimeProperty(auto_now_add=True)

class TestResults(webapp.RequestHandler):
    def post(self):
        data = simplejson.loads(self.request.body)
        tr = TestResult()
        tr.browser = data.browser
        tr.platform = data.platform
        tr.version = data.version
        tr.results = data.results
        tr.put()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write("{result:'ok'}")

application = webapp.WSGIApplication(
        [('/', MainPage),
         ('/testresults', TestResults)],
         ('/turtle', TurtlePage)],
        debug=False)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
