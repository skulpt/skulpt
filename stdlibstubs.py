__author__ = 'bmiller'

import os, shutil

mymodules = ['document', 'math', 'operator', 'processing', 'random', 're', 'time', 'test', 'turtle', 'unittest', 'urllib', 'webgl']
p26root = '/System/Library/Frameworks/Python.framework/Versions/2.6/lib/python2.6/'


def make_stub(fname,fpath):
    modname = fname.replace('.py','')
    if modname not in mymodules:
        f = open(fpath, 'w')
        f.write('''raise NotImplementedError("%s is not yet implemented in Skulpt")\n''' % modname)
        f.close()


for root, dirs, files in os.walk(p26root):
    for dname in dirs:
        newdir = os.path.join(root,dname)
        newdir = newdir.replace(p26root,'src/lib/')
        if not os.path.exists(newdir):
            print("making", newdir)
            os.makedirs(newdir)
            newfile = os.path.join(newdir,'__init__.py')
            make_stub(dname, newfile)

    for fname in [f for f in files if f.endswith(".py")]:
        newfile = root.replace(p26root,'src/lib/')
        if newfile.endswith('src/lib/'):
            newfile = os.path.join(newfile, fname)
            print("making file", newfile)
            make_stub(fname,newfile)