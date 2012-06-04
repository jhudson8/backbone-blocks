$(document).ready(function() {

	var MyView = Pages.View.extend({
		el: '#example',
		templates: {
			template: 'Hello <%= name %>'
		}
	});

	var myModel = new Backbone.Model({name: 'World'});
	new MyView({
		model: myModel
	}).render();
	

	// use handlebars template rendering
	Pages.Defaults.templateEngine = Pages.Handler.Template.Handlebars;

	Pages.templates = {
		example: {
			people: {
				'list': '{{#each collection}}{{#with attributes}} <p>{{firstName}} {{lastName}}</p> {{/with}}{{/each}}'
			}
		}
	}

	var CollectionView = Pages.View.extend({
		viewPackage: 'example.people',
		el: '#example',
		template: 'list'
	});

	var people = new Backbone.Collection([
		{firstName: 'John', lastName: 'Doe'},
		{firstName: 'George', lastName: 'Washington'}
	]);
	new CollectionView({
		collection: people
	}).render();

});