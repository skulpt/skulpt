(function(self)
{
    self.__setattr__('modules', Module$.modules$);
    var argv = sk$sysargv || [];
    for (var i = 0; i < argv.length; ++i)
        argv[i] = new Str$(argv[i]);
    self.__setattr__('argv', new List$(argv));
})
