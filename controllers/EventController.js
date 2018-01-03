const Event = require('../models/Event');

exports.getEvents = (req, res) => {
    Event.find({}, (err, events) => {
        res.render('event/events.twig', { events: events });
    });
};