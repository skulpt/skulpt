# -*- coding: utf-8 -*-
# this file is released under public domain and you can use without limitations
from os import path
import os
import shutil
import sys

from docutils.utils import SystemMessage

from sphinx import __version__
from sphinx.errors import SphinxError
from sphinx.application import Sphinx
from sphinx.util import Tee, format_exception_cut_frames, save_traceback
from sphinx.util.console import red, nocolor, color_terminal
from sphinx.util.pycompat import terminal_safe


#########################################################################
## This is a samples controller
## - index is the default action of any application
## - user is required for authentication and authorization
## - download is for downloading files uploaded in the db (does streaming)
## - call exposes all registered services (none by default)
#########################################################################

@auth.requires_login()
def index():
    """
    example action using the internationalization operator T and flash
    rendered by views/default/index.html or views/generic.html
    """
    #response.flash = "Welcome to CourseWare Manager!"
    
    basicvalues = {}
    basicvalues["message"]=T('Welcome to CourseWare Builder')
    basicvalues["descr"]=T('''This tool allows you to create your own courseware by choosing from a catalog of modules.  
    To begin, enter a project name below.''')
    #return dict(message=T('Welcome to CourseWare Manager'))
    return basicvalues

def build():
    
    buildvalues = {}
    buildvalues['pname']=request.vars.projectname
    buildvalues['pdescr']=request.vars.projectdescription
    response.files.append(URL('static','css/dd.css'))
    response.files.append(URL('static','js/dd.js'))

    db.projects.update_or_insert(projectcode=request.vars.projectname,description=request.vars.projectdescription)

    if request.vars.coursetype != 'custom':

        cid = db.courses.update_or_insert(course_id=request.vars.projectname)

        # if make instructor add row to auth_membership
        if request.vars.instructor == "yes":
            gid = db(db.auth_group.role == 'instructor').select(db.auth_group.id).first()
            db.auth_membership.insert(user_id=auth.user.id,group_id=gid)

        # update instructor record to have course_id be this course
        # if the above update_or_insert on project does nothing (meaning this is a duplicate)
        # then do not change teh instructors cid.
        if cid:
            db(db.auth_user.id == auth.user.id).update(course_id = cid)

        # Now Copy the whole source directory to tmp
        workingdir = request.folder
        sourcedir = path.join(workingdir,'tmp',request.vars.projectname)

        shutil.copytree(path.join(workingdir,'source'),sourcedir)

        conffile = request.vars.coursetype + '-conf.py'
        indexfile = 'index-' + request.vars.coursetype
        # copy the config file to conf.py
        shutil.copy(path.join(workingdir,'source','OldIndexAndConfFiles',conffile),
            path.join(sourcedir,'conf.py'))

        # copy the index file
        shutil.copy(path.join(workingdir,'source','OldIndexAndConfFiles',indexfile),
            path.join(sourcedir,'index.rst'))

        # set the courseid
        # set the url
        # build the book

        coursename = request.vars.projectname
        confdir = sourcedir
        outdir = path.join(request.folder, 'static' , coursename)
        doctreedir = path.join(outdir,'.doctrees')
        buildername = 'html'
        confoverrides = {}
        confoverrides['html_context.appname'] = request.application
        confoverrides['html_context.course_id'] = coursename
        confoverrides['html_context.loglevel'] = 10
        confoverrides['html_context.course_url'] = 'http://' + request.env.http_host
        if request.vars.loginreq == 'yes':
            confoverrides['html_context.login_required'] = 'true'
        else:
            confoverrides['html_context.login_required'] = 'false'
        status = sys.stdout
        warning = sys.stdout
        freshenv = True
        warningiserror = False
        tags = []
        print sys.path
        sys.path.insert(0,path.join(request.folder,'modules'))
        app = Sphinx(sourcedir, confdir, outdir, doctreedir, buildername,
                    confoverrides, status, warning, freshenv,
                    warningiserror, tags)
        force_all = True
        filenames = []
        app.build(force_all, filenames)

        shutil.rmtree(sourcedir)

        return dict(mess='Your course is ready',course_url='static/'+coursename+'/index.html' )       
    else:
        moddata = {}
        
        rows = db(db.modules.id>0).select()
        for row in rows:
            moddata[row.id]=[row.shortname,row.description,row.pathtofile]
        
        buildvalues['moddata']=  moddata   #actually come from source files
        
        return buildvalues
    
def makefile():
    
    p = request.vars.toc

        
                  
    pcode = request.vars.projectname
    row = db(db.projects.projectcode==pcode).select()
    title = row[0].description
    
    workingdir = request.folder
    sourcedir = path.join(workingdir,'tmp',pcode)

    # copy modules from source

    os.mkdir(sourcedir)

    f = open(path.join(sourcedir,"index.rst"),"w")
    
    f.write('''.. Copyright (C)  Brad Miller, David Ranum
   Permission is granted to copy, distribute and/or modify this document
   under the terms of the GNU Free Documentation License, Version 1.3 or 
   any later version published by the Free Software Foundation; with 
   Invariant Sections being Forward, Prefaces, and Contributor List, 
   no Front-Cover Texts, and no Back-Cover Texts.  A copy of the license
   is included in the section entitled "GNU Free Documentation License".''' + "\n\n")

                  
    f.write("="*len(title) + "\n")
    f.write(title + "\n")
    f.write("="*len(title) + "\n\n")
    
    toc = request.vars.toc
    parts = toc.split(" ")
    
    idx = 0
    while idx<len(parts):
        item = parts[idx]
        if ".rst" in item:
            f.write("   "+item+"\n")
            idx=idx+1
            moduleDir = item.split('/')[0]
            try:
                shutil.copytree(path.join(workingdir,'source',moduleDir),
                                path.join(sourcedir,moduleDir))
            except:
                print 'copying %s again' % moduleDir
        else:
            topic = ""
            while idx<len(parts) and ".rst" not in parts[idx]:
                if topic != "":
                   topic =topic + " " + parts[idx]
                else:
                    topic = topic + parts[idx]
                idx=idx+1
                    #realitem = item[5:]
            f.write("\n" + topic + "\n" + ":"*len(topic) + "\n\n")
            f.write('''.. toctree::
   :maxdepth: 2 \n\n''')
                
    
    
    f.write('''\nAcknowledgements
::::::::::::::::

.. toctree::
   :maxdepth: 1

   FrontBackMatter/copyright.rst
   FrontBackMatter/prefaceinteractive.rst
   FrontBackMatter/foreword.rst
   FrontBackMatter/preface.rst
   FrontBackMatter/preface2e.rst
   FrontBackMatter/contrib.rst
   FrontBackMatter/fdl-1.3.rst''' + "\n")


    f.close()

    shutil.copytree(path.join(workingdir,'source','FrontBackMatter'),
                                path.join(sourcedir,'FrontBackMatter'))

    coursename = pcode
    confdir = path.join(workingdir,'source')
    outdir = path.join(request.folder, 'static' , coursename)
    doctreedir = path.join(outdir,'.doctrees')
    buildername = 'html'
    confoverrides = {}
    confoverrides['html_context.appname'] = request.application
    confoverrides['html_context.course_id'] = coursename
    confoverrides['html_context.loglevel'] = 10
    confoverrides['html_context.course_url'] = 'http://' + request.env.http_host
    confoverrides['html_context.login_required'] = 'true'
    status = sys.stdout
    warning = sys.stdout
    freshenv = True
    warningiserror = False
    tags = []
    app = Sphinx(sourcedir, confdir, outdir, doctreedir, buildername,
                confoverrides, status, warning, freshenv,
                warningiserror, tags)
    force_all = True
    filenames = []
    app.build(force_all, filenames)

    shutil.rmtree(sourcedir)
    
    yoururlpath=path.join('/',request.application,"static",coursename,"index.html")

    return dict(message=T("Here is the link to your new eBook"),yoururl=yoururlpath)

def user():
    """
    exposes:
    http://..../[app]/default/user/login
    http://..../[app]/default/user/logout
    http://..../[app]/default/user/register
    http://..../[app]/default/user/profile
    http://..../[app]/default/user/retrieve_password
    http://..../[app]/default/user/change_password
    use @auth.requires_login()
        @auth.requires_membership('group name')
        @auth.requires_permission('read','table name',record_id)
    to decorate functions that need access control
    """
    return dict(form=auth())


def download():
    """
    allows downloading of uploaded files
    http://..../[app]/default/download/[filename]
    """
    return response.download(request,db)


def call():
    """
    exposes services. for example:
    http://..../[app]/default/call/jsonrpc
    decorate with @services.jsonrpc the functions to expose
    supports xml, json, xmlrpc, jsonrpc, amfrpc, rss, csv
    """
    return service()


@auth.requires_signature()
def data():
    """
    http://..../[app]/default/data/tables
    http://..../[app]/default/data/create/[table]
    http://..../[app]/default/data/read/[table]/[id]
    http://..../[app]/default/data/update/[table]/[id]
    http://..../[app]/default/data/delete/[table]/[id]
    http://..../[app]/default/data/select/[table]
    http://..../[app]/default/data/search/[table]
    but URLs must be signed, i.e. linked with
      A('table',_href=URL('data/tables',user_signature=True))
    or with the signed load operator
      LOAD('default','data.load',args='tables',ajax=True,user_signature=True)
    """
    return dict(form=crud())

