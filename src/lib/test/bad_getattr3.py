def __getattr__(name):
    global __getattr__
    if name != 'delgetattr':
        raise AttributeError
    del __getattr__
    raise AttributeError
