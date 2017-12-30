let validator = require('validator');
let xss = require('xss');
let url = require('url');

const User = require('../models/User');

exports.register = (req, res) => {
    res.render('user/register.twig', { query: req.query, error: req.flash().error });
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
                            req.flash('error', { 'msg': 'L\'email rentré est déjà utilisé !' });
                            return res.redirect(url.format({
                                pathname: 'register',
                                query: {
                                    first_name: firstName,
                                    last_name: lastName,
                                    email: email
                                }
                            }));
                        } else {
                            newUser.save();
                            return res.redirect(url.format({
                                pathname: 'login',
                                query: {
                                    email: email
                                }
                            }));
                        }
                    });
                } else {
                    req.flash('error', { 'msg': 'Le mot de passe et la confirmation sont différents !' });
                }
            } else {
                req.flash('error', { 'msg': 'L\'email rentré est incorrect !' });
            }
        } else {
            req.flash('error', { 'msg': 'Le nom rentré est incorrect !' });
        }
    } else {
        req.flash('error', { 'msg': 'Le prénom rentré est incorrect !' });
    }

    res.redirect(url.format({
        pathname: 'register',
        query: {
            first_name: firstName,
            last_name: lastName,
            email: email
        }
    }));
};

exports.login = (req, res) => {
    res.render('user/login.twig', { query: req.query, error: req.flash().error });
};

exports.validLogin = (req, res) => {
    let email = xss(req.body.email);
    let password = xss(req.body.password);

    if (validator.isEmail(email)) {
        User.findOne({ email: email }, (err, existingUser) => {
            if (existingUser) {
                if (existingUser.comparePassword(password)) {
                    req.session.user = { "first_name": existingUser.first_name, "email": existingUser.email };
                    req.flash('success', { 'msg': 'Vous êtes maintenant connecté !' });
                    return res.redirect('/');
                } else {
                    req.flash('error', { 'msg': 'Mot de passe incorrect !' });
                    return res.redirect(url.format({
                        pathname: 'login',
                        query: {
                            email: email
                        }
                    }));
                }
            } else {
                req.flash('error', { 'msg': 'Ce compte n\'existe pas !' });
                return res.redirect(url.format({
                    pathname: 'login',
                    query: {
                        email: email
                    }
                }));
            }
        });
    } else {
        req.flash('error', { 'msg': 'Email est incorrect !' });
        res.redirect(url.format({
            pathname: 'login',
            query: {
                email: email
            }
        }));
    }
};

exports.logout = (req, res) => {
    req.flash('success', { 'msg': 'Vous avez bien été déconnecté !' });
    req.session.user = undefined;

    res.redirect('/');
};