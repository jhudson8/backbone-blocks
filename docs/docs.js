Blocks.templates = {
	'api-index' : '<div class="sections"></div>',
	'api-section' : '<a class="toc_title" href="#section/{{name}}">{{name}}</a> <ul class="toc_section classes"></div>',
	'api-class' : '<h1 class="page-title">{{name}}</h1> <p>{{linkScan descr}}</p> <ul id="method-list" class="methods method-list"></ul>',
	'api-method' : {
		template : '<li class="api-method">\
				<h2 class="entry-title">.{{name}} ( {{parametersShort}} )</h2>\
				<p class="desc">{{linkScan descr}}</p>\
				<p class="parameters"</p></li>',
		parameters : {
			empty : ''
		}
	},
	'api-parameter' : '<p class="arguement"><strong title="{{type}}">{{name}}</strong>: {{linkScan descr}} </p>',
	'mini-api-index' : '<div class="sections"></div>',
	'mini-api-section' : '<div class="classes"></div>',
	'mini-api-class' : '<a class="toc_title" href="#api/{{name}}">{{name}}</a> <ul class="toc_section methods"></ul>',
	'mini-api-method' : {
		template : '<li><a href="#api/{{methodClass}}#{{name}}">{{name}}</a></li>',
		'parameters-empty' : ''
	}
};

// use a handlebars template engine
Blocks.Defaults.templateEngine = new Blocks.Template.Handlebars();
Blocks.Defaults.collectionHandlerClass = Blocks.Handler.Collection.ItemView;

var linkPattern = /#\{link:([^}|]*)\|?([^}]*)\}/;
Handlebars.registerHelper("linkScan", function(val) {
	if (!val)
		return val;
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
	return (this.options.mini ? 'mini-' : '') + this.viewName;
}

views.Base = Blocks.View.extend({
	modelOptions : function() {
		return _.extend(Blocks.View.prototype.modelOptions.apply(this,
				arguments), {
			fetch : false
		});
	},
	collectionOptions : function() {
		return _.extend(Blocks.View.prototype.collectionOptions.apply(this,
				arguments), {
			fetch : false
		});
	}
});

views.APIIndex = views.Base.extend({
	viewName : 'api-index',
	className : 'api-index',
	template : miniTemplate,

	init : function() {
		this.addCollection('sections', this.options.sections);
	},

	sectionsItem : function(section) {
		return new views.APISection({
			section : section,
			mini : this.options.mini
		});
	}
});

views.APISection = views.Base.extend({
	viewName : 'api-section',
	className : 'api-section',
	template : miniTemplate,

	init : function() {
		this.addModel(this.options.section);
		this.addCollection('classes', this.options.section.classes);
	},

	classesItem : function(clazz) {
		return new views.APIClass({
			clazz : clazz,
			mini : this.options.mini
		});
	}
});

views.APIClass = views.Base.extend({
	viewName : 'api-class',
	className : 'api-class',
	template : miniTemplate,

	events : {
		'rendered' : 'onRendered'
	},

	init : function() {
		this.addModel(this.options.clazz);
		this.addCollection('methods', this.options.clazz.methods);
	},

	onRendered : function() {
		if (this.options.method) {
			_.defer(_.bind(function() {
				var el = this.$('.api-method-' + this.options.method);
				if (el.size()) {
					el.get(0).scrollIntoView();
					el.effect("highlight", {}, 3000);
				}
			}, this));
		}
	},

	methodsItem : function(method) {
		return new views.APIMethod({
			method : method,
			mini : this.options.mini
		});
	}
});

views.APIMethod = views.Base.extend({
	viewName : 'api-method',
	template : miniTemplate,

	init : function() {
		this.$el.addClass('api-method-' + this.options.method.attributes.name);
		this.addModel(this.options.method);
		if (this.options.method.parameters) {
			this.parameters = this.addCollection('parameters',
					this.options.method.parameters);
			this.parametersShort = this.parameters.models.map(function(model) {
				return model.attributes.name
			}).join(', ');
		}
	},

	parametersItem : function(parameter) {
		return new views.APIParameter({
			parameter : parameter,
			mini : this.options.mini
		});
	}
});

views.APIParameter = views.Base.extend({
	viewName : 'api-parameter',
	className : 'api-parameter',
	template : miniTemplate,

	init : function() {
		var param = this.addModel(this.options.parameter);
		param.attributes.type = param.attributes.type || 'string';
	}
});

/** ROUTER* */
var Router = Blocks.Router.extend({

	routes : {
		"api/:class" : "apiClassView"
	},

	apiClassView : function(className) {
		var pattern = /^([^#]*)#(.*)/;
		var method;
		var match = className.match(pattern);
		if (match) {
			className = match[1];
			method = match[2];
		}
		var data = modelData.index[className];
		if (data) {
			var model = new models.Class(data, {
				parse : true
			});
			Blocks.setView(new views.APIClass({
				clazz : model,
				method : method
			}));
		}
	}
});

$(document).ready(function() {
	new Router();
	new Blocks.Page({
		el : '.container'
	});

	apiIndex = new views.APIIndex({
		sections : data.apiSections,
		mini : true,
		el : '#sidebar'
	});
	apiIndex.render();

	Backbone.history.start();
});