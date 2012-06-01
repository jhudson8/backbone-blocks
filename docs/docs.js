Pages.templates = {
	'api-index':
			'<div class="sections"></div>',
	'api-section':
			'<div class="section-label">{{name}}</div> <div class="classes"></div>',
	'api-class':
			'<div class="class-label">{{name}}</div> <p>{{linkScan descr}}</p> <div class="methods-text">Methods</div><div class="methods"></div>',
	'api-method': {
		template: '<div class="method-label method-{{name}}">{{name}}</div> <p class="description">{{linkScan descr}}</p> <div class="parameters"></div>',
		'parameters-empty': 'there are no parameters'
	},
	'api-parameter':
			'<div class="parameter-label">{{name}} (<span class="type"></span>)</div> <p class="description">{{linkScan descr}}</p>',

	'mini-api-index':
			'<div class="sections mini"></div>',
	'mini-api-section':
			'<div class="section-label">{{name}}</div> <div class="classes"></div>',
	'mini-api-class':
			'<div class="class-label"><a href="#api/{{name}}">{{name}}</a></div> <div class="methods"></div>',
	'mini-api-method': {
		template: '<div class="method-label"><a href="#api/{{methodClass}}#{{name}}">{{name}}</a> ( {{parametersShort}} )</div>',
		'parameters-empty': 'there are no parameters'
	},
}

// use a handlebars template engine
Pages.Defaults.templateEngine = {
	load: function(content) {
		return Handlebars.compile(content);
	}
}
var linkPattern = /#\{link:([^}|]*)\|?([^}]*)\}/;
Handlebars.registerHelper("linkScan", function(val) {
	if (!val) return val;
	var match;
	while (match = val.match(linkPattern)) {
		var link = '<a href="#api/' + match[1] + '">';
		if (match[2]) {
			link += match[2];
		} else {
			link += match[1];
		}
		link += '</a>';
		val = val.replace(match[0], link);
	}
	return new Handlebars.SafeString(val);
});

var views = {};
function miniTemplate() {
	return (this.options.mini ? 'mini-' : '') + this.name
}

views.Base = Pages.View.extend({
	modelOptions: function() {
		return _.extend(Pages.View.prototype.modelOptions.apply(this, arguments), {fetch: false});
	},
	collectionOptions: function() {
		return _.extend(Pages.View.prototype.collectionOptions.apply(this, arguments), {fetch: false});
	}
});

views.APIIndex = views.Base.extend({
	name: 'api-index',
	className: 'api-index',
	template: miniTemplate,
	
	init: function() {
		this.addCollection('sections', this.options.sections);
	},

	sectionsItem: function(section) {
		return new views.APISection({section: section, mini: this.options.mini});
	}
});

views.APISection = views.Base.extend({
	name: 'api-section',
	className: 'api-section',
	template: miniTemplate,

	init: function() {
		this.addModel(this.options.section);
		this.addCollection('classes', this.options.section.classes);
	},

	classesItem: function(clazz) {
		return new views.APIClass({clazz: clazz, mini: this.options.mini});
	}
});

views.APIClass = views.Base.extend({
	name: 'api-class',
	className: 'api-class',
	template: miniTemplate,
	
	events: {
		'rendered': 'onRendered'
	},

	init: function() {
		this.addModel(this.options.clazz);
		this.addCollection('methods', this.options.clazz.methods);
	},
	
	onRendered: function() {
		if (this.options.method) {
			var el = this.$('.method-' + this.options.method);
			if (el.size()) {
				el.get(0).scrollIntoView();
				// el.effect("highlight", {}, 3000);
			}
		}
	},

	methodsItem: function(method) {
		return new views.APIMethod({method: method, mini: this.options.mini});
	}
});

views.APIMethod = views.Base.extend({
	name: 'api-method',
	className: 'api-method',
	template: miniTemplate,

	init: function() {
		this.addModel(this.options.method);
		if (this.options.method.parameters) {
			this.parameters = this.addCollection('parameters', this.options.method.parameters);
			this.parametersShort = this.parameters.models.map(function(model) { return model.attributes.name } ).join(', ');
		}
	},

	parametersItem: function(parameter) {
		return new views.APIParameter({parameter: parameter, mini: this.options.mini});
	}
});

views.APIParameter = views.Base.extend({
	name: 'api-parameter',
	className: 'api-parameter',
	template: miniTemplate,

	init: function() {
		this.addModel(this.options.parameter);
	}
});

/** ROUTER**/
var Router = Backbone.Router.extend({

  routes: {
    "api/:class": "apiClassView"
  },

  apiClassView: function(className) {
  	var pattern = /^([^#]*)#(.*)/;
  	var method;
  	var match = className.match(pattern);
  	if (match) {
	  	className = match[1];
	  	method = match[2];
  	}
  	var data = modelData.index[className];
  	if (data) {
  		var model = new models.Class(data, {parse: true});
		  this.setView(new views.APIClass({clazz: model, method: method}));
		 }
  },

  setView: function(view) {
	  if (this.view) this.view.destroy();
	  this.view = view;
	  view.render();
	  $('.page').html('');
	  $('.page').append(view.el);
	  window.scrollTo(0, 0);
  }
});


$(document).ready(function() {
	new Router();

	apiIndex = new views.APIIndex({sections: data.apiSections, mini: true, el: '#sidebar'});
	apiIndex.render();

	Backbone.history.start();
});