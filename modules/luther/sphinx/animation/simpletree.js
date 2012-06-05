SimpleTreeModel = function()  //construct the model
{
}
    
SimpleTreeModel.prototype.init = function(ctl)
{

var model = [
{ nodelist: {C_0: {color: 'blue', style: 'filled'}, 
    H_0: {type: 's', shape: 'record', color: 'blue', label: 'foo'}, 
    H_1: {type: 's'}, H_2: {type: 's'}, 
    C_1: {type: 's'}, H_3: {type: 's'}, 
    H_4: {type: 's'}, H_5: {type: 's'}}, 
    edgelist: {C_0: ['H_0:f1', 'H_1', 'H_2', 'C_1'], C_1: ['H_3', 'H_4', 'H_5']}, 
    params: {node: {shape: 'circle', color: 'red'}, edge: {color: 'blue'}}},

{ nodelist: {C_0: {}, 
    H_0: {type: 's', shape: 'record', color: 'blue', label: 'foo', style: 'filled'}, 
    H_1: {type: 's'}, H_2: {type: 's'}, 
    C_1: {type: 's'}, H_3: {type: 's'}, 
    H_4: {type: 's'}, H_5: {type: 's'}}, 
    edgelist: {C_0: ['H_0:f1', 'H_1', 'H_2', 'C_1'], C_1: ['H_3', 'H_4', 'H_5']}, 
    params: {node: {shape: 'circle', color: 'red'}, edge: {color: 'blue'}}},

{ nodelist: {C_0: {}, 
    H_0: {type: 's', shape: 'record', label: 'foo'}, 
    H_1: {type: 's', style: 'filled', color: 'blue'}, H_2: {type: 's'}, 
    C_1: {type: 's'}, H_3: {type: 's'}, 
    H_4: {type: 's'}, H_5: {type: 's'}}, 
    edgelist: {C_0: ['H_0:f1', 'H_1', 'H_2', 'C_1'], C_1: ['H_3', 'H_4', 'H_5']}, 
    params: {node: {shape: 'circle', color: 'red'}, edge: {color: 'blue'}}},

{ nodelist: {C_0: {}, 
    H_0: {type: 's', shape: 'record', label: 'foo'}, 
    H_1: {type: 's', style: 'filled', color: 'blue'}, H_2: {type: 's'}, 
    C_1: {type: 's'}, H_3: {type: 's'}, 
    H_4: {type: 's'}, H_5: {type: 's'}, B_1: {type: 's', color: 'blue', style: 'filled'}}, 
    edgelist: {C_0: ['H_0:f1', 'H_1', 'H_2', 'C_1'], C_1: ['H_3', 'H_4', 'H_5'], H_1: ['B_1']}, 
    params: {node: {shape: 'circle', color: 'red'}, edge: {color: 'blue'}}},
];

return model
}


TreeViewer = function()  //construct the view
{
  
}

TreeViewer.prototype.init = function(c)
{
   this.ctx = c
}

TreeViewer.prototype.render = function(ascene)
{
  $('#ancan_div').attr('class','none')
  $('#ancan_div').gchart($.gchart.graphviz(true, ascene.nodelist,
    ascene.edgelist, ascene.params ))

}

