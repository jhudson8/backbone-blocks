var modelData = {};
modelData.api = {
	sections: {
		'Plugins': {
		
			'Pages.TemplateEngine': {
				descr: ' #{link:Pages.View#addView} Responsible for rendering templates (eg: underscore, jquery, mustache).  It would be up to the template engine impl to do template cacheing.',
				defaultImpl: 'Pages.TemplateEngines.Underscore',
				methods: {
					load: {
						descr: 'Load a template and return a function ready to call with a single context parameter',
						params: [
							{name: 'content', descr: 'the template content'}
						]
					}
				},
				returns: 'object'
			},
		
			'Pages.ContentProvider': {
				descr: 'Responsible for retrieving content which will usually be used as the input for template rendering.  This is a syncronous API.',
				defaultImpl: 'Pages.ContentProviders.HashProvider',
				methods: {
					get: {
						descr: 'return the content as identified by the path',
						params: [
							{name: 'path', descr: 'the content path'},
							{name: 'view', descr: 'the view where the content will be displayed (can be used for impl content location)', optional: true},
							{name: 'suppressErrors', descr: 'boolean indicating if errors should be suppressed.  If they are suppressed, the impl should trigger the <em>error:template</em> with hash containing <em>path</em>, and <em>error</e> values.', type: 'boolean', optional: true, defaultVal: 'false'}
						]
					}
				}
			},
		
			'Pages.ManagedObjectHandler': {
				defaultImpl: [
					{descr: 'View Subview handler see {#Pages.View#addView}', defaultImpl: 'Pages.SubViewHandlers.Default'},
					{descr: 'View Model: see {#Pages.View#addModel}', defaultImpl: 'Pages.ModelHandlers.ViewTemplate'},
					{descr: 'View Collection: see {#Pages.View#addCollection}', defaultmpl: 'Pages.CollectionHandlers.TemplateBound'}
				],
				descr: 'An object responsible for handling events on another object (eg: view, model, collection).  This is how views handle sub-views, collections and models that interact with the UI.',
				methods: {
					events: {
						descr: '(could be hash instead of function).  Just like standard backbone events, a data structure used to auto-bind handler methods to the managed object.  A special "parent:" prefix could be added to bind to the parent object instead of the managed object (ie: the parent view as opposed to the managed view/collection/model)'
					},
					initialize: {
						descr: 'called once at beginning of lifecycle',
						parameters: [
							{name: 'view', descr: 'the parent (ie: the view)', type: 'object'},
							{name: 'object', descr: 'the managed object (ie: the subview/model/collection)', type: 'object'},
							{name: 'options', descr: 'the provided options proxied from {#Pages.ObjectManager#add}', type: 'properties'}
						]
					},
					destroy: {
						descr: 'called once at end of lifecyle'
					}
				}
			},

			'Pages.ObjectManager': {
				desr: 'Contains all logic for "managed objects".  A managed object is just an object with the following properties described #{link:Pages.ManagedObjectHandler|here}.  Each managed object "watches" a parent object by using event bindings and does action based on those changes.  Pages uses these object to handle different data structures within views like sub-views, models and collections.  A special case of this is also a view mixin.',
				methods: {
					get: {
						descr: 'return a single or list of managed objects',
						params: [
							{name: 'type', descr: 'object type identifier'},
							{name: 'obj', descr: 'managed object alias (if this is omitted all objects of the given type will be returned)', optional: true}
						],
						returns: 'object or array'
					},
					getAll: {
						descr: 'return all managed objects of a given type and call #{link:Pages.ManagedObjectHandler#destroy|destroy} on each one',
						params: [
							{name: 'type', descr: 'object type identifier'}
						],
						returns: 'list'
					},
					remove: {
						descr: 'return a managed object and call #{link:Pages.ManagedObjectHandler#destroy|destroy}',
						params: [
							{name: 'type', descr: 'object type identifier'},
							{name: 'alias', descr: 'managed object alias', type:'object'}
						],
						returns: 'boolean'
					},
					add: {
						descr: 'add an object to be managed',
						params: [
							{name: 'type', descr: 'arbitrary type identifier (all aliases of objects with the same type must be unique)'},
							{name: 'options', descr: 'object data <dl> <dt>alias</dt><dd>the object alias (unique by type)</dd> <dt>{key is the first param}</dt><dd>the managed object</dd> <dt>handler</dt><dd>the #{link:Pages.ObjectHandler|object handler}</dd> <dt>selector</dt><dd>the element selector where appropriate</dd> </dl> And any othe properties that are meaningful to the #{link:Pages.ManagedObjectHandler|object handler}.', type:'properties'}
						]
					},
					exec: {
						descr: 'execute a specific function on all managed objects',
						params: [
							{name: 'type', descr: 'object type identifier (used to limit to a specific type)', optional:true},
							{name: 'fName', descr: 'the method name'},
							{name: 'args', descr: 'method arguments', optional:true, type:'array'}
						]
					},
					destroy: {
						descr: 'destroy this object manager (and all object handlers).  This will <em>not</em> destroy the objects that the handlers are watching (ie: model/collection/view) and is up to hander impls to do that.'
					}			
				}
			},

			'Pages.ModelHandlers.BaseElementHandler': {
				mh: true,
				descr: 'Abstract method set useful for plugin classes which deal with UI contributions.  These methods assume that the <em>selector</em> property is set in the options',
				methods: {
					'getElement': {
						descr: 'returns the element as defined by <em>options.selector</em> (see #{link:Pages.ManagedObjectHandler#initialize}).  Note: the element must not have any inner content or an error will be thrown'
						},
					'elBind': {
						descr: 'bind the provided function (or function represented by name) to the element',
						params: [
							{name: 'event', descr: 'the event name (eg: change)'},
							{name: 'selector', descr: 'the selector (if nested within options.el selector)', optional: true},
							{name: 'fName', descr: 'the function name or actual function.  The function will be bound to the handler.', type: 'string or function'}
						]
					}
				}
			}
		},
		
		'View Models': {
			'Pages.ModelHandlers.ViewTemplate': {
				mh: true,
				defaultImpl: true,
				descr: 'Simple model handler just exposes a <em>parentContext</em> method to contribute to a context for a template.  The default implementation of the #{Pages.View#getContext} will execute the parentContext method on all managed objects',
				methods: {
					'context': {
						descr: 'if this alias is the default alias (so most likely is used without any other applied models), will add model attributes directly, otherwise will add model attributes to context using alias as the key'
						}
				}
			}
		},
		
		'View Collections': {
			'Pages.CollectionHandlers.TemplateBound': {
				mh: true,
				defaultImpl: true,

				descr: 'Handler that will render a collection using templates.  There are several diffrent template used (all prefixed with "{view.template or view.name}/{alias or \'items\'}-"): <dl> <dt>item</dt><dd>template used to render a single item</dd>\
						<dl> <dt>empty</dt><dd>template used if there are no items to display</dd>\
						<dl> <dt>loading</dt><dd>template used if the model data is currently being fetched (will default to empty)</dd> </dl>.\
<pre class="code">\
// view templates with alias of "foo" and view template property "myview" and no package (assuming the default #{link:Pages.ContentProvider|content provider}\
Pages.Templates.myview = {\
	\'foo-item\': \'item template contents\',\
	\'foo-empty\': \'empty template contents\',\
	\'foo-loading\': \'loading template contents\'\
}\
</pre>\
						The item template can additionally be replaced with a full view: see the <em>onAdd</em> details.',

				methods: {
					'render': {
						descr: 'bound to <em>parent:render</em>; Main method for collection display.  This will render the appropriate template'
					},
					'onAdd': {
						descr: 'bound to <em>add</em>; Will insert into the DOM the item template contents or element of a view instance.  By default the template will be used but the view can implement the <em>{alias}Item</em> (ex: fooItem: function(model) {...}) to return a view instead.'
					},
					'onRemove': {
						descr: 'bound to <em>remove</em>; Will remove the appropriate entry from the DOM or, if the new collection size is 0, will call render'
					},
					'onReset': {
						descr: 'bound to <em>reset</em>; Will simply call render'
					},
					'onEmpty': {
						descr: 'Will be called when the collection is empty (default behavior is to render {alias}-empty'
					},
					'onLoading': {
						descr: 'Will be called when the collection is currently being fetched (default behavior is to render {alias}-loading'
					},
					'context': {
						descr: 'Return the context used for template processing',
						params: [
							{name: 'model', descr: 'the item model model', optional: true}
						]
					},
					'itemTemplateContainer': {
						descr: 'Return the new element that will contain the template contents (if an item template is used instead of a view)'
					},
					'getTemplatePath': {
						descr: 'Return the template path prefix for retrieving content (default is "{view.prefix (optionsl)}/{view.template or view.name}/{alias}-")',
						params: [
							{name: 'model', descr: 'the item model model', optional: true}
						]
					}
				}
			}
		},
		
		'Backbone Overrides / Replacements': {
			'Backbone.Model': {
				descr: 'A couple methods were directly added to Backbone.Model so we could rely on their existance.',
				methods: {
					'isFetching': {
						descr: 'Return true if the model data is currently being fetched'
					},
					'isPopulated': {
						descr: 'Return true if the model data has been populated'
					}
				}
			},
			'Backbone.Collection': {
				descr: 'A couple methods were directly added to Backbone.Collection so we could rely on their existance.',
				methods: {
					'isFetching': {
						descr: 'Return true if the model data is currently being fetched'
					},
					'isPopulated': {
						descr: 'Return true if the model data has been populated'
					}
				}
			},

			'Pages.View': {
				descr: 'Enhanced View class which provided support for managed objects and more powerful event binding.',
				properties: {
					templateEngine: 'A reference to the default #{link:Pages.TemplateEngine|template engine}',
					contentProvider: 'A reference to the default #{link:Pages.ContentProvider|content provider}',
					objectManager: 'Instance property for the the#{link:Pages.ObjectManager|object manager}' 
				},
				methods: {
					'getTemplatePath': {
						descr: 'Return the template path used for getting view content'
					},

					'execTemplate': {
						descr: 'Execute the template using the provided context and return the merged content',
						params: [
							{name: 'path', descr: 'the template path'},
							{name: 'context', descr: 'the template context'},
							{name: 'options', descr: 'template processing options.  <em>suppressError</em> will suppress any error thrown and trigger a <em>template:error</em> event instead'}
						]
					},

					'getContext': {
						descr: 'return the data context for template processing'
					},

					'mixin': {
						descr: 'Add a mixin.  The mixin is basically a #{link:Pages.ManagedObjectHandler|managed object handler} except that the managed object is the view iteslf.  Whereas normal handlers have a reference to a parent (the view) and a context object, this only has a reference to the view.  The mixin initialize method has only 2 parameters (view, options)',
						params: [
							{name: 'mixin', desc: 'the mixin', type: '{Pages.ManagedObjectHandler}'},
							{name: 'options', desc: 'options applicable to the mixin'}
						]
					},

					'addView': {
						descr: 'Add a managed sub-view.  The sub-view will be rendered any time the parent view is rendered and will be destroyed when the parent is destroyed.  The options.selector value is used to locate the sub-view location in the DOM.  The selector will be defaulted if it doesn\'t exist using #{link:Pages.Defaults.selectorGenerator} (by default ".{alias}".  By default, the #{link:Pages.Defaults.viewHandlerClass} handler will be used but an override can be supplied using the <em>handler</em> option.',
						params: {
							'option 1': [
								{name: 'view', desc: 'view instance', type: '{Pages.View}'},
								{name: 'options', desc: 'options hash (at least alias or selector is required)', type: 'properties'},
							],
							'option 2': [
								{name: 'alias', desc: 'alias'},
								{name: 'view', desc: 'view instance', type: '{Pages.View}'},
								{name: 'options', desc: 'options hash', type: 'properties'},
							],
							'option 3': [
								{name: 'options', desc: 'options hash; known property names are <em>view, handler, alias, selector</em>', type: 'properties'},
							],
						}
					},

					'viewOptions': {
						descr: 'Override point for creating or initializing the default vew options.  Parameters are <em>arguments</em> from addView call.'
						}
					},
					
					'addCollection': {
						descr: 'Add a managed collection.  The actual implementation is up to the #{link:Pages.ManagedObjectHandler|handler} but the default impl is #{link:Pages.CollectionHandlers.TemplateBound}.  The <em>options.selector</em> option value will be defaulted if it doesn\'t exist using #{link:Pages.Defaults.selectorGenerator} (by default ".{alias}".  The <em>handler</em> option value can be used to override the default managed object handler impl.',
						params: {
							'option 1': [
								{name: 'collection', desc: 'collection instance', type: '{Backbone.Collection}'},
								{name: 'options', desc: 'options hash (at least alias or selector is required)', type: 'properties'},
							],
							'option 2': [
								{name: 'alias', desc: 'alias'},
								{name: 'collection', desc: 'collection instance', type: '{Backbone.Collection}'},
								{name: 'options', desc: 'options hash', type: 'properties'},
							],
							'option 3': [
								{name: 'options', desc: 'options hash; known property names are <em>collection, handler, alias, selector</em>', type: 'properties'},
							],
						}
					},

					'collectionOptions': {
						descr: 'Override point for creating or initializing the default collection options.  Parameters are <em>arguments</em> from addCollection call.'
					},

					'addModel': {
						descr: 'Add a managed model.  The actual implementation is up to the #{link:Pages.ManagedObjectHandler|handler} but the default impl is #{link:Pages.ModelHandlers.ViewTemplate}.  The <em>options.selector</em> option value will be defaulted if it doesn\'t exist using #{link:Pages.Defaults.selectorGenerator} (by default ".{alias}".  The <em>handler</em> option value can be used to override the default managed object handler impl.',
						params: {
							'option 1': [
								{name: 'model', desc: 'model instance', type: '{Backbone.Model}'},
								{name: 'options', desc: 'options hash (at least alias or selector is required)', type: 'properties'},
							],
							'option 2': [
								{name: 'alias', desc: 'alias'},
								{name: 'model', desc: 'model instance', type: '{Backbone.Model}'},
								{name: 'options', desc: 'options hash', type: 'properties'},
							],
							'option 3': [
								{name: 'options', desc: 'options hash; known property names are <em>collection, handler, alias, selector</em>', type: 'properties'},
							],
						}
					},

					'modelOptions': {
						descr: 'Override point for creating or initializing the default model options.  Parameters are <em>arguments</em> from addModel call.'
					},

					'render': {
						descr: 'Render this view by calling #{link:Pages.View.execTemplate} using #{link:Pages.View.getTemplatePath} and #{link:Pages.View.getContext}.  #{link:Pages.ManagedObjectHandler|managed object handlers} should use the "parent:rendered" event name to make UI changes after the view has been rendered (ex: events: {\'parent:rendered\': \'myRenderMethod\'}',
						triggers: [
							{name: 'rendering', descr: 'Before rendering occurs'},
							{name: 'rendered', descr: 'After rendering occurs'}
						]
					},

					'destroy': {
						descr: 'Destroy this view and all managed objects.  All subclass *must* call this method.',
						triggers: [
							{name: 'destryoing', descr: 'Before destroying occurs'},
							{name: 'destroyed', descr: 'After destroying occurs'}
						]
					},

					'delegateEvents': {
						descr: 'Override of Backbone.View method to add additional functionality.  If the event key has no spaces, it will be treated as a binding to a view event.  Also, a hierarchical has structure may be used.  so, \
<pre class="code">\
events: {\
	foo: {\
		bar1: \'onBar1\',\
		bar2: \'onBar2\',\
	},\
}\
</pre>\
								has the same meaning as\
events: {\
	\'foo:bar1\': \'onBar1\',\
	\'foo:bar2\': \'onBar2\',\
}\
</pre>',
						params: [
							{name: 'events', descr: 'overriding events (default is to use this view events)', optional: true, type: 'properties'}
						]
					},

					'delegateEvent': {
						descr: 'Delete a single event.  The additional view (as opposed to DOM) event binding is implemented here',
						params: [
							{name: 'key', descr: 'the event key'},
							{name: 'method', descr: 'a callback method which will be bound to this view', type: 'function'}
						]
					}
				}
			}
		}
	}

defaults = {
	modelAlias: 'the default alias used for registering a model #{link:Pages.ManagedObjectHandler|object handler}',
	collectionAlias: 'the default alias used for registering a collection #{link:Pages.ManagedObjectHandler|object handler}',
	viewAlias: 'the default alias used for registering a sub-view #{link:Pages.ManagedObjectHandler|object handler}',
	collectionContainerClass: 'the default element class that will be applied to the collection content root',
	subviewContainerClass: 'the default element class that will be applied to the sub-view content root',
	modelContainerClass: 'the default element class that will be applied to the model content root',
	eventWatch: {descr: 'should, by default, registered #{link:Pages.ManagedObjectHandler|object handlers} bubble their events to the parent (view) using the alias as a prefix', type: 'boolean'},
	selectorGenerator: 'function use to take options from #{link:Pages.View#addView}, #{link:Pages.View#addCollection}, and #{link:Pages.View#addModel} and return the root element selector'
}

plugins = {
}

// normalize the data
// copy all entries of a hash structury and set a specific property with the key
function convertIndexedToList(root, parentKey, childKey) {
	var rootList = [];
	for (var prop in root) {
		var rootItem = root[prop];
		if (childKey) {
			var _rootItem = {};
			_rootItem[parentKey] = prop;
			_rootItem[childKey] = rootItem;
			rootList.push(_rootItem);
		} else {
			rootItem[parentKey] = prop;
			rootList.push(rootItem);
		}
	}
	return rootList;
}

modelData.api.sections = convertIndexedToList(modelData.api.sections, 'name', 'classes');
_.each(modelData.api.sections, function(section) {
	section.classes = convertIndexedToList(section.classes, 'name');
	_.each(section.classes, function(clazz) {
		clazz.methods = convertIndexedToList(clazz.methods, 'name');
	});
});
plugins = convertIndexedToList(plugins, 'name');
_.each(plugins, function(clazz) {
	clazz.methods = convertIndexedToList(clazz.methods, 'name');
});
// index
modelData.index = {};
_.each(modelData.api.sections, function(section) {
	_.each(section.classes, function(clazz) {
		modelData.index[clazz.name] = clazz;
	});
});
_.each(plugins, function(clazz) {
	modelData.index[clazz.name] = clazz;
});
for (var name in modelData.index) {
	var clazz = modelData.index[name];
	if (clazz.methods) {
		_.each(clazz.methods, function(method) {
			method.methodClass = clazz.name;
		});
	}
}

/** CLASS DEFINITIONS **/
var models = {}, collections = {};
models.Base = Pages.Model.extend({
	fetch: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      this.set(this.parse(JSON.parse(JSON.stringify(this.data))));
      options.success && options.success(this);
	}
});
collections.Base = Pages.Collection.extend({
	fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === undefined) options.parse = true;
      var collection = this;
      var success = options.success;
      this.reset(this.parse(data = JSON.parse(JSON.stringify(this.data))), {parse: true});
      options.success && options.success(this);
	}
});

/** MODELS **/
models.Section = models.Base.extend({
	parse: function(data) {
		this.classes = new collections.Classes(data.classes, {parse: true});
		delete data.classes;

		return data;
	}
});

models.Class = models.Base.extend({
	parse: function(data) {
		if (data.methods) {
			this.methods = new collections.Methods(data.methods, {parse: true});
		}
		if (data.properties) {
			this.properties = new collections.Properties(data.properties, {parse: true});
		}
		delete data.properties;

		return data;
	}
});

models.Method = models.Base.extend({
	parse: function(data) {
		this.parameters = new collections.Parameters(data.params, {parse: true});
		delete data.parameters;

		return data;
	}
});

models.Property = models.Base.extend({
});

models.Parameter = models.Base.extend({
});


/** COLLECTIONS **/
collections.Sections = collections.Base.extend({
	model: models.Section
});

collections.Classes = collections.Base.extend({
	model: models.Class
});

collections.Methods = collections.Base.extend({
	model: models.Method});

collections.Properties = collections.Base.extend({
	model: models.Property});

collections.Parameters = collections.Base.extend({
	model: models.Parameter});

var data = {};
data.apiSections = new collections.Sections(JSON.parse(JSON.stringify(modelData.api.sections)), {parse: true});
