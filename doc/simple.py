from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
import os

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

application = webapp.WSGIApplication(
        [('/', MainPage),
         ('/turtle', TurtlePage)],
        debug=False)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
