let mustache = require('mustache');

exports.getApi = (req, res) => {
    const template = require('../views/layouts/template.html');
    res.send(mustache.render(template));
};

exports.getStations = (db, req, res) => {
    db.collection("stationsVeloStan").find().toArray((error, results) => {
        if (error) throw error;

        res.send(results);
    });
};

exports.getParkings = (db, req, res) => {
    db.collection("parkingsVoitures").find().toArray((error, results) => {
        if (error) throw error;

        res.send(results);
    });
};