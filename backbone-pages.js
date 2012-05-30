var Pages = {
	Defaults: {
		modelAlias: 'model',
		collectionAlias: 'collection',
		viewAlias: 'view',
		collectionContainerClass: 'bp_col-container',
		subviewContainerClass: 'bp_sv-container',
		modelContainerClass: 'bp_mdl-container',
		eventWatch: false,
		selectorGenerator: function(options) { return '.' + options.alias; }
	}
};

(function() {
// Cached regex to split keys for `delegate`.
var delegateEventSplitter = /^(\S+)\s*(.*)$/;


/****************************************
 * MANAGED OBJECTS
 ****************************************/
Pages.ObjectManager = function(parent) {
	this.parent = parent;
	this.managedObjects = {};
};
_.extend(Pages.ObjectManager.prototype, {
	get: function(type, alias) {
		var l = this.managedObjects[type];
		if (!type) return;
		for (var i=0; i<l.length; i++) {
			if (l[i].alias === alias) return l;
		}
	},

	getAll: function(type) {
		return this.managedObjects[type] || [];
	},

	add: function(type, options) {
		var l = this.managedObjects[type];
		if (!l) {
			l = this.managedObjects[type] = [];
		}
		for (var i=0; i<l.length; i++) {
			if (l[i].alias === options.alias) {
				throw new Error('Existing managed ' + type + ' "' + options.alias + '"');
			}
		}
		
		var object = options[type];
		// initialize and allow auto-binding from the context object to the view
		options.handler.init && options.handler.init(this.parent, object, options);
		// if alias was provided, proxy all sub-view events
		if (options.alias && options.watch) {
			options._binder = this.eventProxy(options.alias, object);
		}
		
		// auto-bind all 'event' references from the handler
		var events = flatten(options.handler.events);
		if (events) {
			var bindings = [];
			for (name in events) {
				var method = events[name];
				if (method) {
					if (_.isString(method)) {
						method = options.handler[method];
						if (!_.isFunction(method)) {
							throw new Error('Invalid managed object event "' + method + '"; is not a valid function name');
						}
					}
					var bound = _.bind(method, options.handler);
					var target = object;
					var pattern = /^parent:/;
					if (name.match(pattern)) {
						// the 'parent' token has been referenced, bind to the parent instead
						name = name.replace(pattern, '');
						target = this.parent;
					}
					target.bind(name, bound);
					bindings.push({target: target, event: name, func: bound});
				}
			}
			options._bindings = bindings;
		}
		
		l.push(options);
		return options[type];
	},

	/**
	 * bind to 'all' on object with the provided alias prefix
	 */
	eventProxy: function(alias, object) {
		var eventProxy = new EventProxy(alias, this.parent);
		object.on('all', eventProxy);
		return {
			alias: alias,
			object: object,
			off: function() {
				object.off('all', eventProxy);
			}
		}
	},

	exec: function(type, method, args) {
		// allow usage without type param to indicate all types
		if (!method || !_.isString(method)) {
			args = method;
			method = type;
			type = undefined;
		}

		function exec(l) {
			_.each(l, function(obj) {
				var func = obj.handler[method];
				func && func.apply(obj.handler, args);
			});
		}

		if (!type) {
			for (var type in this.managedObjects) {
				exec(this.managedObjects[type]);
			}
		} else {
			exec(this.getAll(type));
		}
	},

	destroy: function() {
		for (var type in this.managedObjects) {
			_.each(this.managedObjects[type], function(obj) {
				if (obj._bindings) {
					_.each(obj._bindings, function(binding) {
						binding.target.off(binding.event, binding.func);
					});
				}
				obj.handler.destroy();
			});
		}
	}
});
Pages.Defaults.objectManagerClass = Pages.ObjectManager;


/**************************************************
 * DEFAULT TEMPLATE ENGINE & CONTENT PROVIDER IMPL
 **************************************************/

/**
 * Pages.Template is the package structure for template engine plugins.  The template engine API
 * is as follows:
 * - load: return function which accepts context parameter to return template content
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
Pages.Defaults.templateEngine = Pages.TemplateEngines.Underscore;


/**
 * Pages.Content is the package structure for template contentent retrieval plugins.  The content provider API
 * is as follows:
 * - get(path, view (optional)) return the content relating to the path
 * - isValid(path) return true if the path represents a valid content block
 */
Pages.ContentProviders = {

	/**
	 * Simple templates that can either be defined on the view within the 'templates' property or on Pages.templates.  If in Pages.templates
	 * then the view 'package' property will be prefixed to the path.  Package segments should be separated with '.'.  Each package segment
	 * will map to a sub-property within Pages.templates.  So, a 'foo' path with a 'abc.def' package would be set as follows:
	 * Pages.templates = {
	 *   abc: {
	 *     def: {
	 *       foo: "This is the foo content"
	 *     }
	 *   }
	 * }
	 */
	HashProvider: function(root) {
		return {
			get: function(path, view, suppressError) {
				// see if we can get from the view first
				var rtn = view && view.templates && view.templates[path];
				
				// if not, pull from the root using the view package if available
				if (!rtn) {
					var parent = root || Pages.templates;
					path = ((view && view.package) ? (view.package.replace('.', '/') + '/') : '') + path
					var parts = path.split('/');
					for (var i in parts) {
						if (!parent) break;
						parent = parent[parts[i]];
					}
					rtn = parent;
				}
				if (rtn && !_.isString(rtn)) {
					// allow for the actual path to reference a hash with a 'template' property.  This helps if
					// collection templates use the view template as the path prefix
					rtn = rtn.template;
				}
				if (!_.isString(rtn) && !suppressError) {
					throw new Error('Undefined template "' + path + '"');
				}
				return rtn;
			},
			
			isValid: function(path, view) {
				return !!this.get(path, view, true);
			}
		};
	}
};
Pages.Defaults.contentProvider = new Pages.ContentProviders.HashProvider();



Pages.ModelHandlers = {};
Pages.ModelHandlers.Simple = Pages.Defaults.modelHandlerClass = function() {};
_.extend(Pages.ModelHandlers.Simple.prototype, {

	init: function(view, model, options) {
		this.model = model;
		this.alias = options.alias;
		if (_.isUndefined(options.fetch) || options.fetch) {
			if (!model.isPopulated || (!model.isPopulated() && !model.isFetching())) {
				model.fetch(options);
			}
		}
	},

	context: function(context) {
		if (this.alias === Pages.Defaults.modelAlias) {
			// single model, go staight to attributes
			_.defaults(context, this.model.attributes);
		} else {
			context[this.alias] = this.model.attributes;
		}
	}
});

/****************************************
 * DEFAULT COLLECTION HANDLER
 ****************************************/

/**
 * Pages.CollectionHandlers is the package structure for view collection handlers.  The collection handler public API
 * is as follows:
 * - init (options, view, collection): initialize with options from Pages.View#setCollection call, view instance and collection instance
 * - render: render the collection
 * - onAdd: called when a model was added to the collection
 * - onRemove: called when a model was removed from the collection
 * - onReset: called when the collection was reset
 */
Pages.CollectionHandlers = {};
Pages.CollectionHandlers.TemplateBound = Pages.Defaults.collectionHandlerClass = function() {};
_.extend(Pages.CollectionHandlers.TemplateBound.prototype, {

	events: {
		'add': 'onAdd',
		'remove': 'onRemove',
		'reset': 'onReset',
		'parent:rendered': 'render'
	},

	init: function(view, collection, options) {
		this.options = options;
		this.view = view;
		this.collection = collection;
		this.subViews = {};
		if (_.isUndefined(options.fetch) || options.fetch) {
			if (!collection.isPopulated || (!collection.isPopulated() && !collection.isFetching())) {
				collection.fetch(options);
			}
		}
	},

	/**
	 * Render the collection within the 'selector' element.  If the collection has 0 items, renderEmpty will be called, otherwise, for each item,
	 * onAdd will be called.
	 */
	render: function() {
		var el;
		try {
			el = this.el = this.view.$el.find(this.options.selector);
		} catch (e) {
			throw new Error('invaild selector "' + this.options.selector + '"; ' + e);
		}
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
			itemEl = $(this.itemContainer(model));
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
	itemContainer: function(model) {
		return this.view.make('div');
	},

	/**
	 * return the item template path
	 * @param model the item model
	 */
	getTemplatePath: function(model) {
		var prefix = (this.view.template || this.view.name) + '/' + (this.options.alias || 'items');
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


/****************************************
 * DEFAULT SUBVIEW HANDLER
 ****************************************/

/**
 * Pages.SubViewHandlers is the package structure for sub-view handlers.  There isn't much need for anything other than
 * the default but it allows us to use a managed object to deal with subviews in a standard way.
 */
Pages.SubViewHandlers = {};
var defaultSubViewHandler = Pages.Defaults.viewHandlerClass = function() {}
_.extend(defaultSubViewHandler.prototype, {
	events: {
		'parent:rendered': 'render'
	},

	init: function(parentView, subView, options) {
		this.options = options;
		this.view = parentView;
		this.subView = subView;
	},

	render: function() {
		var el;
		try {
			el = this.el = this.view.$el.find(this.options.selector);
		} catch (e) {
			throw new Error('invaild selector "' + this.options.selector + '"; ' + e);
		}
		if (el.size() != 1) {
			console.log(this.view.$el.html());
			throw new Error('non-unique or non-existing sub-view container element "' + this.options.selector + '"');
		}
		if (el.children().size() == 0) {
			// we're good here
		} else if (el.children.size() == 1) {
			// assume we are re-rendering
			el.children.at(0).remove();
		} else {
			throw new Error('view container element must be empty');
		}
		this.subView.render();
		el.append(this.subView.el);
	},

	destroy: function() {
		this.subView.destroy();
	}
});


/****************************************
 * MODEL AND COLLECTION
 ****************************************/

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
		options = wrapFetchOptions(this, options);
		this._fetching = true;
		Backbone.Collection.prototype.fetch.call(this, options);
	}
});


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
		options = wrapFetchOptions(this, options);
		this._fetching = true;
		Backbone.Collection.prototype.fetch.call(this, options);
	}
});


/****************************************
 * VIEW
 ****************************************/

/**
 * Backbone view with enhanced fuctionality.  Template rendering, form serialization, sub views, multiple
 * collection handling, additional event delegation, etc...
 */
Pages.View = Backbone.View.extend({

	// set some defaults
	templateLoader: Pages.Defaults.templateEngine,
	contentProvider: Pages.Defaults.contentProvider,

  /**
   * You can bind to event 'initialized' to execute post-initialization code
   * @trigger 'initialized'
   */
	initialize: function(options) {
		// cache of view events for auto-binding
		this._delegatedViewEvents = {};

		this.objectManager = new Pages.Defaults.objectManagerClass(this);

		// FIXME use managed handler
		if (options && options.model) {
			this.setModel(options.model);
		}
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
			var content = this.contentProvider.get(path, this);
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
		var context = {};
		this.objectManager.exec('model', 'context', [context]);
		return _.defaults(context, this.options);
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
	addView: function() {
		var options = this.viewOptions.apply(this, arguments);
		return this.objectManager.add(Pages.Defaults.viewAlias, options);
	},

	// (view[, options]) or (alias, view[, options]) or (options)
	viewOptions: function() {
		return populateOptions ({
			arguments: arguments,
			type: Pages.Defaults.viewAlias,
			objectClass: Backbone.View,
			alias: Pages.Defaults.viewAlias,
			handlerClass: Pages.Defaults.viewHandlerClass,
			addSelector: true
		});
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
	addCollection: function() {
		var options = this.collectionOptions.apply(this, arguments);
		return this.objectManager.add(Pages.Defaults.collectionAlias, options);
	},

	// (collection[, options]) or (alias, collection[, options]) or (options)
	collectionOptions: function() {
		return populateOptions ({
			arguments: arguments,
			type: Pages.Defaults.collectionAlias,
			objectClass: Backbone.Collection,
			alias: Pages.Defaults.collectionAlias,
			handlerClass: Pages.Defaults.collectionHandlerClass,
			addSelector: true
		});
	},

	setModel: function() {
		var options = this.modelOptions.apply(this, arguments);
		return this.objectManager.add(Pages.Defaults.modelAlias, options);
	},

	// (model[, options]) or (alias, model[, options]) or (options)
	modelOptions: function() {
		return populateOptions ({
			arguments: arguments,
			type: Pages.Defaults.modelAlias,
			objectClass: Backbone.Model,
			alias: Pages.Defaults.modelAlias,
			handlerClass: Pages.Defaults.modelHandlerClass,
			addSelector: true
		});
	},

	/**
	 * Get template content using property 'template' or 'name' and render it using this.getContext as data context
	 * @trigger 'render:start', 'render:content', 'render:subviews', 'render:collections', 'render:end'
	 */
	render: function() {
		this.trigger('rendering');
		var content = this.execTemplate(this.getTemplatePath(), this.getContext());
		this.$el.html(content);
		this.trigger('rendered');
		return this;
	},

	/**
	 * destroy all sub-views and unbind all custom bindings
	 */
	destroy: function() {
		this.undelegateEvents(true);

		// model bindings
		this._modelBinder && this._modelBinder.off();

		this.objectManager.destroy();
		delete this.objectManager;

		delete this._delegatedViewEvents;

		return this;
	},


	/****************************************
	 * EVENTS
	 ****************************************/

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
		events = flatten(_.defaults(events || {}, getValue(this, 'events')));
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
		if (key.indexOf(' ') == -1) {
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

// apply the $uper function
_.each([Pages.View, Pages.Model, Pages.Collection], function(obj) {
	// THIS CAN ONLY BE CALLED WITHIN FUNCTIONS THAT ARE DEFINED ON A CLASS WHICH IS NOT MEANT TO BE EXTENDED
	obj.prototype.$uper = function $uper (name, arguments) {
		this.constructor.__super__[name].apply(this, arguments);
	}
});


// PRIVATE CLASSES AND METHODS //
function EventProxy(alias, context) {
	return function(event) {
		var args = _.toArray(arguments);
		args[0] = alias + ':' + event;
		context.trigger.apply(context, args);
		args[0] = alias + ':all';
		args.splice(1, 0, event);
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

function populateOptions (data) {
	var rtn;
	if (data.arguments[0] instanceof data.objectClass) {
		// allow for (object [, options])
		rtn = data.arguments[1] || {alias: data.alias};
		rtn[data.type] = data.arguments[0];
	} else {
		// allow for (alias, object[, options]) or (options)
		if (_.isString(data.arguments[0])) {
			rtn = data.arguments[2] || {};
			rtn.alias = data.arguments[0];
			rtn[data.type] = data.arguments[1];
		} else {
			rtn = data.arguments[0];
		}
	}
	if (!rtn.handler) rtn.handler = new data.handlerClass();
	if (!rtn.alias) rtn.alias = data.alias;
	if (data.addSelector && !rtn.selector) rtn.selector = Pages.Defaults.selectorGenerator(rtn);
	if (_.isUndefined(rtn.watch)) rtn.watch = Pages.Defaults.eventWatch;
	return rtn;
}

function wrapFetchOptions(model, options) {
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
	options.success = success;
	options.error = error;
	return options;
}

})();
