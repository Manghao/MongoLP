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
                        password: password,
                        type_user: 'user'
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
    let flash = req.flash();
    res.render('user/login.twig', { query: req.query, success: flash.success, error: flash.error });
};

exports.validLogin = (req, res) => {
    let email = xss(req.body.email);
    let password = xss(req.body.password);

    if (validator.isEmail(email)) {
        User.findOne({ email: email }, (err, existingUser) => {
            if (existingUser) {
                if (existingUser.comparePassword(password)) {
                    req.session.user = { "id": existingUser.id, "first_name": existingUser.first_name, "last_name": existingUser.last_name, "email": existingUser.email, "type_user": existingUser.type_user };
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

    res.redirect('login');
};

exports.getAccount = (req, res) => {
    User.findOne({ email: req.session.user.email }, (err, existingUser) => {
        if (existingUser) {
            res.render('user/account.twig', { auth: req.session.user, user: existingUser, success: req.flash().success });
        } else {
            res.redirect('/');
        }
    });
};

exports.editAccount = (req, res) => {
    User.findOne({ email: req.session.user.email }, (err, existingUser) => {
        if (existingUser) {
            res.render('user/edit.twig', { auth: req.session.user, user: existingUser, query: req.query, error: req.flash().error });
        } else {
            res.redirect('/');
        }
    });
};

exports.update = (req, res) => {
    let firstName = xss(req.body.first_name);
    let lastName = xss(req.body.last_name);
    let email = xss(req.body.email);

    if (validator.isAlpha(firstName)) {
        if (validator.isAlpha(lastName)) {
            if (validator.isEmail(email)) {
                return User.findOne({ email: req.session.user.email }, (err, currentUser) => {
                    if (currentUser) {
                        req.session.user.first_name = firstName;
                        req.session.user.last_name = lastName;
                        currentUser.first_name = firstName;
                        currentUser.last_name = lastName;

                        if (currentUser.email === email) {
                            currentUser.save();

                            req.flash('success', { 'msg': 'Vos informations ont bien été modifiées !' });
                            return res.redirect('account');
                        } else {
                            return User.findOne({ email: email }, (err, existingUser) => {
                                if (existingUser) {
                                    req.flash('error', { 'msg': 'L\'email rentré est déjà utilisé !' });
                                    return res.redirect(url.format({
                                        pathname: 'edit',
                                        query: {
                                            first_name: firstName,
                                            last_name: lastName,
                                            email: email
                                        }
                                    }));
                                } else {
                                    req.session.user.email = email;
                                    currentUser.email = email;
                                    currentUser.save();

                                    req.flash('success', { 'msg': 'Vos informations ont bien été modifiées !' });
                                    return res.redirect('account');
                                }
                            });
                        }
                    } else {
                        res.redirect('/');
                    }
                });
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
        pathname: 'edit',
        query: {
            first_name: firstName,
            last_name: lastName,
            email: email
        }
    }));
};

exports.editPwd = (req, res) => {
    User.findOne({ email: req.session.user.email }, (err, existingUser) => {
        if (existingUser) {
            res.render('user/editPwd.twig', { error: req.flash().error });
        } else {
            res.redirect('/');
        }
    });
};

exports.updatePwd = (req, res) => {
    let passwordOld = xss(req.body.password_old);
    let passwordNew = xss(req.body.password_new);
    let passwordConfirm = xss(req.body.password_confirm);

    User.findOne({ email: req.session.user.email }, (err, currentUser) => {
        if (currentUser) {
            if (currentUser.comparePassword(passwordOld)) {
                if (validator.equals(passwordNew, passwordConfirm)) {
                    if (!validator.equals(passwordOld, passwordNew)) {
                        currentUser.password = passwordNew;
                        currentUser.save();
                    }

                    req.flash('success', { 'msg': 'Votre mot de passe a bien été modifié !' });
                    res.redirect('account');
                } else {
                    req.flash('error', {'msg': 'Le nouveau mot de passe et la confirmation sont différents !'});
                    res.redirect('editPwd');
                }
            } else {
                req.flash('error', {'msg': 'L\'ancien mot de passe n\'est pas bon !'});
                res.redirect('editPwd');
            }
        } else {
            res.redirect('/');
        }
    });
};