var Pages = {
  Handler: {}
};

(function() {
// Cached regex to split keys for `delegate`.
var delegateEventSplitter = /^(\S+)\s*(.*)$/;


// The self-propagating extend function that Backbone classes use.
var extend = Backbone.Model.extend;

/**************************************************
 * DEFAULT TEMPLATE ENGINE & CONTENT PROVIDER IMPL
 **************************************************/

function templateLoadPath(path, view, options) {
	var contentProvider = options && options.provider || Pages.contentProvider;
	return this.loadContent(contentProvider.get(path, view, options), options);
}

/**
 * Pages.Template is the package structure for template engine plugins.  The template engine API
 * is as follows:
 * - load: return function which accepts context parameter to return template content
 */
Pages.Handler.Template = {

	/**
	 * Simple template plugin using the underscore template function
	 */
	Underscore: {
		loadContent: function(content) {
			return function(data) {
				return _.template(content, data);
			}
		},
		loadPath: templateLoadPath
	},
	Handlebars: {
		loadContent: function(content) {
			return Handlebars.compile(content);
		},
		loadPath: templateLoadPath
	}
};



/**
 * Pages.Content is the package structure for template contentent retrieval plugins.  The content provider API
 * is as follows:
 * - get(path, view (optional)) return the content relating to the path
 * - isValid(path) return true if the path represents a valid content block
 */
Pages.Handler.Content = {

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
			get: function(path, view) {
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
				if (!_.isString(rtn)) {
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


/**************************************************
 * CORE ABSTRACT HANDLERS
 **************************************************/

/**
 * Base handler that provides utility methods to get selector value and bind events
 */
Pages.Handler.Base = function() {};
_.extend(Pages.Handler.Base.prototype, {
	elBind: function (eventName, selector, fName) {
		var func = _.isString(fName) ? this[fName] : fName;
		if (!func) throw new Error ('Invalid function name "' + fName + '"');
		func = _.bind(func, this);
		if (!selector) {
			this.view.$el.bind(eventName, func);
		} else {
			this.view.$el.delegate(selector, eventName, func);
		}
	}
});
Pages.Handler.Base.extend = extend;



/****************************************
 * DEFAULT MODEL AND COLLECTION HANDLER
 ****************************************/

/**
 * Simple handler that will only contribute model attributes to the context.
 * If the default alias is used, the model attributes will be applied directly to the context,
 * otherwise they will use the alias as the attribute namespace
 */
Pages.Handler.ModelContextContributor = Pages.Handler.Base.extend({
	parentContext: function(context) {
		var model = this.options[this.options._data.type];
		if (this.options.alias === Pages.Defaults.modelAlias) {
			// single model, go straight to attributes
			_.defaults(context, model.attributes);
		} else {
			context[this.alias] = model.attributes;
		}
	}
});


/**
 * Simple handler that will only contribute collection models to the context.  The
 * alias will be used as the namespace for the models.
 */
Pages.Handler.CollectionContextContributor = Pages.Handler.Base.extend({
	parentContext: function(context) {
		var collection = this.options[this.options._data.type];
		context[this.options.alias] = collection.models;
	}
});


/****************************************
 * DEFAULT SUBVIEW HANDLER
 ****************************************/

/**
 * Pages.SubViewHandlers is the package structure for sub-view handlers.  There isn't much need for anything other than
 * the default but it allows us to use a managed object to deal with subviews in a standard way.
 */
Pages.Handler.SimpleSubView = Pages.Handler.Base.extend({
	events: {
		'parent:rendered': 'render'
	},

	init: function(parentView, subView) {
		this.view = parentView;
		this.subView = subView;
	},

	render: function() {
		var el = this.$el;
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

var _collectionFetch = Backbone.Collection.prototype.fetch;
_.extend(Backbone.Collection.prototype, {
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
		_collectionFetch.call(this, options);
	}
});

var _modelFetch = Backbone.Model.prototype.fetch;
_.extend(Backbone.Model.prototype, {
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
		if (this._populated) return true;
		for (var name in this.attributes) {
			if (name != 'id') return true;
		}
		return false;
	},

	fetch: function(options) {
		options = wrapFetchOptions(this, options);
		this._fetching = true;
		_modelFetch.call(this, options);
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

  /**
   * You can bind to event 'initialized' to execute post-initialization code
   * @trigger 'initialized'
   */
	initialize: function(options) {
		// cache of view events for auto-binding
		this._delegatedViewEvents = {};

		this.templateEngine = Pages.templateEngine;
		this.contentProvider = Pages.contentProvider;
		this.objectManager = new Pages.Defaults.objectManagerClass(this);

		if (options && options.model &&  Pages.Defaults.autoAddModel) {
			this.addModel(options.model);
		}
		if (options && options.collection && Pages.Defaults.autoAddCollection) {
			this.addCollection(options.collection);
		}

		this.init && this.init(this.options);
	},

	/**
	 * Return the template path for this view
	 */
	getTemplatePath: function() {
		return getValue(this, 'template') || getValue(this, 'name') || 'template';
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
			return this.templateEngine.loadPath(path, this, options)(context);
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
		this.objectManager.exec(undefined, 'parentContext', [context]);
		return _.defaults(context, this);
	},

	mixin: function(obj, options) {
		if (!this.mixinId) this.mixinId = 0;
		options = options || {};
		if (!options.alias) options.alias = ('mixin_' + ++this.mixinId); // alias would only be set if it needed to be removed later
		options.mixin = this; // 'mixin' prop represent context object (object that the handler will get event auto-bind to)
		options.handler = obj; // the handler in this case will be the mixin
		this.objectManager.add('mixin', options);
		return this;
	},

	/**
	 * add a sub view.  Available overloaded parameter types are
	 * (view[, options]) or (alias, view[, options]) or (options)
	 * If the sub-view alias is 'foo', the view events could contain, for example, { 'foo:render': 'fooRender' }
	 */
	addView: function() {
		var options = this.viewOptions.apply(this, arguments);
		return this.objectManager.add(Pages.Defaults.viewAlias, options);
	},

	viewOptions: function() {
		return populateOptions ({
			arguments: arguments,
			type: Pages.Defaults.viewAlias,
			objectClass: Backbone.View,
			alias: Pages.Defaults.viewAlias,
			handlerClass: Pages.Defaults.viewHandlerClass,
			addSelector: true,
			bubbleUp: Pages.Defaults.bubbleViewEvents
		});
	},

	/**
	 * add a monitored collection.  Available overloaded parameter types are
	 * (collection[, options]) or (alias, collection[, options]) or (options)
	 * If the collection alias is 'foo', the view events could contain, for example, { 'foo:reset': 'fooReset' }
	 */
	addCollection: function() {
		var options = this.collectionOptions.apply(this, arguments);
		return this.objectManager.add(Pages.Defaults.collectionAlias, options);
	},

	collectionOptions: function() {
		return populateOptions ({
			arguments: arguments,
			type: Pages.Defaults.collectionAlias,
			objectClass: Backbone.Collection,
			alias: Pages.Defaults.collectionAlias,
			handlerClass: Pages.Defaults.collectionHandlerClass,
			addSelector: true,
			bubbleUp: Pages.Defaults.bubbleCollectionEvents
		});
	},

	/**
	 * add a monitored model.  Available overloaded parameter types are
	 * (model[, options]) or (alias, model[, options]) or (options)
	 * If the model alias is 'foo', the view events could contain, for example, { 'foo:change': 'fooChange' }
	 */
	addModel: function() {
		var options = this.modelOptions.apply(this, arguments);
		return this.objectManager.add(Pages.Defaults.modelAlias, options);
	},

	modelOptions: function() {
		return populateOptions ({
			arguments: arguments,
			type: Pages.Defaults.modelAlias,
			objectClass: Backbone.Model,
			alias: Pages.Defaults.modelAlias,
			handlerClass: Pages.Defaults.modelHandlerClass,
			addSelector: true,
			bubbleUp: this.bubbleUpEvents
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
		this.trigger('destroying');
		this.undelegateEvents(true);
		this.objectManager.destroy();
		delete this.objectManager;
		delete this._delegatedViewEvents;
		this.trigger('destroyed');
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
_.each([Pages.View, Backbone.Model, Backbone.Collection], function(obj) {
	// THIS CAN ONLY BE CALLED WITHIN FUNCTIONS THAT ARE DEFINED ON A CLASS WHICH IS NOT MEANT TO BE EXTENDED
	obj.prototype.$uper = function $uper (name, arguments) {
		this.constructor.__super__[name].apply(this, arguments);
	}
});


/****************************************
 * MANAGED OBJECTS
 ****************************************/
 
 var parentPrefixPattern = /^parent:/;
 var elPrefixPattern = /^el:/;
 var loadedObjectPattern = /^\*(.+)/;
 
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

	remove: function(type, alias) {
		var l = this.managedObjects[type];
		if (!type) return;
		for (var i=0; i<l.length; i++) {
			if (l[i].alias === alias) {
				l[i].handler.destroy && l[i].handler.destroy();
				delete l[i];
				return true;
			}
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
				// remove the previous
				l[i].destroy();
				break;
			}
		}

		// initialize options
		options._data = {type: type, bindings: []};
		var bindings = options._data.bindings;
		options.handler.options = options;
		// if a selector property was provided, auto-set $el on the handler
		// and update it as the parent renders itself
		var parent = options.handler.parent = this.parent;
		var elBind;
		if (options.selector && parent.$el) {
			elBind = function() {
				options.handler.$el = parent.$el.find(options.selector); 
			}
			parent.on('rendered', elBind);
			bindings.push(function() {
				parent.off('rendered', elBind);
			});
		}

		var object = options[type];
		// initialize and allow auto-binding from the context object to the view
		var initArgs = [this.parent, object, options];
		if (this.parent === object) {
			// special case, if context object is same as parent init with parent, options
			initArgs = [this.parent, options];
		} else if (options.bubbleUp) {
			// no need to bind parent event to itself
			options._binder = this.eventProxy(options.alias, object);
		}
		options.handler.init && options.handler.init.apply(options.handler, initArgs);

		// auto-bind all 'event' references from the handler
		var events = flatten(options.handler.events);
		if (events) {
			var bindings = [];
			for (name in events) {
				var method = getMethod(events[name], options.handler);
				bindings.push(this.bindEvent(name, method, object, options) || {});
			}
			options._data.bindings = bindings;
		}
		
		l.push(options);
		return options[type];
	},

	bindEvent: function(event, method, object, options) {
		var bound = _.bind(method, options.handler);				
		var target = object;

		// use the * prefix as a marker to wait for a loaded model/collection
		var loadedCallback;
		var match = event.match(loadedObjectPattern);
		if (match) {
			event = match[1];
			var _bound = bound;
			bound = function () {
				if (object.isPopulated()) {
					_bound(arguments);
					if (loadedCallback) {
						object.off('fetched', loadedCallback);
						delete loadedCallback;
					}
				} else if (object.isFetching()) {
					if (!loadedCallback) {
						loadedCallback = bound;
						object.on('fetched', bound);
					}
				}
			};
		}

		// allow events that are split by a space refer to standard DOM event & selector
		if (this.parent.$el && options.selector) {
			// check for element binding
			var parts = event.split(' ');
			if (parts.length > 1) {
				var parent = this.parent;
				var _selector = options.selector;
				if (parts[1] !== 'this') {
					_selector += ' ' + parts[1];
				}
				parent.$el.delegate(parts[1], parts[0], bound);
				return {
					destroy: function() {
						parent.$el.undelegate(parts[1], parts[0], bound);
					}
				}
			}
		}

		// allow the 'parent:' prefix for handler bindings to the parent instead of the managed object
		// for instance: bind to the view instead of the model		
		if (event.match(parentPrefixPattern)) {
			// the 'parent' token has been referenced, bind to the parent instead
			event = event.replace(parentPrefixPattern, '');
			target = this.parent;
		}

		target.on(event, bound);

		return {
			destroy: function() {
				target.off(name, bound);
				if (loadedCallback) {
					object.off('fetched', loadedCallback);
				}
			}
		}
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

		function exec(l, rtn) {
			for (var alias in l) {
				var obj = l[alias];
				var func = obj.handler[method];
				rtn[alias] = func && func.apply(obj.handler, args);
			}
		}

		var rtn = {};
		if (!type) {
			for (var type in this.managedObjects) {
			  var typeRtn = {};
			  rtn[type] = typeRtn;
				exec(this.managedObjects[type], typeRtn);
			}
			return new AggregateResponse(rtn, true);
		} else {
			exec(this.getAll(type), rtn);
			return new AggregateResponse(rtn, false);
		}
	},

	destroy: function() {
		for (var type in this.managedObjects) {
			_.each(this.managedObjects[type], function(obj) {
				if (obj._data.bindings) {
					_.each(obj._data.bindings, function(binding) {
						binding.destroy && binding.destroy();
					});
				}
				obj.handler.destroy && obj.handler.destroy();
			});
		}
	}
});

function AggregateResponse(data, typed) {
	var values = [];
	var total = 0;
	var responded = 0;
	function eval(data) {
		for (var i in data) {
			total ++;
			if (!_.isUndefined(data[i])) {
				responded ++;
				values.push(data[i]);
			}
		}
	}
	if (typed) {
		for (var i in data) {
			eval(data[i]);
		}
	} else {
		eval(data);
	}
	
	return {
		total: total,
		responded: responded,
		all: function(val, allowTruthy) {
			for (var i in values) {
				if (allowTruthy) {
					if ((val && !values[i]) || (!val && values[i])) {
						return false;
					}
				} else {
					if (!(val === values[i])) {
						return false;
					}
				}
			}
			return true;
		},
		any: function(val, allowTruthy) {
			for (var i in values) {
				if (allowTruthy) {
					if ((val && values[i]) || (!val && !values[i])) {
						return true;
					}
				} else {
					if (val === values[i]) {
						return true;
					}
				}
			}
			return false;
		}
	};
}

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
	if (_.isUndefined(rtn.bubbleUp)) rtn.bubbleUp = data.bubbleUp;
	return rtn;
}

function wrapFetchOptions(model, options) {
	model.trigger('fetching');
	options = options || {};
	var _success = options.success;
	function success() {
		model._fetching = false;
		model._populated = true;
		options.success && options.success.apply(model, arguments);
		model.trigger('fetched');
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

function getMethod(methodOrName, parent) {
	if (methodOrName) {
		if (_.isString(methodOrName)) {
			var func = parent[methodOrName];
			if (!func) throw new Error('Invalid function name "' + methodOrName + '"');
			return func;
		} else {
			return methodOrName;
		}
	}
}

// setup plugin packages
Pages.Handler.Collection = {};
Pages.Handler.Model = {};
Pages.Handler.View = {};

// set the defaults
Pages.templateEngine = Pages.Handler.Template.Underscore;
Pages.contentProvider = new Pages.Handler.Content.HashProvider();
Pages.Defaults = {
	objectManagerClass: Pages.ObjectManager,
	modelHandlerClass: Pages.Handler.ModelContextContributor,
	collectionHandlerClass: Pages.Handler.CollectionContextContributor,
	viewHandlerClass: Pages.Handler.SimpleSubView,
	modelAlias: 'model',
	collectionAlias: 'collection',
	viewAlias: 'view',
	collectionContainerClass: 'bp_col-container',
	subviewContainerClass: 'bp_sv-container',
	modelContainerClass: 'bp_mdl-container',
	selectorGenerator: function(options) { return '.' + options.alias; },
	autoAddModel: true,
	autoAddCollection: true,
	bubbleCollectionEvents: false,
	bubbleModelEvents: false,
	bubbleViewEvents: false
}

})();
