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
		this.serializer = options.serializer || Blocks.Defaults.serializer;
		this.model = model;
		this._bound = _.bind(this.modelChanged, this);
		model.on('change', this._bound);
		this.cleanUp(function() {model.off('change', this._bound);});
	},

	rendered : function() {
		if (this.model.attributes) {
			this.serializer.synchronizeDOM(this.$el, this.model);
		}
	},

	modelChanged : function(model, options) {
		this.serializer.synchronizeDOM(this.$el, model);
	},

	synchronize : function() {
		var attr = this.serializer.serialize(this.$el);
		return !!this.model.set(attr, {
			error: _.bind(function(model, errors) {
				this.parent.trigger('field:error', errors, this.parent, undefined);
				Blocks.page && Blocks.page.trigger('field:error', errors, this.parent, undefined);
			}, this)
		});
	},

	inputChanged : function(event) {
		var element = $(event.target);
		var attributes = this.serializer.serializeField(event.target);
		if (attributes) {
			var validate = true;
			for (var key in attributes) {
				validate = validate && this.validateField(key);
			}
			if (validate) {
				var rtn = this.model.set(attributes, {
					error: _.bind(function(model, errors) {
						this.parent.trigger('field:error', errors, element, this.parent);
						Blocks.page && Blocks.page.trigger('field:error', errors, element, this.parent);
					}, this),
					individual: true
				});
				if (rtn) {
					this.parent.trigger('field:success',  element, this.parent);
					Blocks.page && Blocks.page.trigger('field:success', element, this.parent);
				}
			} else {
				this.model.set(attributes, {validate: false});
			}
		}
	},

	validateField: function(key) {
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