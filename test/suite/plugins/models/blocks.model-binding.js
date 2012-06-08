(function() {
	module("Model Binding Handler", moduleOptions);

	var View = Blocks.View
			.extend({
				viewName : 'foo',
				templates : {
					foo : '<span id="l0">{{testLabel}}</span>\
				<form class="model"><input id="t1" type="text" name="txt1"/>\
				<input id="t2" type="checkbox" name="bool1"/>\
				<input id="t3" type="checkbox" name="bool2"/>\
				<input id="t4" type="radio" name="bool3" value="true"/>\
				<input id="t5" type="radio" name="bool3" value="false"/>\
				<input id="t6" type="radio" name="bool4" value="true"/>\
				<input id="t7" type="radio" name="bool4" value="false"/>\
				<input id="t8" type="radio" name="opt5" value="a"/>\
				<input id="t9" type="radio" name="opt5" value="b"/>\
				<input id="t10" type="radio" name="opt5" value="c"/>\
				<select id="t11" name="sel6"><option value="a">a</option><option value="b">b</option><option value="c">c</option></select>\
				<textarea id="t12" name="ta7"></textarea>\
				</form>'
				}
			});

//	test(
//			"Render init",
//			function() {
//				Blocks.templateEngine = new Blocks.Template.Handlebars();
//				Blocks.Defaults.modelHandlerClass = Blocks.Handler.ModelBinder;
//
//				var model = new MockModel({
//					testLabel : 'test label',
//					txt1 : 'foo',
//					bool1 : true,
//					bool2 : false,
//					bool3 : true,
//					bool4 : false,
//					opt5 : 'b',
//					sel6 : 'c',
//					ta7 : 'bar'
//				});
//				var view = new View({
//					model : model
//				});
//				view.render();
//				equal(view.$el.find('#l0').html(), 'test label',
//						"model in template context rendering");
//				equal(view.$el.find('#t1').val(), 'foo', "standard text field");
//				equal(view.$el.find('#t2').attr('checked'), 'checked',
//						"checked (true)");
//				equal(view.$el.find('#t3').attr('checked'), undefined,
//						"checked (false)");
//				equal(view.$el.find('#t4').attr('checked'), 'checked',
//						"radio t/f (t:true)");
//				equal(view.$el.find('#t5').attr('checked'), undefined,
//						"radio t/f (f:true)");
//				equal(view.$el.find('#t6').attr('checked'), undefined,
//						"radio t/f (t:false)");
//				equal(view.$el.find('#t7').attr('checked'), 'checked',
//						"radio t/f (f:false)");
//				equal(view.$el.find('#t8').attr('checked'), undefined,
//						"radio (a:a/b/c)");
//				equal(view.$el.find('#t9').attr('checked'), 'checked',
//						"radio (b:a/b/c)");
//				equal(view.$el.find('#t10').attr('checked'), undefined,
//						"radio (c:a/b/c)");
//				equal(view.$el.find('#t11').val(), 'c', "select");
//				equal(view.$el.find('#t12').val(), 'bar', "textarea");
//			});
//
//	test(
//			"Model change to DOM",
//			function() {
//				Blocks.templateEngine = new Blocks.Template.Handlebars();
//				Blocks.Defaults.modelHandlerClass = Blocks.Handler.ModelBinder;
//
//				var model = new MockModel({
//					txt1 : 'foo',
//					bool1 : true,
//					bool2 : false,
//					bool3 : true,
//					bool4 : false,
//					opt5 : 'b',
//					sel6 : 'c',
//					ta7 : 'bar'
//				});
//				var view = new View({
//					model : model
//				});
//				view.render();
//				model.set({
//					txt1 : 'bar',
//					bool1 : false,
//					bool2 : true,
//					bool3 : false,
//					bool4 : true,
//					opt5 : 'a',
//					sel6 : 'a',
//					ta7 : 'foo'
//				});
//
//				equal(view.$el.find('#t1').val(), 'bar', "standard text field");
//				equal(view.$el.find('#t2').attr('checked'), undefined,
//						"checked (true)");
//				equal(view.$el.find('#t3').attr('checked'), 'checked',
//						"checked (false)");
//				equal(view.$el.find('#t4').attr('checked'), undefined,
//						"radio t/f (t:true)");
//				equal(view.$el.find('#t5').attr('checked'), 'checked',
//						"radio t/f (f:true)");
//				equal(view.$el.find('#t6').attr('checked'), 'checked',
//						"radio t/f (t:false)");
//				equal(view.$el.find('#t7').attr('checked'), undefined,
//						"radio t/f (f:false)");
//				equal(view.$el.find('#t8').attr('checked'), 'checked',
//						"radio (a:a/b/c)");
//				equal(view.$el.find('#t9').attr('checked'), undefined,
//						"radio (b:a/b/c)");
//				equal(view.$el.find('#t10').attr('checked'), undefined,
//						"radio (c:a/b/c)");
//				equal(view.$el.find('#t11').val(), 'a', "select");
//				equal(view.$el.find('#t12').val(), 'foo', "textarea");
//			});

	test("DOM change to model", function() {
		Blocks.templateEngine = new Blocks.Template.Handlebars();
		Blocks.Defaults.modelHandlerClass = Blocks.Handler.ModelBinder;

		var model = new MockModel({
			txt1 : 'foo',
			bool1 : true,
			bool2 : false,
			bool3 : true,
			bool4 : false,
			opt5 : 'b',
			sel6 : 'c',
			ta7 : 'bar'
		});
		var view = new View({
			model : model
		});
		view.render();
		view.$el.find('#t1').val('bar').change();
		view.$el.find('#t2').removeAttr('checked').change();
		view.$el.find('#t3').attr('checked', 'checked').change();
		view.$el.find('#t5').attr('checked', 'checked').change();
		view.$el.find('#t6').attr('checked', 'checked').change();
		view.$el.find('#t8').attr('checked', 'checked').change();
		view.$el.find('#t11').val('a').change();
		view.$el.find('#t12').val('foo').change();

		var attr = model.attributes;
		equal(attr.txt1, 'bar');
		equal(attr.bool1, false);
		equal(attr.bool2, true);
		equal(attr.bool3, false);
		equal(attr.bool4, true);
		equal(attr.opt5, 'a');
		equal(attr.sel6, 'a');
		equal(attr.ta7, 'foo');
	});

	test("Auto field validation using model.validate", function() {
		Blocks.templateEngine = new Blocks.Template.Handlebars();
		Blocks.Defaults.modelHandlerClass = Blocks.Handler.ModelBinder;
		
		var ValidModel = MockModel.extend({
			validate: function(attributes) {
				if (attributes.txt1 && attributes.txt1.length < 4) {
					return {fieldKey: 'txt1', message: 'Invalid length'};
				}
			}
		});

		var model = new ValidModel({
			txt1 : 'food'
		});
		var view = new View({
			model : model
		});
		var validationError;
		view.bind('fieldError', function(error) {
			validationError = error;
		});
		view.bind('fieldSuccess', function() {
			validationError = false;
		});
		view.render();
		view.$el.find('#t1').val('bar').change();
		equal(validationError.message, 'Invalid length');
		view.$el.find('#t1').val('food').change();
		equal(validationError, false);
	});
})();
