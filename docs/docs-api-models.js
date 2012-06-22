var modelData = {};
modelData.api = {
	sections: {
		'Plugins': {
			'TemplateEngine': {
				descr: 'Responsible for transforming content into template functions (eg: underscore, jquery, mustache).  Templates can be used in the following ways: <ul>\
					<li>If within a view, use the #{link:Blocks.View#mergeTemplate|View helper method} ```\
var context = {"foo": "bar"};\n\
var content = this.mergeTemplate("my/content/path", context);\n\
this.$(".whatever").html(content);\
```</li><li>Use the #{link:Blocks#template} method</li></ul>\
					<p>Use `Blocks.Defaults.templateEngine` to set a different template engine.  See #{link:Blocks.Template.Handlebars} for example.</p>',
				defaultImpl: 'Blocks.Template.Underscore',
				methods: {
					get: {
						descr: 'Load a template and return a function ready to call with a single context parameter',
						params: [
							{name: 'content', descr: 'the template content'},
							{name: 'options', descr: 'options meaningful to template engine impl'}
						],
						returns: ['function(data)', 'function ready to call with context parameter']
					}
				}
			},
		
			'ContentProvider': {
				descr: 'Responsible for retrieving content which will usually be used as the input for template rendering.  This is a syncronous API.',
				defaultImpl: 'Blocks.Content.HashProvider',
				methods: {
					get: {
						descr: 'return the content as identified by the path',
						params: [
							{name: 'path', descr: 'the content path'},
							{name: 'view', descr: 'the view where the content will be displayed (can be used for impl content location)', optional: true}
						],
						returns: ['string', 'the requested content']
					},
					isValid: {
						descr: 'return a boolean representing whether the given view/path corresponds to a valid template',
						params: [
							{name: 'path', descr: 'the content path'},
							{name: 'view', descr: 'the view where the content will be displayed (can be used for impl content location)', optional: true}
						],
						returns: ['boolean', 'true if the content is valid, false otherwise']
					}
				}
			},
			
			'NamingStrategy': {
				descr: 'To be used with a #{link:Serializer}, used to map DOM elements with an #{link:InputHandler}',
				defaultImpl: 'Blocks.Handler.Field.SimpleNamingStrategy',
				methods: {
					getFieldKey: {
						descr: 'Return the model field key for a DOM element or null if N/A',
						params: [
						    {name: 'element', descr: 'the DOM element'}
						],
						returns: ['string', 'the model field key']
					},
					getElement: {
						descr: 'Return the jquery selector for all elements associated with the field key',
						params: [
						   {name: 'key', descr: 'the model attribute key'},
						   {name: 'root', descr: 'the root jquery selector'}
						],
						returns: ['$element', 'the jquery selector for all field-oriented elements']
					},
					getElements: {
						descr: 'Return an map of elements with key as model field key and value as single element or list of elements. The default strategy will \
							ignore all elements with a data-type attribute (assuming another naming strategy will override).',
						params: [
						   {name: 'root', descr: 'the root jquery selector'}
						],
						returns: ['properties[field key, DOM element array]', 'map of elements to field key']
					}
				}
			},
			
			'InputHandler': {
				descr: 'To be used with a #{link:Serializer}, an input handler is used for serializing and mapping field input values to models or hash objects',
				defaultImpl: 'Blocks.Handler.Field.SimpleInputHandler',
				methods: {
					serializeField: {
						descr: 'Serialize and return a single input field value',
						params: [
						    {name: 'element', descr: 'the DOM element', type: 'element'}
						],
						returns: ['object', 'single field value (usually a string but is not required to be)']
					},
					serialize: {
						descr: 'Serialize the input(s) represented by the element(s) to the attributes map using the provided key',
						params: [
						    {name: 'key', descr: 'the model attributes key'},
						    {name: 'elements', descr: 'array of DOM elements returned by naming strategy for this field', type:'array:element'},
						    {name: 'attr', descr: 'optional attribues hash (will be returned if falsy)', type:'properties'},
						],
						returns: ['properties[field key, model-oriented field value]', 'the serialized field values (equal to attr if passed)']
					},
					setElementValue: {
						descr: 'Set the element(s) value using the provided value',
						params: [
						    {name: 'key', descr: 'the model attributes key'},
						    {name: 'value', descr: 'the value to set', type:'object'},
						    {name: 'el', descr: 'the jquery wrapped element', type:'$element'},
						]
					}
				}
			},
			
			'Serializer': {
				descr: 'Used to synchronize models to DOM and DOM back to models.  The Serializer is actually a manager for sets of #{link:NamingStrategy} and #{link:InputHandler}.\
					The naming strategy is used to select individual fields for an input handler which is actually used to do the DOM / model synchronization.\
					This is generally not used directly as there are helper methods on #{link:Blocks} which use the default serializer.  The default serializer can be set using the\
					`Blocks.Defaults.serializer` value.',
				defaultImpl: 'Blocks.Handler.Field.Serializer',
				methods: {
					add: {
						descr: 'Add a naming #{link:NamingStrategy} and #{link:InputHandler} set.',
						params: [
						    {name: 'data', descr: 'hash containing `namingStrategy` and `inputHandler`', type: 'properties'}
						],
						returns: 'this'
					},
					serializeField: {
						descr: 'Serialize a single field and return the value.  All naming strategies will be queried for the the field and the first one that\
							returns a field name will have their associated input handler return the serialized value.',
						params: [
						    {name: 'el', descr: 'the DOM element to serialize', type:'array:element'}
						],
						returns: ['object', 'whatever value the associated input handler returns which is usually a string']
					},
					serialize: {
						descr: 'Serialize all input fields under the given root.  All naming strategies will be queried for the the field and the first one that\
							returns a field name will have their associated input handler return the serialized value.  Return all serialized values as a hash.',
						params: [
						    {name: 'root', descr: 'the root jquery selector', type:'$element'},
						    {name: 'attr', descr: 'attributes hash to populate', type: 'properties', optional:true}
						],
						returns: ['properties[model field key, model field value]', 'the model attributes']
					},
					synchronizeDOM: {
						descr: 'Synchronize all input fields with the corresponding model attribute values.  Any field that has a naming strategy using #{link:NamingStrategy#getFieldKey}\
							match will have it\'s corresponding input handler set the value using #{link:InputHandler#setElementValue}.',
						params: [
						    {name: 'root', descr: 'the root jquery selector', type:'$element'},
						    {name: 'model', descr: 'the source model to synchronize', type: 'model,properties'}
						]
					},
				}
			},
			
			'ManagedModelHandler': {
				defaultImpl: 'Blocks.Handler.ModelContextContributor',
				descr: 'External class used to perform actions for a view related to a model and within the context of a view.  The `events` property can be used for binding to view events\
					as well as model, DOM and window events.  Each handler will get initialized (#{link:ManagedModelHandler#init}) with the associated view, model and options used when the\
					handler was added (see #{Blocks.View#addModel}).<br><br>There is no single required method but several optional methods depending on the pupose of the handler.<br><br>\
					Methods can be called on handlers using the #{link:Blocks.View#exec} method.<br><br>When the handler is registered with a `selector` option value, an additional property,\
					`$el` property will be set as an instance variable on the handler with the value of the jquery-wrapped element identified by the selector.',
				methods: {
					init: {
						descr: 'Initialize the handler with the associated model and view.  This is called automatically when the handler is registered.',
						params: [
						    {name: 'view', descr: 'The parent view that contains the model', type: 'Blocks.View'},
						    {name: 'model', descr: 'The associated model', type: 'Backbone.Model'},
						    {name: 'options', descr: 'Any additional options used with the #{link:Blocks.View#addModel} call'}
						]
					},
					events: 'This can either be a function which returns a set of Backbone-style events and bindings or the hash structure.\
						<ul><li>Standard events with no space are assumed to refer to the associated model</li>\
						<li>Events prefixed with `!` will cause the associated method to be called when the event fires <strong>and</strong> the model has been fetched</li>\
						<li>Events that start with `parent:` are assumed to refer to the parent view</li>\
						<li>Events that contain whitespace (`event selector`) are assumed to refer to DOM element bindings.  An optional `selector` option must be used in this case to identify the UI focus of this handler</li>\
						<li>Events that start with `$window` are assumed to refer to window bindings.</li></ul>  All bindings are cleaned up automatically (assuming the parent view destroy method is called).',
					destroy: 'Called automatically when the parent view destory method is called',
					parentContext: {
						descr: 'This is called with the default view rendering behavior.  Any handler that wishes to add to the view context can do so here.',
						params: [
						     {name: 'context', descr: 'The context used for the parent view template merge', type: 'properties'}
						]
					},
					synchronize: {
						descr: 'Synchronize all DOM input field data with the associated model.  Return true with no validation issues and false otherwise.',
						params: [
						     {name: 'options', descr: 'Any options used for the set call', optional: true}
						],
						returns: ['boolean', 'true if success, false if validation issues']
					},
					serialize: {
						descr: 'Serialize all input fields to a hash structure.  Unless explicitely needed otherwise, the default serializer should be used for serialization (#{link:Blocks#serialize}).  Return all serialized values as a hash.',
						params: [
						    {name: 'attr', descr: 'attributes hash to populate', type: 'properties'}
						],
						returns: ['properties[model field key, model field value]', 'all model attributes']
					}
				}
			},

			'ManagedCollectionHandler': {
				defaultImpl: 'Blocks.Handler.CollectionContextContributor',
				descr: 'External class used to perform actions for a view related to a collection and within the context of a view.  The `events` property can be used for binding to view events\
					as well as collection, DOM and window events.  Each handler will get initialized (#{link:ManagedCollectionHandler#init}) with the associated view, collection and options used when the\
					handler was added (see #{Blocks.View#addCollection}).<br><br>There is no single required method but several optional methods depending on the pupose of the handler.<br><br>\
					Methods can be called on handlers using the #{link:Blocks.View#exec} method.<br><br>When the handler is registered with a `selector` option value, an additional property,\
					`$el` property will be set as an instance variable on the handler with the value of the jquery-wrapped element identified by the selector.',
				methods: {
					init: {
						descr: 'Initialize the handler with the associated collection and view.  This is called automatically when the handler is registered.',
						params: [
						    {name: 'view', descr: 'The parent view that contains the model', type: 'Blocks.View'},
						    {name: 'collection', descr: 'The associated collection', type: 'Backbone.Collection'},
						    {name: 'options', descr: 'Any additional options used with the #{link:Blocks.View#addCollection} call'}
						]
					},
					events: 'This can either be a function which returns a set of Backbone-style events and bindings or the hash structure.\
						<ul><li>Standard events with no space are assumed to refer to the associated collection</li>\
						<li>Events prefixed with `!` will cause the associated method to be called when the event fires <strong>and</strong> the collection has been fetched</li>\
						<li>Events that start with `parent:` are assumed to refer to the parent view</li>\
						<li>Events that contain whitespace (`event selector`) are assumed to refer to DOM element bindings.  An optional `selector` option must be used in this case to identify the UI focus of this handler</li>\
						<li>Events that start with `$window ` are assumed to refer to window bindings.</li></ul>  All bindings are cleaned up automatically (assuming the parent view destroy method is called).',
					destroy: 'Called automatically when the parent view destory method is called',
					parentContext: {
						descr: 'This is called with the default view rendering behavior.  Any handler that wishes to add to the view context can do so here.',
						params: [
						     {name: 'context', descr: 'The context used for the parent view template merge', type: 'properties'}
						]
					},
					synchronize: {
						descr: 'Synchronize all DOM input field data with the associated model.  Return true with no validation issues and false otherwise.',
						params: [
						     {name: 'options', descr: 'Any options used for the set call', optional: true}
						],
						returns: ['boolean', 'true if success, false if validation issues']
					},
					serialize: {
						descr: 'Serialize all input fields to a hash structure.  Unless explicitely needed otherwise, the default serializer should be used for serialization (#{link:Blocks#serialize}).  Return all serialized values as a hash.',
						params: [
						    {name: 'attr', descr: 'attributes hash to populate', type: 'properties'}
						],
						returns: ['properties[model field key, model field value]', 'all model attributes']
					}
				}
			},

			'ManagedViewHandler': {
				defaultImpl: 'Blocks.Handler.SimpleSubView',
				descr: 'External class used to allow views to contain subviews.  A subview is added using #{link:Blocks.View#addView} with either the default handler or a custom one (as\
					defined by the `handler` option property).  The default handler will be all that is needed in most cases as it will clean up sub views and re-render sub views if\
					parent views are rendered.  Like other managed handlers, the `events` property can be used for binding to view events\
					as well as collection, DOM and window events.  Each handler will get initialized with the associated view, sub view and options used when the\
					handler was added.<br><br>There is no single required method but several optional methods depending on the pupose of the handler.  A subview must always be registered\
					with a `selector` option parameter and will always have an `$el` property set on the handler instance as the jquery-wrapped element identified by the selector.',
				methods: {
					init: {
						descr: 'Initialize the handler with the associated sub view and parent view.  This is called automatically when the handler is registered.',
						params: [
						    {name: 'view', descr: 'The parent view that contains the sub view', type: 'Blocks.View'},
						    {name: 'subView', descr: 'The sub view', type: 'Blocks.View'},
						    {name: 'options', descr: 'Any additional options used with the #{link:Blocks.View#addCollection} call'}
						]
					},
					events: 'This can either be a function which returns a set of Backbone-style events and bindings or the hash structure.\
						<ul><li>Standard events with no space are assumed to refer to the associated collection</li>\
						<li>Events prefixed with `!` will cause the associated method to be called when the event fires <strong>and</strong> the collection has been fetched</li>\
						<li>Events that start with `parent:` are assumed to refer to the parent view</li>\
						<li>Events that contain whitespace (`event selector`) are assumed to refer to DOM element bindings.  An optional `selector` option must be used in this case to identify the UI focus of this handler</li>\
						<li>Events that start with `$window ` are assumed to refer to window bindings.</li></ul>  All bindings are cleaned up automatically (assuming the parent view destroy method is called).',
					destroy: 'Called automatically when the parent view destory method is called'
				}
			},

			
			
			
			
			/***********************
			 * ABSTRACT / IMPL CLASSES
			 **********************/
			'Blocks.Handlers.Base': {
				descr: 'Base class for handlers or actually any other plugin.  Basically just exposes the Bacbone `extends` method as well as Backbone.Events',
				methods: {
					'setOptions': {
						descr: 'Called on construction with parameters being constructor arguments'
						},
					'extend': {
						descr: 'Static method to be used when creating a subclass.  ```var mySubClass = Blocks.Handlers.Base.extend({ ... });```',
						params: [
							{name: 'properties', descr: 'the subclass prototype properties', type: 'properties'},
						]
					}
				}
			},
			'Blocks.Template.Underscore': {
				descr: 'Template engine using underscore #{extlink:http://underscorejs.org/#template|template} method.<br><br>This is the default template engine to avoid adding additional dependencies.',
				interfaceClass: 'TemplateEngine'
			},
			'Blocks.Template.Handlebars': {
				descr: 'Template engine which uses #{extlink:http://handlebarsjs.com|Handlebars}.  To use this, you must<ul>\
					<li>Include #{extlink:http://cloud.github.com/downloads/wycats/handlebars.js/handlebars-1.0.0.beta.6.js|handlebars.js}</li>\
					<li>Include the following code ```Blocks.Defaults.templateEngine = new Blocks.Template.Handlebars();```</li></ul>',
				interfaceClass: 'TemplateEngine'
			},
			'Blocks.Content.HashProvider': {
				descr: 'Template engine which uses #{extlink:http://handlebarsjs.com|Handlebars}.  To use this, you must<ul>\
					<li>Include #{extlink:http://cloud.github.com/downloads/wycats/handlebars.js/handlebars-1.0.0.beta.6.js|handlebars.js}</li>\
					<li>Include the following code ```Blocks.Defaults.templateEngine = new Blocks.Template.Handlebars();```</li></ul>',
				interfaceClass: 'TemplateEngine'
			},
			
			
			
			
			
			
			
			
			
/*
			'Blocks.ObjectManager': {
				desr: 'Contains all logic for "managed objects".  A managed object is just an object with the following properties described #{link:Blocks.ManagedObjectHandler|here}.  Each managed object "watches" a parent object by using event bindings and does action based on those changes.  Pages uses these object to handle different data structures within views like sub-views, models and collections.  A special case of this is also a view mixin.',
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
						descr: 'return all managed objects of a given type and call #{link:Blocks.ManagedObjectHandler#destroy|destroy} on each one',
						params: [
							{name: 'type', descr: 'object type identifier'}
						],
						returns: 'list'
					},
					remove: {
						descr: 'return a managed object and call #{link:Blocks.ManagedObjectHandler#destroy|destroy}',
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
							{name: 'options', descr: 'object data <dl> <dt>alias</dt><dd>the object alias (unique by type)</dd> <dt>{type key}</dt><dd>the managed object</dd> <dt>handler</dt><dd>the #{link:Blocks.ObjectHandler|object handler}</dd> <dt>selector</dt><dd>the element selector where appropriate</dd> </dl> And any othe properties that are meaningful to the #{link:Blocks.ManagedObjectHandler|object handler}.', type:'properties'}
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
*/
			
			

		},
		
		'View Models': {
			'Blocks.Handlers.ViewTemplate': {
				mh: true,
				defaultImpl: true,
				descr: 'Simple model handler just exposes a <em>parentContext</em> method to contribute to a context for a template.  The default implementation of the #{Blocks.View#getContext} will execute the parentContext method on all managed objects',
				methods: {
					'context': {
						descr: 'if this alias is the default alias (so most likely is used without any other applied models), will add model attributes directly, otherwise will add model attributes to context using alias as the key'
						}
				}
			}
		},
		
		'View Collections': {
			'Backbone.CollectionHandlers.TemplateBound': {
				mh: true,
				defaultImpl: true,

				descr: 'Handler that will render a collection using templates.  There are several diffrent template used (all prefixed with "{view.template or view.name}/{alias or \'items\'}-"): <dl> <dt>item</dt><dd>template used to render a single item</dd>\
						<dl> <dt>empty</dt><dd>template used if there are no items to display</dd>\
						<dl> <dt>loading</dt><dd>template used if the model data is currently being fetched (will default to empty)</dd> </dl>.\
<pre class="code">\
// view templates with alias of "foo" and view template property "myview" and no package (assuming the default #{link:Blocks.ContentProvider|content provider}\
Blocks.Templates.myview = {\
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

			'Blocks.View': {
				descr: 'Enhanced View class which provided support for managed objects and more powerful event binding.',
				properties: {
					templateEngine: 'A reference to the default #{link:Blocks.TemplateEngine|template engine}',
					contentProvider: 'A reference to the default #{link:Blocks.ContentProvider|content provider}',
					objectManager: 'Instance property for the the#{link:Blocks.ObjectManager|object manager}' 
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
						descr: 'Add a mixin.  The mixin is basically a #{link:Blocks.ManagedObjectHandler|managed object handler} except that the managed object is the view iteslf.  Whereas normal handlers have a reference to a parent (the view) and a context object, this only has a reference to the view.  The mixin initialize method has only 2 parameters (view, options)',
						params: [
							{name: 'mixin', desc: 'the mixin', type: '{Blocks.ManagedObjectHandler}'},
							{name: 'options', desc: 'options applicable to the mixin'}
						]
					},

					'addView': {
						descr: 'Add a managed sub-view.  The sub-view will be rendered any time the parent view is rendered and will be destroyed when the parent is destroyed.  The options.selector value is used to locate the sub-view location in the DOM.  The selector will be defaulted if it doesn\'t exist using #{link:Blocks.Defaults.selectorGenerator} (by default ".{alias}".  By default, the #{link:Blocks.Defaults.viewHandlerClass} handler will be used but an override can be supplied using the <em>handler</em> option.',
						params: {
							'option 1': [
								{name: 'view', desc: 'view instance', type: '{Blocks.View}'},
								{name: 'options', desc: 'options hash (at least alias or selector is required)', type: 'properties'},
							],
							'option 2': [
								{name: 'alias', desc: 'alias'},
								{name: 'view', desc: 'view instance', type: '{Blocks.View}'},
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
						descr: 'Add a managed collection.  The actual implementation is up to the #{link:Blocks.ManagedObjectHandler|handler} but the default impl is #{link:Backbone.CollectionHandlers.TemplateBound}.  The <em>options.selector</em> option value will be defaulted if it doesn\'t exist using #{link:Blocks.Defaults.selectorGenerator} (by default ".{alias}".  The <em>handler</em> option value can be used to override the default managed object handler impl.',
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
						descr: 'Add a managed model.  The actual implementation is up to the #{link:Blocks.ManagedObjectHandler|handler} but the default impl is #{link:Blocks.Handlers.ViewTemplate}.  The <em>options.selector</em> option value will be defaulted if it doesn\'t exist using #{link:Blocks.Defaults.selectorGenerator} (by default ".{alias}".  The <em>handler</em> option value can be used to override the default managed object handler impl.',
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
						descr: 'Render this view by calling #{link:Blocks.View.execTemplate} using #{link:Blocks.View.getTemplatePath} and #{link:Blocks.View.getContext}.  #{link:Blocks.ManagedObjectHandler|managed object handlers} should use the "parent:rendered" event name to make UI changes after the view has been rendered (ex: events: {\'parent:rendered\': \'myRenderMethod\'}',
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
	modelAlias: 'the default alias used for registering a model #{link:Blocks.ManagedObjectHandler|object handler}',
	collectionAlias: 'the default alias used for registering a collection #{link:Blocks.ManagedObjectHandler|object handler}',
	viewAlias: 'the default alias used for registering a sub-view #{link:Blocks.ManagedObjectHandler|object handler}',
	collectionContainerClass: 'the default element class that will be applied to the collection content root',
	subviewContainerClass: 'the default element class that will be applied to the sub-view content root',
	modelContainerClass: 'the default element class that will be applied to the model content root',
	eventWatch: {descr: 'should, by default, registered #{link:Blocks.ManagedObjectHandler|object handlers} bubble their events to the parent (view) using the alias as a prefix', type: 'boolean'},
	selectorGenerator: 'function use to take options from #{link:Blocks.View#addView}, #{link:Blocks.View#addCollection}, and #{link:Blocks.View#addModel} and return the root element selector'
}

plugins = {
}

// normalize the data
// copy all entries of a hash structury and set a specific property with the key
function convertIndexedToList(root, parentKey, childKey, stringValKey) {
	var rootList = [];
	for (var prop in root) {
		var rootItem = root[prop];
		if (_.isString(rootItem) && stringValKey) {
			var _rootItem = {};
			_rootItem[stringValKey] = rootItem;
			rootItem = _rootItem;
		}
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
		clazz.methods = convertIndexedToList(clazz.methods, 'name', undefined, 'descr');
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

/** CLASS DEFINITIONS * */
var models = {}, collections = {};
models.Base = Backbone.Model.extend({
	fetch: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      this.set(this.parse(JSON.parse(JSON.stringify(this.data))));
      options.success && options.success(this);
	}
});
collections.Base = Backbone.Collection.extend({
	fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === undefined) options.parse = true;
      var collection = this;
      var success = options.success;
      this.reset(this.parse(data = JSON.parse(JSON.stringify(this.data))), {parse: true});
      options.success && options.success(this);
	}
});

/** MODELS * */
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
		
		if (data.returns) {
			if (_.isArray(data.returns)) {
				data.returns = {
						type: data.returns[0],
						descr: data.returns[1]
				};
			} else {
				data.returns = {
						type: data.returns
				};
			}
		}

		return data;
	}
});

models.Property = models.Base.extend({
});

models.Parameter = models.Base.extend({
});


/** COLLECTIONS * */
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
console.log(data);