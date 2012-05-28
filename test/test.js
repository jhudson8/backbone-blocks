$(document).ready(function() {

	Pages.templates = {
		view1: 'This is view 1 content <button>Click me</button>',
		view2: 'This is view 2 content',
		main: {
			template: 'should be view 1<div id="view1"> </div><br><br>should be view 2<div id="view2"></div> <br><br><div class="items"></div>',
			'items-item': '<%= firstName %> <%= lastName %>',
			'items-empty': 'Nothing to see here',
			'items-loading': 'Loading...'
		}
	}

	var view1 = Pages.View.extend({
		template: 'view1',
		events: {
			'click button': 'onClick'
		},
		onClick: function() {
			this.trigger('clicked');
		}
	});

	var view2 = Pages.View.extend({
		template: 'view2'
	});

	var _main = Pages.View.extend({
		el: '#main',
		template: 'main',
		
		// FIXME these events *should be* delegated
		events: {
			'view2:rendered': 'dummy'
		},

		dummy: function() {
			// alert('dummy1');
		},
		
		initialize: function() {
			Pages.View.prototype.initialize.apply(this, arguments);
			
			this.addView({
				view: new view1(),
				selector: '#view1',
				alias: 'view1'
			});
			this.addView({
				view: new view2(),
				selector: '#view2',
				alias: 'view2'
			});
		}
	});

	var main = _main.extend({
		events: {
			view1: {
				'rendered': 'dummy2',
				'clicked': 'view1Clicked'
			}
		},

		view1Clicked: function() {
			alert('clicked');
		},

		initialize: function() {
			_main.prototype.initialize.apply(this, arguments);
			var collection = new Pages.Collection();
			collection._fetching = true;
			this.items = this.addCollection({
				selector: '.items',
				alias: 'items',
				collection: collection
			});
		},

		dummy2: function() {
			// alert('dummy2');
		}
	});
				
	var main = new main();
	main.render();
	
	setTimeout(function() {
		console.log('add items');
		main.items.add(new Backbone.Model({
			id: '123',
			firstName: 'Joe',
			lastName: 'Hudson'
		}));
		main.items.add(new Backbone.Model({
			id: '234',
			firstName: 'Billy',
			lastName: 'Bob'
		}));
		
		setTimeout(function() {
			console.log('remove single item');
			main.items._populated = true;
			main.items._fetching = false;
			main.items.remove(main.items.at(0));
			
			setTimeout(function() {
				console.log('reset items');
				main.items.reset();
			}, 1000);
			
		}, 1000);
		
	}, 1000);
});