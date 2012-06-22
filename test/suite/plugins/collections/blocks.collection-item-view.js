(function() {
	module('Collection item-view plugin');

	function replaceContainerId(val) {
		return val.replace(/"blk_\d+"/g, '"{*}"');
	}

	var View = Blocks.View.extend({
		templates : {
			template : 'main <div class="people"></div>',
			people : {
				loading : 'The people are loading...',
				empty : 'There are no people',
				item : '{{firstName}} {{lastName}}',
				full : 'The items are: <ul id="{{containerId}}"></ul>'
			}
		}
	});

	test(
					"lifecycle events and templates",
					function() {
						Blocks.Defaults.templateEngine = new Blocks.Template.Handlebars();
						Blocks.Defaults.collectionHandlerClass = Blocks.Handler.Collection.ItemView;

						var people = new MockCollection();
						people.mockFetching();

						var view = new View();
						view.addCollection('people', people, {
							itemTag : 'li'
						});
						view.render();
						equal(view.$el.html(), 'main <div class="people">The people are loading...</div>',
										'loading template and rendering');
						people.mockFetched();
						people.reset();
						equal(view.$el.html(), 'main <div class="people">There are no people</div>',
										'empty template and reset binding');
						people.add(new Backbone.Model({
							firstName : 'Joe',
							lastName : 'Hudson'
						}));
						equal(
										replaceContainerId(view.$el.html()),
										'main <div class="people">The items are: <ul id="{*}"><li data-view="{*}">Joe Hudson</li></ul></div>',
										'full template, item template and add binding');
						people.add(new Backbone.Model({
							firstName : 'Bill',
							lastName : 'Bixby'
						}));
						equal(
										replaceContainerId(view.$el.html()),
										'main <div class="people">The items are: <ul id="{*}"><li data-view="{*}">Joe Hudson</li><li data-view="{*}">Bill Bixby</li></ul></div>',
										'full template, item template and add binding');
						people.remove(people.at(0));
						equal(
										replaceContainerId(view.$el.html()),
										'main <div class="people">The items are: <ul id="{*}"><li data-view="{*}">Bill Bixby</li></ul></div>',
										'delete binding');
					});

	test(
					"full views for item entries (instead of templates)",
					function() {
						Blocks.Defaults.templateEngine = new Blocks.Template.Handlebars();
						Blocks.Defaults.collectionHandlerClass = Blocks.Handler.Collection.ItemView;

						var ItemView = Blocks.View.extend({
							tagName : 'li',
							templates : {
								template : 'person: {{firstName}} {{lastName}}'
							}
						});

						var MainView = View.extend({
							peopleItem : function(model) {
								return new ItemView({
									model : model
								});
							}
						});
						var people = new MockCollection({
							firstName : 'Joe',
							lastName : 'Hudson'
						});
						var view = new MainView();
						view.addCollection('people', people);
						view.render();
						equal(
										replaceContainerId(view.$el.html()),
										'main <div class="people">The items are: <ul id="{*}"><li data-view="{*}">person: Joe Hudson</li></ul></div>',
										'collection UI content is as expected');
					});
})();
