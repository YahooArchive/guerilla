/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 */

$(document).ready(function () {
	var form = $('#create-form');
	form.submit(function () {
		$.ajax({
			type: form.attr('method'),
			url: form.attr('action'),
			data: form.serialize(),
			success: function (data) {
				if (!data.success) {
					$('.form-group').removeClass('has-error');
					$('.err-msg').html('');
					
					var scrollTo;
					data.errors.forEach(function (error) {
						var path = error.path;
						var message = error.message;
						
						path = path.split('.').join('\\.');

						$('#' + path).addClass('has-error');
						$('#' + path + '-error').html(message);

						var y = $('#' + path).position().top;
						if (!scrollTo || y < scrollTo)
							scrollTo = y;
					});

					$('html, body').animate({ scrollTop: scrollTo }, 'slow');
				}
				else {
					window.location.replace(data.redirect);
				}
			}
         });

		return false;
	});
});