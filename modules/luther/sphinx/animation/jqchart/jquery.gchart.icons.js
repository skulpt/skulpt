/* http://keith-wood.name/gChart.html
   Google Chart icons extension for jQuery v1.4.3.
   See API details at http://code.google.com/apis/chart/.
   Written by Keith Wood (kbwood{at}iinet.com.au) September 2008.
   Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and 
   MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses. 
   Please attribute the author if you use it. */

(function($) { // Hide scope, no $ conflict

/* Mapping from marker placement names to chart drawing placement codes. */
var PLACEMENTS = {center: 'h', centre: 'h', left: 'l', right: 'r', h: 'h', l: 'l', r: 'r'};
/* Mapping from icon tail names to chart tail codes. */
var TAILS = {bottomLeft: 'bb', topLeft: 'bbtl', topRight: 'bbtr', bottomRight: 'bbbr', none: 'bbT',
	bb: 'bb', bbtl: 'bbtl', bbtr: 'bbtr', bbbr: 'bbbr', bbT: 'bbT',
	edgeBottomLeft: 'edge_bl', edgeBottomCenter: 'edge_bc', edgeBottomRight: 'edge_br',
	edgeTopLeft: 'edge_tl', edgeTopCenter: 'edge_tc', edgeTopRight: 'edge_tr',
	edgeLeftTop: 'edge_lt', edgeLeftCenter: 'edge_lc', edgeLeftBottom: 'edge_lb',
	edgeRightTop: 'edge_rt', edgeRightCenter: 'edge_rc', edgeRightBottom: 'edge_rb',
	edgeBL: 'edge_bl', edgeBC: 'edge_bc', edgeBR: 'edge_br',
	edgeTL: 'edge_tl', edgeTC: 'edge_tc', edgeTR: 'edge_tr',
	edgeLT: 'edge_lt', edgeLC: 'edge_lc', edgeLB: 'edge_lb',
	edgeRT: 'edge_rt', edgeRC: 'edge_rc', edgeRB: 'edge_rb'};
/* Mapping from icon map pin style names to chart map pin style codes. */
var PIN_STYLES = {none: 'pin', star: 'pin_star', left: 'pin_sleft', right: 'pin_sright'};
/* Mapping from icon shadow names to chart icon shadow codes. */
var SHADOWS = {no: '', yes: '_withshadow', only: '_shadow'};
/* Mapping from icon note types to chart icon note codes. */
var NOTES = {arrow: 'arrow_d', balloon: 'balloon', pinned: 'pinned_c',
	sticky: 'sticky_y', taped: 'taped_y', thought: 'thought'};
/* Mapping from contextual alignment names to chart drawing alignment codes. */
var ALIGNMENTS = {topLeft: 'lt', top: 'ht', topRight: 'rt', left: 'lv', center: 'hv', centre: 'hv',
	right: 'rv', bottomLeft: 'lb', bottom: 'hb', bottomRight: 'rb',
	tl: 'lt', lt: 'lt', t: 'ht', ht: 'ht', tr: 'rt', rt: 'rt', l: 'l', lv: 'lv', c: 'hv', hc: 'hv',
	hv: 'hv', r: 'rv', rv: 'rv', bl: 'lb', lb: 'lb', b: 'hb', hb: 'hb', br: 'rb', rb: 'rb'};
/* Allowed sizes of icons. */
var SIZES = {12: 12, 16: 16, 24: 24};
/* Mapping from embedded chart alignment names to chart drawing alignment codes. */
var EMBEDDED_ALIGNMENTS = {topLeft: 'tl', top: 'ht', topRight: 'tr', left: 'vl', center: 'hv', centre: 'hv',
	right: 'vr', bottomLeft: 'lb', bottom: 'hb', bottomRight: 'rb',
	tl: 'tl', t: 'ht', ht: 'ht', tr: 'tr', l: 'vl', vl: 'vl', c: 'hv',
	hv: 'hv', r: 'vr', vr: 'vr', bl: 'lb', lb: 'lb', b: 'hb', hb: 'hb', br: 'rb', rb: 'rb'};

$.extend($.gchart._defaults, {
		icons: [] // Definitions of dynamic icons for the chart, each entry is an object with
			// name (string), data (string), series (number), item (number), zIndex (number),
			// position (number[2]), offsets (number[2])
	});

$.gchart._chartOptions = $.gchart._chartOptions.join().replace(/Markers/, 'Markers,Icons').split(',');

$.extend($.gchart._prototype.prototype, {

	/* Create a dynamic icon definition.
	   @param  name      (string) the name of the icon to use
	   @param  data      (string) the icon's encoded parameters
	   @param  series    (number, optional) the series to which the icon applies, -1 for freestanding
	   @param  item      (number or string or number[2 or 3], optional)
	                     the item in the series to which it applies or 'all' (default)
	                     or 'everyn' or [start, end, every]
	   @param  zIndex    (number, optional) the z-index (-1.0 to 1.0)
	   @param  position  (number[2], optional) an absolute chart position (0.0 to 1.0)
	   @param  offsets   (number[2], optional) pixel offsets
	   @return  (object) the icon definition */
	icon: function(name, data, series, item, zIndex, position, offsets) {
		if ($.isArray(series)) {
			offsets = item;
			position = series;
			zIndex = null;
			item = null;
			series = null;
		}
		if ($.isArray(zIndex)) {
			offsets = position;
			position = zIndex;
			zIndex = null;
		}
		return {name: name, data: data, series: series || 0, item: (item || item == 0 ? item : 'all'),
			zIndex: zIndex, position: position, offsets: offsets};
	},

	/* Create a bubble icon definition.
	   @param  text      (string) the text content, use '|' for line breaks
	   @param  image     (string, optional) the name of an inset image
	   @param  tail      (string, optional) the type of tail to use
	   @param  large     (boolean, optional) true if a large bubble is required
	   @param  shadow    (string, optional) 'no', 'yes', 'only'
	   @param  bgColour  (string, optional) the icon background's colour
	   @param  colour    (string, optional) the icon text's colour
	   @param  series    (number, optional) the series to which the icon applies
	   @param  item      (number or string or number[2 or 3], optional)
	                     the item in the series to which it applies or 'all' (default)
	                     or 'everyn' or [start, end, every]
	   @param  zIndex    (number, optional) the z-index (-1.0 to 1.0)
	   @param  position  (number[2], optional) an absolute chart position (0.0 to 1.0)
	   @param  offsets   (number[2], optional) pixel offsets
	   @return  (object) the icon definition */
	bubbleIcon: function(text, image, tail, large, shadow, bgColour, colour,
			series, item, zIndex, position, offsets) {
		if (typeof image == 'boolean') {
			offsets = zIndex;
			position = item;
			zIndex = series;
			item = colour;
			series = bgColour;
			colour = shadow;
			bgColour = large;
			shadow = tail;
			large = image;
			tail = null;
			image = null;
		}
		else if (typeof image == 'number') {
			offsets = bgColour;
			position = shadow;
			zIndex = large;
			item = tail;
			series = image;
			colour = null;
			bgColour = null;
			shadow = null;
			large = null;
			tail = null;
			image = null;
		}
		if (typeof tail == 'boolean') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = colour;
			colour = bgColour;
			bgColour = shadow;
			shadow = large;
			large = tail;
			tail = null;
		}
		else if (typeof tail == 'number') {
			offsets = colour;
			position = bgColour;
			zIndex = shadow;
			item = large;
			series = tail;
			colour = null;
			bgColour = null;
			shadow = null;
			large = null;
			tail = null;
		}
		if (typeof large == 'number') {
			offsets = series;
			position = colour;
			zIndex = bgColour;
			item = shadow;
			series = large;
			colour = null;
			bgColour = null;
			shadow = null;
			large = null;
		}
		if (typeof shadow == 'number') {
			offsets = item;
			position = series;
			zIndex = colour;
			item = bgColour;
			series = shadow;
			colour = null;
			bgColour = null;
			shadow = null;
		}
		if (typeof bgColour == 'number') {
			offsets = zIndex;
			position = item;
			zIndex = series;
			item = colour;
			series = bgColour;
			colour = null;
			bgColour = null;
		}
		if (typeof colour == 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = colour;
			colour = null;
		}
		var multiline = text.match(/\|/);
		var colours = this.color(bgColour || 'white') + ',' + this.color(colour || 'black');
		var data = (image ? image + ',' : '') + (TAILS[tail] || 'bb') + ',' +
			(multiline ? colours + ',' : '') + this._escapeIconText(text) +
			(multiline ? '' : ',' + colours);
		return this.icon('bubble' + (image ? '_icon' : '') +
			(multiline || (!image && large) ? '_texts' : '_text') +
			(large || multiline  ? '_big' : '_small') + SHADOWS[shadow || 'yes'],
			data, series, item, zIndex, position, offsets);
	},

	/* Create a map pin icon definition.
	   @param  letter    (string) the single letter to show
	   @param  image     (string, optional) the name of an inset image
	   @param  style     (string, optional) '' or 'none', 'star', 'left', 'right'
	   @param  shadow    (string, optional) 'no', 'yes', 'only'
	   @param  bgColour  (string, optional) the icon background's colour
	   @param  colour    (string, optional) the icon text's colour
	   @param  series    (number, optional) the series to which the icon applies
	   @param  item      (number or string or number[2 or 3], optional)
	                     the item in the series to which it applies or 'all' (default)
	                     or 'everyn' or [start, end, every]
	   @param  zIndex    (number, optional) the z-index (-1.0 to 1.0)
	   @param  position  (number[2], optional) an absolute chart position (0.0 to 1.0)
	   @param  offsets   (number[2], optional) pixel offsets
	   @return  (object) the icon definition */
	mapPinIcon: function(letter, image, style, shadow, bgColour, colour,
			series, item, zIndex, position, offsets) {
		if (typeof image == 'number') {
			offsets = colour;
			position = bgColour;
			zIndex = shadow;
			item = style;
			series = image;
			colour = null;
			bgColour = null;
			shadow = null;
			style = null;
			image = null;
		}
		if (typeof style == 'number') {
			offsets = series;
			position = colour;
			zIndex = bgColour;
			item = shadow;
			series = style;
			colour = null;
			bgColour = null;
			shadow = null;
			style = null;
		}
		if (typeof shadow == 'number') {
			offsets = item;
			position = series;
			zIndex = colour;
			item = bgColour;
			series = shadow;
			colour = null;
			bgColour = null;
			shadow = null;
		}
		if (typeof bgColour == 'number') {
			offsets = zIndex;
			position = item;
			zIndex = series;
			item = colour;
			series = bgColour;
			colour = null;
			bgColour = null;
		}
		if (typeof colour == 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = colour;
			colour = null;
		}
		var data = (style ? (PIN_STYLES[style] || 'pin') + ',' : '') +
			(image ? image : this._escapeIconText(letter)) + ',' + this.color(bgColour || 'white') +
			(image ? '' : ',' + this.color(colour || 'black'));
		return this.icon('map_' + (style ? 'x' : '') + 'pin' + (image ? '_icon' : '_letter') +
			SHADOWS[shadow || 'yes'], data, series, item, zIndex, position, offsets);
	},

	/* Create a fun note icon definition.
	   @param  title      (string) the note title
	   @param  text       (string, optional) the text content, use '|' for line breaks
	   @param  type       (string, optional) the type of note to display
	   @param  large      (boolean, optional) true if a large note is required
	   @param  alignment  (string, optional) 'left', 'right', 'center'
	   @param  colour     (string, optional) the icon text's colour
	   @param  series     (number, optional) the series to which the icon applies
	   @param  item       (number or string or number[2 or 3], optional)
	                     the item in the series to which it applies or 'all' (default)
	                     or 'everyn' or [start, end, every]
	   @param  zIndex     (number, optional) the z-index (-1.0 to 1.0)
	   @param  position   (number[2], optional) an absolute chart position (0.0 to 1.0)
	   @param  offsets    (number[2], optional) pixel offsets
	   @return  (object) the icon definition */
	noteIcon: function(title, text, type, large, alignment, colour,
			series, item, zIndex, position, offsets) {
		if (typeof text == 'boolean') {
			offsets = zIndex;
			position = item;
			zIndex = series;
			item = colour;
			series = alignment;
			colour = large;
			alignment = type;
			large = text;
			type = null;
			text = null;
		}
		else if (typeof text == 'number') {
			offsets = colour;
			position = alignment;
			zIndex = large;
			item = type;
			series = text;
			colour = null;
			alignment = null;
			large = null;
			type = null;
			text = null;
		}
		if (typeof type == 'boolean') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = colour;
			colour = alignment;
			alignment = large;
			large = type;
			type = null;
		}
		else if (typeof type == 'number') {
			offsets = series;
			position = colour;
			zIndex = alignment;
			item = large;
			series = type;
			colour = null;
			alignment = null;
			large = null;
			type = null;
		}
		if (typeof large == 'number') {
			offsets = item;
			position = series;
			zIndex = colour;
			item = alignment;
			series = large;
			colour = null;
			alignment = null;
			large = null;
		}
		if (typeof alignment == 'number') {
			offsets = zIndex;
			position = item;
			zIndex = series;
			item = colour;
			series = alignment;
			colour = null;
			alignment = null;
		}
		if (typeof colour == 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = colour;
			colour = null;
		}
		var data = (NOTES[type] || 'sticky_y') + ',' + (large ? '1' : '2') + ',' +
			this.color(colour || 'black') + ',' + (PLACEMENTS[alignment] || 'h') + ',' +
			(title ? this._escapeIconText(title) + ',' : '') + this._escapeIconText(text || '');
		return this.icon('fnote' + (title ? '_title' : ''),
			data, series, item, zIndex, position, offsets);
	},

	/* Create a weather icon definition.
	   @param  title     (string) the note title
	   @param  text      (string, optional) the text content, use '|' for line breaks
	   @param  type      (string, optional) the type of note to display
	   @param  image     (string, optional) the name of an inset image
	   @param  series    (number, optional) the series to which the icon applies
	   @param  item      (number or string or number[2 or 3], optional)
	                     the item in the series to which it applies or 'all' (default)
	                     or 'everyn' or [start, end, every]
	   @param  zIndex    (number, optional) the z-index (-1.0 to 1.0)
	   @param  position  (number[2], optional) an absolute chart position (0.0 to 1.0)
	   @param  offsets   (number[2], optional) pixel offsets
	   @return  (object) the icon definition */
	weatherIcon: function(title, text, type, image, series, item, zIndex, position, offsets) {
		if (typeof text == 'number') {
			offsets = item;
			position = series;
			zIndex = image;
			item = type;
			series = text;
			image = null;
			type = null;
			text = null;
		}
		if (typeof type == 'number') {
			offsets = zIndex;
			position = item;
			zIndex = series;
			item = image;
			series = type;
			image = null;
			type = null;
		}
		if (typeof image == 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = image;
			image = null;
		}
		var data = (NOTES[type] || 'sticky_y') + ',' + (image || 'sunny') + ',' +
			this._escapeIconText(title || '') + (text ? ',' + this._escapeIconText(text) : '');
		return this.icon('weather', data, series, item, zIndex, position, offsets);
	},

	/* Create a text outline icon definition.
	   @param  text       (string) the text content, use '|' for line breaks
	   @param  size       (number, optional) the text size in pixels
	   @param  bold       (boolean, optional) true for bold
	   @param  alignment  (string, optional) 'left', 'right', 'center'
	   @param  colour     (string, optional) the icon text's fill colour
	   @param  outline    (string, optional) the icon text's outline colour
	   @param  series     (number, optional) the series to which the icon applies
	   @param  item       (number or string or number[2 or 3], optional)
	                      the item in the series to which it applies or 'all' (default)
	                      or 'everyn' or [start, end, every]
	   @param  zIndex     (number, optional) the z-index (-1.0 to 1.0)
	   @param  position   (number[2], optional) an absolute chart position (0.0 to 1.0)
	   @param  offsets    (number[2], optional) pixel offsets
	   @return  (object) the icon definition */
	outlineIcon: function(text, size, bold, alignment, colour, outline,
			series, item, zIndex, position, offsets) {
		if (typeof size == 'boolean') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = outline;
			outline = colour;
			colour = alignment;
			alignment = bold;
			bold = size;
			size = null;
		}
		if (typeof size == 'string') {
			offsets = zIndex;
			position = item;
			zIndex = series;
			item = outline;
			series = colour;
			outline = alignment;
			colour = bold;
			alignment = size;
			bold = null;
			size = null;
		}
		if (typeof bold == 'number') {
			offsets = series;
			position = outline;
			zIndex = colour;
			item = alignment;
			series = bold;
			outline = null;
			colour = null;
			alignment = null;
			bold = null;
		}
		if (typeof alignment == 'number') {
			offsets = item;
			position = series;
			zIndex = outline;
			item = colour;
			series = alignment;
			outline = null;
			colour = null;
			alignment = null;
		}
		if (typeof colour == 'number') {
			offsets = zIndex;
			position = item;
			zIndex = series;
			item = outline;
			series = colour;
			outline = null;
			colour = null;
		}
		if (typeof outline == 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = outline;
			outline = null;
		}
		var data = this.color(colour || 'white') + ',' + (size || 10) + ',' +
			(PLACEMENTS[alignment] || 'h') + ',' + this.color(outline || 'black') + ',' +
			(bold ? 'b' : '_') + ',' + this._escapeIconText(text);
		return this.icon('text_outline', data, series, item, zIndex, position, offsets);
	},

	/* Create a colour varying icon definition.
	   @param  image         (string) the name of the icon to use
	   @param  colourSeries  (number) the series from which colour data is taken
	   @param  colourLow     (string[3] or string, optional) the icons' fill colour(s) (default 'green')
	   @param  colourMiddle  (string, optional) the icons' middle fill colour (default 'yellow')
	   @param  colourHigh    (string, optional) the icons' high fill colour (default 'red')
	   @param  size          (number, optional) the icon size in pixels - 12, 16, 24 (default 12)
	   @param  outline       (string, optional) the icons' outline colour (default 'black')
	   @param  alignment     (string, optional) result of contextualAlignment(...) (default 'hb')
	   @param  series        (number) the series to which the icon applies
	   @param  item          (number or string or number[2 or 3], optional)
	                         the item in the series to which it applies or 'all' (default)
	                         or 'everyn' or [start, end, every]
	   @param  zIndex        (number, optional) the z-index (-1.0 to 1.0)
	   @param  position      (number[2], optional) an absolute chart position (0.0 to 1.0)
	   @param  offsets       (number[2], optional) pixel offsets
	   @return  (object) the icon definition */
	colourVaryIcon: function(image, colourSeries, colourLow, colourMiddle, colourHigh, size, outline, alignment,
			series, item, zIndex, position, offsets) {
		if ($.isArray(colourLow)) {
			offsets = zIndex;
			position = item;
			zIndex = series;
			item = alignment;
			series = outline;
			alignment = size;
			outline = colourHigh;
			size = colourMiddle;
			colourHigh = colourLow[2];
			colourMiddle = colourLow[1];
			colourLow = colourLow[0];
		}
		else if (typeof colourLow != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = size;
			size = colourHigh;
			colourHigh = colourMiddle;
			colourMiddle = colourLow;
			colourLow = null;
		}
		if (typeof colourMiddle != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = size;
			size = colourHigh;
			colourHigh = colourMiddle;
			colourMiddle = null;
		}
		if (typeof colourHigh != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = size;
			size = colourHigh;
			colourHigh = null;
		}
		if (typeof size != 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = size;
			size = null;
		}
		if (typeof outline != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = null;
		}
		if (typeof alignment != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = null;
		}
		var data = image + ',' + (colourSeries || 0) + ',' + this.color(colourLow || 'green') + ',' +
			this.color(colourMiddle || 'yellow') + ',' + this.color(colourHigh || 'red') + ',' +
			(SIZES[size] || 12) + ',' + this.color(outline || 'black') + ',' + (alignment || 'hb-0-0');
		return this.icon('cm_color', data, series, item, zIndex, position, offsets);
	},

	/* Create a size varying icon definition.
	   @param  image           (string) the name of the icon to use
	   @param  sizeSeries      (number) the series from which size data is taken
	   @param  zeroSize        (number[3] or number, optional) the icons' size at minimum data value (default 4),
	                           or array of this and next two values
	   @param  sizeMultiplier  (number, optional) the size scaling factor (default 10)
	   @param  minSize         (number, optional) the minimum size for any icon in pixels (default 4)
	   @param  colour          (string, optional) the icons' fill colour (default '#88ff88')
	   @param  outline         (string, optional) the icons' outline colour (default 'black')
	   @param  alignment       (string, optional) result of contextualAlignment(...) (default 'hb')
	   @param  series          (number) the series to which the icon applies
	   @param  item            (number or string or number[2 or 3], optional)
	                           the item in the series to which it applies or 'all' (default)
	                           or 'everyn' or [start, end, every]
	   @param  zIndex          (number, optional) the z-index (-1.0 to 1.0)
	   @param  position        (number[2], optional) an absolute chart position (0.0 to 1.0)
	   @param  offsets         (number[2], optional) pixel offsets
	   @return  (object) the icon definition */
	sizeVaryIcon: function(image, sizeSeries, zeroSize, sizeMultiplier, minSize, colour, outline, alignment,
			series, item, zIndex, position, offsets) {
		if ($.isArray(zeroSize)) {
			offsets = zIndex;
			position = item;
			zIndex = series;
			item = alignment;
			series = outline;
			alignment = colour;
			outline = minSize;
			colour = sizeMultiplier;
			minSize = zeroSize[2];
			sizeMultiplier = zeroSize[1];
			zeroSize = zeroSize[0];
		}
		else if (typeof zeroSize != 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = colour;
			colour = minSize;
			minSize = sizeMultiplier;
			sizeMultiplier = zeroSize;
			zeroSize = null;
		}
		if (typeof sizeMultiplier != 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = colour;
			colour = minSize;
			minSize = sizeMultiplier;
			sizeMultiplier = null;
		}
		if (typeof minSize != 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = colour;
			colour = minSize;
			minSize = null;
		}
		if (typeof colour != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = colour;
			colour = null;
		}
		if (typeof outline != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = null;
		}
		if (typeof alignment != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = null;
		}
		var data = image + ',' + (sizeSeries || 0) + ',' + (zeroSize || 4) + ',' +
			(sizeMultiplier || 10) + ',' + (minSize || 4) + ',' + this.color(outline || 'black') + ',' +
			this.color(colour || '#88ff88') + ',' + (alignment || 'hb-0-0');
		return this.icon('cm_size', data, series, item, zIndex, position, offsets);
	},

	/* Create a colour and size varying icon definition.
	   @param  image           (string) the name of the icon to use
	   @param  colourSeries    (number) the series from which colour data is taken
	   @param  colourLow       (string[3] or string, optional) the icons' fill colour(s) (default 'green')
	   @param  colourMiddle    (string, optional) the icons' middle fill colour (default 'yellow')
	   @param  colourHigh      (string, optional) the icons' high fill colour (default 'red')
	   @param  sizeSeries      (number) the series from which size data is taken
	   @param  zeroSize        (number[3] or number, optional) the icons' size at minimum data value (default 4),
	                           or array of this and next two values
	   @param  sizeMultiplier  (number, optional) the size scaling factor (default 10)
	   @param  minSize         (number, optional) the minimum size for any icon in pixels (default 4)
	   @param  outline         (string, optional) the icons' outline colour (default 'black')
	   @param  alignment       (string, optional) result of contextualAlignment(...) (default 'hb')
	   @param  series          (number) the series to which the icon applies
	   @param  item            (number or string or number[2 or 3], optional)
	                           the item in the series to which it applies or 'all' (default)
	                           or 'everyn' or [start, end, every]
	   @param  zIndex          (number, optional) the z-index (-1.0 to 1.0)
	   @param  position        (number[2], optional) an absolute chart position (0.0 to 1.0)
	   @param  offsets         (number[2], optional) pixel offsets
	   @return  (object) the icon definition */
	colourSizeVaryIcon: function(image, colourSeries, colourLow, colourMiddle, colourHigh,
			sizeSeries, zeroSize, sizeMultiplier, minSize, outline, alignment,
			series, item, zIndex, position, offsets) {
		if ($.isArray(colourLow)) {
			offsets = zIndex;
			position = item;
			zIndex = series;
			item = alignment;
			series = outline;
			alignment = minSize;
			outline = sizeMultiplier;
			minSize = zeroSize;
			sizeMultiplier = sizeSeries;
			zeroSize = colourHigh;
			sizeSeries = colourMiddle;
			colourHigh = colourLow[2];
			colourMiddle = colourLow[1];
			colourLow = colourLow[0];
		}
		else if (typeof colourLow != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = minSize;
			minSize = sizeMultiplier;
			sizeMultiplier = zeroSize;
			zeroSize = sizeSeries;
			sizeSeries = colourHigh;
			colourHigh = colourMiddle;
			colourMiddle = colourLow;
			colourLow = null;
		}
		if (typeof colourMiddle != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = minSize;
			minSize = sizeMultiplier;
			sizeMultiplier = zeroSize;
			zeroSize = sizeSeries;
			sizeSeries = colourHigh;
			colourHigh = colourMiddle;
			colourMiddle = null;
		}
		if (typeof colourHigh != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = minSize;
			minSize = sizeMultiplier;
			sizeMultiplier = zeroSize;
			zeroSize = sizeSeries;
			sizeSeries = colourHigh;
			colourHigh = null;
		}
		if ($.isArray(zeroSize)) {
			offsets = zIndex;
			position = item;
			zIndex = series;
			item = alignment;
			series = outline;
			alignment = minSize;
			outline = sizeMultiplier;
			minSize = zeroSize[2];
			sizeMultiplier = zeroSize[1];
			zeroSize = zeroSize[0];
		}
		else if (typeof zeroSize != 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = minSize;
			minSize = sizeMultiplier;
			sizeMultiplier = zeroSize;
			zeroSize = null;
		}
		if (typeof sizeMultiplier != 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = minSize;
			minSize = sizeMultiplier;
			sizeMultiplier = null;
		}
		if (typeof minSize != 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = minSize;
			minSize = null;
		}
		if (typeof outline != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = outline;
			outline = null;
		}
		if (typeof alignment != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = null;
		}
		var data = image + ',' + (colourSeries || 0) + ',' + this.color(colourLow || 'green') + ',' +
			this.color(colourMiddle || 'yellow') + ',' + this.color(colourHigh || 'red') + ',' +
			(sizeSeries || 0) + ',' + (zeroSize || 4) + ',' + (sizeMultiplier || 10) + ',' + (minSize || 4) + ',' +
			this.color(outline || 'black') + ',' + (alignment || 'hb-0-0');
		return this.icon('cm_color_size', data, series, item, zIndex, position, offsets);
	},

	/* Create a stacking icon definition.
	   @param  image           (string) the name of the icon to use
	   @param  repeatSeries    (number) the series from which repeat data is taken
	   @param  scalingFactor   (number, optional) the data value scaling factor (default 10)
	   @param  horizontal      (boolean, optional) true if stacking horizontally (default false)
	   @param  size            (number, optional) the icons' size - 12, 16, 24 (default 12)
	   @param  colour          (string, optional) the icons' fill colour (default '#88f88')
	   @param  outline         (string, optional) the icons' outline colour (default 'black')
	   @param  spacing         (number, optional) spacing between icons in pixels (default 0)
	   @param  alignment       (string, optional) result of contextualAlignment(...) (default 'hb')
	   @param  series          (number) the series to which the icon applies
	   @param  item            (number or string or number[2 or 3], optional)
	                           the item in the series to which it applies or 'all' (default)
	                           or 'everyn' or [start, end, every]
	   @param  zIndex          (number, optional) the z-index (-1.0 to 1.0)
	   @param  position        (number[2], optional) an absolute chart position (0.0 to 1.0)
	   @param  offsets         (number[2], optional) pixel offsets
	   @return  (object) the icon definition */
	stackingIcon: function(image, repeatSeries, scalingFactor, horizontal, size, colour, outline,
			spacing, alignment, series, item, zIndex, position, offsets) {
		if (typeof scalingFactor != 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = outline;
			outline = colour;
			colour = size;
			size = horizontal;
			horizontal = scalingFactor;
			scalingFactor = null;
		}
		if (typeof horizontal != 'boolean') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = outline;
			outline = colour;
			colour = size;
			size = horizontal;
			horizontal = null;
		}
		if (typeof size != 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = outline;
			outline = colour;
			colour = size;
			size = null;
		}
		if (typeof colour != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = outline;
			outline = colour;
			colour = null;
		}
		if (typeof outline != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = outline;
			outline = null;
		}
		if (typeof spacing != 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = null;
		}
		if (typeof alignment != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = null;
		}
		var data = image + ',' + (repeatSeries || 0) + ',' + (scalingFactor || 10) + ',' +
			(horizontal ? 'h' : 'V') + ',' + (SIZES[size] || 12) + ',' + this.color(colour || '#88ff88') + ',' +
			this.color(outline || 'black') + ',' + (spacing || 0) + ',' + (alignment || 'hb-0-0');
		return this.icon('cm_repeat', data, series, item, zIndex, position, offsets);
	},

	/* Create a stacking with colour varying icon definition.
	   @param  image           (string) the name of the icon to use
	   @param  repeatSeries    (number) the series from which repeat data is taken
	   @param  scalingFactor   (number, optional) the data value scaling factor (default 10)
	   @param  horizontal      (boolean, optional) true if stacking horizontally (default false)
	   @param  size            (number, optional) the icons' size - 12, 16, 24 (default 12)
	   @param  colourSeries    (number) the series from which colour data is taken
	   @param  colourLow       (string[3] or string) the icons' fill colour(s) (default 'green')
	   @param  colourMiddle    (string, optional) the icons' middle fill colour (default 'yellow')
	   @param  colourHigh      (string, optional) the icons' high fill colour (default 'red')
	   @param  outline         (string, optional) the icons' outline colour (default 'black')
	   @param  spacing         (number, optional) spacing between icons in pixels (default 0)
	   @param  alignment       (string, optional) result of contextualAlignment(...) (default 'hb')
	   @param  series          (number) the series to which the icon applies
	   @param  item            (number or string or number[2 or 3], optional)
	                           the item in the series to which it applies or 'all' (default)
	                           or 'everyn' or [start, end, every]
	   @param  zIndex          (number, optional) the z-index (-1.0 to 1.0)
	   @param  position        (number[2], optional) an absolute chart position (0.0 to 1.0)
	   @param  offsets         (number[2], optional) pixel offsets
	   @return  (object) the icon definition */
	stackingColourVaryIcon: function(image, repeatSeries, scalingFactor, horizontal, size,
			colourSeries, colourLow, colourMiddle, colourHigh, outline,
			spacing, alignment, series, item, zIndex, position, offsets) {
		if (typeof scalingFactor != 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = outline;
			outline = colourHigh;
			colourHigh = colourMiddle;
			colourMiddle = colourLow;
			colourLow = colourSeries;
			colourSeries = size;
			size = horizontal;
			horizontal = scalingFactor;
			scalingFactor = null;
		}
		if (typeof horizontal != 'boolean') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = outline;
			outline = colourHigh;
			colourHigh = colourMiddle;
			colourMiddle = colourLow;
			colourLow = colourSeries;
			colourSeries = size;
			size = horizontal;
			horizontal = null;
		}
		if (typeof size != 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = outline;
			outline = colourHigh;
			colourHigh = colourMiddle;
			colourMiddle = colourLow;
			colourLow = colourSeries;
			colourSeries = size;
			size = null;
		}
		if ($.isArray(colourLow)) {
			offsets = zIndex;
			position = item;
			zIndex = series;
			item = alignment;
			series = spacing;
			alignment = outline;
			spacing = colourHigh;
			outline = colourMiddle;
			colourHigh = colourLow[2];
			colourMiddle = colourLow[1];
			colourLow = colourLow[0];
		}
		else if (typeof colourLow != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = outline;
			outline = colourHigh;
			colourHigh = colourMiddle;
			colourMiddle = colourLow;
			colourLow = null;
		}
		if (typeof colourMiddle != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = outline;
			outline = colourHigh;
			colourHigh = colourMiddle;
			colourMiddle = null;
		}
		if (typeof colourHigh != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = outline;
			outline = colourHigh;
			colourHigh = null;
		}
		if (typeof outline != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = outline;
			outline = null;
		}
		if (typeof spacing != 'number') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = spacing;
			spacing = null;
		}
		if (typeof alignment != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = alignment;
			alignment = null;
		}
		var data = image + ',' + (repeatSeries || 0) + ',' + (scalingFactor || 10) + ',' +
			(horizontal ? 'h' : 'V') + ',' + (SIZES[size] || 12) + ',' + (colourSeries || 0) + ',' +
			this.color(colourLow || 'green') + ',' + this.color(colourMiddle || 'yellow') + ',' +
			this.color(colourHigh || 'red') + ',' + this.color(outline || 'black') + ',' +
			(spacing || 0) + ',' + (alignment || 'hb-0-0');
		return this.icon('cm_repeat_color', data, series, item, zIndex, position, offsets);
	},

	/* Generate a contextual alignment value.
	   @param  position  (string) the anchor point, e.g. 'topLeft', 'center', ...
	   @param  hOffset   (number, optional) a horizontal offset (pixels)
	   @param  vOffset   (number, optional) a vertical offset (pixels)
	   @return  (string) the alignment property */
	contextualAlignment: function(position, hOffset, vOffset) {
		hOffset = hOffset || 0;
		vOffset = vOffset || 0;
		return (ALIGNMENTS[position] || 'hv') +
			(hOffset == 0 ? '-0' : (hOffset > 0 ? '%20' + hOffset : hOffset)) +
			(vOffset == 0 ? '-0' : (vOffset > 0 ? '%20' + vOffset : vOffset));
	},

	/* Generate an embedded chart icon.
	   @param  embeddedOptions  (object) the options for the embedded chart
	   @param  bubble           (boolean, optional) true if embedded in a bubble (default false)
	   @param  alignment        (string, optional) the type of tail to use for a bubble (default 'bottomLeft'),
	                            or the alignment of a non-bubble icon (default 'bottomLeft')
	   @param  padding          (number, optional) the padding inside the bubble in pixels (default 4)
	   @param  frameColour      (string, optional) the colour of the frame border (default #00d0d0)
	   @param  fillColour       (string, optional) the colour of the frame background (default #80ffff)
	   @param  series           (number, optional) the series to which the icon applies
	   @param  item             (number or string or number[2 or 3], optional)
	                            the item in the series to which it applies or 'all' (default)
	                            or 'everyn' or [start, end, every]
	   @param  zIndex           (number, optional) the z-index (-1.0 to 1.0)
	   @param  position         (number[2], optional) an absolute chart position (0.0 to 1.0)
	   @param  offsets          (number[2], optional) pixel offsets
	   @return  (object) the icon definition */
	embeddedChart: function(embeddedOptions, bubble, alignment, padding, frameColour, fillColour,
			series, item, zIndex, position, offsets) {
		if (typeof bubble != 'boolean') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = fillColour;
			fillColour = frameColour;
			frameColour = padding;
			padding = alignment;
			alignment = bubble;
			bubble = false;
		}
		if (typeof alignment != 'string') {
			offsets = position;
			position = zIndex;
			zIndex = item;
			item = series;
			series = fillColour;
			fillColour = frameColour;
			frameColour = padding;
			padding = alignment;
			alignment = null;
		}
		if (!bubble) {
			offsets = item;
			position = series;
			zIndex = fillColour;
			item = frameColour;
			series = padding;
			fillColour = null;
			frameColour = null;
			padding = null;
		}
		else {
			if (typeof padding != 'number') {
				offsets = position;
				position = zIndex;
				zIndex = item;
				item = series;
				series = fillColour;
				fillColour = frameColour;
				frameColour = padding;
				padding = null;
			}
			if (typeof frameColour != 'string') {
				offsets = zIndex;
				position = item;
				zIndex = series;
				item = fillColour;
				series = frameColour;
				fillColour = null;
				frameColour = null;
			}
			else if (typeof fillColour != 'string') {
				offsets = position;
				position = zIndex;
				zIndex = item;
				item = series;
				series = fillColour;
				fillColour = null;
			}
		}
		var encodeEmbedded = function(value) {
			return value.replace(/%7c/ig, '|').replace(/@/g, '@@').replace(/%/g, '%25').
				replace(/,/g, '@,').replace(/\|/g, '@|').replace(/;/g, '@;').
				replace(/&/g, '%26').replace(/=/g, '%3D');
		};
		var allOptions = $.extend({}, $.gchart._defaults, {width: 120, height: 60}, embeddedOptions);
		var embedded = $.gchart._generateChart(allOptions);
		embedded = embedded.replace(/^[^\?]+\?/, '').split('&');
		embedded = $.map(embedded, function(value) {
			value = value.split('=');
			return encodeEmbedded(value[0]) + ',' + encodeEmbedded(value[1]);
		});
		var data = (bubble ? (TAILS[alignment] || 'bb') + ',' + (padding == null ? 4 : padding) + ',' +
			this.color(frameColour || '#00d0d0') + ',' + this.color(fillColour || '#80ffff') :
			(EMBEDDED_ALIGNMENTS[alignment] || 'lb')) + ',' + embedded.join(',');
		return this.icon('ec' + (bubble ? 'b' : ''), data, series, item, zIndex, position, offsets);
	},

	/* Generate dynamic icon parameters.
	   @param  type     (string) the encoded chart type
	   @param  options  (object) the current instance settings
	   @return  (string) the icons parameters */
	addIcons: function(type, options) {
		var decodeItem = function(item) {
			if (item == 'all') {
				return item;
			}
			if (typeof item == 'string') {
				if (/^every(\d+)$/.exec(item)) {
					return item.replace(/every/, 'every,');
				}
			}
			if ($.isArray(item)) {
				return 'range,' + item.join(',');
			}
			return item;
		};
		var icons = '';
		var freeIcon = '';
		for (var i = 0; i < options.icons.length; i++) {
			var icon = options.icons[i];
			if (icon.series == -1) {
				freeIcon = '&chst=d_' + icon.name + '&chld=' + icon.data.replace(/,/g, '|');
			}
			else {
				icons += '|y;s=' + icon.name + ';d=' + icon.data +
					(icon.position ? '' : ';ds=' + icon.series + ';dp=' + decodeItem(icon.item)) +
					(icon.zIndex ? ';py=' + icon.zIndex : '') + 
					(icon.position ? ';po=' + icon.position.join(',') : '') + 
					(icon.offsets ? ';of=' + icon.offsets.join(',') : '');
			}
		}
		return (icons ? '&chem=' + icons.substr(1) : '') + freeIcon;
	},

	/* Escape reserved characters in icon text.
	   @param  value  (string) the text to escape
	   @return  (string) the escaped text */
	_escapeIconText: function(value) {
		return value.replace(/([@=,;])/g, '@$1').replace(/\|/g, ',');
	}
});

$.extend($.gchart._prototype.prototype, {
	colorVaryIcon: $.gchart._prototype.prototype.colourVaryIcon,
	colorSizeVaryIcon: $.gchart._prototype.prototype.colourSizeVaryIcon,
	stackingColorVaryIcon: $.gchart._prototype.prototype.stackingColourVaryIcon
});

})(jQuery);
