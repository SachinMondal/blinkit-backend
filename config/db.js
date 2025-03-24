const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
const dbURI = process.env.DB;

// Connect to MongoDB
mongoose.connect(dbURI)
    .then(() => {
        console.log("Connected to the database");
    })
    .catch(err => {
        console.error("Error connecting to the database", err);
    });

// Listen for events on the connection object
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Error in connecting to the database'));
db.once('open', function() {
    console.log("Successfully connected to the database");
});

module.exports = db;