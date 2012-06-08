/**
 * Handler & associated field helps to auto bind model values to DOM and DOM
 * changes to model. Validation errors will go directly against the model and
 * will emit errors on the view.
 */

Blocks.Handler.Field.NamingStragety = {
		getFieldKey: function(element) {
			return element.attr('name');
		},
		getElement : function(key, el) {
			return el.find('[name="' + key + '"]');
		},
};

Blocks.Handler.Field.SimpleFieldHandler = {
	serialize : function(key, element, attr) {
		var type = element.attr('type');
		var val = element.val();
		if (type === 'checkbox') {
			attr[key] = !!element.attr('checked');
		} else if (type === 'radio' && (val === 'true' || val === 'false')) {
			if (val === 'true') {
				attr[key] = true;
			} else {
				attr[key] = false;
			}
		} else {
			attr[key] = val;
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

Blocks.Handler.ModelBinder = Blocks.Handler.ModelContextContributor.extend({

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
				this.getNamingStrategy().getElement(key, this.$el));
	},

	fieldHandler : function(key) {
		return this.fields && this.fields[key] && this.fields[key].handler
				|| Blocks.Handler.Field.SimpleFieldHandler;
	},

	modelChanged : function(model, options) {
		for ( var key in options.changes) {
			this.updateFieldValue(key, this.model.attributes[key]);
		}
	},

	inputChanged : function(event) {
		var element = $(event.target);
		var key = this.getNamingStrategy().getFieldKey(element, this.model);
		if (key) {
			var attributes = {};
			this.fieldHandler(key).serialize(key, element, attributes);
			if (this.validate(key)) {
				var rtn = this.model.set(attributes, {error: _.bind(function(model, errors) {
					this.parent.trigger('fieldError', errors, element, this.parent);
					Blocks.page && Blocks.page.trigger('fieldError', errors, element, this.parent);
				}, this)});
				if (rtn) {
					this.parent.trigger('fieldSuccess',  element, this.parent);
					Blocks.page && Blocks.page.trigger('fieldSuccess', element, this.parent);
				}
			} else {
				this.model.set(attributes, {validate: false});
			}
		}
	},

	getNamingStrategy : function() {
		return this.options.namingStrategy || Blocks.Handler.Field.NamingStragety;
	},

	validate: function(key) {
		if (this.fields) {
			for (var i in this.fields) {
				if (fields[i].key === key && !_.isUndefined(fields[i].validate)) {
					return fields[i].validate;
				}
			}
		}
		return true;
				
	},

	destroy : function() {
		model.off('change', this._bound);
	}
});