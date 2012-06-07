/**
 * Handler & associated field helps to auto bind model values to DOM and DOM
 * changes to model. Validation errors will go directly against the model and
 * will emit errors on the view.
 */

Blocks.Handler.Field = {};
Blocks.Handler.Field.NameFieldMapper = {
	getElements : function(key, el) {
		return el.find('[name="' + key + '"]');
	},
	getFieldKey : function(element) {
		return element.attr('name');
	}
};

Blocks.Handler.Field.SimpleFieldHandler = {

	setModelValue : function(key, element, model) {
		var type = element.attr('type');
		var val = element.val();
		var attr = {};
		if (type === 'checkbox') {
			attr[key] = !!element.attr('checked');
			return model.set(attr);
		} else if (type === 'radio' && (val === 'true' || val === 'false')) {
			if (val === 'true') {
				attr[key] = true;
				return model.set(attr);
			} else {
				attr[key] = false;
				return model.set(attr);
			}
		} else {
			attr[key] = val;
			return model.set(attr);
		}
	},

	setElementValue : function(key, value, el) {
		var size = el.size();
		if (!size || _.isUndefined(value))
			return;
		if (size === 1) {
			// checkbox
			if (_.isBoolean(value)) {
				if (value)
					el.attr('checked', 'checked');
				else
					el.removeAttr('checked');
			} else {
				el.val(value);
			}
		} else if (_.isBoolean(value) && size === 2) {
			// true/false radio buttons
			el.each(function(index, _el) {
				_el = $(_el);
				var val = _el.attr('value');
				if (val) {
					if (value) {
						if (val.charAt(0) === 't') {
							_el.attr('checked', 'checked');
						} else {
							_el.removeAttr('checked');
						}
					} else {
						if (val.charAt(0) === 'f') {
							_el.attr('checked', 'checked');
						} else {
							_el.removeAttr('checked');
						}
					}
				}
			});
		} else {
			// list of radio buttons
			el.each(function(index, _el) {
				_el = $(_el);
				var val = _el.attr('value');
				if (val) {
					if (val === value) {
						_el.attr('checked', 'true');
					} else {
						_el.removeAttr('checked');
					}
				}
			});
		}
	}
};

Blocks.Handler.ModelBinder = Blocks.Handler.Base.extend({

	events : {
		'*parent:rendered' : 'rendered',
		'change input' : 'inputChanged',
		'change select' : 'inputChanged',
		'change textarea' : 'inputChanged'
	},

	init : function(view, model, options) {
		this.model = model;
		this._bound = _.bind(this.modelChanged, this);
		model.on('change', this._bound);
	},

	rendered : function() {
		if (this.model.attributes) {
			for ( var key in this.model.attributes) {
				this.updateFieldValue(key, this.model.attributes[key]);
			}
		}
	},

	updateFieldValue : function(key, value) {
		this.fieldHandler(key).setElementValue(key, value,
				this.fieldMap(key).getElements(key, this.$el));
	},

	fieldHandler : function(key) {
		return this.fields && this.fields[key] && this.fields[key].handler
				|| Blocks.Handler.Field.SimpleFieldHandler;
	},

	fieldMap : function(keyOrElement) {
		var key = _.isString(keyOrElement) || keyOrElement.attr('name');
		return this.fields && this.fields[keyOrElement] && this.fields[keyOrElement].map
				|| Blocks.Handler.Field.NameFieldMapper;
	},

	modelChanged : function(model, options) {
		for ( var key in options.changes) {
			this.updateFieldValue(key, this.model.attributes[key]);
		}
	},

	inputChanged : function(event) {
		var element = $(event.target);
		var key = this.fieldMap(element).getFieldKey(element);
		this.fieldHandler(key).setModelValue(key, element, this.model);
	},

	destroy : function() {
		model.off('change', this._bound);
	}
});