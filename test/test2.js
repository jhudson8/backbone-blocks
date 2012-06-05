$(document).ready(function() {

Pages.templateEngine = Pages.Handler.Template.Handlebars;

var View = Pages.View.extend({
	el: '#main',
	template: 'test',

	templates: {
		test: '{{#each collection}} <p> {{attributes.firstName}} {{attributes.lastName}} </p> {{/each}} <br>  <button class="foo">Click Me</button> <br> <div class="collection"> <button class="foo">Click Me</button>  </div>'
	},

	initialize: function(args) {
		this.$uper('initialize', arguments);
		/*
		this.addModel({
			model: args.person,
			alias: 'person',
			fetch: false
		});
		*/
	}
});



var Person = Backbone.Model.extend({
		validate: function(attrs) {
			if (attrs.firstName && attrs.firstName.length < 5) {
				return "first name must be at least 5 chars";
			}
		}
});
var People = Backbone.Collection.extend({
		model: Person,
		isPopulated: function() {
			return this.populated;
		},
		isFetching: function() {
			return this.fetching;
		}
});

var people = new People([
	{firstName: "Joe", lastName: "Hudson"},
	{firstName: "Billy", lastName: "Bob"}
]);

var view = new View({
	collection: people
});
people.fetching = true;
view.render();

setTimeout(function() {
	people.fetching = false;
	people.populated = true;
	people.trigger('fetched');
}, 3000)


});