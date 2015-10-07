/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 */

$(document).ready(function () {
	var editForm = $('#edit-form');
	editForm.submit(function () {
		$.ajax({
			type: editForm.attr('method'),
			url: editForm.attr('action'),
			data: editForm.serialize(),
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

	var deleteForm = $('#delete-form');
	deleteForm.submit(function () {
		$('#confirm-delete').hide();
		$('#delete-progress').show();

		$.ajax({
			type: deleteForm.attr('method'),
			url: deleteForm.attr('action'),
			data: deleteForm.serialize(),
			success: function (data) {
				window.location.replace(data.redirect);
			}
         });

		return false;
	});
});