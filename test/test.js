$(document).ready(function() {
	Pages.ContentProviders.defaultProvider = new Pages.ContentProviders.ElementProvider('${template}-template');

	var view1 = Pages.View.extend({
		template: 'view1-template'
	});

	var view2 = Pages.View.extend({
		template: 'view1-template'
	});

	var _main = Pages.View.extend({
		el: '#main',
		template: 'main',
		
		events: {
			'view1': {
				'rendered': 'dummy'
			}
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
		'view2:rendered': 'dummy2'
		},

		initialize: function() {
			var collection = new Backbone.Collection();
			Pages.View.prototype.initialize.apply(this, arguments);
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
		main.items.add(new Backbone.Model({
			firstName: 'Joe',
			lastName: 'Hudson'
		}));
	}, 1000);
});