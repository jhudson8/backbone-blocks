/**
 * Mixin to initialize jquery components. Subclasses of this mixin should define
 * the components that should be used. They can be in 2 different formats:
 * components: { '{jquery component name} {element selector}': { subtypes: true,
 * '{sub-selector}': {init options} } } or components: { '{jquery component
 * name} {element selector}': {init options} }
 * 
 * example:
 * 
 * components: { 'datepicker .date': { '[data-picker=3mo]': { numberOfMonths: 3,
 * showButtonPanel: true } } }
 */
(function() {
	var partPattern = /^([^\s]*)\s+(.+)/;
	Blocks.Mixin.JQuery = Blocks.Handler.Base.extend({
		events : {
			'parent:rendered' : 'onRendered'
		},

		init : function() {
			var _components = Blocks.Util.getValue(this, 'components');
			if (!_components)
				throw new Error('You must define some jquery components');

			var components = this.components = [];
			for ( var key in _components) {
				var match = key.match(partPattern);
				if (!match)
					throw new Error('Invalid jquery type/selector format: ' + name);
				components.push({
					jqueryName : match[1],
					selector : match[2],
					options : _components[key]
				});
			}
		},

		onRendered : function() {
			for ( var i = 0; i < this.components.length; i++) {
				var data = this.components[i];
				this.parent.$el.find(data.selector).each(function(index, element) {
					var $el = $(element);
					if (data.options.subtypes) {
						for (selector in data.options) {
							if (selector != 'subtypes' && $el.is(selector)) {
								$el[data.jqueryName](data.options[selector]);
								break;
							}
						}
					} else {
						$el[data.jqueryName](data.options);
					}
				});
			}
		}
	});
})();
