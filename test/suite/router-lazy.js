(function(env) {
	var Router = Blocks.Router.extend({
		routes: {
			'test/1': 'one',
			'test/2': 'two'
		},

		one: function() {
			env.test1 = true;
		},

		two: function() {
			env.test2 = true;
		}
	});
	new Router();	
})(this);
