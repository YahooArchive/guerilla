/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 */

var moment = require('moment');
var changeCase = require('change-case');

function getTitle (key) {
	if (key === 'number')
		return 'Result #';
	else 
		return changeCase.titleCase(key);
}

function getValue (key, result) {
	if (key === 'number' || key === 'id') {
		return result[key];
	}
	else if (key === 'queued' || key === 'started' || key === 'finished') {
		var date = result[key];
		if (date)
			return moment(date).format('M/D/YY h:mm:ss A');
		else
			return '';
	}
	else if (key === 'queue_time') {
		if (result.started)	return utils.formatMilliseconds(result[key]);
		else return utils.formatMilliseconds(moment().diff(result.queued));
	}
	else if (key === 'run_time') {
		if (result.started && result.finished) return utils.formatMilliseconds(result[key]);
		else if (result.started && !result.finished) return utils.formatMilliseconds(moment().diff(result.started));
		else return '';
	}
	else {
		return (utils.exists(result.data[key])) ? result.data[key] : null;
	}
}

function getHref (job, result) {
	return '/jobs/' + job.id + '/results/' + result.number;
}

function getFileUrl (file) {
	return window.location.pathname + '/' + file;
}

function generateTableForJob (config, selector) {
	//create table
	var table = $(document.createElement('table'));
	table.addClass('table table-hover');

	//create table header
	var thead = $(document.createElement('thead'));
	var tr = $(document.createElement('tr'));
	config.series.forEach(function (key) {
		var th = $(document.createElement('th'));
		th.text(getTitle(key));
		tr.append(th);
	});
	thead.append(tr);
	table.append(thead);

	//create table body
	var tbody = $(document.createElement('tbody'));
	for (var i = config.results.length - 1; i >= 0; i--) {
		var result = config.results[i];
		var tr = $(document.createElement('tr'));

		if (result.status === 'queued') tr.addClass('active');
		else if (result.status === 'running') tr.addClass('info');
		else if (result.status === 'success') tr.addClass('success');
		else if (result.status === 'failure') tr.addClass('danger');
		else tr.addClass('warning');

		tr.addClass('clickable-row');
		tr.attr('href', getHref(config.job, result));

		config.series.forEach(function (key) {
			var td = $(document.createElement('td'));
			td.text(getValue(key, result) || '');
			tr.append(td);
		});

		tbody.append(tr);
	}
	table.append(tbody);

	$(selector).html(table);
	$(selector).attr('height', '100%');
	$(selector).css('height', '100%');

	$('.clickable-row').click(function () {
		window.document.location = $(this).attr('href');
	});
}

function generateTableForFile (config, selector) {
	$.get(getFileUrl(config.file), function (data) {
		var rows = data.trim().split('\n');
		var headers = rows.shift().split(',');

		//create table
		var table = $(document.createElement('table'));
		table.addClass('table table-hover');

		//create table header
		var thead = $(document.createElement('thead'));
		var tr = $(document.createElement('tr'));
		headers.forEach(function (header) {
			var th = $(document.createElement('th'));
			th.text(getTitle(header));
			tr.append(th);
		});
		thead.append(tr);
		table.append(thead);

		//create table body
		var tbody = $(document.createElement('tbody'));
		rows.forEach(function (row) {
			var tr = $(document.createElement('tr'));
			row = row.split(',');
			row.forEach(function (col) {
				var td = $(document.createElement('td'));
				td.text(col);
				tr.append(td);
			});
			tbody.append(tr);
		});
		table.append(tbody);

		$(selector).html(table);
		$(selector).attr('height', '100%');
		$(selector).css('height', '100%');
	});
}

function generateTable (config, selector) {
	if (config.job)
		generateTableForJob(config, selector);
	else if (config.file)
		generateTableForFile(config, selector);
	else
		generateErrorMessage(selector);
}

function getSharedHighchartsData (config) {
	var data = {
		chart: {
			zoomType: 'x'
		},
        title: {
            text: getTitle(config.title)
        },
        tooltip: {
		    crosshairs: [true, true],
		    useHTML: true
		},
        yAxis: {
            title: {
                text: config.y_axis_label || ''
            },
            labels: {
                format: '{value}'
            }
        },
        plotOptions: {
            line: {
	            connectNulls: false
	        }
        }
    };

    if (config.thresholds) {
    	data.yAxis.plotLines = [];
    	for (var key in config.thresholds) {
    		data.yAxis.plotLines.push({
    			value: config.thresholds[key],
    			color: 'black',
                width: 2,
                zIndex: 100,
                label: {
                    text: key
                }
    		});
    	}
    }

    return data;
}

function appendHighchartsDataForJob (data, config) {
	var categories = [];
	var series = [];
	config.series.forEach(function (s) {
		series.push({
			key: s,
			name: getTitle(s),
			data: []
		});
	});
	config.results.forEach(function (result) {
		categories.push(result.number.toString());
		series.forEach(function (s) {
			var value = getValue(s.key, result);
			s.data.push((utils.exists(value)) ? Number(value) : null);
		});
	});

	data.series = series;
	data.xAxis = {
        categories: categories,
        title: {
        	text: getTitle('number')
        }
    };
    data.tooltip.formatter = function () {
    	var result = config.results[this.key - 1];
    	var html = '';
    	html += '<span style="font-size: 10px">' + result.number + ' - ' + getTitle(result.status) + '</span><br/>';
    	html += '<span style="font-size: 10px">' + moment(result.started).format('M/D/YY, h:mm:ss A') + '</span><br/>';
    	html += '<span style="color: ' + this.point.color + '">●</span> ' + this.series.name + ': <b>' + this.y + '</b><br/>';
    	return html;
    };
    data.plotOptions.series = {
        cursor: 'pointer',
        point: {
            events: {
                click: function () {
                	var url = getHref(config.job, config.results[this.category - 1]);
                	window.document.location = url;
                }
            }
        }
    };

    return data;
}

function appendHighchartsDataForFile (data, config, callback) {
	$.get(getFileUrl(config.file), function (file) {
		data.data = {
			csv: file
		};

		data.xAxis = {
            title: {
            	text: config.x_axis_label || ''
            }
        };

	    callback(data);
	});
}

function getHighchartsData (config, callback) {
	var data = getSharedHighchartsData(config);

    if (config.job)
        callback(appendHighchartsDataForJob(data, config));
	else if (config.file)
		appendHighchartsDataForFile(data, config, callback);
	else 
		callback(null);
}

function generateHighChart (type, config, selector) {
	var data = getHighchartsData(config, function (data) {
		if (!data)
			return generateErrorMessage(selector);

		data.chart.type = type;
		$(selector).highcharts(data);
	});
}

function generateErrorMessage (selector) {
	$(selector).html($(document.createElement('h3')).text('Unable to generate report.'));
}

function generateReport (config, selector) {
	try {
		if (config.type === 'table')
			generateTable(config, selector);
		else if (config.type === 'bar')
			generateHighChart('column', config, selector);
		else if (config.type === 'line')
			generateHighChart('line', config, selector);
		else
			generateErrorMessage(selector);
	}
	catch (ex) {
		console.log(ex.stack);
		generateErrorMessage(selector);
	}
}

function generateReportForJob (job, config, selector) {
	config.job = { id: job.id };
	config.results = job.results;
	generateReport(config, selector);
}