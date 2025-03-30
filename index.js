const express = require("express");
const cors = require("cors");
const formidable = require("express-formidable");

const app = express();
const port = 8000;

// Import other necessary modules
const passport = require("passport");
const db = require("./config/db");

// Use CORS middleware with permissive settings
app.use(cors({ 
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Ensure JSON and URL-encoded body parsing happens before formidable
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Use formidable only for file upload routes
const formidableMiddleware = formidable({
  multiples: true,
  keepExtensions: true,
});

// Routes
const router = require("./routers");
app.use("/api/", (req, res, next) => {
  if (req.headers["content-type"]?.includes("multipart/form-data")) {
    formidableMiddleware(req, res, next);
  } else {
    express.json()(req, res, next);
  }
}, router);

app.listen(port, function (err) {
    if (err) {
        console.log('Error in connecting to the server');
    } else {
        console.log(`Successfully connected to the server and running at port: ${port}`);
    }
});
