module("Template Plugins");

var model = {firstName: 'Joe'};

test("Underscore", function() {
	
	var template = 'Hello <%= firstName %>';
	var engine = new Blocks.Template.Underscore();
	equal('Hello Joe', engine.loadTemplate(template)(model));
});

test("Handlebars", function() {
	var template = 'Hello {{firstName}}';
	var engine = new Blocks.Template.Handlebars();
	equal('Hello Joe', engine.loadTemplate(template)(model));
});
