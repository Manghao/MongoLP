let express = require('express');
let mongoose = require('mongoose');
let ObjectId = require('mongodb').ObjectID;
let fs = require('fs');
let http = require('http');
let https = require('https');
let x2j = require('xml2js');
let app = express();
let session = require('express-session');
let flash = require('connect-flash');

const bodyParser = require('body-parser');
const config = require('./config/config');
const AppController = require('./controllers/AppController');
const UserController = require('./controllers/UserController');

mongoose.connect('mongodb://' + config.getConfig(), {
    useMongoClient: true,
    promiseLibrary: global.Promise
});
let db = mongoose.connection;

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ cookie: { maxAge: 60000 },
    secret: 'woot',
    resave: false,
    saveUninitialized: false}));
app.use(flash());

app.get('/',(req, res) => {
    AppController.getHome(req, res);
});

app.get('/register', (req, res) => {
    UserController.register(req, res);
});

app.post('/createAccount', (req, res) => {
    UserController.createAccount(req, res);
});

app.get('/login', (req, res) => {
    UserController.login(req, res);
});

app.post('/validLogin', (req, res) => {
    UserController.validLogin(req, res);
});

app.get('/map',(req, res) => {
    refreshCollection();
    AppController.getMap(req, res);
});

app.get('/stations', (req, res) => {
    AppController.getStations(db, req, res);
});

app.get('/parkings', (req, res) => {
    AppController.getParkings(db, req, res);
});

refreshCollection = () => {
    console.log('\t- Reloading database');

    db.collection("parkingsVoitures").remove({});

    https.get('https://geoservices.grand-nancy.org/arcgis/rest/services/public/VOIRIE_Parking/MapServer/0/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=pjson', (result) => {
        let body = '';
        result.on('data', (data) => {
            body += data;
        })
		.on('end', () => {
            let parkings = JSON.parse(body).features;
            for (let i = 0; i < parkings.length; i++) {
                let park = {};
                for(let key in parkings[i].attributes) {
                    park[key.toLowerCase()] = parkings[i].attributes[key];
                }
                park['geometry'] = parkings[i].geometry;
                db.collection('parkingsVoitures').insert(park);
            }
        })
        .on('error', (e) => {
            console.log('Error : ' + e.message);
        });
    });

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
};

app.listen(3000, () => {
    setInterval(refreshCollection, (5 * 60 * 1000));
    console.log("listening on port 3000");
});