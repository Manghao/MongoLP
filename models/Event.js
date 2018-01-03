const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    nom: String,
    capacite: Number,
    places_disponibles: Number,
    id_rue: String,
    adresse: String,
    lat: Number,
    lng: Number,
    type: String
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;