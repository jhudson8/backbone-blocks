/**
 * - init (options, view, collection): initialize with options from Pages.View#setCollection call, view instance and collection instance
 * - render: render the collection
 * - onAdd: called when a model was added to the collection
 * - onRemove: called when a model was removed from the collection
 * - onReset: called when the collection was reset
 */
Pages.Handler.Collection.ItemView = function() {};
_.extend(Pages.Handler.Collection.ItemView.prototype, Pages.Handler.BaseElementHandler, {

	events: {
		'add': 'onAdd',
		'remove': 'onRemove',
		'reset': 'onReset',
		'parent:rendered': 'render'
	},

	init: function(view, collection, options) {
		this.view = view;
		this.collection = collection;
		this.subViews = {};
	},

	/**
	 * Render the collection within the 'selector' element.  If the collection has 0 items, renderEmpty will be called, otherwise, for each item,
	 * onAdd will be called.
	 */
	render: function() {
		var el = this.el = this.getElement();
		if (el.size() == 0) return;

		// clear out existing content
		el.html('');
	
		// destroy existing subviews
		for (var id in this.subViews) {
			this.subViews[id].destroy();
		}
		this.subViews = {};

		// call onAdd for each item
		if (this.collection.size() > 0) {
			this.wasEmpty = false;
			this.collection.each(_.bind(function(model) {
				this.onAdd(model, el);
			}, this));
		} else {
			this.wasEmpty = true;
			if (this.collection.isFetching && this.collection.isFetching()) {
				this.onLoading();
			} else {
				this.onEmpty();
			}
		}
	},

	/**
	 * render the content for this model
	 */
	onAdd: function(model) {
		if (this.wasEmpty) {
			// just render like normal if we used to be empty
			return this.render();
		}

		// what function should we use to get item data
		var viewFunctions = [Pages.Defaults.collectionAlias + 'Item'];
		if (this.options.alias) viewFunctions.splice(0, 0, this.options.alias + 'Item');
		var fc = this.getFunctionAndContext(viewFunctions, this.onItem);
		var data = fc.func.call(fc.context, model, this.options);

		// data can be either HTML string or View instance
		var itemEl;		
		if (data instanceof Backbone.View) {
			data.render();
			itemEl = data.$el;
			this.subViews[model.id] = data;
		} else {
			itemEl = $(this.itemTemplateContainer(model));
			itemEl.append(data);
		}

		// set the data attribute and append the item element
		itemEl.attr('data-view', model.id);
		itemEl.addClass(Pages.Defaults.collectionContainerClass);
		this.el.append(itemEl);
	},

	/**
	 * remove the content relating to this model
	 */
	onRemove: function(model) {
		var view = this.subViews[model.id];
		if (view) {
			view.destroy();
			delete this.subViews[model.id];
		}

		if (this.collection.size() == 0) {
			this.render();
		} else {
			var items = this.el.find('.' + Pages.Defaults.collectionContainerClass);
			for (var i=0; i<items.size(); i++) {
				if (items.get(i).getAttribute('data-view') === model.id) {
					$(items.get(i)).remove();
					return;
				}
			}
		}
	},

	/**
	 * render the collection again as the collection will represent a reset state
	 */
	onReset: function() {
		this.render.call(this);
	},

	destroy: function() {
		for (var id in this.subViews) {
			this.subViews[id].destroy();
		}
	},

	// non-API methods are below
	/**
	 * Called when the collection should be rendered in an empty state
	 */
	onEmpty: function() {
		this.wasEmpty = true;
		this.el.html(this.view.execTemplate(this.getTemplatePath() + '-empty'));
	},

	/**
	 * Called when the collection should be rendered in an empty state
	 */
	onLoading: function() {
		var path = this.getTemplatePath() + '-loading';
		if (this.view.contentProvider.isValid(path, this.view)) {
			this.el.html(this.view.execTemplate(path, this.view));
		} else {
			this.onEmpty();
		}
	},

	/**
	 * return the context for getting the collection item data
	 * @param model the item model
	 */
	context: function(model) {
		return model.attributes;
	},

	/**
	 * return the HTML contents or view impl for this model
	 * @param model the item model
	 */
	onItem: function(model) {
		return this.view.execTemplate(this.getTemplatePath(model), this.context(model));
	},

	/**
	 * return the element container for item data (if was HTML string)
	 * @param model the item model
	 */
	itemTemplateContainer: function(model) {
		return this.view.make('div');
	},

	/**
	 * return the item template path
	 * @param model the item model
	 */
	getTemplatePath: function(model) {
		var prefix = this.view.getTemplatePath() + '/' + (this.options.alias || 'items');
		if (model) {
			return prefix + '-item';
		} else {
			return prefix;
		}
	},

	/**
	 * Return a hash contain props for 'func' and 'context' depending if the a function was found as
	 * a property of the view of the default function.
	 * @param viewNames array of names of view properties to check for existance (use view as context)
	 * @param defaultFunc the default function if (use this as context)
	 */
	getFunctionAndContext: function(viewNames, defaultFunc) {
		var viewContext = false;
		var func;
		if (viewNames) {
			for (var i in viewNames) {
				func = this.view[viewNames[i]];
				if (func) {
					return {func: func, context: this.view};
				}
			}
		}
		return {func: defaultFunc, context: this};
	}
});