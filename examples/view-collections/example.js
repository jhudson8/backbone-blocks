$(document).ready(function() {

	Pages.templates = {
		main: {
			template: 'This is the main view <br><br/> <h3>People</h3><div id="people"></div> <br><br/> <h3>Places</h3><div id="places"></div>',

			'people-empty': 'There are no people here',
			'people-loading': 'Loading people...',

			'places-item': '<%= city %>, <%= state %>',
			'places-empty': 'There are no places here',
			'places-loading': 'Loading places...',
		},
		person: '<%= firstName %> <%= lastName %> <button class="remove">Remove</button>'
	}

	// Models / Collections
	var Person = Pages.Model.extend({
	});

	var People = Pages.Collection.extend({
		url: 'people.json',
		model: Person
	});

	var Place = Pages.Model.extend({
	});

	var Places = Pages.Collection.extend({
		url: 'places.json',
		model: Place
	});

	// Views
	var PersonView = Pages.View.extend({
		template: 'person',
		events: {
			'click .remove': 'onRemove'
		},
		
		onRemove: function() {
			this.model.collection.remove(this.model);
		}
	});
	
	var MainView = Pages.View.extend({
		el: '#example',
		template: 'main',

		initialize: function() {
			this.$uper('initialize', arguments);
			
			this.people = this.addCollection({
				collection: new People(),
				alias: 'people',
				selector: '#people'
				// handler: some other collection hander; Pages.CollectionHandlers.Default is the default
			});

			this.places = this.addCollection({
				collection: new Places(),
				alias: 'places',
				selector: '#places'
				// handler: some other collection hander; Pages.CollectionHandlers.Default is the default
			});
		},

		// collection item views can be used for rendering by implementing {alias}Item.  Data is the collection handler options.
		// otherwise, the template {alias}-item will be used with the model attributes as the context
		peopleItem: function(model, data) {
			return new PersonView({
				model: model
			});
		}
	});
	
	var main = new MainView();
	main.render();

});