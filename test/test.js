$(document).ready(function() {



Pages.ModelHandlers.AutoFieldValue = function(fields) {
	this.fields = fields;
};
_.extend(Pages.ModelHandlers.AutoFieldValue.prototype, Pages.ModelHandlers.BaseElementHandler, {

	inputTemplate: '<div><label><%= label %></label><%= value %></div>',

	events: {
		'parent:rendered': 'render'
	},

	init: function(view, model, options) {
		this.view = view;
		this.model = model;
		this.options = options;
	},

	render: function() {
		var html = this.fields.map(_.bind(this.fieldMarkup, this)).join('');
		var el = this.el = this.getElement();
		el.html(html);
	},

	fieldMarkup: function(data) {
		data.value = this.model.attributes[data.key] || '';
		return _.template(this.inputTemplate, data);
	}
});



Pages.ModelHandlers.AttributeDisplay = function(fields) {
	this.fields = fields;
};
_.extend(Pages.ModelHandlers.AttributeDisplay.prototype, Pages.ModelHandlers.BaseElementHandler, {

	inputTemplate: '<div class="<%= containerClass %>"><label for="<%= id %>"><%= label %></label><input id="<%= id %>" name="<%= key %>" type="text" class="<%= inputClass %>"/><span class="message"></span></div>',

	events: {
		'parent:rendered': 'render'
	},

	init: function(view, model, options) {
		this.view = view;
		this.model = model;
		this.alias = options.alias;
		this.options = options;
		if (_.isUndefined(options.fetch) || options.fetch) {
			if (!model.isPopulated || (!model.isPopulated() && !model.isFetching())) {
				model.fetch(options);
			}
		}

		this.containerClass = 'if-' + this.view.cid;
		this.fields = this.fields.map(_.bind(function(field) {
			if (_.isString(field)) field = {key: field};
			field.label = field.label || field.key;
			field.containerClass = this.containerClass;
			field.inputClass = field.containerClass + '-' + field.key;
			field.id = this.model.id + '-' + field.key;
			return field;
		}, this));

		this.elBind('change', this.options.selector, 'onChange');
	},

	render: function() {
		var html = this.fields.map(_.bind(this.fieldMarkup, this)).join('');
		var el = this.el =this.getElement();
		el.html(html);

		// bind the data
		_.each(this.fields, _.bind(function(data) {
			var selector = '.' + data.inputClass;
			el.find(selector).val(escape(this.model.attributes[data.key] || ''));
		}, this));
	},

	update: function(field) {
		this.el.find(this.containerClass + '-' + field.key)
	},

	onChange: function(event) {
		var el = $(event.srcElement);
		var key = event.srcElement.name;
		var value = el.val();
		var containerClass = this.containerClass;
		var container = el.parent('.' + containerClass);
		function err(model, msg) {
			container.addClass('error');
			container.find('.message').html(msg);
		}
		var options = {error: err};
		var set = {};
		set[key] = value;
		if (this.model.set(set, options)) {
			container.removeClass('error');
			container.find('.message').html('');
		}

	},

	fieldMarkup: function(data) {
		return _.template(this.inputTemplate, data);
	}
});


var View = Pages.View.extend({
	el: '#main',
	template: 'test',
	templates: {
		test: 'hello world!<br><br> <div class="person"></div>'
	},

	initialize: function(args) {
		this.$uper('initialize', arguments);
		this.addModel({
			model: args.person,
			alias: 'person',
			handler: new Pages.ModelHandlers.AutoFieldValue([
				{key: 'firstName', label: 'First Name'},
				{key: 'lastName', label: 'Last Name'}
			]),
			fetch: false
		});
	}
});

var Person = Pages.Model.extend({
		validate: function(attrs) {
			if (attrs.firstName && attrs.firstName.length < 5) {
				return "first name must be at least 5 chars";
			}
		}
});
var view = new View({
	person: new Person(
		{id: '123', firstName: 'Joe', lastName: 'Hudson'}
	)
});
view.render();


/*
	Pages.templates = {
		view1: 'This is view 1 content <button>Click me</button>',
		view2: 'This is view 2 content',
		main: {
			template: 'should be view 1<div class="view1"> </div><br><br>should be view 2<div class="view2"></div> <br><br><div class="items"></div>',
			'items-item': '<%= firstName %> <%= lastName %>',
			'items-empty': 'Nothing to see here',
			'items-loading': 'Loading...'
		}
	}

	var view1 = Pages.View.extend({
		template: 'view1',
		events: {
			'click button': 'onClick'
		},
		onClick: function() {
			this.trigger('clicked');
		}
	});

	var view2 = Pages.View.extend({
		template: 'view2'
	});

	var main = Pages.View.extend({
		el: '#main',
		template: 'main',

		events: {
			view1: {
				'rendered': 'view1Rendered',
				'clicked': 'view1Clicked'
			}
		},

		initialize: function() {
			Pages.View.prototype.initialize.apply(this, arguments);

			var collection = new Pages.Collection();
			collection._fetching = true;
			this.items = this.addCollection('items', collection, {fetch: false, watch: true});

			this.addView('view1', new view1(), {watch: true});
			this.addView('view2', new view2(), {watch: true});
		},
		
		view1Clicked: function() {
			alert('clicked');
		},

		view1Rendered: function() {
			console.log('view 1 rendered');
		}
	});
				
	var main = new main();
	main.render();
	
	setTimeout(function() {
		console.log('add items');
		main.items.add(new Backbone.Model({
			id: '123',
			firstName: 'Joe',
			lastName: 'Hudson'
		}));
		main.items.add(new Backbone.Model({
			id: '234',
			firstName: 'Billy',
			lastName: 'Bob'
		}));
		
		setTimeout(function() {
			console.log('remove single item');
			main.items._populated = true;
			main.items._fetching = false;
			main.items.remove(main.items.at(0));
			
			setTimeout(function() {
				console.log('reset items');
				main.items.reset();
				
				main.destroy();
			}, 1000);
			
		}, 1000);
		
	}, 1000);
*/
});