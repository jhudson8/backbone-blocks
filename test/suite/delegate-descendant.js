module("Delegates");

test(
				"standard descendant selection",
				function() {
					var el = $('#qunit-fixture');

					el
									.html('<button id="btn1" class="bar"></button>\
						<div class="foo1">\
							<button id="btn2" class="bar"></button>\
							<div class="foo2">\
								<button id="btn3"></button>\
							</div>\
						</div>');
					var count1 = 0;
					var count2 = 0;
					var count3 = 0;

					// match on any button and increment count 1
					el.delegate('button', 'click', undefined, function() {
						count1++;
					});

					// only match on btn2 & btn3 and increment count 2
					el.delegate('.foo1 button', 'click', undefined, function() {
						count2++;
					});

					// only match on btn3 and increment count 3
					el.delegate('.foo2 button', 'click', undefined, function() {
						count3++;
					});

					var btn1 = el.find('#btn1');
					equal(btn1.length, 1, 'valid reference to #btn1');
					btn1.click();
					equal(count1, 1, 'button catch all click handler incremented');
					equal(count2, 0, 'btn2 click handler not incremented');
					equal(count3, 0, 'btn3 click handler not incremented');

					var btn2 = el.find('#btn2');
					equal(btn2.length, 1, 'valid reference to #btn2');
					btn2.click();
					equal(count1, 2, 'button catch all click handler incremented');
					equal(count2, 1, 'btn2 click handler incremented');
					equal(count3, 0, 'btn3 click handler incremented');

					var btn3 = el.find('#btn3');
					equal(btn2.length, 1, 'valid reference to #btn3');
					btn3.click();
					equal(count1, 3, 'button catch all click handler incremented');
					equal(count2, 2, 'btn2 click handler incremented');
					equal(count3, 1, 'btn3 click handler incremented');
				});