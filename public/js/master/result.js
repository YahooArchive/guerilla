/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 */

$(document).ready(function () {

	$.ajax({
		type: 'GET',
		url: window.location.pathname + '/files',
		success: function (data) {
			var files = data.files;

			if (files && files.length > 0) {
				var fileSpan = $('#files');
				files.forEach(function (file) {
					fileSpan.append('<a target="_blank" href="' + window.location.pathname + '/' + file + '">' + file + '</a><br />');
				});
				fileSpan.show();
			}
		}
	});

	$('.tab').on('shown.bs.tab', function (e) {
		var index = $(this).index() - 1;
		if (index < 0) return;
		var selector = '#report-' + index;
		generateReport(result.reports[index], selector);
	});

});