var Blocks = {
		templateEngine: {
			loadPath: function(path, view, options) {},
			loadTemplate: function(content, options) {}
		},
		contentProvider: {
			get: function(path, view, options) {},
			isValid: function(path, view) {}
		},
		Defaults: {
			objectManagerClass : undefined,
			modelHandlerClass : undefined,
			collectionHandlerClass : undefined,
			viewHandlerClass : undefined,
			containerCssClass : undefined,
			selectorGenerator : function(options) {},
			autoAddModel : true,
			autoAddCollection : true,
			bubbleCollectionEvents : false,
			bubbleModelEvents : false,
			bubbleViewEvents : false
		},
		Handler: {
			Base: {},
			ModelContextContributor: {},
			CollectionContextContributor: {}
		},
		Template: {
			Underscore: {},
			Handlebars: {}
		},
		Content: {
			HashProvider: {}
		},
		View: {}
};
