/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 */

$(document).ready(function () {
	if (job.reports && job.reports.length > 0) {
		var selector = '#report-0';
		generateReportForJob(job, job.reports[0], selector);
	}

	$('.tab').on('shown.bs.tab', function (e) {
		var index = $(this).index();
		var selector = '#report-' + index;
		generateReportForJob(job, job.reports[index], selector);
	});
});