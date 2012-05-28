$(document).ready(function() {

	Pages.templates = {
		sub: 'This is the sub-view: <%= value %>',
		main: 'This is the main view <br><br/> <div id="subView"></div>'
	}

	var SubView = Pages.View.extend({
		template: 'sub'
	});

	var MainView = Pages.View.extend({
		el: '#example',
		template: 'main',

		initialize: function() {
			this.$uper('initialize', arguments);

			var subView = this.addView({
				view: new SubView({value: 'Hello World'}),
				selector: '#subView'
			});
		}
	});
	
	var main = new MainView();
	main.render();
});