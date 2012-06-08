(function(env) {
	var root = env.Blocks = {};
	// Cached regex to split keys for `delegate`.
	var delegateEventSplitter = /^(\S+)\s*(.*)$/;

	var $window = $(window);

	// package and base handler setup
	var _handler = root.Handler = {};
	var _template = root.Template = {};
	var _content = root.Content = {};
	_handler.Field = {};

	var _base = _handler.Base = function(options) {
		if (this.setOptions) {
			this.setOptions(options);
		} else {
			this.options = options;
		}
	};
	_base.extend = Backbone.Model.extend;

	/*****************************************************************************
	 * DEFAULT TEMPLATE ENGINE & CONTENT PROVIDER IMPL
	 ****************************************************************************/

	var _templateBase = _handler.TemplateBase = _base.extend({
		loadPath : function(path, view, options) {
			var contentProvider = options && options.provider || root.contentProvider;
			return this.loadTemplate(contentProvider.get(path, view, options), options);
		}
	});

	/**
	 * Simple template plugin using the underscore template function
	 */
	_template.Underscore = _templateBase.extend({
		loadTemplate : function(content) {
			return _.template(content);
		}
	});

	/**
	 * Simple template plugin using the handlebars template engine
	 */
	_template.Handlebars = _templateBase.extend({
		loadTemplate : function(content) {
			return Handlebars.compile(content);
		}
	});

	/**
	 * Simple templates that can either be defined on the view within the
	 * 'templates' property or on Blocks.templates. If in Blocks.templates then
	 * the view 'package' property will be prefixed to the path. Package segments
	 * should be separated with '.'. Each package segment will map to a
	 * sub-property within Blocks.templates. So, a 'foo' path with a 'abc.def'
	 * package would be set as follows: Blocks.templates = { abc: { def: { foo:
	 * "This is the foo content" } } }
	 */
	_content.HashProvider = _base.extend({
		get : function(path, view) {
			var pathParts = path ? path.split('/') : undefined;
			function navigate(obj, parts) {
				var parent = obj;
				for ( var i = 0; i < parts.length; i++) {
					if (!parent)
						break;
					parent = parent[parts[i]];
				}
				return parent;
			}
			function strVal(obj, prop) {
				if (obj && prop) {
					var rtn = obj[prop];
					if (_.isString(rtn)) {
						return rtn;
					}
				}
			}
			function checkPaths(obj) {
				if (obj) {
					if (!pathParts) {
						return strVal(obj, view.viewName) || strVal(obj, 'template');
					} else {
						var parent = navigate(obj, pathParts);
						if (_.isString(parent))
							return parent;
					}
				}
			}

			var rtn;
			if (view && view.templates) {
				rtn = checkPaths(view.templates);
			}

			if (!rtn && root.templates) {
				var packageParts = (view && view.viewPackage) ? view.viewPackage.split('.') : undefined;
				if (packageParts) {
					var _root = navigate(root.templates, packageParts);
					if (view) {
						if (view && view.viewName) {
							_root = _root[view.viewName];
						}
						if (!path && _.isString(_root)) {
							return _root;
						}
					}
					rtn = checkPaths(_root || root.templates);
				} else {
					rtn = checkPaths(_root || root.templates);
				}
			}

			if (!rtn || !_.isString(rtn)) {
				throw new Error('Undefined template "' + path + '"');
			}
			return rtn;
		},

		isValid : function(path, view) {
			return !!this.get(path, view, true);
		}
	});

	/*****************************************************************************
	 * CORE ABSTRACT HANDLERS
	 ****************************************************************************/

	/**
	 * Base handler that provides utility methods to get selector value and bind
	 * events
	 */
	_handler.ElBase = _handler.Base.extend({
		elBind : function(eventName, selector, fName) {
			var func = _.isString(fName) ? this[fName] : fName;
			if (!func)
				throw new Error('Invalid function name "' + fName + '"');
			func = _.bind(func, this);
			if (!selector) {
				this.view.$el.bind(eventName, func);
			} else {
				this.view.$el.delegate(selector, eventName, func);
			}
		}
	});

	/*****************************************************************************
	 * DEFAULT MODEL AND COLLECTION HANDLER
	 ****************************************************************************/

	/**
	 * Simple handler that will only contribute model attributes to the context.
	 * If the default alias is used, the model attributes will be applied directly
	 * to the context, otherwise they will use the alias as the attribute
	 * namespace
	 */
	_handler.ModelContextContributor = _handler.Base.extend({
		parentContext : function(context) {
			var model = this.options[this.options._data.type];
			if (this.options.alias === root.Defaults.modelAlias) {
				// single model, go straight to attributes
				_.defaults(context, model.attributes);
			} else {
				context[this.alias] = model.attributes;
			}
		}
	});

	/**
	 * Simple handler that will only contribute collection models to the context.
	 * The alias will be used as the namespace for the models.
	 */
	_handler.CollectionContextContributor = _handler.Base.extend({
		parentContext : function(context) {
			var collection = this.options[this.options._data.type];
			context[this.options.alias] = collection.models;
		}
	});

	/*****************************************************************************
	 * DEFAULT SUBVIEW HANDLER
	 ****************************************************************************/

	/**
	 * Blocks.SubViewHandlers is the package structure for sub-view handlers.
	 * There isn't much need for anything other than the default but it allows us
	 * to use a managed object to deal with subviews in a standard way.
	 */
	_handler.SimpleSubView = _handler.Base.extend({
		events : {
			'parent:rendered' : 'render'
		},

		init : function(parentView, subView) {
			this.view = parentView;
			this.subView = subView;
		},

		render : function() {
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

		getObjectManagers : function() {
			return [ this.subView.getObjectManager() ];
		},

		destroy : function() {
			this.subView.destroy();
		}
	});

	/*****************************************************************************
	 * MODEL AND COLLECTION
	 ****************************************************************************/

	var _collectionFetch = Backbone.Collection.prototype.fetch;
	_.extend(Backbone.Collection.prototype, {
		/**
		 * return true if models are currently being fetched
		 */
		isFetching : function() {
			return this._fetching;
		},

		/**
		 * return true if data has been fetched and populated
		 */
		isPopulated : function() {
			return (this.size() > 0 || this._populated);
		},

		fetch : function(options) {
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
		isFetching : function() {
			return this._fetching;
		},

		/**
		 * return true if data has been fetched and populated
		 */
		isPopulated : function() {
			if (this._populated)
				return true;
			for ( var name in this.attributes) {
				if (name != 'id')
					return true;
			}
			return false;
		},

		fetch : function(options) {
			options = wrapFetchOptions(this, options);
			this._fetching = true;
			_modelFetch.call(this, options);
		}
	});

	/*****************************************************************************
	 * VIEW
	 ****************************************************************************/

	/**
	 * Backbone view with enhanced functionality. Template rendering, form
	 * serialization, sub views, multiple collection handling, additional event
	 * delegation, etc...
	 */
	root.View = Backbone.View.extend({

		/**
		 * You can bind to event 'initialized' to execute post-initialization code
		 * 
		 * @trigger 'initialized'
		 */
		initialize : function(options) {
			this._bindings = [];

			this.templateEngine = root.templateEngine;
			this.contentProvider = root.contentProvider;
			this.objectManager = new root.Defaults.objectManagerClass(this);

			if (options && options.model && root.Defaults.autoAddModel) {
				this.addModel(options.model);
			}
			if (options && options.collection && root.Defaults.autoAddCollection) {
				this.addCollection(options.collection);
			}

			this.init && this.init(this.options);
		},

		/**
		 * return template contents using the template & content plugins
		 * 
		 * @param path
		 *          the template path
		 * @param context
		 *          the context data
		 * @param options
		 *          meaningful for the template plugin or use 'suppressError' to
		 *          suppress any errors
		 * @trigger 'template:error' if errors were suppressed and an error occured
		 */
		execTemplate : function(path, context, options) {
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
		getContext : function() {
			var context = {};
			this.objectManager.exec(undefined, 'parentContext', [ context ]);
			return _.defaults(context, this);
		},

		mixin : function(obj, options) {
			if (!this.mixinId)
				this.mixinId = 0;
			options = options || {};
			if (!options.alias)
				options.alias = ('mixin_' + ++this.mixinId); // alias
			// would only be set if it needed to be removed later
			options.mixin = this; // 'mixin' prop represent context
			// object (object that the handler
			// will get event auto-bind to)
			options.handler = obj; // the handler in this case will be
			// the mixin
			this.objectManager.add('mixin', options);
			return this;
		},

		/**
		 * add a sub view. Available overloaded parameter types are (view[,
		 * options]) or (alias, view[, options]) or (options) If the sub-view alias
		 * is 'foo', the view events could contain, for example, { 'foo:render':
		 * 'fooRender' }
		 */
		addView : function() {
			var options = this.viewOptions.apply(this, arguments);
			return this.objectManager.add(root.Defaults.viewAlias, options);
		},

		viewOptions : function() {
			return populateOptions({
				arguments : arguments,
				type : root.Defaults.viewAlias,
				objectClass : Backbone.View,
				alias : root.Defaults.viewAlias,
				handlerClass : root.Defaults.viewHandlerClass,
				addSelector : true,
				bubbleUp : root.Defaults.bubbleViewEvents
			});
		},

		/**
		 * add a monitored collection. Available overloaded parameter types are
		 * (collection[, options]) or (alias, collection[, options]) or (options) If
		 * the collection alias is 'foo', the view events could contain, for
		 * example, { 'foo:reset': 'fooReset' }
		 */
		addCollection : function() {
			var options = this.collectionOptions.apply(this, arguments);
			return this.objectManager.add(Blocks.Defaults.collectionAlias, options);
		},

		collectionOptions : function() {
			return populateOptions({
				arguments : arguments,
				type : Blocks.Defaults.collectionAlias,
				objectClass : Backbone.Collection,
				alias : Blocks.Defaults.collectionAlias,
				handlerClass : Blocks.Defaults.collectionHandlerClass,
				addSelector : true,
				bubbleUp : Blocks.Defaults.bubbleCollectionEvents
			});
		},

		/**
		 * add a monitored model. Available overloaded parameter types are (model[,
		 * options]) or (alias, model[, options]) or (options) If the model alias is
		 * 'foo', the view events could contain, for example, { 'foo:change':
		 * 'fooChange' }
		 */
		addModel : function() {
			var options = this.modelOptions.apply(this, arguments);
			return this.objectManager.add(Blocks.Defaults.modelAlias, options);
		},

		modelOptions : function() {
			return populateOptions({
				arguments : arguments,
				type : Blocks.Defaults.modelAlias,
				objectClass : Backbone.Model,
				alias : Blocks.Defaults.modelAlias,
				handlerClass : Blocks.Defaults.modelHandlerClass,
				addSelector : true,
				bubbleUp : this.bubbleUpEvents
			});
		},

		/**
		 * Get template content using property 'template' or 'name' and render it
		 * using this.getContext as data context
		 * 
		 * @trigger 'render:start', 'render:content', 'render:subviews',
		 *          'render:collections', 'render:end'
		 */
		render : function() {
			this.trigger('rendering');
			var content = this.execTemplate(undefined, this.getContext());
			this.$el.html(content);
			this.trigger('rendered');
			return this;
		},

		/**
		 * destroy all sub-views and unbind all custom bindings
		 */
		destroy : function() {
			this.trigger('destroying');
			this.undelegateEvents();
			this.objectManager.destroy();
			delete this.objectManager;
			this.trigger('destroyed');
			return this;
		},

		/***************************************************************************
		 * EVENTS
		 **************************************************************************/

		/**
		 * Provide additional event delegations. Events without a space will be
		 * considered as binding to events that are triggered from this view. Hash
		 * expanded events are allowed. the following are equivalent: events {
		 * 'foo:bar': 'abc', foo: { bar: 'abc' } }
		 */
		delegateEvents : function(events) {
			events = flatten(_.defaults(events || {}, getValue(this, 'events')));
			if (!events)
				return;
			this.undelegateEvents(true);
			for ( var key in events) {
				var method = events[key];
				if (!_.isFunction(method))
					method = this[events[key]];
				if (!method)
					throw new Error('Method "' + events[key] + '" does not exist');
				var binding = this.delegateEvent(key, method, this);
				if (binding) {
					this._bindings.push(binding);
				}
			}
		},

		/**
		 * delegate a specific event
		 * 
		 * @param key
		 *          the event key
		 * @method the unbound method
		 */
		delegateEvent : function(key, method, target) {
			// see if we need to override the target
			var specialTargets = this.getSpecialTargets();
			if (specialTargets) {
				for ( var name in specialTargets) {
					if (key.indexOf(name) === 0) {
						// we have a match
						target = specialTargets[name];
						key = key.substring(name.length);
					}
				}
			}

			if (key.indexOf(' ') == -1) {
				// treat this type of event key as a self event binding
				var bound = _.bind(method, this);
				target.on(key, bound);
				return function() {
					target.off(key, bound);
				};
			}

			var $el = this.el;
			var match = key.match(delegateEventSplitter);
			var eventName = match[1], selector = match[2];
			method = _.bind(method, this);
			eventName += '.delegateEvents' + this.cid;
			if (selector === '') {
				$el.on(eventName, method);
				return function() {
					$el.off(eventName, method);
				};
			} else {
				$el.delegate(selector, eventName, method);
				return function() {
					$el.undelegate(selector, eventName, method);
				};
			}
		},

		getSpecialTargets : function() {
			return {
				'$window ' : $window,
				'$el ' : this.$el
			};
		},

		/**
		 * Undelegate all events
		 * 
		 * @param includeAll
		 *          true to include the custom view events that were bound
		 */
		undelegateEvents : function() {
			_.each(this._bindings, function(binding) {
				binding && binding();
			});
			this._bindings = [];
		},

		getObjectManager : function() {
			return this.objectManager;
		}
	});

	// apply the $uper function
	_.each([ Blocks.View, Backbone.Model, Backbone.Collection ], function(obj) {
		// THIS CAN ONLY BE CALLED WITHIN FUNCTIONS THAT ARE DEFINED ON A CLASS
		// WHICH IS NOT MEANT TO BE EXTENDED
		obj.prototype.$uper = function $uper(name, arguments) {
			this.constructor.__super__[name].apply(this, arguments);
		};
	});

	/*****************************************************************************
	 * MANAGED OBJECTS
	 ****************************************************************************/

	var loadedObjectPattern = /^\!(.+)/;

	root.ObjectManager = function(parent) {
		this.parent = parent;
		this.managedObjects = {};
	};
	root.ObjectManager.extend = Backbone.Model.extend;
	_.extend(Blocks.ObjectManager.prototype, {
		get : function(type, alias) {
			var l = this.managedObjects[type];
			if (!type)
				return;
			for ( var i = 0; i < l.length; i++) {
				if (l[i].alias === alias)
					return l;
			}
		},

		remove : function(type, alias) {
			var l = this.managedObjects[type];
			if (!type)
				return;
			for ( var i = 0; i < l.length; i++) {
				if (l[i].alias === alias) {
					l[i].handler.destroy && l[i].handler.destroy();
					delete l[i];
					return true;
				}
			}
		},

		getAll : function(type) {
			return this.managedObjects[type] || [];
		},

		add : function(type, options) {
			var l = this.managedObjects[type];
			if (!l) {
				l = this.managedObjects[type] = [];
			}
			for ( var i = 0; i < l.length; i++) {
				if (l[i].alias === options.alias) {
					// remove the previous
					l[i].destroy();
					break;
				}
			}

			// initialize options
			options._data = {
				type : type,
				bindings : []
			};
			var bindings = options._data.bindings;
			options.handler.options = options;
			options.handler[type] = options[type];
			// if a selector property was provided, auto-set $el on the handler
			// and update it as the parent renders itself
			var parent = options.handler.parent = this.parent;
			var elBind;
			if (options.selector && parent.$el) {
				elBind = function() {
					options.handler.$el = parent.$el.find(options.selector);
				};
				parent.on('rendered', elBind);
				bindings.push(function() {
					parent.off('rendered', elBind);
				});
			}

			var object = options[type];
			// initialize and allow auto-binding from the context object to the
			// view
			var initArgs = [ this.parent, object, options ];
			if (this.parent === object) {
				// special case, if context object is same as parent init with
				// parent, options
				initArgs = [ this.parent, options ];
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
					bindings.push(this.bindEvent(name, method, object, options.handler, options) || {});
				}
				options._data.bindings = bindings;
			}

			l.push(options);
			return options[type];
		},

		/**
		 * Bind a specific event
		 * 
		 * @param event
		 *          the event name
		 * @param method
		 *          the callback
		 * @param object
		 *          the object to bind to
		 * @param options
		 *          the options provided with the add call
		 */
		bindEvent : function(event, method, object, context, options) {
			var bound = _.bind(method, context);
			var target = object;

			// use the ! prefix as a marker to wait for a loaded
			// model/collection
			var loadedCallback = undefined;
			var match = event.match(loadedObjectPattern);
			if (match) {
				event = match[1];
				var _bound = bound;
				bound = function() {
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

			// see if we need to override the target
			var specialTargets = this.getSpecialTargets(object, options);
			if (specialTargets) {
				for ( var name in specialTargets) {
					if (event.indexOf(name) === 0) {
						// we have a match
						target = specialTargets[name];
						event = event.substring(name.length);
					}
				}
			}

			// allow events that are split by a space refer to standard DOM
			// event & selector
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
						destroy : function() {
							parent.$el.undelegate(parts[1], parts[0], bound);
						}
					};
				}
			}

			target.on(event, bound);

			return {
				destroy : function() {
					target.off(event, bound);
					if (loadedCallback) {
						object.off('fetched', loadedCallback);
					}
				}
			};
		},

		getSpecialTargets : function(managedObject, options) {
			return {
				'parent:' : this.parent,
				'$window ' : $window
			};
		},

		/**
		 * bind to 'all' on object with the provided alias prefix
		 */
		eventProxy : function(alias, object) {
			var eventProxy = new EventProxy(alias, this.parent);
			object.on('all', eventProxy);
			return {
				alias : alias,
				object : object,
				off : function() {
					object.off('all', eventProxy);
				}
			};
		},

		/**
		 * Execute a method on all handler
		 * 
		 * @param type
		 *          optional type filter
		 * @param method
		 *          the method name
		 * @param args
		 *          method arguments
		 * @param includeAll
		 *          true to drill down to any contained object managers (eg: views
		 *          associated with collection items)
		 * @returns {AggregateResponse}
		 */
		exec : function(type, method, args, includeAll) {
			// allow usage without type param to indicate all types
			if (!method || !_.isString(method)) {
				args = method;
				method = type;
				type = undefined;
			}
			if (_.isBoolean(args)) {
				includeAll = args;
				args = undefined;
			}

			// execute the method on the handler objects
			function exec(l, rtn) {
				var count = 0;
				for ( var alias in l) {
					count++;
					var obj = l[alias];
					var func = obj.handler[method];
					if (func) {
						rtn.push(func.apply(obj.handler, args));
					}

					// handle any subtypes
					if (includeAll) {
						var mgrs = obj.handler.getObjectManagers && obj.handler.getObjectManagers();
						if (mgrs) {
							_.each(mgrs, function(mgr) {
								var subRtn = mgr.exec(type, method, args, true);
								rtn.push.apply(rtn, subRtn.values);
								count += subRtn.total;
							});
						}
					}
				}
				return count;
			}

			var rtn = [];
			var count = 0;
			if (!type) {
				for ( var type in this.managedObjects) {
					count += exec(this.managedObjects[type], rtn);
				}
				return new AggregateResponse(rtn, count);
			} else {
				count += exec(this.getAll(type), rtn);
				return new AggregateResponse(rtn, count);
			}
		},

		/**
		 * Clean up this manager and all associated handlers by calling
		 * handler.destroy.
		 */
		destroy : function() {
			for ( var type in this.managedObjects) {
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

	/**
	 * Return type for exec call
	 */
	function AggregateResponse(data, total) {
		var values = _.without(data, [ undefined ]);
		return {
			// total number of handlers that had an impl for the method
			total : total,
			// total number of handlers which had a response other than undefined
			responded : values.length,
			// a list of response values
			values : values,

			// did all of the values response match the provided value?
			all : function(val, allowTruthy) {
				for ( var i in values) {
					var value = values[i];
					if (allowTruthy) {
						if ((val && !value) || (!val && value)) {
							return false;
						}
					} else {
						if (!(val === value)) {
							return false;
						}
					}
				}
				return true;
			},

			// did any of the values response match the provided value?
			any : function(val, allowTruthy) {
				for ( var i in values) {
					var value = values[i];
					if (allowTruthy) {
						if ((val && value) || (!val && !value)) {
							return true;
						}
					} else {
						if (val === value) {
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
		};
	}

	function getValue(object, prop) {
		if (!(object && object[prop]))
			return null;
		return _.isFunction(object[prop]) ? object[prop]() : object[prop];
	}

	function flatten(object) {
		if (!object)
			return object;
		var parent = arguments[1] || object;
		var prefix = arguments[2] || '';
		for ( var key in object) {
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

	function populateOptions(data) {
		var rtn;
		if (data.arguments[0] instanceof data.objectClass) {
			// allow for (object [, options])
			rtn = data.arguments[1] || {
				alias : data.alias
			};
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
		if (!rtn.handler)
			rtn.handler = new data.handlerClass();
		if (!rtn.alias)
			rtn.alias = data.alias;
		if (data.addSelector && !rtn.selector)
			rtn.selector = root.Defaults.selectorGenerator(rtn);
		if (_.isUndefined(rtn.bubbleUp))
			rtn.bubbleUp = data.bubbleUp;
		return rtn;
	}

	function wrapFetchOptions(model, options) {
		model.trigger('fetching');
		options = options || {};
		var _success = options.success;
		function success() {
			model._fetching = false;
			model._populated = true;
			_success && _success.apply(model, arguments);
			model.trigger('fetched');
		}
		var _error = options.error;
		function error() {
			model._fetching = false;
			_error && _error.apply(model, arguments);
		}
		options.success = success;
		options.error = error;
		return options;
	}

	function getMethod(methodOrName, parent) {
		if (methodOrName) {
			if (_.isString(methodOrName)) {
				var func = parent[methodOrName];
				if (!func)
					throw new Error('Invalid function name "' + methodOrName + '"');
				return func;
			} else {
				return methodOrName;
			}
		}
	}

	// setup plugin packages
	_handler.Collection = {};
	_handler.Model = {};
	_handler.View = {};

	root.resetDefaults = function() {
		root.templateEngine = new _template.Underscore();
		root.contentProvider = new _content.HashProvider();
		return root.Defaults = {
			objectManagerClass : Blocks.ObjectManager,
			modelHandlerClass : _handler.ModelContextContributor,
			collectionHandlerClass : _handler.CollectionContextContributor,
			viewHandlerClass : _handler.SimpleSubView,
			modelAlias : 'model',
			collectionAlias : 'collection',
			viewAlias : 'view',
			containerCssClass : 'blk-container',
			selectorGenerator : function(options) {
				return '.' + options.alias;
			},
			autoAddModel : true,
			autoAddCollection : true,
			bubbleCollectionEvents : false,
			bubbleModelEvents : false,
			bubbleViewEvents : false
		};
	};
	root.resetDefaults();

})(this);
