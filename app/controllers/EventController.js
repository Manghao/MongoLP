const Event = require('../models/Event');
const Comment = require('../models/Comment');
const User = require('../models/User');
const limit = 9;

let xss = require('xss');

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
    res.render('event/create.twig');
};

exports.storeEvent = (req, res) => {
    
};
