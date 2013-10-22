var config = require("./config");
var express = require("express");
var path = require("path");
var app = express();
var snapshotResource = require("./resources/hashtagSnapshotResource");

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.compress());
    app.use(express.static(config.webAppPath, {maxAge: 86400000}));
    app.use(app.router);
    if (config.trustProxy) {
        app.enable("trust proxy");
    }
});

var auth = function(req, res, next) {
    if (req.query.key == config.apiKey) {
        next();
    } else {
        res.send(401);
    }
};

app.get("/api/snapshots", snapshotResource.list);
app.get("/api/snapshots/:id", snapshotResource.get);
app.post("/api/snapshots", auth, snapshotResource.create);
app.del("/api/snapshots", auth, snapshotResource.removeAll);
app.put("/api/snapshots/:id", auth, snapshotResource.update);
app.del("/api/snapshots/:id", auth, snapshotResource.remove);

//serve the angular app on all other routes
app.get("*", function(req, res) {
    res.sendfile(path.join(config.webAppPath, "index.html"));
});

app.listen(config.port);
console.log("Server running on port " + config.port);

