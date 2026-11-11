"""Cache decoded source lines supplied by the Skulpt host.

Cache records and loader lookup follow CPython 3.7's Lib/linecache.py.
Sk.read supplies virtual files rather than filesystem metadata; as with
loader-provided source in CPython, entries have no modification time.
"""

from _linecache import read_source
from functools import partial

__all__ = ['getline', 'clearcache', 'checkcache', 'lazycache']
cache = {}


def clearcache():
    cache.clear()


def getline(filename, lineno, module_globals=None):
    lines = getlines(filename, module_globals)
    if 1 <= lineno <= len(lines):
        return lines[lineno - 1]
    return ''


def getlines(filename, module_globals=None):
    entry = cache.get(filename)
    if entry is not None and len(entry) != 1:
        return entry[2]
    return updatecache(filename, module_globals)


def checkcache(filename=None):
    """Virtual source entries have no mtime to check, like CPython loader entries.

    Use updatecache(filename) or clearcache() when the host changes its source.
    """


def updatecache(filename, module_globals=None):
    if filename in cache and len(cache[filename]) != 1:
        del cache[filename]
    if not filename or (filename.startswith('<') and filename.endswith('>')):
        return []

    source = read_source(filename)
    if source is None and lazycache(filename, module_globals):
        try:
            source = cache[filename][0]()
        except (ImportError, OSError):
            return []
    if source is None:
        return []

    # Text-mode source reading uses universal newlines in CPython.
    source = source.replace('\r\n', '\n').replace('\r', '\n')
    lines = source.splitlines(True)
    if lines and not lines[-1].endswith('\n'):
        lines[-1] += '\n'
    cache[filename] = (len(source), None, lines, filename)
    return lines


def lazycache(filename, module_globals):
    """Register a module loader without fetching its source yet."""
    if filename in cache:
        return len(cache[filename]) == 1
    if not filename or (filename.startswith('<') and filename.endswith('>')):
        return False
    if module_globals and '__name__' in module_globals:
        name = module_globals['__name__']
        loader = module_globals.get('__loader__')
        get_source = getattr(loader, 'get_source', None)
        if name and get_source:
            cache[filename] = (partial(get_source, name),)
            return True
    return False
