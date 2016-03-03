
var fs = require('fs');

module.exports = {
	mkdirsSync: function () {

	},
	readdirSync: fs.readdirSync.bind(fs)
};