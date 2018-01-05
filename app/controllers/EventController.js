const config = require('../config/config');
const Event = require('../models/Event');
const Comment = require('../models/Comment');
const User = require('../models/User');
const limit = 9;

let validator = require('validator');
let xss = require('xss');
let url = require('url');
let NodeGeocoder = require('node-geocoder');

exports.getEvents = (req, res) => {
    let totalPages = 0;
    Event.count({}, (err, result) => {
        totalPages = Math.ceil(result / limit);

        let page = (req.query.page ? (req.query.page >= 1 ? (req.query.page <= totalPages ? req.query.page : totalPages) : 1) : 1);

        Event.find({}).skip((page - 1) * limit).limit(limit)
            .exec((err, result) => {
                res.render('event/events.twig', { auth: req.session.user, events: result, totalPages: totalPages, currentPage: page });
            });
    });
};

exports.getOneEvent = (req, res) => {
    let id = req.params.id;

    Event.findOne({ _id: id }, (err, existingEvent) => {
        if (existingEvent) {
            Comment.find({ id_event: id }, (err, existingComments) => {
                if (existingComments) {
                    res.render('event/view.twig', { auth: req.session.user, event: existingEvent, comments: existingComments, success: req.flash().success });
                }
            });
        }
    });
};

exports.addComment = (req, res) => {
    let id = req.params.id;
    let comment = xss(req.body.comment);

    Event.findOne({ _id: id }, (err, existingEvent) => {
        if (existingEvent) {
            let newComment = new Comment({
                comment: comment,
                id_event: id,
                id_creator: req.session.user.id
            });

            newComment.name = req.session.user.first_name + ' ' + req.session.user.last_name;
            newComment.save();

            req.flash('success', { 'msg': 'Votre commentaire a bien été ajouté !' })
            res.redirect('/events/' + id);
        } else {
            res.redirect('/');
        }
    });
};

exports.deleteComment = (req, res) => {
    let idEvent = req.params.idEvent;
    let idComment = req.params.idComment;

    Event.findOne({ _id: idEvent }, (err, existingEvent) => {
        if (existingEvent) {
            Comment.findOne({ _id: idComment, id_event: idEvent }, (err, existingComment) => {
                if (existingComment) {
                    existingComment.remove();

                    req.flash('success', { 'msg': 'Le commentaire a bien été supprimé !' });
                    res.redirect('/events/' + idEvent);
                } else {
                    res.redirect('/');
                }
            });
        } else {
            res.redirect('/');
        }
    });
};

exports.createEvent = (req, res) => {
    let flash = req.flash();
    res.render('event/create.twig', { auth: req.session.user, query: req.query, success: flash.success, error: flash.error });
};

exports.storeEvent = (req, res) => {
    let name = xss(req.body.name);
    let capacity = req.body.capacity;
    let free = req.body.free;
    let street_num = xss(req.body.street_num);
    let street = xss(req.body.street);
    let city = xss(req.body.city);
    let code = xss(req.body.code);
    let statut = xss(req.body.statut);
    let type = xss(req.body.type);

    let errors = false;

    if (capacity != '' || free != '') {
        if (parseInt(free) > parseInt(capacity)) {
            errors = true;
            req.flash('error', { 'msg': 'Le nombre de places disponibles ne peut être suprérieur à la capacité !' });
        }
    }

    if (name != '') {
        if (city != '') {
            if (street != '') {
                if (validator.isInt(code)) {
                    if (validator.isInt(street_num)) {
                        let options = {
                            provider: 'opencage',
                            
                            httpAdapter: 'https',
                            apiKey: config.getApiKey(),
                            formatter: null
                        };
                        let geocoder = NodeGeocoder(options);

                        geocoder.geocode({address: street_num + " " + street + " " + city, country: 'France', zipcode: code}, function(err, result) {
                            if (err) throw err;

                            if (result.length > 1) {
                                let event = new Event({
                                    nom: name,
                                    capacite: (capacity == '') ? 0 : capacity,
                                    places_disponibles: (free == '') ? 0 : free,
                                    id_rue: street_num,
                                    adresse: street + ", " + code + " " + city,
                                    statut: statut,
                                    lat: result[0].latitude,
                                    lng: result[0].longitude,
                                    type: type
                                });

                                event.save();

                                return res.redirect('/events/' + event._id);
                            } else {
                                req.flash('error', { 'msg': "Veuillez vérifier que l'adresse soit valide !" });
                                return res.redirect(url.format({
                                    pathname: '/event/create',
                                    query: {
                                        name: name,
                                        capacity: capacity,
                                        free: free,
                                        street_num: street_num,
                                        street: street,
                                        city: city,
                                        code: code,
                                        statut: statut,
                                        type: type
                                    }
                                }));
                            }
                        });
                    } else {
                        errors = true;
                        req.flash('error', { 'msg': 'Le numéro de rue rentré est incorrect !' });
                    }
                } else {
                    errors = true;
                    req.flash('error', { 'msg': 'Le code postal rentré est incorrect !' });
                }
            } else {
                errors = true;
                req.flash('error', { 'msg': 'Le nom de rue rentré est incorrect !' });
            }
        } else{
            errors = true;
            req.flash('error', { 'msg': 'La ville rentrée est incorrect !' });
        }
    } else {
        errors = true;
        req.flash('error', { 'msg': 'Le nom rentré est incorrect !' });
    }

    if (errors) {
        res.redirect(url.format({
            pathname: '/event/create',
            query: {
                name: name,
                capacity: capacity,
                free: free,
                street_num: street_num,
                street: street,
                city: city,
                code: code,
                statut: statut,
                type: type
            }
        }));
    }
};
