exports.getHome = (req, res) => {
    res.render('index/home.twig', { auth: req.session.user, success: req.flash().success });
};

exports.getMap = (req, res) => {
    res.render('map/map.twig', { auth: req.session.user });
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