const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;

// Import other necessary modules
const passport = require("passport");
const db = require("./config/db");

// Use CORS middleware with permissive settings
app.use(
    cors({
      origin: "*", 
      methods: "GET,POST,PUT,DELETE,OPTIONS,PATCH",
      allowedHeaders: "Content-Type,Authorization", 
      credentials: true, 
    })
  );

app.use(express.json());
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