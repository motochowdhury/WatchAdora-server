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

// Listener
app.listen(port, () => console.log(`server is running at port: ${port}`));
