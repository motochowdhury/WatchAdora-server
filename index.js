require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 5000;

// MidleWare
app.use(cors());
app.use(express.json());

// MongoDB
const uri = process.env.MONGO_URL;
const client = new MongoClient(uri);

const run = async () => {
  try {
    client.connect();
    console.log("Server is up");
  } catch (err) {
    console.log(err.message);
  }
};
run();

// Mongo Collection
const DB = client.db("WatchAdora");
const categories = DB.collection("categories");
const products = DB.collection("products");
const users = DB.collection("users");
const bookings = DB.collection("bookings");
const wishlist = DB.collection("wishlist");
const reportedProducts = DB.collection("reportedProducts");

app.get("/", (req, res) => {
  res.send("Server Is Up");
});

// User API
app.post("/users", async (req, res) => {
  try {
    const user = req.body;
    const createdUser = await users.insertOne(user);
    res.send({
      success: true,
      data: createdUser,
    });
  } catch (err) {
    res.send({
      success: false,
      err,
    });
  }
});

app.get("/user", async (req, res) => {
  try {
    const email = req.query.email;
    const query = { email: email };
    const user = await users.findOne(query);
    res.send(user);
  } catch (err) {
    res.send(err);
  }
});

app.patch("/user", async (req, res) => {
  try {
    const email = req.query.email;
    const query = { email: email };
    const verify = { rule: req.body };
    const user = await users.replaceOne(query, verify);

    res.send({
      success: true,
      data: user,
    });
  } catch (err) {
    res.send({
      success: false,
      err,
    });
  }
});

app.get("/users", async (req, res) => {
  try {
    const allUsers = await users.find({}).toArray();
    res.send(allUsers);
  } catch (err) {
    res.send(err);
  }
});

// categories API
app.get("/categories", async (req, res) => {
  try {
    const categoriesArr = await categories.find({}).toArray();
    res.send({
      success: true,
      data: categoriesArr,
    });
  } catch (err) {
    res.send({
      success: false,
      err,
    });
  }
});

app.post("/categories", async (req, res) => {
  try {
    const result = await categories.insertOne(req.body);
    res.send(result);
  } catch (err) {
    console.log(err.message);
  }
});

//  products API

app.get("/products", async (req, res) => {
  try {
    const allProduct = await products.find({}).toArray();
    res.send({
      success: true,
      data: allProduct,
    });
  } catch (err) {
    res.send({
      success: false,
      err: err.message,
    });
  }
});
app.get("/products/:catId", async (req, res) => {
  try {
    const catId = req.params.catId;
    const query = {
      catId: catId,
      paymentStatus: "unpaid",
    };
    const allProduct = await products.find(query).toArray();
    // const product = allProduct.map((pd) => pd.paymentStatus !== "unpaid");
    res.send({
      success: true,
      data: allProduct,
    });
  } catch (err) {
    res.send({
      success: false,
      err: err.message,
    });
  }
});

// Booking API

app.post("/booking", async (req, res) => {
  try {
    const booking = req.body;
    const savedBooking = await bookings.insertOne(booking);
    res.send({
      success: true,
      data: savedBooking,
    });
  } catch (err) {
    res.send({
      success: false,
      err,
    });
  }
});

app.get("/booking", async (req, res) => {
  try {
    const email = req.query.email;
    const allBookings = await bookings.find({ email: email }).toArray();
    res.send(allBookings);
  } catch (err) {
    res.send(err);
  }
});

// WishList API
app.post("/wishlist", async (req, res) => {
  try {
    const wishProduct = req.body;
    const savedWishProduct = await wishlist.insertOne(wishProduct);
    res.send({
      success: true,
      data: savedWishProduct,
    });
  } catch (err) {
    res.send({
      success: false,
      err,
    });
  }
});

// Report To admin

app.post("/reportadmin", async (req, res) => {
  try {
    const reportedProduct = req.body;
    const data = await reportedProducts.insertOne(reportedProduct);
    res.send({
      success: true,
      data,
    });
  } catch (err) {
    res.send({
      success: false,
      err,
    });
  }
});

app.get("/report", async (req, res) => {
  try {
    const reportedItems = await reportedProducts.find({}).toArray();
    res.send(reportedItems);
  } catch (err) {
    res.send(err);
  }
});
// Listener
app.listen(port, () => console.log(`server is running at port: ${port}`));
