(function(env) {
	module('Router');
	
	asyncTest('Module loading', function() {
		var fooCalled = false;
		var catchAllCalled = false;
		var BaseRouter = Blocks.Router.extend({
			timeout: 1000,
			modules: {
				test: {
					routes: ['test/*'],
					scripts: ['suite/router-lazy.js'],
					styles: ['suite/router-lazy.css ']
				}
			},
	
			routes: {
				'foo': 'foo',
				'*wild': 'catchAll'
			},
	
			foo: function() {
				fooCalled = true;
			},
			catchAll: function() {
				catchAllCalled = true;
			}
		});
	
		new BaseRouter();
		Backbone.history.start();
		
		Backbone.history.navigate('foo', true);
		equal(fooCalled, true, "Base router sync loading of defined route");
		Backbone.history.navigate('bar', true);
		equal(catchAllCalled, true, "Base router sync loading of catch-all route");
	
		var moduleLoading = false;
		Blocks.bind('module:loaded', function() {
			equal(env.test1, true, 'async module router method executes directly after module load');
			Backbone.history.navigate('test/2', true);
			equal(env.test2, true, 'async module router method executes after loaded navigate');

			fooCalled = false;
			catchAllCalled = false;
			Backbone.history.navigate('foo', true);
			equal(fooCalled, true, 'base router defined route still working');
			Backbone.history.navigate('bar', true);
			equal(catchAllCalled, true, 'base router catch-all route still working');
			equal($("#qunit-fixture").css('margin'), '20px', 'async module css loading is working');
			start();
		});
		Blocks.bind('module:loading', function() {
			moduleLoading = true;
		});
		Blocks.bind('module:error', function(name, error) {
			throw new Error('module loading error: ' + error);
			start();
		});
		Backbone.history.navigate('test/1', true);
		equal(moduleLoading, true, 'Async module is being loaded');
	});
})(this);
