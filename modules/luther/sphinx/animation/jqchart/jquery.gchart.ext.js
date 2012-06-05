/* http://keith-wood.name/gChart.html
   Google Chart interface extensions for jQuery v1.4.3.
   See API details at http://code.google.com/apis/chart/.
   Written by Keith Wood (kbwood{at}iinet.com.au) September 2008.
   Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and 
   MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses. 
   Please attribute the author if you use it. */

(function($) { // Hide scope, no $ conflict

$.extend($.gchart._defaults, {
		// Maps -------------------
		mapLatLong: false, // True to use lat/long coords in mapArea
		mapArea: null, // New maps: (number) pixel border all around or
			// (number[4]) individual pixel borders or lat/long
			// Original maps: the general area to show:
			// world, africa, asia, europe, middle_east, south_america, usa
		mapRegions: [], // List of country/state codes to plot
		mapDefaultColor: 'bebebe', // The colour for non-plotted countries/states
		mapColors: ['blue', 'red'], // The colour range for plotted countries/states
		// QR Code ----------------
		qrECLevel: null, // Error correction level: low, medium, quarter, high
		qrMargin: null // Margin (squares) around QR code, default is 4
	});

// New chart types: formula, map, mapOriginal, meter, qrCode, scatter, venn
$.extend($.gchart._chartTypes, {formula: 'tx', map: 'map', mapOriginal: 't',
	meter: 'gom', qrCode: 'qr', scatter: 's', venn: 'v',
	gom: 'gom', qr: 'qr', s: 's', t: 't', tx: 'tx', v: 'v'});
	
$.extend($.gchart._typeOptions, {map: 'map', qr: 'qr', t: 'map', tx: 'no'});

$.extend($.gchart._prototype.prototype, {

	/* Latitude and longitude coordinates for the continents. */
	mapAfrica: [-35, -20, 40, 55],
	mapAsia: [-15, 40, 75, 180],
	mapAustralia: [-45, 110, -10, 155],
	mapEurope: [33, -25, 73, 50],
	mapNorthAmerica: [5, -175, 75, -50],
	mapSouthAmerica: [-55, -85, 15, -35],

	/* Prepare options for a scatter chart.
	   @param  values   (number[][2/3]) the coordinates of the points: [0] is the x-coord,
	                    [1] is the y-coord, [2] (optional) is the percentage size
	   @param  minMax   (number[2/4]) any minimum and maximum values for the axes (optional)
	   @param  labels   (string[]) the labels for the groups (optional)
	   @param  colours  (string[]) the colours for the labels (optional)
	   @param  options  (object) additional settings (optional)
	   @return  (object) the configured options object */
	scatter: function(values, minMax, labels, colours, options) {
		if (!$.isArray(minMax)) {
			options = minMax;
			colours = null;
			labels = null;
			minMax = null;
		}
		else if (typeof minMax[0] != 'number') {
			options = colours;
			colours = labels;
			labels = minMax;
			minMax = null;
		}
		if (labels && !$.isArray(labels)) {
			options = labels;
			colours = null;
			labels = null;
		}
		var series = [[], [], []];
		for (var i = 0; i < values.length; i++) {
			series[0][i] = values[i][0];
			series[1][i] = values[i][1];
			series[2][i] = values[i][2] || 100;
		}
		minMax = minMax || [];
		options = options || {};
		if (labels) {
			options.extension = {chdl: labels.join('|')};
		}
		if (colours) {
			colours = $.map(colours, function(v, i) {
				return $.gchart.color(v);
			});
			$.extend(options.extension, {chco: colours.join('|')});
		}
		return $.extend({}, options,
			{type: 'scatter', encoding: (minMax.length >= 2 ? 'scaled' : 'text'), series: [
				(minMax.length >= 2 ? $.gchart.series(series[0], minMax[0], minMax[1]) :
				$.gchart.series(series[0])),
				(minMax.length >= 4 ? $.gchart.series(series[1],
				(minMax[2] != null ? minMax[2] : minMax[0]), (minMax[3] != null ? minMax[3] : minMax[1])) :
				$.gchart.series(series[1])), $.gchart.series(series[2])]});
	},

	/* Prepare options for a Venn diagram.
	   @param  size1       (number) the relative size of the first circle
	   @param  size2       (number) the relative size of the second circle
	   @param  size3       (number) the relative size of the third circle
	   @param  overlap12   (number) the overlap between circles 1 and 2
	   @param  overlap13   (number) the overlap between circles 1 and 3
	   @param  overlap23   (number) the overlap between circles 2 and 3
	   @param  overlap123  (number) the overlap between all circles
	   @param  options     (object) additional settings (optional)
	   @return  (object) the configured options object */
	venn: function(size1, size2, size3, overlap12, overlap13, overlap23, overlap123, options) {
		return $.extend({}, options || {}, {type: 'venn', series:
			[$.gchart.series([size1, size2, size3, overlap12, overlap13, overlap23, overlap123])]});
	},

	/* Prepare options for a Google meter.
	   @param  text      (string or string[]) the text to show on the arrow (optional)
	   @param  values    (number or number[] or [] of these) the position(s) of the arrow(s)
	   @param  maxValue  (number) the maximum value for the meter (optional, default 100)
	   @param  colours   (string[]) the colours to use for the band (optional)
	   @param  labels    (string[]) labels appearing beneath the meter (optional)
	   @param  styles    (number[][4]) the styles of each series' arrows:
	                     width, dash, space, arrow size (optional)
	   @param  options   (object) additional settings (optional)
	   @return  (object) the configured options object */
	meter: function(text, values, maxValue, colours, labels, styles, options) {
		if (typeof text != 'string' && !$.isArray(text)) {
			options = styles;
			styles = labels;
			labels = colours;
			colours = maxValue;
			maxValue = values;
			values = text;
			text = '';
		}
		if (typeof maxValue != 'number') {
			options = styles;
			styles = labels;
			labels = colours;
			colours = maxValue;
			maxValue = null;
		}
		if (!$.isArray(colours)) {
			options = styles;
			styles = labels;
			labels = colours;
			colours = null;
		}
		if (!$.isArray(labels)) {
			options = styles;
			styles = labels;
			labels = null;
		}
		if (!$.isArray(styles)) {
			options = styles;
			styles = null;
		}
		values = ($.isArray(values) ? values : [values]);
		var multi = false;
		for (var i = 0; i < values.length; i++) {
			multi = multi || $.isArray(values[i]);
		}
		var ss = (multi ? [] : [$.gchart.series(values)]);
		if (multi) {
			for (var i = 0; i < values.length; i++) {
				ss.push($.gchart.series($.isArray(values[i]) ? values[i] : [values[i]]));
			}
		}
		values = ss;
		if (colours) {
			var cs = '';
			$.each(colours, function(i, v) {
				cs += ',' + $.gchart.color(v);
			});
			colours = cs.substr(1);
		}
		if (styles) {
			var ls = ['', ''];
			$.each(styles, function(i, v) {
				v = ($.isArray(v) ? v : [v]);
				ls[0] += '|' + $.gchart.color(v.slice(0, 3).join(','));
				ls[1] += '|' + (v[3] || 15);
			});
			styles = ls[0].substr(1) + ls[1];
		}
		var axis = (labels && labels.length ?  $.gchart.axis('y', labels) : null);
		return $.extend({}, options || {}, {type: 'meter',
			maxValue: maxValue || 100, series: values,
			dataLabels: ($.isArray(text) ? text : [text || ''])},
			(colours ? {extension: {chco: colours}} : {}),
			(axis ? {axes: [axis]} : {}),
			(styles ? {extension: {chls: styles}} : {}));
	},

	/* Prepare options for a map chart.
	   @param  latLongArea    (boolean) true to specify the area via latitude/longitude (optional)
	   @param  mapArea        (string) the region of the world to show (original map style) or
	                          (number[4]) the pixel zoom or lat/long coordinates to show or
							  (number) all around pixel zoom (optional)
	   @param  values         (object) the countries/states to plot -
	                          attributes are country/state codes and values
	   @param  defaultColour  (string) the colour for regions without values (optional)
	   @param  colour         (string or string[]) the starting colour or
	                          gradient colours for rendering values (optional)
	   @param  endColour      (string) the ending colour for rendering values (optional)
	   @param  options        (object) additional settings (optional)
	   @return  (object) the configured options object */
	map: function(latLongArea, mapArea, values, defaultColour, colour, endColour, options) {
		if (typeof latLongArea != 'boolean') {
			options = endColour;
			endColour = colour;
			colour = defaultColour;
			defaultColour = values;
			values = mapArea;
			mapArea = latLongArea;
			latLongArea = false;
		}
		if (typeof mapArea == 'object' && !$.isArray(mapArea)) { // Optional mapArea
			options = endColour;
			endColour = colour;
			colour = defaultColour;
			defaultColour = values;
			values = mapArea;
			mapArea = null;
		}
		if (typeof defaultColour == 'object') {
			options = defaultColour;
			endColour = null;
			colour = null;
			defaultColour = null;
		}
		else if (typeof colour == 'object' && !$.isArray(colour)) {
			options = colour;
			endColour = null;
			colour = null;
		}
		else if (typeof endColour == 'object') {
			options = endColour;
			endColour = null;
		}
		var mapRegions = [];
		var data = [];
		var i = 0;
		for (var name in values) {
			mapRegions[i] = name.replace(/_/g, '-');
			data[i] = values[name];
			i++;
		}
		if (typeof mapArea == 'number') {
			mapArea = [mapArea, mapArea, mapArea, mapArea];
		}
		return $.extend({}, options || {},
			{type: (typeof mapArea == 'string' ? 'mapOriginal' : 'map'),
			mapLatLong: latLongArea, mapArea: mapArea, mapRegions: mapRegions,
			mapDefaultColor: defaultColour || $.gchart._defaults.mapDefaultColor,
			mapColors: ($.isArray(colour) ? colour : [colour || $.gchart._defaults.mapColors[0],
			endColour || $.gchart._defaults.mapColors[1]]),
			series: [$.gchart.series('', data)]});
	},

	/* Prepare options for generating a QR Code.
	   @param  text      (object) the QR code settings or
	                     (string) the text to encode
	   @param  encoding  (string) the encoding scheme (optional)
	   @param  ecLevel   (string) the error correction level: l, m, q, h (optional)
	   @param  margin    (number) the margin around the code (optional)
	   @return  (object) the configured options object */
	qrCode: function(text, encoding, ecLevel, margin) {
		var options = {};
		if (typeof text == 'object') {
			options = text;
		}
		else { // Individual fields
			options = {dataLabels: [text], encoding: encoding,
				qrECLevel: ecLevel, qrMargin: margin};
		}
		options.type = 'qrCode';
		if (options.text) {
			options.dataLabels = [options.text];
			options.text = null;
		}
		return options;
	},

	/* Generate standard options for map charts.
	   @param  options  (object) the chart settings
	   @param  labels   (string) the concatenated labels for the chart
	   @return  (string) the standard map chart options */
	mapOptions: function(options, labels) {
		var encoding = this['_' + options.encoding + 'Encoding'] || this['_textEncoding'];
		var colours = '';
		for (var i = 0; i < options.mapColors.length; i++) {
			colours += ',' + $.gchart.color(options.mapColors[i]);
		}
		return (typeof options.mapArea == 'string' ? '&chtm=' + options.mapArea :
			(options.mapArea ? (options.mapLatLong ? ':fixed=' : ':auto=') +
			($.isArray(options.mapArea) ? options.mapArea.join(',') :
			options.mapArea + ',' + options.mapArea + ',' + options.mapArea + ',' + options.mapArea) : '')) +
			'&chd=' + encoding.apply($.gchart, [options]) +
			(options.mapRegions && options.mapRegions.length ?
			'&chld=' + options.mapRegions.join(typeof options.mapArea == 'string' ? '' : '|') : '') +
			'&chco=' + $.gchart.color(options.mapDefaultColor) + colours;
	},

	/* Generate standard options for QR Code charts.
	   @param  options  (object) the chart settings
	   @param  labels   (string) the concatenated labels for the chart
	   @return  (string) the standard QR Code chart options */
	qrOptions: function(options, labels) {
		return $.gchart._include('&choe=', options.encoding) +
			(options.qrECLevel || options.qrMargin ?
			'&chld=' + (options.qrECLevel ? options.qrECLevel.charAt(0) : 'l') +
			(options.qrMargin != null ? '|' + options.qrMargin : '') : '') +
			(labels ? '&chl=' + labels.substr(1) : '');
	},

	/* Generate standard options for charts that aren't really charts.
	   @param  options  (object) the chart settings
	   @param  labels   (string) the concatenated labels for the chart
	   @return  (string) the standard non-chart options */
	noOptions: function(options, labels) {
		return '&chl=' + labels.substr(1);
	},

	/* Generate the options for chart size, including restriction for maps.
	   @param  type     (string) the encoded chart type
	   @param  options  (object) the chart settings
	   @return  (string) the chart size options */
	addSize: function(type, options) {
		var maxSize = (type == 'map' || type == 't' ? 600 : 1000);
		options.width = Math.max(10, Math.min(options.width, maxSize));
		options.height = Math.max(10, Math.min(options.height, maxSize));
		if (options.width * options.height > 300000) {
			options.height = Math.floor(300000 / options.width);
		}
		return 'chs=' + options.width + 'x' + options.height;
	}
});

})(jQuery);
