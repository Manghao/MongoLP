let express = require('express');
let mustache = require('mustache');
let mongoose = require('mongoose');
let ObjectId = require('mongodb').ObjectID;
let fs = require('fs');
let http = require('http');
let https = require('https');
let x2j = require('xml2js');
let app = express();

mongoose.connect('mongodb://localhost:27017/Mongodb', {
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

app.get('/parkings', (req, res) => {
    db.collection("parkingsVoitures").find().toArray((error, results) => {
        if (error) throw error;

        res.send(results);
    });
});

refreshCollection = () => {
    console.log('\t- Reloading database');

    db.collection("parkingsVoitures").remove({});

    https.get('https://geoservices.grand-nancy.org/arcgis/rest/services/public/VOIRIE_Parking/MapServer/0/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=html', (result) => {
        let body = '';
        result.on('data', (data) => {
            body += data;
        })
            .on('end', () => {
                let parser = new x2j.Parser({ explicitArray : false });
                parser.parseString(body, (errParser, resultParser) => {
                	let parkings = resultParser.html.body.div.a;
                	parkings.forEach((park) => {
                        let one = park['$'];
                        one.details = {};

                        https.get(`https://geoservices.grand-nancy.org${one.href}?f=pjson`, (result) => {
                            let body = '';
                            result.on('data', (data) => {
                                body += data;
                            })
                                .on('end', () => {
                                    let parking = JSON.parse(body);
                                    let park = {};
                                    for(let key in parking.feature.attributes) {
                                    	park[key.toLowerCase()] = parking.feature.attributes[key];
									}
                                    park['geometry'] = parking.feature.geometry;
                                    db.collection('parkingsVoitures').insert(park);
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

    /*db.collection("stationsVeloStan").remove({});

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
    });*/
};

app.listen(3000, () => {
    setInterval(refreshCollection, (5 * 60 * 1000));
    console.log("listening on port 3000");
});