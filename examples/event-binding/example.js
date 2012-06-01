$(document).ready(function() {

	Pages.templates = {
		sub: '<button>Click me</button>',
		main: {
			template: 'JOE -- <div class="subView"></div> <div class="things"></div> <div class="log"></div>',
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
			subView: {
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
				alias: 'subView',
				watch: true
			});

			this.addCollection({
				alias: 'things',
				collection: options.things,
				fetch: false,
				watch: true
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
			this.$('.log').html(this._log);
		}
	});
	
	var main = new MainView({
		things: things
	});
	main.setModel(viewModel, {fetch: false});
	main.render();
	
	things.reset();
	viewModel.set({abc: 'def'});
});