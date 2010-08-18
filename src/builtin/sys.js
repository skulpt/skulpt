var $builtinmodule = function(name)
{
    var sys = {};

    var args = [];
    for (var i = 0; i < Sk.sysargv.length; ++i)
        args.push(new Sk.builtin.str(Sk.sysargv[i]));
    sys.argv = new Sk.builtin.list(args);

    sys.copyright = Sk.builtin.str("Copyright 2009-2010 Scott Graham.\nAll Rights Reserved.\n");

    sys.modules = Sk.sysmodules;

    sys.path = Sk.realsyspath;

    return sys;
};
