/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 */

$(document).ready(function () {

	workers.forEach(function (worker) {
		$.ajax({
			type: 'GET',
			url: '/workers/' + worker.id + '/health',
			success: function (data) {
				var json = JSON.parse(data);
				if (!json['alive'])
					return;
				
				var healthDiv = $('#' + worker.id + '-health');
				healthDiv.removeClass('unavailable-health');
				healthDiv.addClass('available-health');
				healthDiv.text('Available');

				var countDiv = $('#' + worker.id + '-active-jobs');
				countDiv.text('Active Jobs: ' + (json['active'] || 0));
			}
		});
	});

});