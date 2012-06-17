(function(env) {
	var root = env.Blocks = {
		// access to default functionality
		setView: function(view, options) {
			Blocks.page.setView(view, options);
		},
		isValidContentPath: function(path, view, options) {
			return ((options && options.contentProvider) || Blocks.Defaults.contentProvider).isValid(path, view, options);
		},
		getContent: function(path, view, options) {
			var contentProvider = (options && options.contentProvider) || Blocks.Defaults.contentProvider;
			return contentProvider.get(path, view, options);
		},
		template: function(path, view, options) {
			var content = this.getContent(path, view, options);
			return this.contentTemplate(content, view, options);
		},
		contentTemplate: function(content, view, options) {
			var templateEngine = (options && options.templateEngine) || Blocks.Defaults.templateEngine;
			return templateEngine.get(content, view, options);
		},
		i18n: function(key, defaultVal, count, options) {
			if (!_.isNumber(count)) {
				options = count;
				count = undefined;
			}
			return Blocks.Default.i18nProvider.get(key, defaultVal);
		},
		serializeField: function(el) {
			return Blocks.Defaults.serializer.serializeField(el);
		},
		serialize: function (root, attr) {
			return Blocks.Defaults.serializer.serialize(root, attr);
		},
		synchronizeDOM: function(root, model) {
			return Blocks.Defaults.serializer.synchronizeDOM(root, model);
		}
	};

	_.extend(root, Backbone.Events);
	// Cached regex to split keys for `delegate`.
	var delegateEventSplitter = /^(\S+)\s*(.*)$/;
	var specialSelectorPattern = /^[\.#](^\s)*/;
	var $window = $(window);

	// package and base handler setup
	var _widget = root.Widget = {};
	var _loader = root.Loader = {};
	var _handler = root.Handler = {};
	var _template = root.Template = {};
	var _content = root.Content = {};
	var _field = _handler.Field = {};
	var _util = root.Util = {};
	root.Mixin = {};

	var _base = _handler.Base = function(options) {
		if (this.setOptions) {
			this.setOptions.apply(this, arguments);
		} else if (arguments.length === 1) {
			this.options = options;
		}
	};
	_base.extend = Backbone.Model.extend;

	_widget.Base = _base.extend({});
	_.extend(_widget.Base.prototype, Backbone.Events);

	/*****************************************************************************
	 * DEFAULT TEMPLATE ENGINE & CONTENT PROVIDER IMPL
	 ****************************************************************************/

	/**
	 * Simple template plugin using the underscore template function
	 */
	_template.Underscore = _base.extend({
		get : function(content) {
			return _.template(content);
		}
	});

	/**
	 * Simple template plugin using the handlebars template engine
	 */
	_template.Handlebars = _base.extend({
		get : function(content) {
			return Handlebars.compile(content);
		}
	});

	/**
	 * Simple templates that can either be defined on the view within the
	 * 'templates' property or on Blocks.templates. If in Blocks.templates then
	 * the view 'package' property will be prefixed to the path. Package segments
	 * should be separated with '.'. Each package segment will map to a
	 * sub-property within Blocks.templates.
	 */
	_content.HashProvider = _base.extend({
		// lookup order
		// 1) {view}.templates.{view.viewName or view.template}.template (if no path)
		// 2) {view}.templates.{view.viewName or view.template} (if no path)
		// 3) {view}.templates.{view.viewName}.{path} (if path)
		// 4) Blocks.templates.{view.viewPackage}.{view.viewName}.{path}
		
		get : function(path, view, options) {
			// split the path into parts
			var pathParts = path ? path.split('/') : undefined;
			var viewTemplate = view && _util.getValue(view, 'template');

			// navigate from a root through hash properties
			function navigate(obj, parts) {
				var parent = obj;
				for ( var i = 0; i < parts.length; i++) {
					if (!parent)
						break;
					parent = parent[parts[i]];
				}
				return parent;
			}

			// return a string value from a property value on an object
			function templateVal(obj, prop) {
				if (obj && prop) {
					var rtn = obj[prop];
					if (_.isString(rtn)) {
						return rtn;
					}
				}
			}

			// check all path options from a root which could contain the view
			// template
			function checkPaths(obj) {
				if (obj) {
					if (!pathParts) {
						var rtn = _util.getValue(obj, viewTemplate) || _util.getValue(obj, view.viewName);
						if (_.isString(rtn)) {
							return rtn;
						} else if (!path && rtn) {
							return rtn.template;
						}
					} else {
						var parent = navigate(obj, pathParts);
						if (_.isString(parent))
							return parent;
					}
				}
			}

			var rtn;
			// first check view.templates
			if (view && view.templates) {
				rtn = checkPaths(view.templates);
			}
			
			// if global, ensure that we use the view name / template as a prefix
			if (pathParts) {
				pathParts.splice(0, 0, view.viewName);
			}

			// then check Block.templates
			if (!rtn && root.templates) {
				var packageParts = (view && view.viewPackage) ? view.viewPackage.split('.') : undefined;
				if (packageParts) {
					var _root = navigate(root.templates, packageParts);
					if (view) {
						if (_root && view && view.viewName) {
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
			if (options && options.suppressError) {
				return rtn;
			}
			else if (!_.isString(rtn)) {
				var err = 'Undefined template ';
				if (path) err += '"' + path + "'";
				if (view) err += ' for view "' + view.viewName + '"';
				throw new Error(err);
			}
			return rtn;
		},

		isValid : function(path, view) {
			return !!this.get(path, view, {suppressError: true});
		}
	});

	/*****************************************************************************
	 * FIELD SERIALIZATION & SYNCHRONIZATION
	 ****************************************************************************/

	/**
	 * Default strategy to match DOM elements with model fields. Requires a field
	 * which has a name value which matches the model field attributes. Any custom
	 * or composite types can set a data-type attribute and will be ignored by the
	 * simple naming strategy.
	 */
	_field.SimpleNamingStrategy = _base.extend({
		setOptions : function(options) {
			if (options) {
				this.dataType = options.dataType;
				this.useDataName = options.useDataName;
			}
		},

		/**
		 * Return the model field key for a DOM element or null if N/A
		 * 
		 * @param element
		 *          the DOM element
		 */
		getFieldKey : function(element) {
			if (this.useDataName) {
				return element.getAttribute('data-name');
			} else {
				return element.getAttribute('name');
			}
		},

		/**
		 * Return the jquery selector for all elements associated with the field key
		 * 
		 * @param key
		 *          the model field key
		 * @param el
		 *          the root jquery selector
		 */
		getElement : function(key, el) {
			var rtn;
			if (this.useDataName) {
				rtn = el.find('[data-name="' + key + '"]');
			} else {
				rtn = el.find('[name="' + key + '"]');
			}
			if (this.dataType) {
				rtn = rtn.filter('[data-type="' + this.dataType + '"]');
			} else {
				rtn = rtn.filter(':not([data-type])');
			}
			return rtn;
		},

		/**
		 * Return an map of elements with key as model field key and value as single
		 * element or list of elements. This strategy will ignore all elements with
		 * a data-type attribute (assuming another naming strategy will override)
		 * 
		 * @param root
		 *          the root jquery selector
		 */
		getElements : function(root) {
			var elements;
			if (this.dataType) {
				elements = root.find('[data-type="' + this.dataType + '"]');
			} else {
				elements = root.find('[name]');
			}
			var rtn = {}, _this = this;
			;
			elements.each(function(index, element) {
				if (!_this.dataType && element.getAttribute('data-type')) {
					return;
				}
				var key = _this.getFieldKey(element);
				var el = rtn[key];
				if (el) {
					el.push(element);
				} else {
					rtn[key] = [ element ];
				}
			});
			return rtn;
		}
	});

	/**
	 * Default handler for serializing and mapping field input values
	 */
	_field.SimpleInputHandler = _base.extend({

		/**
		 * Serialize a single input field
		 * 
		 * @param element
		 *          the single DOM element
		 */
		serializeField : function(element) {
			var el = $(element);
			var type = el.attr('type');
			var val = el.val();
			if (type === 'checkbox') {
				return !!element.checked;
			} else if (type === 'radio') {
				if (element.checked) {
					if (isIn(val, Blocks.Defaults.trueValues) || isIn(val, Blocks.Defaults.falseValues)) {
						return isIn(val, Blocks.Defaults.trueValues);
					} else {
						return val;
					}
				}
			} else {
				return val;
			}
		},

		/**
		 * Serialize the input(s) represented by the element(s) to the attributes
		 * map using the provided key
		 * 
		 * @param key
		 *          the attributes map key
		 * @param elements
		 *          array of DOM elements returned by naming strategy for this field
		 *          (could be a single)
		 * @param attr
		 *          the attributes hash
		 */
		serialize : function(key, elements, attr) {
			attr = attr || {};
			var _this = this;
			_.each(elements, function(element) {
				var val = _this.serializeField(element);
				if (!_.isUndefined(val)) {
					attr[key] = val;
				}
			});
			return attr;
		},

		/**
		 * Set the element(s) value using the provided value
		 * 
		 * @param key
		 *          the model field key
		 * @param value
		 *          the value to set
		 * @param el
		 *          the jquery/zepto wrapped element selection
		 */
		setElementValue : function(key, value, el) {
			var size = el.length;
			if (!size || _.isUndefined(value))
				return;

			var tVals = Blocks.Defaults.trueValues;
			var fVals = Blocks.Defaults.falseValues;

			// boolean representing on/off values for checkbox or radio
			if (_.isBoolean(value)) {
				el.each(function(index, element) {
					var type = element.getAttribute('type').toLowerCase();
					var eVal = element.value;
					if (type == 'checkbox') {
						element.checked = value;
					} else {
						// radio buttons
						if ((value && isIn(eVal, tVals)) || (!value && isIn(eVal, fVals))) {
							element.checked = true;
						} else {
							element.checked = false;
						}
					}
				});
				return true;
			}

			function setString(stringVal, el) {
				var type = (el.attr('type') || 'text').toLowerCase();
				if (type === 'checkbox' || type == 'radio') {
					if (stringVal === el.val()) {
						el.attr('checked', 'checked');
					} else {
						el.removeAttr('checked');
					}
				} else {
					el.val(stringVal);
				}
			}

			// string value for text/select/radio choice
			if (_.isString(value)) {
				if (el.length === 1) {
					setString(value, el);
				} else {
					el.each(function(index, el) {
						setString(value, $(el));
					});
				}
				return true;
			}
			return false;
		}
	});

	/**
	 * Constructor can either be a list of or a single hash containing
	 * 'namingStrategy' and 'inputHandler'
	 */
	var _defaultNamingStrategy = new _field.SimpleNamingStrategy();
	var _defaultInputHandler = new _field.SimpleInputHandler();
	_field.Serializer = _base.extend({
		setOptions : function(options) {
			if (!options) {
				this.entries = [ {
					namingStrategy : _defaultNamingStrategy,
					inputHandler : _defaultInputHandler
				} ];
			} else if (_.isArray(options)) {
				this.entries = options;
			} else {
				this.entries = [ options ];
			}
		},

		// should be {namingStrategy: x, inputHandler: x}
		add : function(options) {
			this.entries.push(options);
			return this;
		},

		serializeField : function(el) {
			for ( var i = 0; i < this.entries.length; i++) {
				var entry = this.entries[i];
				var key = entry.namingStrategy.getFieldKey(el);
				if (key) {
					var val = entry.inputHandler.serializeField && entry.inputHandler.serializeField(el);
					if (!_.isUndefined(val)) {
						var rtn = {};
						rtn[key] = val;
						return rtn;
					} else {
						return;
					}
				}
			}
		},

		serialize : function(root, attr) {
			attr = attr || {};
			_.each(this.entries, function(entry) {
				var elements = entry.namingStrategy.getElements(root);
				for ( var name in elements) {
					var _elements = elements[name];
					entry.inputHandler.serialize(name, _elements, attr);
				}
			});
			return attr;
		},

		synchronizeDOM : function(root, model) {
			if (model instanceof Backbone.Model) {
				model = model.attributes;
			}
			_.each(this.entries, function(entry) {
				for ( var key in model) {
					var el = entry.namingStrategy.getElement(key, root);
					entry.inputHandler.setElementValue(key, model[key], $(el));
				}
			});
		}
	});

	/*****************************************************************************
	 * DEFAULT MODEL, COLLECTION SUBVIEW HANDLER
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
			if (!this.options.alias) {
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
			context[this.options.alias || 'collection'] = collection.models;
		}
	});

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
			this._toClean = [];

			if (this.serializer)
				this.serializer = Blocks.Defaults.serializer;
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
		mergeTemplate : function(path, context, options) {
			try {
				return Blocks.template(path, this, options)(context);
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
		 * Add a widget. Parameters are (selector, widget, options) *or* (widget,
		 * options)
		 * 
		 * A selector must be supplied (can be options.selector). If an alias is
		 * provided, events will be bubbled up.
		 */
		addWidget : function(selector, widget, options) {
			// selector, widget, options *or* widget, options
			if (_.isString(selector)) {
				options = options || {};
				options.selector = selector;
			} else {
				options = widget;
				widget = selector;
				selector = undefined;
			}
			if (!options.selector) {
				throw new Error('A widget must have a selector');
			}
			options.widget = widget;
			this.objectManager.add('widget', options);
			return widget;
		},

		/**
		 * add a sub view. Available overloaded parameter types are (view[,
		 * options]) or (alias, view[, options]) or (options) If the sub-view alias
		 * is 'foo', the view events could contain, for example, { 'foo:render':
		 * 'fooRender' }
		 */
		addView : function() {
			var options = this.viewOptions.apply(this, arguments);
			return this.objectManager.add('view', options);
		},

		viewOptions : function() {
			return populateOptions({
				arguments : arguments,
				type : 'view',
				objectClass : Backbone.View,
				handlerClass : root.Defaults.viewHandlerClass,
				addSelector : true
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
			return this.objectManager.add('collection', options);
		},

		collectionOptions : function() {
			return populateOptions({
				arguments : arguments,
				type : 'collection',
				objectClass : Backbone.Collection,
				handlerClass : Blocks.Defaults.collectionHandlerClass,
				addSelector : true
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
			return this.objectManager.add('model', options);
		},

		modelOptions : function() {
			return populateOptions({
				arguments : arguments,
				type : 'model',
				objectClass : Backbone.Model,
				handlerClass : Blocks.Defaults.modelHandlerClass,
				addSelector : true
			});
		},

		serialize : function(el) {
			return this.serializer.serialize(el || this.$el);
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
			var content = this.mergeTemplate(undefined, this.getContext());
			this.$el.html(content);
			this.trigger('rendered');
			return this;
		},

		exec : function(type, name, args) {
			if (!_.isString(name)) {
				args = name;
				name = type;
				type = undefined;
			}
			return this.objectManager.exec(type, name, args);
		},

		/**
		 * Add a callback that will be executed when the view is destroyed
		 */
		cleanUp : function(callback) {
			this._toClean.push(callback);
		},

		/**
		 * destroy all sub-views and unbind all custom bindings
		 */
		destroy : function() {
			this.trigger('destroying');
			_.each(this._toClean, function(callback) {
				callback && callback();
			});
			this.undelegateEvents();
			this.objectManager.destroy();
			delete this.objectManager;
			this.trigger('destroyed');
			return this;
		},

		/**
		 * Provide additional event delegations. Events without a space will be
		 * considered as binding to events that are triggered from this view. Hash
		 * expanded events are allowed. the following are equivalent: events {
		 * 'foo:bar': 'abc', foo: { bar: 'abc' } }
		 */
		delegateEvents : function(events) {
			events = flatten(_.defaults(events || {}, _util.getValue(this, 'events')));
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

			var $el = this.$el;
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
	 * PAGE
	 ****************************************************************************/
	/**
	 * The page is a special view that is used to transition to different views.
	 * This is the main dynamic portion of the application. Unless the
	 * secondary=true options is provided, the page will be available as
	 * Blocks.page.
	 */
	root.Page = root.View.extend({

		/**
		 * Init optoins: pageEl: optional sub selector within the page el (otherwise
		 * page el is used) secondary: by default, Blocks.page will be set as this
		 * page *unless* 'secondary' is truthy
		 */
		init : function(options) {
			this.pageEl = options.pageEl ? this.$(options.pageEl) : this.$el;
			if (!options.secondary) {
				root.page = this;
			}
		},

		/**
		 * Transition to a new view. The leaving view will trigger 'leaving' and
		 * 'left' events. The incoming view will trigger the 'transitioning' and
		 * 'transitioned' events.
		 */
		setView : function(view, options) {
			options = options || {};
			if (this.currentView) {
				this.trigger('leaving', this.currentView, options);
				this.currentView.destroy();
				this.trigger('left', this.currentView, options);
			}

			var _success = options.success;
			var success = _.bind(function() {
				_success && _success();
				this.trigger('transitioned', view, options);
				this.currentView = view;
			}, this);
			options.success = success;
			var transition = this.getTransition(this.pageEl, view, this.currentView, options);

			this.trigger('transitioning', view, options);
			view.render();
			transition();
		},

		/**
		 * Return a transition function which will be used to replace the old view
		 * with the new view
		 */
		getTransition : function(root, view, previousView, options) {
			return function() {
				root.html('');
				root.append(view.$el);
				options.success();
				window.scrollTo(0, 0);
			};
		},

		render : function() {
		}
	});

	/*****************************************************************************
	 * ROUTER
	 ****************************************************************************/

	root.Router = Backbone.Router.extend({
		initialize : function(options) {
			this.modules = this.modules || options && options.modules;
			if (this.modules) {
				for ( var name in this.modules) {
					this.addModule(name, this.modules[name]);
				}
			}

			this.init && this.init();
		},

		addModule : function(name, data, options) {
			this.loadedModules = this.loadedModules || {};
			var loader = new root.Defaults.moduleLoaderClass(name, data, options);
			var callback = this.moduleCallback(name, loader);
			_.each(data.routes, _.bind(function(route) {
				this.route(route.replace('*', '*var'), 'module:' + name, callback);
			}, this));
		},

		moduleCallback : function(name, loader) {
			return _.bind(function() {
				if (!this.loadedModules[name]) {
					Blocks.trigger('module:loading', name);
					// loading module for the first time
					var _this = this;
					loader.loadModule({
						success : function() {
							_this.loadedModules[name] = true;
							Backbone.history.loadUrl();
							Blocks.trigger('module:loaded', name);
						},
						error : function(e) {
							Blocks.trigger('module:error', name, e);
						}
					});
				}
			}, this);
		}
	});

	_loader.SimpleLoader = _base.extend({
		setOptions : function(name, data, options) {
			this.name = name;
			this.data = data;
			this.options = options;
			this.loadPrefix = (options && options.loadPrefix) || '';
		},

		loadModule : function(options) {
			var returns = {};
			var _this = this;
			var timeout;
			var success;

			// make sure all script are loaded before truly calling the callback
			var SuccessCallback = function(script) {
				return function() {
					if (!timeout) {
						return;
					}
					var done = true;
					returns[script] = true;
					for ( var i = 0; i < _this.data.scripts.length; i++) {
						if (!returns[_this.data.scripts[i]]) {
							done = false;
							break;
						}
					}
					if (done) {
						clearTimeout(timeout);
						delete timeout;
						success = true;
						options.success();
					}
				};
			};

			// use a timeout to make the error callback if things don't load in time
			timeout = setTimeout(function() {
				if (!success) {
					_this.timeout = true;
					options.error && options.error('timeout');
				}
			}, this.timeout || 10000);

			for ( var i = 0; i < this.data.scripts.length; i++) {
				this.appendScript(this.data.scripts[i], new SuccessCallback(this.data.scripts[i]));
			}
			if (this.data.styles) {
				for ( var i = 0; i < this.data.styles.length; i++) {
					this.appendStyle(this.data.styles[i]);
				}
			}
		},

		appendScript : function(path, callback) {
			var head = this.head || document.getElementsByTagName('head')[0];
			var el = document.createElement('script'), loaded;
			el.onload = el.onerror = el.onreadystatechange = function() {
				if ((el.readyState && !(/^c|loade/.test(el.readyState))) || loaded) {
					return;
				}
				loaded = true;
				el.onload = el.onreadystatechange = null;
				callback();
			};
			el.async = 1;
			el.src = this.loadPrefix + path;
			head.insertBefore(el, head.firstChild);
		},

		appendStyle : function(path) {
			if (document.createStyleSheet) {
				document.createStyleSheet(path);
			} else {
				$("head").append(
								$("<link rel='stylesheet' href='" + this.loadPrefix + path
												+ "' type='text/css' media='screen' />"));
			}
		}
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
			if (options.alias) {
				for ( var i = 0; i < l.length; i++) {
					if (l[i].alias === options.alias) {
						throw new Error('Duplicate alias "' + options.alias + '"');
					}
				}
			}
			if (options.handler === this.parent) {
				throw new Error('Invalid handler - can not be the parent');
			}

			var store = {
				options : options,
				bindings : [],
				alias : options.alias
			};

			// initialize options
			options._data = {
				type : type
			};
			var bindings = store.bindings;
			if (options.handler) {
				options.handler.options = options;
				options.handler[type] = options[type];
			} else {
				// the object itself is the handler (aka: widget)
				options.handler = options[type];
				options.handler.options = _.defaults(options.handler.options || {}, options);
			}
			store.handler = options.handler;

			// provide a cleanup method
			if (!options.handler.cleanUp) {
				options.handler.cleanUp = function(callback) {
					bindings.push(callback);
				};
			}

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
			if (options.fetch) {
				object.fetch(options);
			}
			// initialize and allow auto-binding from the context object to the
			// view
			var initArgs = [ this.parent, object, options ];
			if (this.parent === object || options.handler === object) {
				// special case, if context object is same as parent (mixin)
				// or if handler is the same as the object (widget)
				initArgs = [ this.parent, options ];
			}
			// no need to bind parent event to itself
			if (this.parent !== object && options.alias) {
				options._binder = this.eventProxy(options.alias, object);
			}
			options.handler.init && options.handler.init.apply(options.handler, initArgs);

			// auto-bind all 'event' references from the handler
			var events = flatten(options.handler.events);
			if (events) {
				for (name in events) {
					var method = getMethod(events[name], options.handler);
					bindings.push(this.bindEvent(name, method, object, options.handler, options) || {});
				}
				options._data.bindings = bindings;
			}

			l.push(store);
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
			if (this.parent.$el) {
				// check for element binding
				var parts = event.split(' ');
				if (parts.length > 1) {
					var parent = this.parent;
					var _selector = options.selector ? options.selector + ' ' + parts[1] : parts[1];
					parent.$el.delegate(_selector, parts[0], bound);
					return function() {
						parent.$el.undelegate(parts[1], parts[0], bound);
					};
				}
			}

			target.on(event, bound);

			return function() {
				target.off(event, bound);
				if (loadedCallback) {
					object.off('fetched', loadedCallback);
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
					if (obj.bindings) {
						_.each(obj.bindings, function(binding) {
							binding && binding();
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

	
	/**************************************************************
	 * UTILITY METHODS
	 *************************************************************/
	
	_util.getValue = function(object, prop) {
		if (!(object && object[prop]))
			return null;
		return _.isFunction(object[prop]) ? object[prop]() : object[prop];
	};
	
	
	// PRIVATE CLASSES AND METHODS //
	function EventProxy(alias, context) {
		return function(event) {
			var args = _.toArray(arguments);
			args[0] = alias + ':' + event;
			context.trigger.apply(context, args);
		};
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
				var aliasOrSelector = data.arguments[0];
				var match = aliasOrSelector.match(specialSelectorPattern);
				if (match) {
					// was a selector - don't auto-create an alias
					rtn.selector = aliasOrSelector;
					if (_.isUndefined(rtn.alias))
						rtn.alias = false;
				} else {
					rtn.alias = aliasOrSelector;
					if (data.addSelector) {
						rtn.selector = Blocks.Defaults.selectorGenerator(rtn);
					}
				}
				rtn[data.type] = data.arguments[1];
			} else {
				rtn = data.arguments[0];
			}
		}
		if (!rtn.handler)
			rtn.handler = new data.handlerClass();
		if (_.isUndefined(rtn.alias))
			rtn.alias = data.alias;
		if (data.addSelector && _.isUndefined(rtn.selector))
			rtn.selector = root.Defaults.selectorGenerator(rtn);
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

	function isIn(val, arr) {
		for ( var i = 0; i < arr.length; i++) {
			if (val === arr[i])
				return true;
		}
		return false;
	}

	// setup plugin packages
	_handler.Collection = {};
	_handler.Model = {};
	_handler.View = {};

	root.resetDefaults = function() {
		return root.Defaults = {
			templateEngine : new _template.Underscore(),
			contentProvider: new _content.HashProvider(),
			serializer : new _field.Serializer(),
			moduleLoaderClass: _loader.SimpleLoader,
			objectManagerClass : Blocks.ObjectManager,
			modelHandlerClass : _handler.ModelContextContributor,
			collectionHandlerClass : _handler.CollectionContextContributor,
			viewHandlerClass : _handler.SimpleSubView,
			modelAlias : 'model',
			containerCssClass : 'blk-container',
			selectorGenerator : function(options) {
				return '.' + options.alias;
			},
			autoAddModel : true,
			autoAddCollection : true,
			trueValues : [ 'true', 'on' ],
			falseValues : [ 'false', 'off' ],
		};
	};
	root.resetDefaults();

})(this);
