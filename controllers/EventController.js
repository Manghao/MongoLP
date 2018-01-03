const Event = require('../models/Event');
const limit = 9;

exports.getEvents = (req, res) => {
    let totalPages = 0;
    Event.count({}, (err, result) => {
        totalPages = Math.ceil(result / limit);

        let page = (req.query.page ? (req.query.page >= 1 ? (req.query.page <= totalPages ? req.query.page : totalPages) : 1) : 1);

        Event.find({}).skip((page - 1) * limit).limit(limit)
            .exec((err, result) => {
                res.render('event/events.twig', { events: result, totalPages: totalPages, currentPage: page });
            });
    });
};