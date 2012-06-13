(function() {
	module("JQuery UI Mixin");

	test("Single option configuration", function() {
			var JQueryMixin = Blocks.Mixin.JQuery.extend({
				components : {
					'datepicker .date' : {
						numberOfMonths : 3,
						showButtonPanel : true
					}
				}
			});

			var View = Blocks.View.extend({
				templates: {
					template: '<input type="text" class="date"/>'
				},
				init : function() {
					this.mixin(new JQueryMixin());
				}
			});
			var view = new View();
			view.render();

			equal(view.$el.find('.date').attr('class'), 'date hasDatepicker', 'The jquery component has been initiated');
	});

	test("Multiple option configuration", function() {
		var JQueryMixin = Blocks.Mixin.JQuery.extend({
			components : {
				'datepicker .date' : {
					subtypes: true,
					'[data-type="3mo"]' : {
						numberOfMonths : 3,
						showButtonPanel : true
					}
				}
			}
		});

		var View = Blocks.View.extend({
			templates: {
				template: '<input type="text" class="date"/><input type="text" class="date" data-type="3mo"/>'
			},
			init : function() {
				this.mixin(new JQueryMixin());
			}
		});
		var view = new View();
		view.render();

		equal(view.$el.find('.date')[0].getAttribute('class'), 'date', 'The jquery component did not initialize for the invalid selector');
		equal(view.$el.find('.date')[1].getAttribute('class'), 'date hasDatepicker', 'The jquery component was initialized for the sub-selector');
});
	
})();
