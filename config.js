var path = require("path");

module.exports = {
    port: 8080,
    dbConnectionString: "mongodb://localhost:27017/trends",
    webAppPath: path.join(__dirname, "web-app"),
    trustProxy: false,
    apiKey: "changeme"
}
