/**
 * Simple templates that can either be defined on the view within the
 * 'templates' property or on Blocks.templates. If in Blocks.templates then
 * the view 'package' property will be prefixed to the path. Package segments
 * should be separated with '.'. Each package segment will map to a
 * sub-property within Blocks.templates.
 */
Blocks.Content.HashProvider = Blocks.Handler.Base.extend({
	// lookup order
	// 1) {view}.templates.{view.viewName or view.template}.template (if no path)
	// 2) {view}.templates.{view.viewName or view.template} (if no path)
	// 3) {view}.templates.{view.viewName}.{path} (if path)
	// 4) Blocks.templates.{view.viewPackage}.{view.viewName}.{path}
	
	get : function(path, view, options) {
		var getValue = Blocks.Util.getValue;
		var root = Blocks;
		
		// split the path into parts
		var pathParts = path ? path.split('/') : undefined;
		var viewTemplate = view && getValue(view, 'template');

		// navigate from a root through hash properties
		function navigate(obj, parts) {
			var parent = obj;
			for ( var i = 0; i < parts.length; i++) {
				if (!parent)
					break;
				parent = parent[parts[i]];
			}
			return parent;
		}

		// return a string value from a property value on an object
		function templateVal(obj, prop) {
			if (obj && prop) {
				var rtn = obj[prop];
				if (_.isString(rtn)) {
					return rtn;
				}
			}
		}

		// check all path options from a root which could contain the view
		// template
		function checkPaths(obj, fromView) {
			if (obj) {
				if (!pathParts) {
					var rtn = getValue(obj, viewTemplate) || getValue(obj, view.viewName);
					if (_.isString(rtn)) {
						return rtn;
					} else if (!path && fromView) {
						return obj.template;
					} else if (!path && rtn) {
						return rtn.template;
					}
				} else {
					var parent = navigate(obj, pathParts);
					if (_.isString(parent))
						return parent;
				}
			}
		}

		var rtn;
		// first check view.templates
		if (view && view.templates) {
			rtn = checkPaths(view.templates, true);
		}
		
		// if global, ensure that we use the view name / template as a prefix
		if (pathParts) {
			pathParts.splice(0, 0, view.viewName);
		}

		// then check Block.templates
		if (!rtn && root.templates) {
			var packageParts = (view && view.viewPackage) ? view.viewPackage.split('.') : undefined;
			if (packageParts) {
				var _root = navigate(root.templates, packageParts);
				if (view) {
					if (_root && view && view.viewName) {
						_root = _root[view.viewName];
					}
					if (root && !path) {
						if (_.isString(_root)) {
							return _root;
						}
						else if (_.isString(_root.template)) {
							return _root.template;
						}
					}
				}
				rtn = checkPaths(_root || root.templates);
			} else {
				rtn = checkPaths(_root || root.templates);
			}
		}
		if (options && options.suppressError) {
			return rtn;
		}
		else if (!rtn || !_.isString(rtn)) {
			var err = 'Undefined template ';
			if (path) err += '"' + path + "'";
			if (view) err += ' for view "' + view.viewName + '"';
			throw new Error(err);
		}
		return rtn;
	},

	isValid : function(path, view) {
		return !!this.get(path, view, {suppressError: true});
	}
});