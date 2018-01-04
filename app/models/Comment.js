const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    comment: String,
    id_event: { type: String, ref: 'Event' },
    id_creator: { type: String, ref: 'User' },
    name: String
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;