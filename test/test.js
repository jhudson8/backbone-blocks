$(document).ready(function() {

	Pages.templates = {
		view1: 'This is view 1 content <button>Click me</button>',
		view2: 'This is view 2 content',
		main: {
			template: 'should be view 1<div class="view1"> </div><br><br>should be view 2<div class="view2"></div> <br><br><div class="items"></div>',
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

	var main = Pages.View.extend({
		el: '#main',
		template: 'main',

		events: {
			view1: {
				'rendered': 'view1Rendered',
				'clicked': 'view1Clicked'
			}
		},

		initialize: function() {
			Pages.View.prototype.initialize.apply(this, arguments);

			var collection = new Pages.Collection();
			collection._fetching = true;
			this.items = this.addCollection('items', collection, {fetch: false, watch: true});

			this.addView('view1', new view1(), {watch: true});
			this.addView('view2', new view2(), {watch: true});
		},
		
		view1Clicked: function() {
			alert('clicked');
		},

		view1Rendered: function() {
			console.log('view 1 rendered');
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
				
				main.destroy();
			}, 1000);
			
		}, 1000);
		
	}, 1000);

});