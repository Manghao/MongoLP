let Twig = require("twig");
let validator = require('validator');
let xss = require('xss');

const User = require('../models/User');

exports.register = (req, res) => {
    let error = req.flash().error;
    if (error === undefined) {
        res.render('user/register.twig');
    } else {
        res.render('user/register.twig', { error: error[0] });
    }
};

exports.createAccount = (req, res) => {
    let firstName = xss(req.body.first_name);
    let lastName = xss(req.body.last_name);
    let email = xss(req.body.email);
    let password = xss(req.body.password);
    let passwordConfirm = xss(req.body.password_confirm);

    if (validator.isAlpha(firstName)) {
        if (validator.isAlpha(lastName)) {
            if (validator.isEmail(email)) {
                if (validator.equals(password, passwordConfirm)) {
                    let newUser = new User({
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        password: password
                    });

                    return User.findOne({ email: email }, (err, existingUser) => {
                        if (existingUser) {
                            req.flash('error', 'L\'email rentré est déjà utilisé !');
                            return res.redirect('register');
                        } else {
                            newUser.save();
                            return res.redirect('/');
                        }
                    });
                } else {
                    req.flash('error', 'Le mot de passe et la confirmation sont différents !');
                }
            } else {
                req.flash('error', 'L\'email rentré est incorrect !');
            }
        } else {
            req.flash('error', 'Le nom rentré est incorrect !');
        }
    } else {
        req.flash('error', 'Le prénom rentré est incorrect !');
    }

    res.redirect('register');
};

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