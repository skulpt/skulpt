/* http://keith-wood.name/gChart.html
   Google Chart GraphViz extension for jQuery v1.4.3.
   See API details at http://code.google.com/apis/chart/.
   Written by Keith Wood (kbwood{at}iinet.com.au) September 2008.
   Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and 
   MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses. 
   Please attribute the author if you use it. */

(function($) { // Hide scope, no $ conflict

// New chart types: graphviz
$.extend($.gchart._chartTypes, {graphviz: 'gv', gv: 'gv'});
	
$.extend($.gchart._typeOptions, {gv: 'no'});

$.extend($.gchart._prototype.prototype, {

	/* Prepare options for a GraphViz chart.
	   @param  engine    (string, optional) the graphing engine to use:
	                     dot (default), neato, twopi, circo, fdp
	   @param  options   (object, optional) other options for the chart
	   @param  directed  (boolean, optional) true for directed graph, false for normal
	   @param  nodes     (string) the DOT representation of the nodes to graph or
	                     (object) the graph nodes and their settings
	   @param  edges     (object, optional) the graph edges keyed from, with array of to
	   @param  attrs     (object, optional) other settings for the graph
	   @return  (object) the configured options object */
	graphviz: function(engine, options, directed, nodes, edges, attrs) {
		if (arguments.length == 1) {
			nodes = engine;
			engine = 'dot';
		}
		var hadEngine = typeof engine == 'string';
		if (!hadEngine) {
			attrs = edges;
			edges = nodes;
			nodes = directed;
			directed = options;
			options = engine;
			engine = 'dot';
		}
		if ((options && typeof options != 'object') || arguments.length == 2 ||
				(arguments.length == 3 && hadEngine)) {
			attrs = edges;
			edges = nodes;
			nodes = directed;
			directed = options;
			options = {};
		}
		if (typeof directed != 'boolean' && arguments.length > 1) {
			attrs = edges;
			edges = nodes;
			nodes = directed;
			directed = false;
		}
		options = options || {};
		options.type = 'gv' + (engine != 'dot' ? ':' + engine : '');
		options.dataLabels = [typeof nodes == 'string' ? nodes :
			this._genGraph(directed, nodes, edges, attrs)];
		return options;
	},

	/* Generate a graph definition.
	   @param  directed  (boolean, optional) true for directed graph, false for normal
	   @param  nodes     (object) the graph nodes and their settings
	   @param  edges     (object) the graph edges keyed from, with array of to
	   @param  attrs     (object, optional) other settings for the graph
	   @return  (string) the graph definition */
	_genGraph: function(directed, nodes, edges, attrs) {
		attrs = attrs || {};
		var gdef = (directed ? 'digraph' : 'graph') + '{';
		var sep = '';
		for (var n in attrs) {
			gdef += sep + n;
			var sep2 = '[';
			for (var n2 in attrs[n]) {
				gdef += sep2 + n2 + '=' + attrs[n][n2];
				sep2 = ','
			}
			gdef += (sep2 != '[' ? ']' : '');
			sep = ';';
		}
		for (var node in nodes || {}) {
			gdef += sep + node;
			var sep2 = '[';
			for (var n in nodes[node]) {
				gdef += sep2 + n + '=' + nodes[node][n];
				sep2 = ','
			}
			gdef += (sep2 != '[' ? ']' : '');
			sep = ';';
		}
		for (var edge in edges || {}) {
			for (var n in edges[edge]) {
				gdef += sep + edge + (directed ? '->' : '--') + edges[edge][n];
			}
			sep = ';';
		}
		gdef += '}';
		return gdef;
	},

	/* Generate standard options for charts that aren't really charts.
	   @param  options  (object) the chart settings
	   @param  labels   (string) the concatenated labels for the chart
	   @return  (string) the standard non-chart options */
	noOptions: function(options, labels) {
		return '&chl=' + labels.substr(1);
	}
});

})(jQuery);
