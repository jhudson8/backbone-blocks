var modelData = {};
modelData.api = {
	sections : {
		'Main Classes' : {
			'Blocks' : {
				descr : 'Root namespace and access point for plugin functionality',
				methods : {
					setPageView : {
						descr : 'Set the current view referenced by the application #{link:Blocks.Page|Page}',
						params : [
								{
									name : 'view',
									descr : 'the #{link:Blocks.View|View} instance',
									type : 'Blocks.View'
								},
								{
									name : 'options',
									descr : 'options supported by the #{link:Blocks.Page|Page}',
									type : 'properties',
									optional : true
								} ],
						returns : [ 'Blocks.View', 'the previous view instance' ]
					},
					getContent : {
						descr : 'Utility method for #{link:ContentProvider#get}',
						params : [
								{
									name : 'path',
									descr : 'the content path',
									optional : true
								},
								{
									name : 'view',
									descr : 'the view related to the content',
									type : 'Blocks.View',
									optional : true
								},
								{
									name : 'options',
									descr : 'additional options specific to content provider.',
									type : 'properties',
									optional : true
								}, ],
						returns : [ 'string', 'the requested content' ]
					},
					isValidContentPath : {
						descr : 'Utility method for #{link:ContentProvider#isValid}',
						params : [
								{
									name : 'path',
									descr : 'the content path',
									optional : true
								},
								{
									name : 'view',
									descr : 'the view related to the content',
									type : 'Blocks.View',
									optional : true
								},
								{
									name : 'options',
									descr : 'additional options specific to content provider.',
									type : 'properties',
									optional : true
								}, ],
						returns : [ 'boolean',
								'true if the content is valid, false otherwise' ]
					},
					template : {
						descr : 'Utility method to retrieve content using the #{link:ContentProvider} and return a template function created by the #{link:TemplateEngine}.\
							<br><br>Unless otherwise specified, the default #{link:ContentProvider} / #{link:TemplateEngine} will be used.  If the `content` option is true then\
							this will assume the first parameter is the actual template content instead of the path used to retrieve the content with the #{link:ContentProvider}.',
						params : [
								{
									name : 'path',
									descr : 'the content path',
									optional : true
								},
								{
									name : 'view',
									descr : 'the view related to the content',
									type : 'Blocks.View',
									optional : true
								},
								{
									name : 'options',
									descr : 'additional options specific to content provider or template engine.  Known options are `contentProvider` and `templateEngine` to use something other than the defaults.',
									type : 'properties',
									optional : true
								}, ],
						returns : [ 'function(data)',
								'function ready to call with context parameter' ]
					},
					i18n : {
						descr : 'Utility method to return a value from the #{link:I18NProvider} provider',
						params : [
								{
									name : 'key',
									descr : 'the i18n key'
								},
								{
									name : 'defaultVal',
									descr : 'the default value'
								},
								{
									name : 'count',
									descr : 'an ordinal value used to identify appropriate i18n value',
									type : 'int'
								}, ],
						returns : [ 'string', 'the requested i18n value' ]
					},
					serializeField : {
						descr : 'Utility method to call #{link:Serializer#serializeField}',
						params : [ {
							name : 'el',
							descr : 'the DOM element to serialize',
							type : 'array:element'
						} ],
						returns : [ 'object',
								'whatever value the associated input handler returns which is usually a string' ]
					},
					serialize : {
						descr : 'Utility method to call #{link:Serializer:serialize}',
						params : [ {
							name : 'root',
							descr : 'the root jquery selector',
							type : '$element'
						}, {
							name : 'attr',
							descr : 'attributes hash to populate',
							type : 'properties',
							optional : true
						} ],
						returns : [
								'properties[model field key, model field value]',
								'the model attributes' ]
					},
					synchronizeDOM : {
						descr : 'Utility method to call #{link:Serializer#synchronizeDOM}',
						params : [ {
							name : 'root',
							descr : 'the root jquery selector',
							type : '$element'
						}, {
							name : 'model',
							descr : 'the source model to synchronize',
							type : 'model,properties'
						} ]
					}
				}
			},
			'Blocks.View' : {
				descr : 'Enhanced View class which provided support for managed objects and more powerful event binding.\
					<br><br>Multiple collections, models, sub-views, #{link:Widget|widgets} and #{link:Mixin|mixins} can be added as managed objects.  When added, the default handler will be used but\
					the defaults can be changed by setting the following values```\
Blocks.Defaults.modelHandlerClass = MyModelHandler;\n\
Blocks.Defaults.collectionHandlerClass = MyCollectionHandler;\n\
Blocks.Defaults.viewHandlerClass = MyViewHandler;```\
					See the view add{Model/Collection/View/Widget} methods for more details but the default behavior is to simply add model/collection attributes to the context for rendering.\
					<br><br>By default, the template retrieved with an undefined path and current view will be retrieved and rendered within this view\'s $el\
					<br><br>These pages also have enhanced events support.  Any managed objects can have their events referencable if they are added with an alias.  In addition, window events\
					can be referenced using $window.  These event bindings will be cleaned up when the view is destroyed.  Here is an example of advanced events usage: ```\
var MyView = Blocks.View.extend({\n\
	viewName: \'myView\',\n\
	viewPackage: \'some.subsection\',\n\
\n\
	events: {\n\
		\'myModel:someEvent\': \'...\', // someEvent event on myModel\n\
		myCollection: { // event parts can be represented in a hierarchy\n\
			event1: \'...\',\n\
			event2: \'...\'\n\
		},\n\
		\'$window resize\': \'...\' // window resize event\n\
		\'$el click\': \'...\'\ // click event on $el \n\
		\'click .foo\': \'...\'\ // click event on .foo within $el \n\
	}\n\
\n\
	init: function(options) {\n\
		// add the "myModel" model using the default managed handler\n\
		this.addModel(\'myModel\', options.myModel);\n\
		// add the "myCollection" model using the default managed handler\n\
		this.addCollection(\'myCollection\', options.myCollection, {handler: new MyCollectionHandler()});\n\
	}\n\
});\n\
```',
				properties : {
					templateEngine : 'A reference to the default #{link:Blocks.TemplateEngine|template engine}',
					contentProvider : 'A reference to the default #{link:Blocks.ContentProvider|content provider}',
					objectManager : 'Instance property for the the#{link:Blocks.ObjectManager|object manager}'
				},
				methods : {
					'init' : {
						descr : 'Initialization method which does not require calling initialize on Blocks.View.',
						params : [ {
							name : 'options',
							descr : 'Arguments that were passed to the constructor'
						} ]
					},
					'mergeTemplate' : {
						descr : 'Execute the template using the provided context and return the merged content',
						params : [ {
							name : 'path',
							descr : 'the template path'
						}, {
							name : 'context',
							descr : 'the template context',
							type : 'properties'
						}, {
							name : 'options',
							descr : 'template processing options',
							type : 'properties'
						} ],
						returns : [ 'string', 'The merged template results' ]
					},

					'getContext' : {
						descr : 'return the data context for template processing',
						returns : [ 'properties', 'The template data context' ]
					},

					'mixin' : {
						descr : 'Add a mixin.  See #{link:Mixin} for more details.',
						params : [ {
							name : 'mixin',
							descr : 'the mixin',
							type : 'Mixin'
						}, {
							name : 'options',
							descr : 'options applicable to the mixin',
							type : 'properties'
						} ],
						returns : [ 'Mixin',
								'The mixin provided with the first parameter' ]
					},

					'addView' : {
						descr : 'Add a managed sub-view.  The sub-view will be rendered any time the parent view is rendered and will be destroyed when the parent is destroyed.\
							<br><br>The options.selector value is used to locate the sub-view location in the DOM.  The selector will be defaulted if it doesn\'t exist using #{link:Blocks.Defaults.selectorGenerator}\
							(by default ".{alias}".\
							<br><br>By default, the #{link:Blocks.Defaults.viewHandlerClass} handler will be used but an override can be supplied using the `handler` option.',
						params : {
							names : [ [ 'view', 'options' ],
									[ 'alias', 'view', 'options' ],
									[ 'options' ] ],
							values : [
									{
										name : 'view',
										descr : 'view instance',
										type : 'Blocks.View'
									},
									{
										name : 'alias',
										descr : 'alias used for event propogation.  the `events` hash can have entries prefixed with `{alias}:` to autobind to view events.  The selector can be determined from the aslias as well.',
										type : 'string'
									},
									{
										name : 'options',
										descr : 'options hash; known property names are `view, handler, alias, selector`',
										type : 'properties'
									} ]
						}
					},

					'viewOptions' : {
						descr : 'Override point for creating or initializing the default vew options.  Parameters are `arguments` from addView call.'
					},

					'addCollection' : {
						descr : 'Add a managed collection.  The actual implementation is up to the #{link:CollectionHandler} but the default impl is #{link:Backbone.Handler.CollectionContextContributor}.  The `options.selector` option value will be defaulted if it doesn\'t exist using #{link:Blocks.Defaults.selectorGenerator} (by default ".{alias}".  The <em>handler</em> option value can be used to override the default managed object handler impl.',
						params : {
							names : [ [ 'collection', 'options' ],
									[ 'alias', 'collection', 'options' ],
									[ 'options' ] ],
							values : [
									{
										name : 'collection',
										descr : 'collection instance',
										type : 'Backbone.Collection'
									},
									{
										name : 'alias',
										descr : 'alias used for event propogation.  the `events` hash can have entries prefixed with `{alias}:` to autobind to view events.  The selector can be determined from the aslias as well.',
										type : 'string'
									},
									{
										name : 'options',
										descr : 'options hash; known property names are `collection, handler, alias, selector`',
										type : 'properties'
									} ]
						}
					},

					'collectionOptions' : {
						descr : 'Override point for creating or initializing the default collection options.  Parameters are `arguments` from addCollection call.'
					},

					'addModel' : {
						descr : 'Add a managed model.  The actual implementation is up to the #{link:Blocks.ManagedObjectHandler|handler} but the default impl is #{link:Blocks.Handlers.ViewTemplate}.  The <em>options.selector</em> option value will be defaulted if it doesn\'t exist using #{link:Blocks.Defaults.selectorGenerator} (by default ".{alias}".  The <em>handler</em> option value can be used to override the default managed object handler impl.',
						params : {
							names : [ [ 'model', 'options' ],
									[ 'alias', 'model', 'options' ],
									[ 'options' ] ],
							values : [
									{
										name : 'model',
										descr : 'model instance',
										type : 'Backbone.Model'
									},
									{
										name : 'alias',
										descr : 'alias used for event propogation.  the `events` hash can have entries prefixed with `{alias}:` to autobind to view events.  The selector can be determined from the aslias as well.',
										type : 'string'
									},
									{
										name : 'options',
										descr : 'options hash; known property names are `model, handler, alias, selector`',
										type : 'properties'
									} ]
						}
					},

					'modelOptions' : {
						descr : 'Override point for creating or initializing the default model options.  Parameters are <em>arguments</em> from addModel call.'
					},

					'render' : {
						descr : 'Render this view by calling #{link:Blocks.View.execTemplate} using #{link:Blocks.View.getTemplatePath} and #{link:Blocks.View.getContext}.  #{link:Blocks.ManagedObjectHandler|managed object handlers} should use the "parent:rendered" event name to make UI changes after the view has been rendered (ex: events: {\'parent:rendered\': \'myRenderMethod\'}',
						triggers : [ {
							name : 'rendering',
							descr : 'Before rendering occurs'
						}, {
							name : 'rendered',
							descr : 'After rendering occurs'
						} ]
					},

					'destroy' : {
						descr : 'Destroy this view and all managed objects.  All subclass *must* call this method.',
						triggers : [ {
							name : 'destryoing',
							descr : 'Before destroying occurs'
						}, {
							name : 'destroyed',
							descr : 'After destroying occurs'
						} ]
					},

					'delegateEvents' : {
						descr : 'Override of Backbone.View method to add additional functionality.  If the event key has no spaces, it will be treated as a binding to a view event.  Also, a hierarchical has structure may be used.  so, \
```\
events: {\n\
	foo: {\n\
		bar1: \'onBar1\',\n\
		bar2: \'onBar2\',\n\
	},\n\
}\n\
```\
								has the same meaning as\
```\
events: {\n\
	\'foo:bar1\': \'onBar1\',\n\
	\'foo:bar2\': \'onBar2\',\n\
}\n\
```',
						params : [ {
							name : 'events',
							descr : 'overriding events (default is to use this view events)',
							optional : true,
							type : 'properties'
						} ]
					},

					'delegateEvent' : {
						descr : 'Delete a single event.  The additional view (as opposed to DOM) event binding is implemented here',
						params : [
								{
									name : 'key',
									descr : 'the event key'
								},
								{
									name : 'method',
									descr : 'a callback method which will be bound to this view',
									type : 'function'
								} ]
					}
				}
			},

			'Blocks.Page' : {
				descr : 'The page is a special view that is used to transition to different views.  This is the main dynamic portion of the application.\
					<br><br>Unless the secondary=true options is provided, the page will be available as #{link:Blocks#page} so just creating a new page instance\
					will make #{link:Blocks#setPageView} available.\
```\
var Page = Blocks.Page.extend({\n\
	el: \'#page\'\n\
});\n\
new Page();\n\
Blocks.setPageView(...);\n\
```',
				methods : {
					'init' : {
						descr : 'Initialization method which does not require calling initialize on Blocks.View.',
						params : [ {
							name : 'options',
							descr : 'Arguments that were passed to the constructor'
						} ]
					},
					'setView' : {
						descr : 'Transition to a new view.<br><br> The leaving view will trigger `leaving` and `left` events. <br><br> The incoming view will trigger the `transitioning` and `transitioned` events.\
							<br><br> This can be called using the #{link:Blocks.setPageView} helper method.',
						params : [
								{
									name : 'view',
									descr : 'The new #{link:Blocks.View|view} to be displayed',
									type : 'Blocks.View'
								},
								{
									name : 'options',
									descr : 'Arguments that were passed to the constructor',
									type : 'properties'
								} ]
					},
					'getTransition' : {
						descr : 'Return a transition function which will be used to replace the old view with the new view.  The default implementation will simply rewrite the page $el with the new view $el content.\
							<br><br> Once the transition is complete, the options.success method must be called.',
						params : [
								{
									name : 'root',
									descr : 'The page $el',
									type : '$element'
								},
								{
									name : 'view',
									descr : 'The new #{link:Blocks.View|view} to be displayed',
									type : 'Blocks.View'
								},
								{
									name : 'previousView',
									descr : 'The previous #{link:Blocks.View|view} to be replaced',
									type : 'Blocks.View'
								},
								{
									name : 'options',
									descr : 'Transition options.  The `success` callback function must be called when the transition is complete',
									type : 'properties'
								} ]
					},
				}
			},

			'Blocks.Router' : {
				descr : 'This is an enhanced version of the standard Backbone.Router.  A Blocks.Router allows lazy loading of application functionality known as modules.\
					<br><br>Each module Will have it\'s own Blocks.Router along with associate javascript and css resources.  The loading of these resources can be plugged\
					in using the #{link:ModuleLoader}.  The base Blocks.Router must define a `modules` property which contains a `scripts` array and `styles` array.  These\
					resources will be dynamically loaded using the #{link:ModuleLoader}.\
					<br><br>A `routes` property must be supplied to define the list of routes that should cause the loading of the additional module.\
					<br><br>Standard routes can be applied like normal to the base module as well.\
					```\
var BaseRouter = Blocks.Router.extend({\n\
	modules: {\n\
		// \'admin\' is an arbitrary module name\n\
		admin: {\n\
			routes: [\n\
			    \'admin\',\n\
			    \'admin/*\'\n\
			],\n\
			scripts: [\n\
			    \'admin/base.js\',\n\
			    \'admin/somethingelse.js\',\n\
			],\n\
			styles: [\n\
			    \'admin/style.css\'\n\
			]\n\
		},\n\
		// some other module definition\n\
		foo: {\n\
			...\n\
		}\n\
	},\n\
\n\
	routes: {\n\
		// standard Backbone.Router route definitions\n\
	}\n\
});\n\
new BaseRouter();\
```',
				methods : {
					'init' : {
						descr : 'Initialization method which does not require calling initialize on Blocks.Router.',
						params : [ {
							name : 'options',
							descr : 'Arguments that were passed to the constructor'
						} ]
					},
					'addModule' : {
						descr : 'Add an additional module (called for each module definition)',
						params : [
								{
									name : 'name',
									descr : 'arbitrary module name'
								},
								{
									name : 'data',
									descr : 'hash containing `routes`, `scripts` and `styles`',
									type : 'properties'
								}, {
									name : 'options',
									descr : 'Router constructor options',
									type : 'properties'
								} ],
						returns : 'this'
					},
					'moduleCallback' : {
						descr : 'Method used to create the route callback.  This function will use a #{link:ModuleLoader} to load all associated module resources.\
							<br><br>After all resources are loaded, the route shoud be navigated to again so the module router will provide a response.\
							<br><br>This will trigger (on #{link:Blocks}) `module:loading` when a new module is being loaded and `module:loaded` when all associated module resources are loaded.\
							<br><br>If any error occured, `module:error is triggered with the associated error.',
						params : [ {
							name : 'name',
							descr : 'the module name'
						}, {
							name : 'loader',
							descr : 'the module loader',
							type : 'ModuleLoader'
						} ],
						returns : 'callback function'
					},
				}
			},

			'Backbone.Model' : {
				descr : 'A couple methods were directly added to Backbone.Model so we could rely on their existance.',
				methods : {
					'isFetching' : {
						descr : 'Return true if the model data is currently being fetched'
					},
					'isPopulated' : {
						descr : 'Return true if the model data has been populated'
					}
				}
			},
			'Backbone.Collection' : {
				descr : 'A couple methods were directly added to Backbone.Collection so we could rely on their existance.',
				methods : {
					'isFetching' : {
						descr : 'Return true if the model data is currently being fetched'
					},
					'isPopulated' : {
						descr : 'Return true if the model data has been populated'
					}
				}
			}
		},

		'Interfaces' : {
			'TemplateEngine' : {
				descr : 'Responsible for transforming content into template functions (eg: underscore, jquery, mustache).  Templates can be used in the following ways: <ul>\
					<li>If within a view, use the #{link:Blocks.View#mergeTemplate|View helper method} ```\
var context = {"foo": "bar"};\n\
var content = this.mergeTemplate("my/content/path", context);\n\
this.$(".whatever").html(content);\
```</li><li>Use the #{link:Blocks#template} method</li></ul>\
					<p>Use `Blocks.Defaults.templateEngine` to set a different template engine.  See #{link:Blocks.Template.Handlebars} for example.</p>',
				defaultImpl : 'Blocks.Template.Underscore',
				methods : {
					get : {
						descr : 'Load a template and return a function ready to call with a single context parameter',
						params : [
								{
									name : 'content',
									descr : 'the template content'
								},
								{
									name : 'options',
									descr : 'options meaningful to template engine impl'
								} ],
						returns : [ 'function(data)',
								'function ready to call with context parameter' ]
					}
				}
			},

			'ContentProvider' : {
				descr : 'Responsible for retrieving content which will usually be used as the input for template rendering.  This is a syncronous API.',
				defaultImpl : 'Blocks.Content.HashProvider',
				methods : {
					get : {
						descr : 'return the content as identified by the path',
						params : [
								{
									name : 'path',
									descr : 'the content path'
								},
								{
									name : 'view',
									descr : 'the view where the content will be displayed (can be used for impl content location)',
									optional : true
								} ],
						returns : [ 'string', 'the requested content' ]
					},
					isValid : {
						descr : 'return a boolean representing whether the given view/path corresponds to a valid template',
						params : [
								{
									name : 'path',
									descr : 'the content path'
								},
								{
									name : 'view',
									descr : 'the view where the content will be displayed (can be used for impl content location)',
									optional : true
								} ],
						returns : [ 'boolean',
								'true if the content is valid, false otherwise' ]
					}
				}
			},

			'NamingStrategy' : {
				descr : 'To be used with a #{link:Serializer}, used to map DOM elements with an #{link:InputHandler}',
				defaultImpl : 'Blocks.Handler.Field.SimpleNamingStrategy',
				methods : {
					getFieldKey : {
						descr : 'Return the model field key for a DOM element or null if N/A',
						params : [ {
							name : 'element',
							descr : 'the DOM element'
						} ],
						returns : [ 'string', 'the model field key' ]
					},
					getElement : {
						descr : 'Return the jquery selector for all elements associated with the field key',
						params : [ {
							name : 'key',
							descr : 'the model attribute key'
						}, {
							name : 'root',
							descr : 'the root jquery selector'
						} ],
						returns : [ '$element',
								'the jquery selector for all field-oriented elements' ]
					},
					getElements : {
						descr : 'Return an map of elements with key as model field key and value as single element or list of elements. The default strategy will \
							ignore all elements with a data-type attribute (assuming another naming strategy will override).',
						params : [ {
							name : 'root',
							descr : 'the root jquery selector'
						} ],
						returns : [ 'properties[field key, DOM element array]',
								'map of elements to field key' ]
					}
				}
			},

			'InputHandler' : {
				descr : 'To be used with a #{link:Serializer}, an input handler is used for serializing and mapping field input values to models or hash objects',
				defaultImpl : 'Blocks.Handler.Field.SimpleInputHandler',
				methods : {
					serializeField : {
						descr : 'Serialize and return a single input field value',
						params : [ {
							name : 'element',
							descr : 'the DOM element',
							type : 'element'
						} ],
						returns : [ 'object',
								'single field value (usually a string but is not required to be)' ]
					},
					serialize : {
						descr : 'Serialize the input(s) represented by the element(s) to the attributes map using the provided key',
						params : [
								{
									name : 'key',
									descr : 'the model attributes key'
								},
								{
									name : 'elements',
									descr : 'array of DOM elements returned by naming strategy for this field',
									type : 'array:element'
								},
								{
									name : 'attr',
									descr : 'optional attribues hash (will be returned if falsy)',
									type : 'properties'
								}, ],
						returns : [
								'properties[field key, model-oriented field value]',
								'the serialized field values (equal to attr if passed)' ]
					},
					setElementValue : {
						descr : 'Set the element(s) value using the provided value',
						params : [ {
							name : 'key',
							descr : 'the model attributes key'
						}, {
							name : 'value',
							descr : 'the value to set',
							type : 'object'
						}, {
							name : 'el',
							descr : 'the jquery wrapped element',
							type : '$element'
						}, ]
					}
				}
			},

			'Serializer' : {
				descr : 'Used to synchronize models to DOM and DOM back to models.  The Serializer is actually a manager for sets of #{link:NamingStrategy} and #{link:InputHandler}.\
					The naming strategy is used to select individual fields for an input handler which is actually used to do the DOM / model synchronization.\
					This is generally not used directly as there are helper methods on #{link:Blocks} which use the default serializer.  The default serializer can be set using the\
					`Blocks.Defaults.serializer` value.',
				defaultImpl : 'Blocks.Handler.Field.Serializer',
				methods : {
					add : {
						descr : 'Add a naming #{link:NamingStrategy} and #{link:InputHandler} set.',
						params : [ {
							name : 'data',
							descr : 'hash containing `namingStrategy` and `inputHandler`',
							type : 'properties'
						} ],
						returns : 'this'
					},
					serializeField : {
						descr : 'Serialize a single field and return the value.  All naming strategies will be queried for the the field and the first one that\
							returns a field name will have their associated input handler return the serialized value.',
						params : [ {
							name : 'el',
							descr : 'the DOM element to serialize',
							type : 'array:element'
						} ],
						returns : [ 'object',
								'whatever value the associated input handler returns which is usually a string' ]
					},
					serialize : {
						descr : 'Serialize all input fields under the given root.  All naming strategies will be queried for the the field and the first one that\
							returns a field name will have their associated input handler return the serialized value.  Return all serialized values as a hash.',
						params : [ {
							name : 'root',
							descr : 'the root jquery selector',
							type : '$element'
						}, {
							name : 'attr',
							descr : 'attributes hash to populate',
							type : 'properties',
							optional : true
						} ],
						returns : [
								'properties[model field key, model field value]',
								'the model attributes' ]
					},
					synchronizeDOM : {
						descr : 'Synchronize all input fields with the corresponding model attribute values.  Any field that has a naming strategy using #{link:NamingStrategy#getFieldKey}\
							match will have it\'s corresponding input handler set the value using #{link:InputHandler#setElementValue}.',
						params : [ {
							name : 'root',
							descr : 'the root jquery selector',
							type : '$element'
						}, {
							name : 'model',
							descr : 'the source model to synchronize',
							type : 'model,properties'
						} ]
					},
				}
			},

			'ModelHandler' : {
				defaultImpl : 'Blocks.Handler.ModelContextContributor',
				descr : 'External class used to perform actions for a view related to a model and within the context of a view.  The `events` property can be used for binding to view events\
					as well as model, DOM and window events.  Each handler will get initialized (#{link:ModelHandler#init}) with the associated view, model and options used when the\
					handler was added (see #{Blocks.View#addModel}).<br><br>There is no single required method but several optional methods depending on the pupose of the handler.<br><br>\
					Methods can be called on handlers using the #{link:Blocks.View#exec} method.<br><br>When the handler is registered with a `selector` option value, an additional property,\
					`$el` property will be set as an instance variable on the handler with the value of the jquery-wrapped element identified by the selector.',
				methods : {
					init : {
						descr : 'Initialize the handler with the associated model and view.  This is called automatically when the handler is registered.',
						params : [
								{
									name : 'view',
									descr : 'The parent view that contains the model',
									type : 'Blocks.View'
								},
								{
									name : 'model',
									descr : 'The associated model',
									type : 'Backbone.Model'
								},
								{
									name : 'options',
									descr : 'Any additional options used with the #{link:Blocks.View#addModel} call'
								} ]
					},
					events : 'This can either be a function which returns a set of Backbone-style events and bindings or the hash structure.\
						<ul><li>Standard events with no space are assumed to refer to the associated model</li>\
						<li>Events prefixed with `!` will cause the associated method to be called when the event fires <strong>and</strong> the model has been fetched</li>\
						<li>Events that start with `parent:` are assumed to refer to the parent view</li>\
						<li>Events that contain whitespace (`event selector`) are assumed to refer to DOM element bindings.  An optional `selector` option must be used in this case to identify the UI focus of this handler</li>\
						<li>Events that start with `$window` are assumed to refer to window bindings.</li></ul>  All bindings are cleaned up automatically (assuming the parent view destroy method is called).',
					destroy : 'Called automatically when the parent view destory method is called',
					parentContext : {
						descr : 'This is called with the default view rendering behavior.  Any handler that wishes to add to the view context can do so here.',
						params : [ {
							name : 'context',
							descr : 'The context used for the parent view template merge',
							type : 'properties'
						} ]
					},
					synchronize : {
						descr : 'Synchronize all DOM input field data with the associated model.  Return true with no validation issues and false otherwise.',
						params : [ {
							name : 'options',
							descr : 'Any options used for the set call',
							optional : true
						} ],
						returns : [ 'boolean',
								'true if success, false if validation issues' ]
					},
					serialize : {
						descr : 'Serialize all input fields to a hash structure.  Unless explicitely needed otherwise, the default serializer should be used for serialization (#{link:Blocks#serialize}).  Return all serialized values as a hash.',
						params : [ {
							name : 'attr',
							descr : 'attributes hash to populate',
							type : 'properties'
						} ],
						returns : [
								'properties[model field key, model field value]',
								'all model attributes' ]
					}
				}
			},

			'CollectionHandler' : {
				defaultImpl : 'Blocks.Handler.CollectionContextContributor',
				descr : 'External class used to perform actions for a view related to a collection and within the context of a view.  The `events` property can be used for binding to view events\
					as well as collection, DOM and window events.  Each handler will get initialized (#{link:CollectionHandler#init}) with the associated view, collection and options used when the\
					handler was added (see #{Blocks.View#addCollection}).<br><br>There is no single required method but several optional methods depending on the pupose of the handler.<br><br>\
					Methods can be called on handlers using the #{link:Blocks.View#exec} method.<br><br>When the handler is registered with a `selector` option value, an additional property,\
					`$el` property will be set as an instance variable on the handler with the value of the jquery-wrapped element identified by the selector.',
				methods : {
					init : {
						descr : 'Initialize the handler with the associated collection and view.  This is called automatically when the handler is registered.',
						params : [
								{
									name : 'view',
									descr : 'The parent view that contains the model',
									type : 'Blocks.View'
								},
								{
									name : 'collection',
									descr : 'The associated collection',
									type : 'Backbone.Collection'
								},
								{
									name : 'options',
									descr : 'Any additional options used with the #{link:Blocks.View#addCollection} call'
								} ]
					},
					events : 'This can either be a function which returns a set of Backbone-style events and bindings or the hash structure.\
						<ul><li>Standard events with no space are assumed to refer to the associated collection</li>\
						<li>Events prefixed with `!` will cause the associated method to be called when the event fires <strong>and</strong> the collection has been fetched</li>\
						<li>Events that start with `parent:` are assumed to refer to the parent view</li>\
						<li>Events that contain whitespace (`event selector`) are assumed to refer to DOM element bindings.  An optional `selector` option must be used in this case to identify the UI focus of this handler</li>\
						<li>Events that start with `$window ` are assumed to refer to window bindings.</li></ul>  All bindings are cleaned up automatically (assuming the parent view destroy method is called).',
					destroy : 'Called automatically when the parent view destory method is called',
					parentContext : {
						descr : 'This is called with the default view rendering behavior.  Any handler that wishes to add to the view context can do so here.',
						params : [ {
							name : 'context',
							descr : 'The context used for the parent view template merge',
							type : 'properties'
						} ]
					},
					synchronize : {
						descr : 'Synchronize all DOM input field data with the associated model.  Return true with no validation issues and false otherwise.',
						params : [ {
							name : 'options',
							descr : 'Any options used for the set call',
							optional : true
						} ],
						returns : [ 'boolean',
								'true if success, false if validation issues' ]
					},
					serialize : {
						descr : 'Serialize all input fields to a hash structure.  Unless explicitely needed otherwise, the default serializer should be used for serialization (#{link:Blocks#serialize}).  Return all serialized values as a hash.',
						params : [ {
							name : 'attr',
							descr : 'attributes hash to populate',
							type : 'properties'
						} ],
						returns : [
								'properties[model field key, model field value]',
								'all model attributes' ]
					}
				}
			},

			'ViewHandler' : {
				defaultImpl : 'Blocks.Handler.SimpleSubView',
				descr : 'External class used to allow views to contain subviews.  A subview is added using #{link:Blocks.View#addView} with either the default handler or a custom one (as\
					defined by the `handler` option property).  The default handler will be all that is needed in most cases as it will clean up sub views and re-render sub views if\
					parent views are rendered.  Like other managed handlers, the `events` property can be used for binding to view events\
					as well as collection, DOM and window events.  Each handler will get initialized with the associated view, sub view and options used when the\
					handler was added.<br><br>There is no single required method but several optional methods depending on the pupose of the handler.  A subview must always be registered\
					with a `selector` option parameter and will always have an `$el` property set on the handler instance as the jquery-wrapped element identified by the selector.',
				methods : {
					init : {
						descr : 'Initialize the handler with the associated sub view and parent view.  This is called automatically when the handler is registered.',
						params : [
								{
									name : 'view',
									descr : 'The parent view that contains the sub view',
									type : 'Blocks.View'
								},
								{
									name : 'subView',
									descr : 'The sub view',
									type : 'Blocks.View'
								},
								{
									name : 'options',
									descr : 'Any additional options used with the #{link:Blocks.View#addCollection} call'
								} ]
					},
					events : 'This can either be a function which returns a set of Backbone-style events and bindings or the hash structure.\
						<ul><li>Standard events with no space are assumed to refer to the associated collection</li>\
						<li>Events prefixed with `!` will cause the associated method to be called when the event fires <strong>and</strong> the collection has been fetched</li>\
						<li>Events that start with `parent:` are assumed to refer to the parent view</li>\
						<li>Events that contain whitespace (`event selector`) are assumed to refer to DOM element bindings.  An optional `selector` option must be used in this case to identify the UI focus of this handler</li>\
						<li>Events that start with `$window ` are assumed to refer to window bindings.</li></ul>  All bindings are cleaned up automatically (assuming the parent view destroy method is called).',
					destroy : 'Called automatically when the parent view destory method is called'
				}
			},

			'ModuleLoader' : {
				defaultImpl : 'Blocks.Loader.SimpleLoader',
				descr : 'Component used to dynamically load module resources (eg: script and css resources).\
					<br><br>The module loader class is set on #{link:Blocks.Defaults#moduleLoaderClass}.  The #{link:Blocks.Router}\
					will use this property to create a new instance when a module is added.',
				methods : {
					'{constructor}' : {
						descr : 'class constructor',
						params : [
								{
									name : 'moduleName',
									descr : 'the module name'
								},
								{
									name : 'data',
									descr : 'the module data including `scripts`, `styles`, and optionally `loadPrefix`.\
						        	  <br><br>Both `scripts` and `styles` are simple arrays containing all javascript and css resources to be loaded.\
						        	  <br><br>The loadPrefix can be used as a prefix for all resources.',
									type : 'properties'
								},
								{
									name : 'options',
									descr : 'the router options',
									type : 'properties'
								}
								]
					},
					'loadModule' : {
						descr : 'Load all module resources that were provided as constructor arguments',
						params : [
								{
									name : 'options',
									descr : 'loader options including `success` callback function.  The module loader will call the success callback function after all javascript resources are loaded.'
								}, ]
					}
				}
			}
		},

		'Template/Content' : {
			'Blocks.Template.Underscore' : {
				descr : 'Template engine using underscore #{extlink:http://underscorejs.org/#template|template} method.<br><br>This is the default template engine to avoid adding additional dependencies.',
				interfaceClass : 'TemplateEngine'
			},
			'Blocks.Template.Handlebars' : {
				descr : 'Template engine which uses #{extlink:http://handlebarsjs.com|Handlebars}.  To use this, you must<ul>\
					<li>Include #{extlink:http://cloud.github.com/downloads/wycats/handlebars.js/handlebars-1.0.0.beta.6.js|handlebars.js}</li>\
					<li>Include the following code ```Blocks.Defaults.templateEngine = new Blocks.Template.Handlebars();```</li></ul>',
				interfaceClass : 'TemplateEngine'
			},
			'Blocks.Content.HashProvider' : {
				descr : 'Template engine which uses a hash structure to store inline content string values.  To use this, you must include the following code ```Blocks.Defaults.contentProvider = new Blocks.Content.HashProvider();```\
					<br><br>There are several different options for locating content by view or path or a combination of both.<ol>\
					<li>{view}.templates.template (if view and no path)</li>\
					<li>{view}.templates.{path} (if view and path)</li>\
					<li>Blocks.templates.{view.viewPackage}.{view.template or view.viewName}.template (if view and no path)</li>\
					<li>Blocks.templates.{view.viewPackage}.{view.template or view.viewName} (if view and no path)</li>\
					<li>Blocks.templates.{view.viewPackage}.{view.template or view.viewName}.{path} (if view and path)</li>\
					<li>Blocks.templates.{path} (if no view)</li></ol>\
					The path checked will use "/" as a hash hierarchy segment indicator.',
				interfaceClass : 'ContentProvider'
			}
		},

		'Model/Collection Handlers' : {
			/*******************************************************************
			 * ABSTRACT / IMPL CLASSES
			 ******************************************************************/
			'Blocks.Handlers.Base' : {
				descr : 'Base class for handlers or actually any other plugin.  Basically just exposes the Bacbone `extends` method as well as Backbone.Events',
				methods : {
					'setOptions' : {
						descr : 'Called on construction with parameters being constructor arguments'
					},
					'extend' : {
						descr : 'Static method to be used when creating a subclass.  ```var mySubClass = Blocks.Handlers.Base.extend({ ... });```',
						params : [ {
							name : 'properties',
							descr : 'the subclass prototype properties',
							type : 'properties'
						}, ]
					}
				}
			},

			'Blocks.Handlers.ModelContextContributor' : {
				interfaceClass : 'ModelHandler',
				defaultImpl : true,
				descr : 'Simple model handler just exposes a `parentContext` method to contribute to a context for a template.  The default implementation of the #{Blocks.View#getContext} will execute the parentContext method on all managed objects',
				methods : {
					'parentContext' : {
						descr : 'if this alias is the default alias (so most likely is used without any other applied models), will add model attributes directly, otherwise will add model attributes to context using alias as the key'
					}
				}
			},

			'Blocks.Handlers.CollectionContextContributor' : {
				interfaceClass : 'CollectionHandler',
				descr : 'Simple collection handler just exposes a `parentContext` method to contribute to a context for a template.  The default implementation of the #{Blocks.View#getContext} will execute the parentContext method on all managed objects.\
					<br><br>Simple handler that will only contribute collection models to the context.  The alias will be used as the namespace for the models.',
				methods : {
					'parentContext' : {
						descr : 'if this alias is the default alias (so most likely is used without any other applied models), will add model attributes directly, otherwise will add model attributes to context using alias as the key'
					}
				}
			},

			'Blocks.Handler.Collection.ItemView' : {
				interfaceClass : 'CollectionHandler',
				descr : 'Handler that will render a collection using templates.  There are several diffrent template used (all prefixed with "{view.template or view.name}/{alias or \'items\'}-"): <dl> <dt>item</dt><dd>template used to render a single item</dd>\
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

				methods : {
					'render' : {
						descr : 'bound to <em>parent:render</em>; Main method for collection display.  This will render the appropriate template'
					},
					'onAdd' : {
						descr : 'bound to <em>add</em>; Will insert into the DOM the item template contents or element of a view instance.  By default the template will be used but the view can implement the <em>{alias}Item</em> (ex: fooItem: function(model) {...}) to return a view instead.'
					},
					'onRemove' : {
						descr : 'bound to <em>remove</em>; Will remove the appropriate entry from the DOM or, if the new collection size is 0, will call render'
					},
					'onReset' : {
						descr : 'bound to <em>reset</em>; Will simply call render'
					},
					'onEmpty' : {
						descr : 'Will be called when the collection is empty (default behavior is to render {alias}-empty'
					},
					'onLoading' : {
						descr : 'Will be called when the collection is currently being fetched (default behavior is to render {alias}-loading'
					},
					'context' : {
						descr : 'Return the context used for template processing',
						params : [ {
							name : 'model',
							descr : 'the item model model',
							optional : true
						} ]
					},
					'itemTemplateContainer' : {
						descr : 'Return the new element that will contain the template contents (if an item template is used instead of a view)'
					},
					'getTemplatePath' : {
						descr : 'Return the template path prefix for retrieving content (default is "{view.prefix (optionsl)}/{view.template or view.name}/{alias}-")',
						params : [ {
							name : 'model',
							descr : 'the item model model',
							optional : true
						} ]
					}
				}
			}
		}
	}
}

defaults = {
	modelAlias : 'the default alias used for registering a model #{link:Blocks.ManagedObjectHandler|object handler}',
	collectionAlias : 'the default alias used for registering a collection #{link:Blocks.ManagedObjectHandler|object handler}',
	viewAlias : 'the default alias used for registering a sub-view #{link:Blocks.ManagedObjectHandler|object handler}',
	collectionContainerClass : 'the default element class that will be applied to the collection content root',
	subviewContainerClass : 'the default element class that will be applied to the sub-view content root',
	modelContainerClass : 'the default element class that will be applied to the model content root',
	eventWatch : {
		descr : 'should, by default, registered #{link:Blocks.ManagedObjectHandler|object handlers} bubble their events to the parent (view) using the alias as a prefix',
		type : 'boolean'
	},
	selectorGenerator : 'function use to take options from #{link:Blocks.View#addView}, #{link:Blocks.View#addCollection}, and #{link:Blocks.View#addModel} and return the root element selector'
}

plugins = {}

// normalize the data
// copy all entries of a hash structury and set a specific property with the key
function convertIndexedToList(root, parentKey, childKey, stringValKey) {
	var rootList = [];
	for ( var prop in root) {
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

modelData.api.sections = convertIndexedToList(modelData.api.sections, 'name',
		'classes');
_.each(modelData.api.sections, function(section) {
	section.classes = convertIndexedToList(section.classes, 'name');
	_.each(section.classes, function(clazz) {
		clazz.methods = convertIndexedToList(clazz.methods, 'name', undefined,
				'descr');
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
for ( var name in modelData.index) {
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
	fetch : function(options) {
		options = options ? _.clone(options) : {};
		var model = this;
		this.set(this.parse(JSON.parse(JSON.stringify(this.data))));
		options.success && options.success(this);
	}
});
collections.Base = Backbone.Collection.extend({
	fetch : function(options) {
		options = options ? _.clone(options) : {};
		if (options.parse === undefined)
			options.parse = true;
		var collection = this;
		var success = options.success;
		this.reset(this.parse(data = JSON.parse(JSON.stringify(this.data))), {
			parse : true
		});
		options.success && options.success(this);
	}
});

/** MODELS * */
models.Section = models.Base.extend({
	parse : function(data) {
		this.classes = new collections.Classes(data.classes, {
			parse : true
		});
		delete data.classes;

		return data;
	}
});

models.Class = models.Base.extend({
	parse : function(data) {
		if (data.methods) {
			this.methods = new collections.Methods(data.methods, {
				parse : true
			});
		}
		if (data.properties) {
			this.properties = new collections.Properties(data.properties, {
				parse : true
			});
		}
		delete data.properties;

		return data;
	}
});

models.Method = models.Base.extend({
	parse : function(data) {
		if (data.params) {
			if (_.isArray(data.params)) {
				this.parameters = new collections.Parameters(data.params, {
					parse : true
				});
				delete data.params;
			} else {
				this.parameterSet = data.params;
				this.parameters = new collections.Parameters(
						data.params.values, {
							parse : true
						});
				delete data.params;
			}
		}

		if (data.returns) {
			if (_.isArray(data.returns)) {
				data.returns = {
					type : data.returns[0],
					descr : data.returns[1]
				};
			} else {
				data.returns = {
					type : data.returns
				};
			}
		}

		return data;
	}
});

models.Property = models.Base.extend({});

models.Parameter = models.Base.extend({});

/** COLLECTIONS * */
collections.Sections = collections.Base.extend({
	model : models.Section
});

collections.Classes = collections.Base.extend({
	model : models.Class
});

collections.Methods = collections.Base.extend({
	model : models.Method
});

collections.Properties = collections.Base.extend({
	model : models.Property
});

collections.Parameters = collections.Base.extend({
	model : models.Parameter
});

var data = {};
data.apiSections = new collections.Sections(JSON.parse(JSON
		.stringify(modelData.api.sections)), {
	parse : true
});
console.log(data);