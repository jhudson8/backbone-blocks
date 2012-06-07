module("Object Manager");

var Model = Backbone.Model.extend({
	mockFetching: function() {
		this._fetching = true;
	},
	mockFetched: function() {
		this._fetching = false;
		this._populated = true;
		this.trigger('fetched');
	}
});

var ModelChangeHandler = function(){};
_.extend(ModelChangeHandler.prototype, {
	events: {
		'*parent:rendered': 'onRendered',
		foo: {
			event2: 'onEvent2',
			bar: {
				event3: 'onEvent3'
			}
		},
		'click button': 'onClick'
	},
	onRendered: function() {
		this.parent.loadedRender = true;
	},
	onEvent2: function() {
		this.parent.event2 = true;
	},
	onEvent3: function() {
		this.parent.event3 = true;
	},
	onClick: function() {
		this.parent.clicked = true;
	}
});

test("exec", function() {
	function handler(rtn) {
		this.doRtn = function() {
			return rtn;
		}
	}
	
	var parent = {};
	var mgr = new Blocks.ObjectManager(parent);
	mgr.add('foo', {
		alias: '1',
		foo: {},
		handler: new handler(true)
	});
	mgr.add('foo', {
		alias: '2',
		foo: {},
		handler: new handler("test")
	});
	mgr.add('bar', {
		alias: '1',
		bar: {},
		handler: new handler(0)
	});
	mgr.add('bar', {
		alias: '2',
		bar: {},
		handler: new handler(false)
	});
	
	var rtn = mgr.exec('foo', 'doRtn');
	equal(rtn.total, 2);
	equal(rtn.responded, 2);
	equal(rtn.all(true), false);
	equal(rtn.all(true, true), true);
	equal(rtn.all(false), false);
	equal(rtn.all(false, true), false);

	equal(rtn.any(true), true);
	equal(rtn.any(true, true), true);
	equal(rtn.any(false), false);
	equal(rtn.any(false, true), false);

	rtn = mgr.exec('bar', 'doRtn');
	equal(rtn.total, 2);
	equal(rtn.responded, 2);
	equal(rtn.all(true), false);
	equal(rtn.all(true, true), false);
	equal(rtn.all(false), false);
	equal(rtn.all(false, true), true);

	equal(rtn.any(true), false);
	equal(rtn.any(true, true), false);
	equal(rtn.any(false), true);
	equal(rtn.any(false, true), true);

	rtn = mgr.exec(undefined, 'doRtn');
	equal(rtn.total, 4);
	equal(rtn.responded, 4);
	equal(rtn.all(true), false);
	equal(rtn.all(true, true), false);
	equal(rtn.all(false), false);
	equal(rtn.all(false, true), false);

	equal(rtn.any(true), true);
	equal(rtn.any(true, true), true);
	equal(rtn.any(false), true);
	equal(rtn.any(false, true), true);
});

test("events", function() {
	
	var model = new Model();
	model.mockFetching();
	
	var View = Blocks.View.extend({
		template: 'foo',
		templates: {
			foo: 'outer content <button class="btn1">non-handled button</button> <div class="sub-content"><button class="btn2">click me</button></div>'
		},
		init: function(options) {
			this.addModel('foo', options.mock, {
				alias: 'sub-content',
				handler: new ModelChangeHandler()});
			
		}
	});
	
	var view = new View({mock: model});
	equal(!!view.event2, false, "Initial state: event2");
	equal(!!view.event3, false, "Initial state: event3");
	
	view.render();
	equal(!!view.loadedRender, false, "Deferred render-bound handler event hasn't fired");	
	model.mockFetched();
	equal(!!view.loadedRender, true, "Render-bound event binding only runs after rendering and loaded object");
	model.trigger('foo:event2');
	equal(!!view.event2, true, "Testing 2 level event hierarchy");
	model.trigger('foo:bar:event3');
	equal(!!view.event3, true, "Testing 3 level event hierarchy");
	
	var btn1 = view.$el.find('.btn1');
	equal(btn1.size(), 1, "Verify btn1 existance");
	btn1.click();
	equal(!!view.clicked, false, "Elements matched by event should not be enabled if outside of selector");
	view.clicked = false;
	var btn1 = view.$el.find('.btn1');
	equal(btn1.size(), 1, "Verify btn2 existance");
	btn1.click();
	equal(!!view.clicked, true, "Element bindings filtered by selector should be enabled for handler");
});