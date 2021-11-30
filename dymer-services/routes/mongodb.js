var util = require('../utility');
const mongoose = require("mongoose");
const mongoURI = util.mongoUrlForm();
var db;
mongoose
    .connect(mongoURI, {
        // useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(x => {
        console.log(` Mongodb | Connected to Mongo! Database name: "${x.connections[0].name}"`);
        db = x.connections[0].db;
    })
    .catch(err => {
        console.error("ERROR | Mongodb | Error connecting to mongo! Database name: ", mongoURI, err);
    });
//mongoose.exports = mongoose;