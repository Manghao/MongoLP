let express = require('express');
let mustache = require('mustache');
let mongoose = require('mongoose');
let ObjectId = require('mongodb').ObjectID;
let fs = require('fs')
let app = express();

mongoose.connect('mongodb://192.168.99.100:27017/tdmongo', {
    useMongoClient: true,
    promiseLibrary: global.Promise
});
let db = mongoose.connection;

require.extensions['.html'] = (module, filename) => {
    module.exports = fs.readFileSync(filename, 'utf8');
};

app.get('/',(req, res) => {
    const template = require('./app/views/layouts/template.html');

    let response = '';
    db.collection("parkingVelo").find().toArray((error, results) => {
        if (error) throw error;

        const output = mustache.render(template, {
            data: results
        });
        res.send(output);
    });

});

app.listen(3000, () => {
	console.log("listening on port 3000");
});