var Pages = {};

(function() {
// Cached regex to split keys for `delegate`.
var delegateEventSplitter = /^(\S+)\s*(.*)$/;
var singlePartPattern = /^[^s]*$/;

/**
 * Pages.Template is the package structure for template engine plugins
 */
Pages.TemplateEngines = {

	/**
	 * Simple template plugin using the underscore template function
	 */
	Underscore: {
		load: function(content) {
			return function(data) {
				return _.template(content, data);
			}
		}
	}
};
// use this value to set the default template engine
Pages.TemplateEngines.defaultEngine = Pages.TemplateEngines.Underscore;


/**
 * Pages.Content is the package structure for template contentent retrieval plugins
 */
Pages.ContentProviders = {

	/**
	 * Simple templates using script tags. ex: <script type="text/handlebars" id="templateName"> ... </script>
	 * @param templatePattern a pattern which contains ${template} if the script id is different than the path
	 */
	ElementProvider: function(templatePattern) {
		templatePattern = templatePattern || '${template}';
		return {
			get: function(path) {
				path = this.normalizePath(path);
				var el = $('#' + path);
				if (el.size() === 1) {
					return el.html();
				} else {
					throw new Error('Undefined template "' + path + '"');
				}
			},
			
			isValid: function(path) {
				path = this.normalizePath(path);
				var el = $('#' + path);
				return (el.size() === 1);
			},

			normalizePath: function(path) {
				path = path.replace('/', '-');
				return templatePattern.replace('${template}', path);
			}
		};
	}
};
// use this value to set the default content provider
Pages.ContentProviders.defaultProvider = new Pages.ContentProviders.ElementProvider();


/**
 * Pages.CollectionHandlers is the package structure for view collection handlers.  The collection handler public API
 * is as follows:
 * - init (options, view, collection): initialize with options from Pages.View#addCollection call, view instance and collection instance
 * - render: render the collection
 * - onAdd: called when a model was added to the collection
 * - onRemove: called when a model was removed from the collection
 * - onReset: called when the collection was reset
 */
Pages.CollectionHandlers = {};
var DefaultCollectionHandler = Pages.CollectionHandlers.Default = function() {}
_.extend(DefaultCollectionHandler.prototype, {

	init: function(options, view, collection) {
		this.options = options;
		this.view = view;
		this.collection = collection;
		this.subViews = {};
	},

	/**
	 * Render the collection within the 'selector' element.  If the collection has 0 items, renderEmpty will be called, otherwise, for each item,
	 * onAdd will be called.
	 */
	render: function() {
		var el = this.el = this.view.$el.find(this.options.selector);
		if (el.size() != 1) {
			console.log(el.html());
			throw new Error('Non-unique or empty collection selector "' + this.options.selector + '"');
		}

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
		var viewFunctions = ['collectionItem'];
		if (this.options.alias) viewFunctions.splice(0, 0, this.options.alias + 'Item');
		var fc = this.getFunctionAndContext(viewFunctions, this.onItem);
		var data = fc.func.call(fc.context, model, this.options);

		// data can be either HTML string or View instance
		var itemEl;		
		if (data instanceof Backbone.View) {
			data.render();
			itemEl = data.el;
			this.subViews[model.id] = data;
		} else {
			itemEl = $(this.itemContainer(model));
			itemEl.append(data);
		}

		// set the data attribute and append the item element
		itemEl.attr('data-view', model.id);
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
			this.getElement().find('[data-view=' + model.id + ']').remove();
		}
	},

	/**
	 * render the collection again as the collection will represent a reset state
	 */
	onReset: function() {
		this.render.call(this);
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
		if (this.view.contentProvider.isValid(path)) {
			this.el.html(this.view.execTemplate(path));
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
	itemContainer: function(model) {
		return this.view.make('div');
	},

	/**
	 * return the item template path
	 * @param model the item model
	 */
	getTemplatePath: function(model) {
		var prefix = (this.view.template || this.view.name) + '-' + (this.options.alias || 'collection');
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


/**
 * Collection
 */
Pages.Collection = Backbone.Collection.extend({
	/**
	 * return true if models are currently being fetched
	 */
	isFetching: function() {
		return this._fetching;
	},

	/**
	 * return true if data has been fetched and populated
	 */
	isPopulated: function() {
		return (this.size() > 0 || this._populated);
	},

	fetch: function(options) {
		options = onFetchOptions(this, options);
		this._fetching = true;
		Backbone.Collection.prototype.fetch.call(options);
	}
});


/**
 * Model
 */
Pages.Model = Backbone.Model.extend({
	/**
	 * return true if model is currently being fetched
	 */
	isFetching: function() {
		return this._fetching;
	},

	/**
	 * return true if data has been fetched and populated
	 */
	isPopulated: function() {
		return this._populated;
	},

	fetch: function(options) {
		options = onFetchOptions(this, options);
		this._fetching = true;
		Backbone.Collection.prototype.fetch.call(options);
	}
});


/**
 * Backbone view with enhanced fuctionality.  Template rendering, form serialization, sub views, multiple
 * collection handling, additional event delegation, etc...
 */
Pages.View = Backbone.View.extend({

  /**
   * You can bind to event 'initialized' to execute post-initialization code
   * @trigger 'initialized'
   */
	initialize: function() {
		// cache of view events for auto-binding
		this._delegatedViewEvents = {};

		// cache of sub-views and collections
		this.subViews = [];
		this.collections = [];

		// set some defaults
		this.templateLoader = this.templateLoader || Pages.TemplateEngines.defaultEngine;
		this.contentProvider = this.contentProvider || Pages.ContentProviders.defaultProvider;
	},

	/**
	 * Get template content using property 'template' or 'name' and render it using this.getContext as data context
	 * @trigger 'render:start', 'render:content', 'render:subviews', 'render:collections', 'render:end'
	 */
	render: function() {
		this.trigger('render:start');
		var content = this.execTemplate(this.getTemplatePath(), this.getContext());
		this.$el.html(content);
		this.renderSubViews();
		this.renderCollections();
		this.trigger('render:end');
		return this;
	},

	/**
	 * Return the template path for this view
	 */
	getTemplatePath: function() {
		return this.template || this.name;
	},

	/**
	 * return template contents using the template & content plugins
	 * @param path the template path
	 * @param context the context data
	 * @param options meaningful for the template plugin or use 'suppressError' to suppress any errors
	 * @trigger 'template:error' if errors were suppressed and an error occured
	 */
	execTemplate: function(path, context, options) {
		try {
			var content = this.contentProvider.get(path);
			var template = this.templateLoader.load(content);
			return template(context);
		} catch (e) {
			if (!options || !options.suppressError) {
				throw e;
			} else {
				this.trigger('template:error', path, e);
			}
		}
	},

	/**
	 * return the data context for template processing
	 */
	getContext: function() {
		return _.extend({}, this.model && this.model.attributes, this.options);
	},

	/**
	 * render all collections that were added using addCollection.  this will defer to the collection handler render method.
	 * the collection handler is defined in options with the addCollection method.
	 */
	renderCollections: function() {
		_.each(this.collections, _.bind(function(collectionData) {
			collectionData.handler.render();
		}, this));
	},

	/**
	 * render all subviews that were added using addSubView
	 */
	renderSubViews: function() {
		_.each(this.subViews, _.bind(function(viewData) {
			var el = this.$el.find(viewData.selector);
			if (el.size() != 1) {
				console.log(this.$el.html());
				throw new Error('non-unique or non-existing sub-view container element "' + viewData.selector + '"');
			}
			if (el.children().size() == 0) {
				// we're good here
			} else if (el.children.size() == 1) {
				// assume we are re-rendering
				el.children.ad(0).remove();
			} else {
				throw new Error('view container element must be empty');
			}
			viewData.view.render();
			el.append(viewData.view.el);
		}, this));
		return this;
	},

	/**
	 * add a sub view.  this can have 2 different parameter types
	 * 1) view selector; eg .sub-view', view instance
	 * 2) named options
	 *    - view: the view instance
	 *    - selector: the selector where the view will be appended
	 *    - alias: an alias for the view (for event binding)
	 * If the sub-view alias is 'foo', the view events could contain, for example, { 'foo:render': 'fooRender' }
	 */
	addView: function(selector, view) {
		var viewData;
		if (!view) {
			viewData = selector;
		} else {
			viewData = {
				selector: selector,
				view: view
			};
		}
		this.subViews.push(viewData);

		// if alias was provided, proxy all sub-view events
		if (viewData.alias) {
			this.eventProxy(viewData.alias, viewData.view);
		}
		return view;
	},

	/**
	 * add a monitored collection.  this can have 2 different parameter types
	 * 1) collection
	 * 2) named options
	 *    - collection: the collection
	 *    - handler: the collection handler used to represent the collection in the view; see: Pages.CollectionHandlers
	 *    - alias: the alias used for binding to collection events
	 * If the collection alias is 'foo', the view events could contain, for example, { 'foo:reset': 'fooReset' }
	 */
	addCollection: function(collection) {
		var collectionData = (collection.collection) ? collection : {collection: collection};
		collection = collectionData.collection;
		collectionData.handler = collectionData.handler || new DefaultCollectionHandler();
		this.collections.push(collectionData);

		// auto-bind modifications to view
		collectionData.handler.init(collectionData, this, collection);
		var onAdd = _.bind(collectionData.handler.onAdd, collectionData.handler);
		var onRemove = _.bind(collectionData.handler.onRemove, collectionData.handler);
		var onReset = _.bind(collectionData.handler.onReset, collectionData.handler);
		collection.on('add', onAdd);
		collection.on('remove', onRemove);
		collection.on('reset', onReset);
		collectionData._events = {
			add: onAdd,
			remove: onRemove,
			reset: onReset
		};

		// if alias was provided, proxy all collection events
		if (collectionData.alias) {
			this.eventProxy(collectionData.alias, collectionData.collection);
		}
		return collection;
	},

	/**
	 * destroy all sub-views and unbind all custom bindings
	 */
	destroy: function() {
		Backbone.View.prototype.destroy.apply(this, arguments);

		// sub views
	  this.subViewCall('destroy');
		delete this.subViews;

		// collections
		_.each(this.collections, _.bind(function(collectionData) {
			collectionData.off('add', collectionData._events.add);
			collectionData.off('remove', collectionData._events.remove);
			collectionData.off('reset', collectionData._events.reset);
		}, this));
		return this;
	},

	/**
	 * Call a named method on all sub-views
	 * @param name the method name
	 * Any additional parameters will be method parameters
	 */
	subViewCall: function(name) {
		var args = _.toArray(arguments);
		args.splice(0, 1);
		_.each(this.subViews, function(viewData) {
			viewData.view[name].apply(args);
		});
		return this;
	},

	/**
	 * bind to 'all' on object with the provided alias prefix
	 */
	eventProxy: function(alias, object) {
		object.bind('all', new EventProxy(alias, this));
		return this;
	},

	/**
	 * Provide additional event delegations.  Events without a space will be considered as
	 * binding to events that are triggered from this view.  Hash expanded events are allowed.
	 * the following are equivalent:
	 * events {
	 *   'foo:bar': 'abc',
	 *   foo: {
	 *     bar: 'abc'
	 *   }
	 * }
	 */
	delegateEvents: function(events) {
		events = defaults.call(this, flatten(events), 'events', true);
		if (!events) return;
		this.undelegateEvents(true);
		for (var key in events) {
			var method = events[key];
			if (!_.isFunction(method)) method = this[events[key]];
			if (!method) throw new Error('Method "' + events[key] + '" does not exist');
			this.delegateEvent(key, method);
		}
	},

	/**
	 * delegate a specific event
	 * @param key the event key
	 * @method the unbound method
	 */
	delegateEvent: function(key, method) {
		if (key.match(singlePartPattern)) {
			// treat this type of event key as a self event binding
			var bound = _.bind(method, this);
			this.on(key, bound);
			this._delegatedViewEvents[key] = bound;
			return;
		}
		var match = key.match(delegateEventSplitter);
		var eventName = match[1], selector = match[2];
		method = _.bind(method, this);
		eventName += '.delegateEvents' + this.cid;
		if (selector === '') {
			this.$el.bind(eventName, method);
		} else {
			this.$el.delegate(selector, eventName, method);
		}
	},

	/**
	 * Undelegate all events
	 * @param includeAll true to include the custom view events that were bound
	 */
	undelegateEvents: function(includeAll) {
		Backbone.View.prototype.undelegateEvents.call(this);
		var e = this._delegatedViewEvents;
		if (includeAll) {
			// unbind all view event bindings
			for (var event in e) {
				this.off(event, e[event]);
			}
			this._delegatedViewEvents = {};
		}
	}
});

// PRIVATE CLASSES AND METHODS //
function EventProxy(alias, context) {
	return function(event) {
		var args = _.toArray(arguments);
		args[0] = alias + ':' + event;
		context.trigger.apply(context, args);
	}
}

function getValue(object, prop) {
  if (!(object && object[prop])) return null;
  return _.isFunction(object[prop]) ? object[prop]() : object[prop];
}

function flatten(object) {
	if (!object) return object;
	var parent = arguments[1] || object;
	var prefix = arguments[2] || '';
	for (var key in object) {
		var val = object[key];
		if (!_.isString(val) && !_.isFunction(val)) {
			flatten(val, parent, prefix + key + ':');
			delete object[key];
		} else if (prefix) {
			parent[prefix + key] = val;
		}
	}
	return object;
}

function defaults(object, prop, doFlatten) {
	var props = getValue(this, prop);
	if (doFlatten) props = flatten(props);
	if (props && props !== object) {
		for (var key in props) {
			if (!object) object = {};
			if (_.isUndefined(object[key])) {
				object[key] = props[key];
			}
		}
	}
	// FIXME why doesn't this work?
	var $super = this.prototype;
	if ($super) {
		object = defaults.call($super, object, flatten);
	}
	return object;
}

function onFetchOptions(model, options) {
	options = options || {};
	var _success = options.success;
	function success() {
		model._fetching = false;
		model._populated = true;
		options.success && options.success.apply(model, arguments);
	}
	var _error = options.error;
	function error() {
		model._fetching = false;
		options.error && options.error.apply(model, arguments);
	}
	return options;
}

})();
