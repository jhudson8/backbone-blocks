(function() {
	module("Views", moduleOptions);

	Blocks.templateEngine = new Blocks.Template.Handlebars();

	test(
			"multiple sub-views",
			function() {
				var SubView = Blocks.View.extend({
					templates : {
						template : 'test view'
					}
				});

				var MainView = Blocks.View
						.extend({
							templates : {
								template : 'main view <div class="view1"></div> <div class="view2"></div>'
							}
						});

				var view = new MainView();
				view.addView('view1', new SubView());
				view.addView('view2', new SubView());
				view.render();
				equal(
						view.$el.html(),
						'main view <div class="view1"><div>test view</div></div> <div class="view2"><div>test view</div></div>',
						'Multiple sub-views render within main view template');
			});

	test(
			"multiple collection rendering",
			function() {
				var DummyCollectionHandler = Blocks.Handler.Base.extend({
					events : {
						'parent:rendered' : 'render'
					},

					render : function() {
						this.$el.html('collection handler: '
								+ this.collection.name);
					}
				});
				Blocks.Defaults.collectionHandlerClass = DummyCollectionHandler;

				var MainView = Blocks.View
						.extend({
							templates : {
								template : 'main view <div class="col1"></div> <div class="col2"></div>'
							}
						});

				var view = new MainView();

				var col1 = new Backbone.Collection();
				col1.name = 'col1';
				var col2 = new Backbone.Collection();
				col2.name = 'col2';

				view.addCollection('col1', col1);
				view.addCollection('col2', col2);
				view.render();
				equal(
						view.$el.html(),
						'main view <div class="col1">collection handler: col1</div> <div class="col2">collection handler: col2</div>',
						'Multiple collections render within main view template');
			});

	test(
			"multiple model rendering",
			function() {
				var DummyModelHandler = Blocks.Handler.Base.extend({
					events : {
						'parent:rendered' : 'render'
					},

					render : function() {
						this.$el.html('model handler: '
								+ this.model.attributes.name);
					}
				});
				Blocks.Defaults.modelHandlerClass = DummyModelHandler;

				var MainView = Blocks.View
						.extend({
							templates : {
								template : 'main view <div class="model1"></div> <div class="model2"></div>'
							}
						});

				var view = new MainView();

				var model1 = new Backbone.Model({
					name : 'name1'
				});
				var model2 = new Backbone.Model({
					name : 'name2'
				});

				view.addModel('model1', model1);
				view.addModel('model2', model2);
				view.render();
				equal(
						view.$el.html(),
						'main view <div class="model1">model handler: name1</div> <div class="model2">model handler: name2</div>',
						'Multiple models render within main view template');
			});

	test("multiple view mixins", function() {
		var Mixin1 = Blocks.Handler.Base.extend({
			events : {
				'parent:rendered' : 'render'
			},

			render : function() {
				this.parent.$el.prepend('foo ');
			}
		});
		var Mixin2 = Blocks.Handler.Base.extend({
			init : function(view) {
				view.show = function() {
					view.$el.show();
				};
				view.hide = function() {
					view.$el.hide();
				};
			}
		});

		var MainView = Blocks.View.extend({
			templates : {
				template : 'test'
			}
		});

		var view = new MainView();

		view.mixin(new Mixin1());
		view.mixin(new Mixin2());
		view.render();

		equal(view.$el.html(), 'foo test', 'Mixin event binding');
		view.show();
		equal(view.$el.css('display'), 'block', 'Mixin view manipulation');
		view.hide();
		equal(view.$el.css('display'), 'none', 'Mixin view manipulation');
	});
})();
