(function() {
	module("Widgets", {
		setup : function() {
			Blocks.templateEngine = new Blocks.Template.Handlebars();
		}
	});

	test("Renders within view", function() {
		var SimpleWidget = Blocks.Widget.Base.extend({

			events : {
				'parent:rendered': 'onRender'
			},

			setOptions: function(options) {
				// constructor parameter
			},

			init: function(view, options) {
				// after attached to view
			},

			onRender: function() {
				this.$el.html('Hello World!');
			},

			changeIt: function(html) {
				this.$el.html(html);
				this.trigger('changed', html);
			}
		});

		var TestView = Blocks.View.extend({
			events: {
				'myWidget:changed': 'onWidgetChanged'
			},
			
			templates: {
				template: 'Main view <span id="foo"></span>'
			},
			
			init: function() {
				this.widget = this.addWidget(new SimpleWidget(), {
					selector: '#foo', alias: 'myWidget'
				});
			},

			onWidgetChanged: function(html) {
				this.changedHtml = html;
			}
		});

		var testView = new TestView();
		testView.render();
		equal(testView.$el.html(), 'Main view <span id="foo">Hello World!</span>', 'Can bind to parent events and render content where appropriate');
		testView.widget.changeIt('Hello Joe!');
		equal(testView.$el.html(), 'Main view <span id="foo">Hello Joe!</span>', 'Can expose methods that alter UI state / content');
		equal(testView.changedHtml, 'Hello Joe!', 'Can expose events that parent can auto-bind to using alias');
	});

})();
