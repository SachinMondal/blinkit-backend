const express = require("express");
const cors = require("cors");
const app = express();
const port = 8000;
const formidable = require("express-formidable");

// Import other necessary modules
const passport = require("passport");
const db = require("./config/db");

// Use CORS middleware with permissive settings
app.use(cors({ 
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(
  formidable({
    multiples: true, // If you want to allow multiple files
    keepExtensions: true, // Keeps file extensions
  })
);
app.use(express.urlencoded({ extended: true }));

// Use routes
app.use("/api/", require("./routers"));

app.listen(port, function (err) {
    if (err) {
        console.log('Error in connecting to the server');
    } else {
        console.log(`Successfully connected to the server and running at port: ${port}`);
    }
});