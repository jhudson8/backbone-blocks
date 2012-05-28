var Pages = {};

(function() {
// Cached regex to split keys for `delegate`.
var delegateEventSplitter = /^(\S+)\s*(.*)$/;
var singlePartPattern = /^[^s]*$/;

Pages.Template = {
	Underscore: {
		load: function(content) {
			return function(data) {
				return _.template(content, data);
			}
		}
	}
};
Pages.Content = {
	ScriptProvider: function(path) {
		path = path.replace('/', '-') + '-template';
		var el = $('#' + path);
		if (el.size() == 1) {
			return el.html();
		} else {
			throw new Error('Undefined template "' + path + '"');
		}
	}
};

Pages.CollectionHandlers = {};
var DefaultCollectionHandler = Pages.CollectionHandlers.Default = function() {}
_.extend(DefaultCollectionHandler.prototype, {

	init: function(options, view, collection) {
		this.options = options;
		this.view = view;
		this.collection = collection;
		this.subViews = {};
	},

	render: function() {
		var el = this.el = this.view.$el.find(this.options.selector);
		if (el.size() != 1) {
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
			this.onEmpty();
		}
	},

	onAdd: function(model) {
		if (this.wasEmpty) {
			return this.render();
		}

		var viewFunctions = ['collectionItem'];
		if (this.options.alias) viewFunctions.splice(0, 0, this.options.alias + 'Item');
		var fc = this.getFunctionAndContext(viewFunctions, this.onItem);
		var data = fc.func.call(fc.context, model, this.options);
		
		var itemEl;		
		if (data instanceof Backbone.View) {
			data.render();
			itemEl = data.el;
			this.subViews[model.id] = data;
		} else {
			itemEl = $(this.itemContainer(model));
			itemEl.append(data);
		}
		itemEl.attr('data-view', model.id);
		this.el.append(itemEl);
	},

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

	onReset: function() {
		this.render.call(this);
	},

	// non-API methods are below
	onEmpty: function() {
		this.wasEmpty = true;
		this.el.html(this.view.getTemplate(this.getPath() + '-empty'));
	},

	context: function(model) {
		return model.attributes;
	},

	onItem: function(model) {
		return this.view.getTemplate(this.getPath(model), this.context(model));
	},

	itemContainer: function(model) {
		return this.view.make('div');
	},

	getPath: function(model) {
		var prefix = (this.view.template || this.view.name) + '-' + (this.options.alias || 'collection');
		if (model) {
			return prefix + '-item';
		} else {
			return prefix;
		}
	},

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

Pages.View = Backbone.View.extend({

	initialize: function() {
		this._delegatedViewEvents = {};

		this.subViews = [];
		this.collections = [];

		// set some defaults
		this.templateLoader = this.templateLoader || Pages.Template.Underscore;
		this.contentLoader = this.contentLoader || Pages.Content.ScriptProvider;
	},

	render: function() {
		var content = this.getTemplate(this.getPath(), this.getContext());
		this.$el.html(content);
		this.renderSubViews();
		this.renderCollections();
		this.trigger('rendered');
		return this;
	},

	getPath: function() {
		return this.template || this.name;
	},

	getTemplate: function(path, context, options) {
		try {
			var content = this.getContent(path);
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

	getContent: function(path) {
		return this.contentLoader(path);
	},

	getContext: function() {
		return _.extend({}, this, this.model && this.model.attributes);
	},

	renderCollections: function() {
		_.each(this.collections, _.bind(function(collectionData) {
			collectionData.handler.render();
		}, this));
	},

	renderSubViews: function() {
		_.each(this.subViews, _.bind(function(viewData) {
			var el = this.$el.find(viewData.selector);
			if (el.size() != 1) {
				throw new Error('non-unique or non-existing sub-view container element "' + viewData.selector + '"');
			}
			if (el.children().size() == 0) {
				// we're good here
			} else if (el.children.size() == 1) {
				// assume we are re-rendering
				el.children.ad(0).remove();
			} else {
				throw new Error('view container element is must be empty');
			}
			viewData.view.render();
			el.append(viewData.view.el);
		}, this));
		return this;
	},

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

	subViewCall: function(name) {
		var args = _.toArray(arguments);
		args.splice(0, 1);
		_.each(this.subViews, function(viewData) {
			viewData.view[name].apply(args);
		});
		return this;
	},

	eventProxy: function(alias, object) {
		object.bind('all', new EventProxy(alias, this));
		return this;
	},

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

})();
