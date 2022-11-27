require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 5000;

// MidleWare
app.use(express.json());
app.use(cors());

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

app.get("/users", async (req, res) => {
  try {
    const email = req.query.email;
    const query = { email: email };
    const user = await users.findOne(query);
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

app.patch("/users", async (req, res) => {
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
    const allProduct = await products.find({ catId: catId }).toArray();
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

// Listener
app.listen(port, () => console.log(`server is running at port: ${port}`));
