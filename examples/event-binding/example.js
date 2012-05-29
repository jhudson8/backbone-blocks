$(document).ready(function() {

	Pages.templates = {
		sub: '<button>Click me</button>',
		main: {
			template: '<div id="subView"></div> <div id="things"></div> <div id="log"></div>',
			'things-empty': ''
		}
	}

	var things = new Pages.Collection();
	var viewModel = new Pages.Model({foo: 'bar'});

	var SubView = Pages.View.extend({
		template: 'sub',
		events: {
			'click button': 'onClick'
		},
		onClick: function() {
			this.trigger('clicked');
		}
	});

	var MainView = Pages.View.extend({
		el: '#example',
		template: 'main',
		
		events: {
			myView: {
				'clicked': 'onSubViewClicked',
				'all': 'onAllViewEvents'
			},
			'model:all': 'onAllModelEvents',
			'things:reset': 'thingsReset',
		},

		initialize: function(options) {
			this.$uper('initialize', arguments);

			var subView = this.addView({
				view: new SubView({value: 'Hello World'}),
				selector: '#subView',
				alias: 'myView'
			});

			this.addCollection({
				alias: 'things',
				selector: '#things',
				collection: options.things,
				fetch: false
			});
		},

		onSubViewClicked: function() {
			this.log('the sub view button was clicked');
		},
		
		onAllViewEvents: function(event) {
			this.log('(allViewEvents) the "' + event + '" event was fired');
		},
		
		onAllModelEvents: function(event) {
			this.log('(onAllModelEvents) the "' + event + '" event was fired');
		},

		thingsReset: function() {
			this.log('the things collection was reset');
		},

		log: function(text) {
			this._log = this._log || '';
			this._log += '<p>' + text + '</p>';
			this.$('#log').html(this._log);
		}
	});
	
	var main = new MainView({
		model: viewModel,
		things: things
	});
	main.render();
	
	things.reset();
	viewModel.set({abc: 'def'});
});