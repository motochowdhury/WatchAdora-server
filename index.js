require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 5000;

// MidleWare
app.use(cors());
app.use(express.json());
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

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
const payments = DB.collection("payments");

// Verify Admin Seller

const verifyAdmin = async (req, res, next) => {
  const decodedEmail = req.decoded.email;
  const query = { email: decodedEmail };
  const user = await users.findOne(query);

  if (user?.userRule !== "admin") {
    return res.status(403).send({ message: "forbidden access" });
  }
  next();
};
const verifySeller = async (req, res, next) => {
  const decodedEmail = req.decoded.email;
  const query = { email: decodedEmail };
  const user = await users.findOne(query);

  if (user?.userRule !== "seller") {
    return res.status(403).send({ message: "forbidden access" });
  }
  next();
};

app.get("/", (req, res) => {
  res.send("Server Is Up");
});

app.get("/jwt", async (req, res) => {
  const email = req.query.email;

  const token = jwt.sign({ email }, process.env.ACCESS_TOKEN);
  return res.send({ accesstoken: token });
  res.status(403).send({ accessToken: "" });
});

// Check Admin Rule
app.get("/admin", async (req, res) => {
  try {
    const email = req.query.email;
    const query = {
      email: email,
    };
    const user = await users.findOne(query);

    res.send({ isAdmin: user?.userRule === "admin" });
  } catch (err) {
    res.send(err);
  }
});

// Check seller rule
app.get("/seller", async (req, res) => {
  try {
    const email = req.query.email;
    const query = {
      email: email,
    };
    const user = await users.findOne(query);

    res.send({ isAdmin: user?.userRule === "seller" });
  } catch (err) {
    res.send(err);
  }
});

// User API
app.post("/users", async (req, res) => {
  try {
    const user = req.body;
    const query = {
      email: user?.email,
    };
    const currUser = await users.findOne(query);
    if (currUser) {
      return res.send({
        success: true,
        data: {},
      });
    }
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

app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const allUsers = await users.find({ userRule: "buyer" }).toArray();
    res.send(allUsers);
  } catch (err) {
    res.send(err);
  }
});

app.get("/user", async (req, res) => {
  try {
    const email = req.query.email;
    const user = await users.findOne({ email: email });
    res.send(user);
  } catch (err) {
    res.send(err);
  }
});

app.get("/admin/sellers", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const allSellers = await users.find({ userRule: "seller" }).toArray();
    res.send(allSellers);
  } catch (err) {
    res.send(err);
  }
});

app.delete("/admin/seller", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const id = req.query.id;
    const email = req.query.email;
    const query = {
      _id: ObjectId(id),
    };
    const deleteProd = await products.deleteMany({ email: email });
    const deleteUser = await users.deleteOne(query);
    res.send(deleteUser);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

app.patch("/admin/seller", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const email = req.query.email;
    const query = {
      email: email,
    };
    const updatedDoc = {
      $set: {
        status: "verified",
      },
    };
    const verify = await users.updateOne(query, updatedDoc);
    res.send(verify);
  } catch (err) {
    res.send(err);
  }
});

app.delete("/admin/user", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const email = req.query.email;
    const query = {
      email: email,
    };
    const deleteBooking = await bookings.deleteMany(query);
    const deleteWishList = await wishlist.deleteMany(query);
    const deleteUser = await users.deleteOne(query);
    res.send(deleteUser);
  } catch (err) {
    console.log(err);
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

app.post("/products", verifyJWT, verifySeller, async (req, res) => {
  try {
    const data = req.body;
    const addedProduct = await products.insertOne(data);
    res.send(addedProduct);
  } catch (err) {
    res.send(err);
  }
});

app.get("/products/:catId", verifyJWT, async (req, res) => {
  try {
    const catId = req.params.catId;
    const query = {
      catId: catId,
      paymentStatus: "unpaid",
    };
    const allProduct = await products.find(query).toArray();
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

app.patch("/product/ad", verifyJWT, verifySeller, async (req, res) => {
  try {
    const id = req.query.id;
    const filter = {
      _id: ObjectId(id),
    };
    const updatedDoc = {
      $set: {
        ad: true,
      },
    };
    const result = await products.updateOne(filter, updatedDoc);
    console.log(result);
    res.send(result);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

app.delete("/product", verifyJWT, verifySeller, async (req, res) => {
  try {
    const id = req.query.id;
    const query = {
      _id: ObjectId(id),
    };
    const result = await products.deleteOne(query);
    res.send(result);
  } catch (err) {
    res.send(err);
  }
});

app.patch("/product/unsold", verifyJWT, verifySeller, async (req, res) => {
  try {
    const id = req.query.id;
    const query = {
      _id: ObjectId(id),
    };
    const replaceDoc = {
      $set: {
        paymentStatus: "unpaid",
      },
    };
    const result = await products.updateOne(query, replaceDoc);
    res.send(result);
  } catch (err) {
    res.send(err);
  }
});

app.get("/ad", verifyJWT, async (req, res) => {
  try {
    const adProducts = await products
      .find({ paymentStatus: "unpaid", ad: true })
      .toArray();
    res.send(adProducts);
  } catch (err) {
    res.send(err);
  }
});

app.get("/seller/products", verifyJWT, verifySeller, async (req, res) => {
  try {
    const email = req.query.email;
    const allProduct = await products
      .find({ "seller.sellerEmail": email })
      .toArray();
    res.send(allProduct);
  } catch (err) {
    res.send(err);
  }
});

// Booking API

app.post("/booking", verifyJWT, async (req, res) => {
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

app.get("/booking", verifyJWT, async (req, res) => {
  try {
    const email = req.query.email;
    const allBookings = await bookings.find({ email: email }).toArray();
    res.send(allBookings);
  } catch (err) {
    res.send(err);
  }
});

app.get("/booking/:id", verifyJWT, async (req, res) => {
  try {
    const id = req.params.id;
    const query = {
      _id: ObjectId(id),
    };
    const bookingProd = await bookings.findOne(query);
    res.send(bookingProd);
  } catch (err) {
    res.send(err);
  }
});

app.delete("/booking", verifyJWT, async (req, res) => {
  try {
    const id = req.query.id;
    const query = {
      _id: ObjectId(id),
    };
    const deletedItem = await bookings.deleteOne(query);
    res.send(deletedItem);
  } catch (err) {
    res.send(err);
  }
});

// WishList API
app.post("/wishlist", verifyJWT, async (req, res) => {
  try {
    const wishProduct = req.body;
    const filter = {
      productId: req.body.productId,
      email: req.body.email,
    };
    const result = await wishlist.findOne(filter);
    if (result) {
      return res.send({
        success: true,
        data: result,
      });
    }
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

app.get("/wishlist", verifyJWT, async (req, res) => {
  try {
    const email = req.query.email;
    const allWishlist = await wishlist.find({ email: email }).toArray();
    res.send(allWishlist);
  } catch (err) {
    res.send(err);
  }
});

app.delete("/wishlist", verifyJWT, async (req, res) => {
  try {
    const id = req.query.id;
    const query = {
      _id: ObjectId(id),
    };
    const deletedItem = await wishlist.deleteOne(query);
    res.send(deletedItem);
  } catch (err) {
    res.send(err);
  }
});

// Report To admin

app.post("/reportadmin", verifyJWT, async (req, res) => {
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

app.get("/report", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const reportedItems = await reportedProducts.find({}).toArray();
    res.send(reportedItems);
  } catch (err) {
    res.send(err);
  }
});

// Listener
app.listen(port, () => console.log(`server is running at port: ${port}`));
