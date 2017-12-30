let Twig = require("twig");

exports.getHome = (req, res) => {
    res.render('index/index.twig');
};

exports.getMap = (req, res) => {
    res.render('map/map.twig');
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