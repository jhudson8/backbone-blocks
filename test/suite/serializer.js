(function() {
	module("Serializer", {
		setup : function() {
			// add the list type serializer for any fields with data-type="list"
			Blocks.serializer.add({
				namingStrategy : new Blocks.Handler.Field.SimpleNamingStrategy({
					dataType : 'list'
				}),
				inputHandler : new Blocks.Handler.Field.ListInputHandler()
			})

			// add the true/fasle type serializer for any fields with data-type="tf"
			// for multiple radio buttons with values of "true" and "false"
			Blocks.serializer.add({
				namingStrategy : new Blocks.Handler.Field.SimpleNamingStrategy({
					dataType : 'tf'
				}),
				inputHandler : new Blocks.Handler.Field.SimpleInputHandler()
			});
		}
	});

	var html = '<input type="text" name="firstName" value="Joe"/>\
		<textarea name="desc">Sample description</textarea>\
		<input type="checkbox" name="accept" value="true" checked/>\
		<input type="radio" name="hasHair" value="true" checked/><input type="radio" name="hasHair" value="false"/>\
		<input type="radio" name="color" value="black"/><input type="radio" name="color" value="red" checked/><input type="radio" name="color" value="blue"/>\
		<input data-type="list" type="checkbox" name="animal" value="dog" checked/><input data-type="list" type="checkbox" name="animal" value="cat" checked/><input data-type="list" type="checkbox" name="animal" value="hamster"/>\
		<select name="finger"><option value="thumb">Thumb</option><option value="index">Index</option><option value="middle" selected>Middle</option></select>\
		<select data-type="list" name="letters" multiple="multiple"><option value="a" selected>A</option><option value="b">B</option><option value="c" selected>C</option></select>';

	test("Serializing from root", function() {
		var el = $('#qunit-fixture');
		el.html(html);

		var attrs = Blocks.serializer.serialize(el);
		equal(attrs.firstName, 'Joe', 'Text field');
		equal(attrs.desc, 'Sample description', 'Textarea');
		equal(attrs.accept, true, 'T/F checkbox');
		equal(attrs.hasHair, true, 'T/F radio buttons');
		equal(attrs.color, 'red', 'Radio button');
		equal(JSON.stringify(attrs.animal), '["dog","cat"]', 'checkboxes to array');
		equal(attrs.finger, 'middle', 'Standard select');
		equal(JSON.stringify(attrs.letters), '["a","c"]', 'multiselect to array');
	});

	test("Setting element values", function() {
		var el = $('#qunit-fixture');
		el.html(html);
		
		var attrs = {
						firstName: 'Bob',
						desc: 'Another desc',
						accept: false,
						hasHair: false,
						color: 'black',
						animal: ['hamster','dog'],
						finger: 'thumb',
						letters: ['b','c']
		};
		Blocks.serializer.setValues(el, attrs);

		attrs = Blocks.serializer.serialize(el);
		equal(attrs.firstName, 'Bob', 'Text field');
		equal(attrs.desc, 'Another desc', 'Textarea');
		equal(attrs.accept, false, 'T/F checkbox'); // bad
		equal(attrs.hasHair, false, 'T/F radio buttons');  // bad
		equal(attrs.color, 'black', 'Radio button');  // bad
		equal(JSON.stringify(attrs.animal), '["dog","hamster"]', 'checkboxes to array');
		equal(attrs.finger, 'thumb', 'Standard select');
		equal(JSON.stringify(attrs.letters), '["b","c"]', 'multiselect to array');
	});
})();
