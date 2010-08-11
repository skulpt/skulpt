 /*
Sk.stdmodules.sys = function(self)
{
    self.__setattr__('modules', Sk.modules);

    var argv = Sk.sysargv || [];
    for (var i = 0; i < argv.length; ++i)
        argv[i] = new Sk.builtin.str(argv[i]);
    self.__setattr__('argv', new Sk.builtin.list(argv));

    self.__setattr__('path', Sk.syspath);
};
*/
