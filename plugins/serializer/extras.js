/**
 * Default handler for serializing and mapping field input values to arrays.
 * This input handler can deal with multi-select, multiple checkboxes and
 * statically defined multiple input fields with the same name.
 */
Blocks.Handler.Field.ListInputHandler = Blocks.Handler.Base.extend({

	/**
	 * Serialize a single input field
	 * 
	 * @param element
	 *          the single DOM element
	 */
	serializeField : function(element) {
		if (element.nodeName === 'SELECT') {
			return this.getSelectValue(element);
		}
	},

	/**
	 * Serialize the input(s) represented by the element(s) to the attributes map
	 * using the provided key
	 * 
	 * @param key
	 *          the attributes map key
	 * @param elements
	 *          array of elements
	 * @param attr
	 *          the attributes hash
	 */
	serialize : function(key, elements, attr) {
		attr = attr || {};
		if (elements.length == 1 && elements[0].nodeName === 'SELECT') {
			attr[key] = this.getSelectValue(elements[0]);
		} else {
			var rtn = [];
			_.each(elements, function(element) {
				var type = element.getAttribute('type');
				var value = element.value;
				if (type && type.toLowerCase() === 'checkbox') {
					if (element.checked)
						rtn.push(value);
				} else {
					rtn.push(value);
				}
			});
			attr[key] = rtn;
		}
		return attr;
	},

	getSelectValue : function(select) {
		var rtn = [];
		for ( var i = 0; i < select.options.length; i++) {
			if (select.options[i].selected) {
				rtn.push(select.options[i].value);
			}
		}
		return rtn;
	},

	/**
	 * Set the element(s) value using the provided value
	 * 
	 * @param key
	 *          the model field key
	 * @param value
	 *          the value to set
	 * @param elements
	 *          the DOM elements associated with the field key
	 */
	setElementValue : function(key, value, elements) {
		var size = elements.length;
		if (!size || _.isUndefined(value)) {
			return;
		}

		if (elements.length == 1 && elements[0].nodeName === 'SELECT') {
			var options = elements[0].options;
			for ( var i = 0; i < options.length; i++) {
				// indexOf isn't universally available
				var selected = false;
				for ( var j = 0; j < value.length; j++) {
					if (value[j] == options[i].value) {
						selected = true;
						break;
					}
				}
				options[i].selected = selected;
			}
		} else {
			for ( var j = 0; j < elements.length; j++) {
				var el = elements[j];
				var type = (el.getAttribute('type') || 'text').toLowerCase();
				if (type === 'checkbox') {
					var checked = false;
					for ( var k = 0; k < value.length; k++) {
						if (value[k] == el.value) {
							checked = true;
							break;
						}
					}
					el.checked = checked;
				} else {
					el.value = value[j];
				}
			}
		}
	}
});

// add the list type serializer for any fields with data-type="list"
Blocks.serializer.add({
	namingStrategy : new Blocks.Handler.Field.SimpleNamingStrategy({
		dataType : 'list'
	}),
	inputHandler : new Blocks.Handler.Field.ListInputHandler()
})

// add the true/fasle type serializer for any fields with data-type="tf"
// for multiple radio buttons with values of "true" and "false"
.add({
	namingStrategy : new Blocks.Handler.Field.SimpleNamingStrategy({
		dataType : 'tf'
	}),
	inputHandler : new Blocks.Handler.Field.SimpleInputHandler()
});
