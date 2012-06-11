(function() {
	module("Page");

	test("set view & default behavior", function() {
		var leaving = false;
		var transitioning = false;
		
		var page = new Blocks.Page({el: '#qunit-fixture'});
		
		page.on('leaving', function() {
			if (leaving) {
				ok(false, 'leaving triggered multiple times');
			} else {
				ok(true, 'leaving triggered');
			}
			leaving = true;
		});
		page.on('left', function() {
			if (leaving) {
				ok(true, 'leaving triggered after left');
			} else {
				ok(false, 'left triggered but no leaving');
			}
		});
		page.on('transitioning', function() {
			if (transitioning) {
				ok(false, 'transitioning triggered multiple times');
			} else {
				ok(true, 'transitioning triggered');
			}
			transitioning = true;
		});
		page.on('transitioned', function() {
			if (transitioning) {
				ok(true, 'transitioning triggered after left');
			} else {
				ok(false, 'transitioned triggered but no transitioning');
			}
		});
		
		equal(page, Blocks.page, 'page has been automatically set as Blocks.page');
		
		var View1 = Blocks.View.extend({
			templates: {
				template: 'This is view 1'
			}
		});
		var View2 = Blocks.View.extend({
			templates: {
				template: 'This is view 2'
			}
		});

		var el = $('#qunit-fixture');
		page.setView(new View1());
		equal(el.html(), '<div>This is view 1</div>', 'initial view has rendered into DOM');
		
		transitioning = false;
		
		page.setView(new View2());
		equal(el.html(), '<div>This is view 2</div>', 'second view has rendered into DOM');

		equal(transitioning, true, 'We should have transitioned');
		equal(leaving, true, 'We should left a view');
	});
})();
