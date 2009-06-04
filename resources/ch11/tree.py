#! /usr/bin/env python

import os
import sys


def getroot():
    if len(sys.argv) == 1:
        path = ''
    else:
        path = sys.argv[1]

    if os.path.isabs(path):
        tree_root = path
    else:
        tree_root = os.path.join(os.getcwd(), path)

    return tree_root


def getdirlist(path):
    dirlist = os.listdir(path)
    dirlist = [name for name in dirlist if name[0] != '.']
    dirlist.sort()
    return dirlist


def traverse(path):
    dirlist = getdirlist(path)
    for file in dirlist:
        if os.path.isfile(os.path.join(path, file)):
            print os.path.join(path, file)
        else:
            print os.path.join(path, file)
            traverse(os.path.join(path, file))


if __name__ == '__main__':
    root =  getroot()
    traverse(root)
