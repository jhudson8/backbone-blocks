(function() {
	module("Template Plugins");

	var model = {
		firstName : 'Joe'
	};

	test("Underscore", function() {

		var template = 'Hello <%= firstName %>';
		var engine = new Blocks.Template.Underscore();
		equal('Hello Joe', engine.get(template)(model), 'underscore loadTemplate method and context merging');
	});

	test("Handlebars", function() {
		var template = 'Hello {{firstName}}';
		var engine = new Blocks.Template.Handlebars();
		equal('Hello Joe', engine.get(template)(model), 'handlebars loadTemplate method and context merging');
	});
})();
