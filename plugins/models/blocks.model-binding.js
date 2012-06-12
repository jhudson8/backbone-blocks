/**
 * Handler & associated field helps to auto bind model values to DOM and DOM
 * changes to model. Validation errors will go directly against the model and
 * will emit errors on the view.
 */
Blocks.Handler.ModelBinder = Blocks.Handler.ModelContextContributor.extend({

	events : {
		'!parent:rendered' : 'rendered',
		'change input' : 'inputChanged',
		'change select' : 'inputChanged',
		'change textarea' : 'inputChanged'
	},

	init : function(view, model, options) {
		this.serializer = options.serializer || Blocks.serializer;
		this.model = model;
		this._bound = _.bind(this.modelChanged, this);
		model.on('change', this._bound);
		this.cleanUp(function() {model.off('change', this._bound);});
	},

	rendered : function() {
		if (this.model.attributes) {
			this.serializer.setValues(this.$el, this.model);
		}
	},

	modelChanged : function(model, options) {
		this.serializer.setValues(this.$el, model);
	},

	inputChanged : function(event) {
		var element = $(event.target);
		var attributes = this.serializer.serializeField(event.target);
		if (attributes) {
			var validate = true;
			for (var key in attributes) {
				validate = validate && this.validate(key);
			}
			if (validate) {
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

	validate: function(key) {
		if (this.fields) {
			for (var i in this.fields) {
				if (fields[i].key === key && !_.isUndefined(fields[i].validate)) {
					return fields[i].validate;
				}
			}
		}
		return true;
	}
});