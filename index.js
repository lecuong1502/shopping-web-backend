const express = require("express");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const { queryAsync } = require("./src/database");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.post("/api/signup", async (req, res) => {
  try {
    const { name, password, gmail, phoneNum, address } = req.body;
    let passwordLength = password.length;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneNumberRegex =
      /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

    if (!name) {
      res.json({ error: "Name is required" });
      return;
    }
    if (passwordLength < 8 || passwordLength > 20) {
      res.json({ error: "Password is invalid" });
      return;
    }
    if (!emailRegex.test(gmail)) {
      res.json({ error: "Gmail is invalid" });
      return;
    }
    if (!phoneNumberRegex.test(phoneNum)) {
      res.json({ error: "Phone number is invalid" });
      return;
    }
    if (!address) {
      res.json({ error: "Address is required" });
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("hased signup", password, hashedPassword);
    // TODO: hash password
    const signUpQuery = `INSERT INTO User (name, password, gmail, phoneNum, address) VALUES ('${name}', '${hashedPassword}', '${gmail}', '${phoneNum}', '${address}');`;
    await queryAsync(signUpQuery);
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({ error: "An error occur" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { password, gmail } = req.body;
    console.log(password, gmail);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("hased login", password, hashedPassword);
    const loginQuery = `SELECT * FROM User WHERE gmail='${gmail}';`;

    const resultUsers = await queryAsync(loginQuery);

    if (resultUsers.length === 0) {
      res.json({ error: "Not exist account" });
      return;
    }

    const checkPassword = await bcrypt.compare(
      password,
      resultUsers[0].password
    );

    if (checkPassword) {
      const secretKey = "domayhackduoc";

      const token = jwt.sign({ gmail }, secretKey, { expiresIn: "3m" });
      console.log(token);

      const tokenQuery = `UPDATE User SET token='${token}' WHERE gmail='${gmail}';`;
      await queryAsync(tokenQuery);

      res.json({ ...resultUsers[0], password: null, token });
    } else {
      res.json({ error: "Not exist account" });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: "An error occur" });
  }
});

app.post("/api/create-product", async (req, res) => {
  try {
    const { productName, image, description, a_unit_of_price } = req.body;
    const { token } = req.headers;
    const findUserQuery = `SELECT * FROM User WHERE token='${token}';`;
    const resultUsers = await queryAsync(findUserQuery);
    if (resultUsers.length === 0) {
      res.json({ error: "Invalid token" });
      return;
    }

    if (!resultUsers[0].isOwner) {
      res.json({ error: "No permission" });
      return;
    }

    const createProductQuery = `INSERT INTO Product (productName, image, description, a_unit_of_price) VALUES ('${productName}', '${image}', '${description}', '${a_unit_of_price}');`;
    const createprodResult = await queryAsync(createProductQuery);
    res.json({ ...createprodResult });
  } catch (error) {
    res.json({ error: "Error" });
    return;
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const printInfoAllProd = `SELECT * FROM Product;`;
    const resultProduct = await queryAsync(printInfoAllProd);
    res.json({ data: resultProduct });
  } catch (error) {
    console.log(error);
    res.json({ error: "Not any products" });
    return;
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const productID = req.params.id;
    const productQuery = `SELECT * FROM Product WHERE id = "${productID}";`;
    const resultProduct = await queryAsync(productQuery);
    res.json({ ...resultProduct[0] })
  } catch (error) {
    res.json({ error: "Error" });
    return;
  }
});

app.get("/api/search-product", async (req, res) => {
  try {
    const {productName} = req.query;
    const productQuery = `SELECT * FROM Product WHERE productName LIKE "%${productName}%"`;
    const resultProduct = await queryAsync(productQuery);
    res.json(resultProduct);
  } catch (error) {
    res.json({ error: "Error" });
  }
});

app.post("/api/delete-product/:id", async (req, res) => {
  try {
    const productID = req.params.id;
    const productQuery = `DELETE FROM Product WHERE id = "${productID}";`;
    const resultProduct = await queryAsync(productQuery);
    res.json(resultProduct);
  } catch (error) {
    res.json({ error: "Error" });
  }
});

app.post("/api/edit-product/:id", async (req, res) => {
  try {
    const productID = req.params.id;
    const { productName, image, description, a_unit_of_price } = req.body;
    const productQuery = `UPDATE Product SET productName="${productName}" WHERE id = "${productID}";`;
    const resultProduct = await queryAsync(productQuery);
    res.json(resultProduct);
  } catch (error) {
    res.json({ error: "Error" });
  }
});

app.post("/api/order/:id", async(req, res) => {
  try {
    const { token } = req.headers;
    const findUserQuery = `SELECT * FROM User WHERE token='${token}';`;
    const resultUsers = await queryAsync(findUserQuery);
    if (resultUsers.length === 0) {
      res.json({ error: "Invalid token" });
      return;
    }

    const userID = parseInt(resultUsers[0].id);

    const productID = req.params.id;
    const {amount} = req.body;
    const priceUnit = `SELECT a_unit_of_price FROM Product WHERE id="${productID}";`;
    
    const resultProduct = await queryAsync(priceUnit);
    const priceCalcu = parseInt(resultProduct[0].a_unit_of_price);
    const totalPrice = priceCalcu * amount;
    const orderQuery = `INSERT INTO Ordering (userID, productID , price, amount) VALUES('${userID}','${productID}', '${totalPrice}', '${amount}');`;
    const resultPrice = await queryAsync(orderQuery);
    res.json({ success: true });
  } catch (error) {
    res.json({ error: error });
  }
});

app.get("/api/history", async (req, res) => {
  try {
    const { token } = req.headers;
    const findUserQuery = `SELECT * FROM User WHERE token='${token}';`;
    const resultUsers = await queryAsync(findUserQuery);

    if (resultUsers.length === 0) {
      res.json({ error: "Invalid token" });
      return;
    }

    const userID = parseInt(resultUsers[0].id);
    const printInfoAllProd = `SELECT * FROM Ordering WHERE userID = '${userID}';`;
    const resultProduct = await queryAsync(printInfoAllProd);
    res.json({ data: resultProduct });
  } catch (error) {
    console.log(error);
    res.json({ error: "Not any products" });
    return;
  }
});

app.get("/api/history-order", async (req, res) => {
  try {
    const { token } = req.headers;
    const findUserQuery = `SELECT * FROM User WHERE token='${token}';`;
    const resultUsers = await queryAsync(findUserQuery);

    if (resultUsers.length === 0) {
      res.json({ error: "Invalid token" });
      return;
    }

    if (!resultUsers[0].isOwner) {
      res.json({ error: "No permission" });
      return;
    }

    const userID = parseInt(resultUsers[0].id);

    const printInfoProd = `SELECT * FROM Ordering WHERE userID = '${userID}';`;
    const resultOrder = await queryAsync(printInfoProd);
    const productID = parseInt(resultOrder[0].userID);
    // const productID = `SELECT productID FROM Ordering WHERE userID = '${userID}';`;
    const productName = `SELECT productName FROM Product WHERE id = '${productID}';`;
    const userName = `SELECT name FROM User WHERE token='${token}';`;
    const resultName = await queryAsync(userName);
    const resultProduct = await queryAsync(productName);
    res.json({ 
      data: {
        productData: resultProduct,
        userData: resultName
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ error: "Not any ordering" });
    return;
  }
});

// Start the server
const port = 443;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});