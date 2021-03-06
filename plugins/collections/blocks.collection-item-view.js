(function() {
	/**
	 * - init (options, view, collection): initialize with options from
	 * Blocks.View#setCollection call, view instance and collection instance -
	 * render: render the collection - onAdd: called when a model was added to
	 * the collection - onRemove: called when a model was removed from the
	 * collection - onReset: called when the collection was reset
	 */
	Blocks.Handler.Collection.ItemView = Blocks.Handler.Base
			.extend({

				events : {
					'add' : 'onAdd',
					'remove' : 'onRemove',
					'reset' : 'onReset',
					'parent:rendered' : 'render'
				},

				init : function(view, collection, options) {
					this.view = view;
					this.collection = collection;
					this.subViews = {};
					this.templateOptions = {
						contentProvider : view.contentProvider,
						templateEngine : view.templateEngine
					};
				},

				/**
				 * Render the collection within the 'selector' element. If the
				 * collection has 0 items, renderEmpty will be called,
				 * otherwise, for each item, onAdd will be called.
				 */
				render : function() {
					var el = this.$el;
					if (el.size() == 0)
						return;

					// clear out existing content
					el.html('');

					// destroy existing subviews
					for ( var id in this.subViews) {
						this.subViews[id].destroy();
					}
					this.subViews = {};

					this.containerEl = this.$el;

					// call onAdd for each item
					if (this.collection.size() > 0) {

						// use the full template if exists
						var fullTemplate = this.getTemplatePath() + 'full';
						if (Blocks.isValidContentPath(fullTemplate,
								this.view, this.templateOptions)) {
							// if a full template is used, an element must be
							// added with id of {containerId - template
							// variable}
							var id = _.uniqueId('blk_');
							var context = _.defaults({
								containerId : id
							}, this.collection);
							var content = Blocks.template(fullTemplate,
									this.view, this.templateOptions)(context);
							this.$el.html(content);
							this.containerEl = this.$el.find('#' + id);
							if (!this.containerEl.size()) {
								throw new Error(
										'The collection container must be referenced in the full template (use containerId token)');
							}
						}

						this.wasEmpty = false;
						this.collection.each(_.bind(function(model) {
							this.onAdd(model, el);
						}, this));
					} else {
						this.wasEmpty = true;
						if (this.collection.isFetching
								&& this.collection.isFetching()) {
							this.onLoading();
						} else {
							this.onEmpty();
						}
					}
				},

				/**
				 * render the content for this model
				 */
				onAdd : function(model) {
					var id = model.id;
					if (!id) {
						id = model._civId = _.uniqueId('blk_');
					}

					if (this.wasEmpty) {
						// just render like normal if we used to be empty
						return this.render();
					}

					// what function should we use to get item data
					var viewFunctions = [ Blocks.Defaults.collectionAlias
							+ 'Item' ];
					if (this.options.alias)
						viewFunctions.splice(0, 0, this.options.alias + 'Item');
					var fc = this.getFunctionAndContext(viewFunctions,
							this.onItem);
					var data = fc.func.call(fc.context, model, this.options);

					// data can be either HTML string or View instance
					var itemEl;
					if (data instanceof Backbone.View) {
						data.render();
						itemEl = data.$el;
						this.subViews[id] = data;
					} else {
						itemEl = $(this.itemTemplateContainer(model));
						itemEl.append(data);
					}

					// set the data attribute and append the item element
					itemEl.attr('data-view', id);
					itemEl.addClass(Blocks.Defaults.collectionContainerClass);
					this.containerEl.append(itemEl);
				},

				/**
				 * remove the content relating to this model
				 */
				onRemove : function(model) {
					var id = model.id;
					if (!id) {
						id = model._civId;
						delete model._civId;
					}

					var view = this.subViews[id];
					if (view) {
						view.destroy();
						delete this.subViews[id];
					}

					if (this.collection.size() == 0) {
						this.render();
					} else {
						var item = this.containerEl.find('[data-view="' + id
								+ '"]');
						item.remove();
					}
				},

				/**
				 * render the collection again as the collection will represent
				 * a reset state
				 */
				onReset : function() {
					this.render.call(this);
				},

				getObjectManagers : function() {
					var rtn = [];
					rtn.push.apply(rtn, this.subViews);
					return rtn;
				},

				destroy : function() {
					for ( var id in this.subViews) {
						this.subViews[id].destroy();
					}
					this.collection.each(function(model) {
						model._civId = void 0;
					});
				},

				// non-API methods are below
				/**
				 * Called when the collection should be rendered in an empty
				 * state
				 */
				onEmpty : function() {
					this.wasEmpty = true;
					this.containerEl = void 0;
					var path = this.getTemplatePath() + 'empty';
					var content = '';
					if (Blocks.isValidContentPath(path, this.view)) {
						content = Blocks.template(path, this.view,
								this.templateOptions);
					}
					this.$el.html(content);
				},

				/**
				 * Called when the collection should be rendered in an empty
				 * state
				 */
				onLoading : function() {
					if (Blocks.isValidContentPath(path, this.view, this.templateOptions)) {
						this.containerEl = void 0;
						var path = this.getTemplatePath() + 'loading';
						this.$el.html(Blocks.template(path, this.view,
								this.templateOptions));
					} else {
						this.onEmpty();
					}
				},

				/**
				 * return the context for getting the collection item data
				 * 
				 * @param model
				 *            the item model
				 */
				context : function(model) {
					return model.attributes;
				},

				/**
				 * return the HTML contents or view impl for this model
				 * 
				 * @param model
				 *            the item model
				 */
				onItem : function(model) {
					return Blocks.template(this.getTemplatePath(model),
							this.view, this.templateOptions)(
							this.context(model));
				},

				/**
				 * return the element container for item data (if was HTML
				 * string)
				 * 
				 * @param model
				 *            the item model
				 */
				itemTemplateContainer : function(model) {
					return this.view.make(this.options.itemTag || 'div');
				},

				/**
				 * return the item template path
				 * 
				 * @param model
				 *            the item model
				 */
				getTemplatePath : function(model) {
					var prefix = (this.options.alias || 'items');
					if (model) {
						return prefix + '/item';
					} else {
						return prefix + '/';
					}
				},

				/**
				 * Return a hash contain props for 'func' and 'context'
				 * depending if the a function was found as a property of the
				 * view of the default function.
				 * 
				 * @param viewNames
				 *            array of names of view properties to check for
				 *            existance (use view as context)
				 * @param defaultFunc
				 *            the default function if (use this as context)
				 */
				getFunctionAndContext : function(viewNames, defaultFunc) {
					var func;
					if (viewNames) {
						for ( var i in viewNames) {
							func = this.view[viewNames[i]];
							if (func) {
								return {
									func : func,
									context : this.view
								};
							}
						}
					}
					return {
						func : defaultFunc,
						context : this
					};
				}
			});
})();
