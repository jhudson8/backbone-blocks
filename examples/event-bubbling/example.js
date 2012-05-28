$(document).ready(function() {

	Pages.templates = {
		sub: 'This is the sub-view: <button>Click me</button>',
		main: 'This is the main view <br><br/> <div id="subView"></div> <br><br> <div id="feedback"></div>'
	}

	var SubView = Pages.View.extend({
		template: 'sub',
		events: {
			'click button': 'onClick'
		},
		onClick: function() {
			this.trigger('clicked');
		}
	});

	var MainView = Pages.View.extend({
		el: '#example',
		template: 'main',
		
		events: {
			'myView:clicked': 'onSubViewClicked'
		},

		initialize: function() {
			this.$uper('initialize', arguments);

			var subView = this.addView({
				view: new SubView({value: 'Hello World'}),
				selector: '#subView',
				alias: 'myView'
			});
		},

		onSubViewClicked: function() {
			this.$('#feedback').html('Sub view was clicked!');
		}
	});
	
	var main = new MainView();
	main.render();
});