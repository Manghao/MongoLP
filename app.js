let express = require('express');
let mustache = require('mustache');
let mongoose = require('mongoose');
let ObjectId = require('mongodb').ObjectID;
let fs = require('fs');
let http = require('http');
let x2j = require('xml2js');
let app = express();

mongoose.connect('mongodb://192.168.99.100:27017/tdmongo', {
	useMongoClient: true,
	promiseLibrary: global.Promise
});
let db = mongoose.connection;

app.use(express.static(__dirname));

require.extensions['.html'] = (module, filename) => {
	module.exports = fs.readFileSync(filename, 'utf8');
};

app.get('/',(req, res) => {
	refreshCollection();
	const template = require('./app/views/layouts/template.html');
	res.send(mustache.render(template));
});

app.get('/stations', (req, res) => {
	db.collection("stationsVeloStan").find().toArray((error, results) => {
		if (error) throw error;

		res.send(results);
	});
});

refreshCollection = () => {
	console.log('\t- Reloading database');

	db.collection("stationsVeloStan").remove({});
	
	http.get('http://www.velostanlib.fr/service/carto', (result) => {
		let body = '';
		result.on('data', (data) => {
			body += data;
		})
		.on('end', () => {
			let parser = new x2j.Parser({ explicitArray : false });
			parser.parseString(body, (errParser, resultParser) => { 
				let stations = resultParser.carto.markers.marker;
				stations.forEach((station) => {
					let one = station['$'];
					one.details = {};

					http.get(`http://www.velostanlib.fr/service/stationdetails/nancy/${one.number}`, (result) => {
						let body = '';
						result.on('data', (data) => {
							body += data;
						})
						.on('end', () => {
							let parser = new x2j.Parser({ explicitArray : false });
							parser.parseString(body, (errParser, resultParser) => { 
								one.details = resultParser.station;
								db.collection('stationsVeloStan').insert(one);
							});
						})
						.on('error', (e) => {
							console.log('Error : ' + e.message);
						});
					});
				});
			});
		})
		.on('error', (e) => {
			console.log('Error : ' + e.message);
		});
	});
}

app.listen(3000, () => {
	setInterval(refreshCollection, (5 * 60 * 1000));
	console.log("listening on port 3000");
});