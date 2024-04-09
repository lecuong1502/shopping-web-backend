const express = require("express");
const bodyParser = require("body-parser");
const { queryAsync } = require("./src/database");
const jwt = require("jsonwebtoken");

const app = express();
app.use(bodyParser.json());

app.post("/api/signup", async (req, res) => {
  try {
    const { name, password, gmail, phoneNum, address } = req.body;
    let passwordLength = password.length;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneNumberRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

    if(!name) {
      res.json({ error: "Name is required" });
      return;
    }
    if(passwordLength < 8 || passwordLength > 20) {
      res.json({ error: "Password is invalid" });
      return;
    }
    if(!emailRegex.test(gmail)){ 
      res.json({ error: "Gmail is invalid" });
      return;
    }
    if (!phoneNumberRegex.test(phoneNum)) {
      res.json({ error: "Phone number is invalid" });
      return;
    }
    if(!address) {
      res.json({ error: "Address is required" });
      return;
    }
    // TODO: hash password
    const signUpQuery = `INSERT INTO User (name, password, gmail, phoneNum, address) VALUES ('${name}', '${password}', '${gmail}', '${phoneNum}', '${address}');`;
    await queryAsync(signUpQuery);
    res.json({ success: true });
  } catch (error) {
    res.json({ error: "An error occur" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { password, gmail } = req.body;
    console.log(password, gmail);
    const loginQuery = `SELECT * FROM User WHERE gmail='${gmail}' and password='${password}';`;
    const resultUsers = await queryAsync(loginQuery);

    if (resultUsers.length > 0) {
      // token
      
      const secretKey = 'domayhackduoc';

      const token = jwt.sign({gmail}, secretKey, { expiresIn: '3m' });
      console.log(token);

      
      const tokenQuery = `UPDATE User SET token='${token}' WHERE gmail='${gmail}';`;
      await queryAsync(tokenQuery);

      res.json({ success: true, token });
    }
    else{
      res.json({ error: "Not exist account" });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: "An error occur" });
  }
});

// Start the server
const port = 443;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
