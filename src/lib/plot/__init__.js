var $builtinmodule = function(name)
{
  Sk.interop['plot'] = Sk.interop['plot'] || {
    'data': {
      'scalar': {},
      'pose': {},
      'motor_command': {},
      'trajectory': {},
      'points': {},
      'covariance2d': {},
      'covariance3d': {},
    }
  };

  var plot = Sk.interop['plot'];

  plot['clear'] = function() {
    Object.keys(plot.data).forEach(function(type) {
      Object.keys(plot.data[type]).forEach(function(name) {
        plot.data[type][name] = [];
      });
    });
  };
  plot['reset'] = function() {
    Object.keys(plot.data).forEach(function(type) {
      plot.data[type] = {};
    });
  };

  var addPlotValue = function(type, name, value) {
    if (plot.data[type][name] == undefined) {
        plot.data[type][name] = [];
    }

    plot.data[type][name].push(value);
  };

  var mod = {};

  mod.plot = new Sk.builtin.func(function(name, value) {
    Sk.builtin.pyCheckArgs('plot', arguments, 2);
    Sk.builtin.pyCheckType('name', 'string', Sk.builtin.checkString(name));
    Sk.builtin.pyCheckType('value', 'number', Sk.builtin.checkNumber(value));

    addPlotValue('scalar', name.v, value.v);
  });

  mod.plot_pose = new Sk.builtin.func(function(name, position, orientation) {
    Sk.builtin.pyCheckArgs('plot_pose', arguments, 3);
    Sk.builtin.pyCheckType('name', 'string', Sk.builtin.checkString(name));

    addPlotValue('pose', name.v, [position.v.get([0, 0]), position.v.get([1, 0]), position.v.get([2, 0]), orientation.v.get([0, 0]), orientation.v.get([1, 0]), orientation.v.get([2, 0])]);
  });

  mod.plot_motor_command = new Sk.builtin.func(function(name, value) {
    Sk.builtin.pyCheckArgs('plot_motor_command', arguments, 2);
    Sk.builtin.pyCheckType('name', 'string', Sk.builtin.checkString(name));

    addPlotValue('motor_command', name.v, [value.v.get([0, 0]), value.v.get([1, 0]), value.v.get([2, 0]), value.v.get([3, 0])]);
  });

  mod.plot_trajectory = new Sk.builtin.func(function(name, position) {
    Sk.builtin.pyCheckArgs('plot_trajectory', arguments, 2);
    Sk.builtin.pyCheckType('name', 'string', Sk.builtin.checkString(name));

    var size = position.v.size();

    addPlotValue('trajectory', name.v, [position.v.get([0, 0]), position.v.get([1, 0]), size[0] > 2 ? position.v.get([2, 0]) : 0]);
  });

  mod.plot_point = new Sk.builtin.func(function(name, position) {
    Sk.builtin.pyCheckArgs('plot_point', arguments, 2);
    Sk.builtin.pyCheckType('name', 'string', Sk.builtin.checkString(name));

    var size = position.v.size();

    addPlotValue('points', name.v, [position.v.get([0, 0]), position.v.get([1, 0]), size[0] > 2 ? position.v.get([2, 0]) : 0]);
  });

  mod.plot_covariance_2d = new Sk.builtin.func(function(name, cov) {
    Sk.builtin.pyCheckArgs('plot_covariance_2d', arguments, 2, 2);
    Sk.builtin.pyCheckType('name', 'string', Sk.builtin.checkString(name));

    addPlotValue('covariance2d', name.v, cov.v.toArray());
  });

  mod.plot_covariance_3d = new Sk.builtin.func(function(name, cov) {
    Sk.builtin.pyCheckArgs('plot_covariance_3d', arguments, 2, 2);
    Sk.builtin.pyCheckType('name', 'string', Sk.builtin.checkString(name));

    addPlotValue('covariance3d', name.v, cov.v.toArray());
  });

  return mod;
};
