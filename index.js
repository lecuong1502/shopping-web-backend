const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());


app.get("/api/login", (req, res) => {
    res.json({ data: 123 })
});

// Start the server
const port = 443;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
