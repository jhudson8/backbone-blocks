QUnit.reset = function() {
	Blocks.resetDefaults();
	Blocks.templates = {};
};

var MockModel = Backbone.Model.extend({
	mockFetching : function() {
		this._fetching = true;
	},
	mockFetched : function() {
		this._fetching = false;
		this._populated = true;
		this.trigger('fetched');
	}
});

var MockCollection = Backbone.Collection.extend({
	mockFetching : function() {
		this._fetching = true;
	},
	mockFetched : function() {
		this._fetching = false;
		this._populated = true;
		this.trigger('fetched');
	}
});