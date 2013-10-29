var genericResource = require("./genericResource");
var config = require("../config");
var mongoose = require("mongoose");
var HashtagSnapshot = require("../model/hashtagSnapshot")
mongoose.connect(config.dbConnectionString);

module.exports = {
    list: function(req, res) {
        var query;
        if (req.query.hours && parseInt(req.query.hours)) {
            var cutoff = new Date(new Date().getTime() - 60 * 60 * 1000 * parseInt(req.query.hours));
            query = HashtagSnapshot.find({"dateCreated": {$gt: cutoff}});
        } else if (req.query.since) {
            query = HashtagSnapshot.find({"dateCreated": {$gt: new Date(req.query.since)}});
        } else {
            query = HashtagSnapshot.find();
        }
        query.sort("hashtag dateCreated");
        query.exec(function(error, result) {
            res.send(error ? 500 : result);
        });
    },

    get: function(req, res) {
        genericResource.get(HashtagSnapshot, req, res);
    },

    create: function(req, res) {
        genericResource.create(HashtagSnapshot, req, res);
    },

    update: function(req, res) {
        genericResource.update(HashtagSnapshot, req, res);
    },

    remove: function(req, res) {
        genericResource.remove(HashtagSnapshot, req, res);
    },

    removeAll: function(req, res) {
        HashtagSnapshot.remove({}, function(error) {
            res.send(error ? 500 : 200);
        });
    }
}
