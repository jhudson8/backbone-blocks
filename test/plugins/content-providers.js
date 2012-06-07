module("Hash Content Provider");

var provider = new Blocks.Content.HashProvider();
Blocks.templates = {
		foo: 'global template',
		example: {
			foo: 'package template'
		}
}

test("View-based templates", function() {
	
	var view = {
			viewPackage: 'example',
			template: 'foo',
			templates: {
				foo: 'view template',
				template: 'default view template'
			}
				
	}
	
	equal(provider.get('foo', view), view.templates.foo, '1st check: {view}.templates.{template}');
	delete view.templates.foo;
	equal(provider.get('foo', view), view.templates.template, '2st check: {view}.templates.template');
	delete view.templates;
	equal(provider.get('foo', view), Blocks.templates.example.foo, '3rd check: {view package}.{template name}');
	Blocks.templates.example.foo = {
			template: 'global default template'
	};
	equal(provider.get('foo', view), Blocks.templates.example.foo.template, '4th check: {view package}.{template name}.template');
});
