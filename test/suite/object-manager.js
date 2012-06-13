(function() {
	module("Object Manager");

	var ModelChangeHandler = function() {
	};
	_.extend(ModelChangeHandler.prototype, {
		events : {
			'$window resize' : 'onWindowResize',
			'!parent:rendered' : 'onRendered',
			foo : {
				event2 : 'onEvent2',
				bar : {
					event3 : 'onEvent3'
				}
			},
			'click button' : 'onClick'
		},
		onRendered : function() {
			this.parent.loadedRender = true;
		},
		onEvent2 : function() {
			this.parent.event2 = true;
		},
		onEvent3 : function() {
			this.parent.event3 = true;
		},
		onClick : function() {
			this.parent.clicked = true;
		},
		onWindowResize : function() {
			this.parent.resized = true;
		},
	});

	test("exec", function() {
		function handler(rtn) {
			this.doRtn = function() {
				return rtn;
			};
		}

		var parent = {};
		var mgr = new Blocks.ObjectManager(parent);
		mgr.add('foo', {
			foo : {},
			handler : new handler(true)
		});
		mgr.add('foo', {
			foo : {},
			handler : new handler("test")
		});
		mgr.add('bar', {
			bar : {},
			handler : new handler(0)
		});
		mgr.add('bar', {
			bar : {},
			handler : new handler(false)
		});

		var rtn = mgr.exec('foo', 'doRtn');
		equal(rtn.total, 2, 'valid total for all "foo" responders');
		equal(rtn.responded, 2, 'valid count of "foo" responders');
		equal(rtn.all(true), false, 'all(true) response when not all true');
		equal(rtn.all(true, true), true, 'all(true, true) response when all are truthy');
		equal(rtn.all(false), false, 'all(false) response when not all are false');
		equal(rtn.all(false, true), false, 'all(false, false) response when not all are falsy');

		equal(rtn.any(true), true, 'any(true) response when at leaast 1 is true');
		equal(rtn.any(true, true), true, 'any(true, true) response when at leaast 1 is truthy');
		equal(rtn.any(false), false, 'any(false) response when none are true');
		equal(rtn.any(false, true), false, 'any(false) response when none are truthy');

		rtn = mgr.exec('bar', 'doRtn');
		equal(rtn.total, 2, 'valid total for all "bar" responders');
		equal(rtn.responded, 2, 'valid count of "bar" responders');
		equal(rtn.all(true), false), 'all(true) response when not all true';
		equal(rtn.all(true, true), false, 'all(true, true) response when not all are truthy');
		equal(rtn.all(false), false, 'all(false) response when not all are false');
		equal(rtn.all(false, true), true, 'all(false) response when all are falsy');

		equal(rtn.any(true), false, 'any(true) response none are true');
		equal(rtn.any(true, true), false, 'any(true) response when none are truthy');
		equal(rtn.any(false), true, 'any(false) response when all are false');
		equal(rtn.any(false, true), true, 'any(false) response when all are falsy');

		rtn = mgr.exec(undefined, 'doRtn');
		equal(rtn.total, 4, 'valid total for all responders');
		equal(rtn.responded, 4, 'valid count of responders');
		equal(rtn.all(true), false, 'all(true) response when not all true');
		equal(rtn.all(true, true), false, 'all(true, true) response when not all are truthy');
		equal(rtn.all(false), false, 'all(false) response when not all are false');
		equal(rtn.all(false, true), false, 'all(false) response when all are falsy');

		equal(rtn.any(true), true, 'any(true) response when at leaast 1 is true');
		equal(rtn.any(true, true), true, 'any(true, true) response when at leaast 1 is truthy');
		equal(rtn.any(false), true, 'any(false) response when at least 1 is false');
		equal(rtn.any(false, true), true, 'any(false) response when at least 1 is falsy');
	});

	test(
					"events",
					function() {

						var model = new MockModel();
						model.mockFetching();

						var View = Blocks.View
										.extend({
											viewName : 'foo',
											templates : {
												foo : 'outer content <button class="btn1">non-handled button</button> <div class="sub-content"><button class="btn2">click me</button></div>'
											},
											init : function(options) {
												this.addModel(options.mock, {
													alias : 'sub-content',
													handler : new ModelChangeHandler()
												});

											}
										});

						var view = new View({
							mock : model
						});
						equal(!!view.event2, false, "Initial state: event2");
						equal(!!view.event3, false, "Initial state: event3");

						view.render();
						equal(!!view.loadedRender, false, "Deferred render-bound handler event hasn't fired");
						model.mockFetched();
						equal(!!view.loadedRender, true,
										"Render-bound event binding only runs after rendering and loaded object");
						model.trigger('foo:event2');
						equal(!!view.event2, true, "Testing 2 level event hierarchy");
						model.trigger('foo:bar:event3');
						equal(!!view.event3, true, "Testing 3 level event hierarchy");

						var btn1 = view.$el.find('.btn1');
						equal(btn1.size(), 1, "Verify btn1 existance");
						btn1.click();
						equal(!!view.clicked, false,
										"Elements matched by event should not be enabled if outside of selector");
						view.clicked = false;
						var btn2 = view.$el.find('.btn2');
						equal(btn2.size(), 1, "Verify btn2 existance");
						btn2.click();
						equal(!!view.clicked, true,
										"Element bindings filtered by selector should be enabled for handler");

						equal(view.resized, undefined, 'Window has not been resized');
						$(window).resize();
						equal(view.resized, true, 'Window has been resized');
						view.resized = false;

						view.destroy();
						$(window).resize();
						equal(view.resized, false, 'Window has been resized but we did');

						view.event2 = false;
						view.event3 = false;
						model.trigger('foo:event2');
						equal(!!view.event2, false, "Model binding is off after destroy");
						model.trigger('foo:bar:event3');
						equal(!!view.event3, false, "Model binding is off after destroy (another)");
					});

	test("destroy", function() {
		var view = new Blocks.View();
		var model = new Backbone.Model();
		var destroyed = false;
		var handler = {
			events : {
				'!parent:rendered' : 'dummy',
				'click button' : 'dummy'
			},
			destroy : function() {
				destroyed = true;
			},
			dummy : function() {
			}
		};

		view.addModel(model, {
			handler : handler
		});
		equal(handler.options._data.bindings.length, 3, 'All bindings got cached to be destroyed later');
		var destroyCount = 0;
		for ( var i = 0; i < handler.options._data.bindings.length; i++) {
			handler.options._data.bindings[i] = function() {
				destroyCount++;
			};
		}
		view.destroy();
		equal(destroyed, true, 'The binding destroy callback was called');
		equal(destroyCount, 3, 'All entries in list were destroyed');
	});
})();
