const express = require("express");
const bodyParser = require("body-parser");
const { queryAsync } = require("./src/database");

const app = express();
app.use(bodyParser.json());

app.post("/api/signup", async (req, res) => {
  try {
    const { name, password, gmail, phoneNum, address } = req.body;
    // TODO: hash password
    const signUpQuery = `INSERT INTO User (name, password, gmail, phoneNum, address) VALUES ('${name}', '${password}', '${gmail}', '${phoneNum}', '${address}');`;
    await queryAsync(signUpQuery);
    res.json({ success: true });
  } catch (error) {
    res.json({ error: "An error occur" });
  }
});

app.get("/api/login", (req, res) => {
  // TODO: check login
  res.json({ data: 123 });
});

// Start the server
const port = 443;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
