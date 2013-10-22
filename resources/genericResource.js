var copyFields = function(Model, src, dest) {
    for (var field in Model.schema.paths) {
        if ((field !== "_id") && (field !== "__v")) {
            if (src[field] !== undefined) {
                dest[field] = src[field];
            }
        }
    }
};

module.exports = {
    copyFields: copyFields,

    list: function(Model, req, res) {
        Model.find(req.query, function(error, result) {
            if (error) {
                console.log(error);
                return res.send(400);
            }
            res.send(result);
        });
    },

    get: function(Model, req, res) {
        Model.findById(req.params.id, function(error, result) {
            if (error) {
                console.log(error);
                return res.send(400);
            }
            res.send(result ? result : 404);
        });
    },

    create: function(Model, req, res) {
        var model = new Model(req.body);
        model.save(function(error) {
            if (error) {
                console.log(error);
                return res.send(400);
            }
            res.send(model);
        });
    },

    update: function(Model, req, res) {
        Model.findById(req.params.id, function(error, result) {
            if (error) {
                console.log(error);
                return res.send(500);
            }
            if (!result) {
                return res.send(404);
            }
            copyFields(Model, req.body, result);
            result.save(function(error) {
                if (error) {
                    console.log(error);
                    return res.send(400);
                }
                res.send(result);
            });
        });
    },

    remove: function(Model, req, res) {
        Model.findById(req.params.id, function(error, result) {
            if (error) {
                console.log(error);
                return res.send(500);
            }
            if (!result) {
                return res.send(404);
            }
            result.remove(function(error) {
                if (error) {
                    return res.send(500);
                }
                res.send(result);
            });
        });
    }
};