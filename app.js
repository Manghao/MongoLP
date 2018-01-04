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
const config = require('./app/config/config');
const Event = require('./app/models/Event');
const AppController = require('./app/controllers/AppController');
const UserController = require('./app/controllers/UserController');
const EventController = require('./app/controllers/EventController');

mongoose.connect('mongodb://' + config.getConfig(), {
    useMongoClient: true,
    promiseLibrary: global.Promise
});
let db = mongoose.connection;

app.use(express.static(__dirname));

app.set('views', __dirname + '/app/views');

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
    if (!req.session.user) {
        UserController.register(req, res);
    } else {
        res.redirect('/');
    }
});

app.post('/createaccount', (req, res) => {
    UserController.createAccount(req, res);
});

app.get('/login', (req, res) => {
    if (!req.session.user) {
        UserController.login(req, res);
    } else {
        res.redirect('/');
    }
});

app.post('/validlogin', (req, res) => {
    UserController.validLogin(req, res);
});

app.get('/logout', (req, res) => {
    if (req.session.user) {
        UserController.logout(req, res);
    } else {
        res.redirect('/');
    }
});

app.get('/account', (req, res) => {
    if (req.session.user) {
        UserController.getAccount(req, res);
    } else {
        res.redirect('/');
    }
});

app.get('/edit', (req, res) => {
    if (req.session.user) {
        UserController.editAccount(req, res);
    } else {
        res.redirect('/');
    }
});

app.post('/update', (req, res) => {
    UserController.update(req, res);
});

app.get('/editpwd', (req, res) => {
    if (req.session.user) {
        UserController.editPwd(req, res);
    } else {
        res.redirect('/');
    }
});

app.post('/updatepwd', (req, res) => {
    UserController.updatePwd(req, res);
});

app.get('/events', (req, res) => {
    EventController.getEvents(req, res);
});

app.get('/events/:id', (req, res) => {
    EventController.getOneEvent(req, res);
});

app.post('/events/:id/addcomment', (req, res) => {
    EventController.addComment(req, res);
});

app.get('/events/:idEvent/deletecomment/:idComment', (req, res) => {
    if (req.session.user) {
        EventController.deleteComment(req, res);
    } else {
        res.redirect('/');
    }
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

    db.collection("events").remove({});
    db.collection("comments").remove({});
    db.collection("parkingsVoitures").remove({});
    db.collection("stationsVeloStan").remove({});

    https.get('https://geoservices.grand-nancy.org/arcgis/rest/services/public/VOIRIE_Parking/MapServer/0/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=pjson', (result) => {
        let body = '';
        result.on('data', (data) => {
            body += data;
        })
		.on('end', () => {
            let parkings = JSON.parse(body).features;
            for (let i = 0; i < parkings.length; i++) {
                let attributes = parkings[i].attributes;
                let geometry = parkings[i].geometry;

                let event = new Event({
                    nom: attributes['NOM'],
                    capacite: attributes['CAPACITE'],
                    places_disponibles: (attributes['PLACES'] == null ? '/' : attributes['PLACES']),
                    id_rue: attributes['ID'],
                    adresse: attributes['ADRESSE'],
                    statut: (attributes['PLACES'] == null ? 'Fermé' : 'Ouvert'),
                    lat: geometry['y'],
                    lng: geometry['x'],
                    type: 'parkingsVoitures'
                });
                event.save();

                let park = {};
                for(let key in attributes) {
                    park[key.toLowerCase()] = attributes[key];
                }
                park['geometry'] = geometry;
                db.collection('parkingsVoitures').insert(park);

            }
        })
        .on('error', (e) => {
            console.log('Error : ' + e.message);
        });
    });

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

                                let event = new Event({
                                    nom: one['name'],
                                    capacite: one.details['total'],
                                    places_disponibles: one.details['free'],
                                    id_rue: one['number'],
                                    adresse: one['address'],
                                    statut: (one['open'] === 0 ? 'Fermé' : 'Ouvert'),
                                    lat: one['lat'],
                                    lng: one['lng'],
                                    type: 'stationsVeloStan'
                                });
                                event.save();
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