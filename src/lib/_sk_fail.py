class NotImplementedImportError(ImportError, NotImplementedError): pass

def _(name):
    msg = "{} is not yet implemented in Skulpt".format(name)
    raise NotImplementedImportError(msg, name=name)
