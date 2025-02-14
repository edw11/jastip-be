import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { User } from "./models/users.model.js";
import { Post } from "./models/posts.model.js";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();
const port = 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ⬅ Middleware to parse cookies
// Allow credentials and restrict CORS to specific origin
app.use(
  cors({
    origin: "https://jastip-fe-nu.vercel.app", // Allow only Next.js frontend
    credentials: true, // Allow cookies
  })
);

// Listen on port
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// Connect to MongoDB
mongoose
  .connect(
    `mongodb+srv://admin:${process.env.DB_PASSWORD}@inkorea.3xklu.mongodb.net/In-Korea?retryWrites=true&w=majority&appName=inKorea`
  )
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
  });

// Register Route
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, imgUrl } = req.body;
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      res.status(409).json({ message: "User is already exist" });
    } else {
      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create the new user
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        imgUrl,
      });
      console.log("User added");

      // Send the created user response
      res.status(200).json(user);
    }
  } catch (error) {
    console.error("Error during registration:", error); // Log the full error

    res.status(500).json({ message: "Server Error: " + error.message });
  }
});

//Sign in Route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log("login detected");
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else {
      const compare = await bcrypt.compare(password, user.password);
      if (!compare) {
        res.status(401).json({ message: "Password is wrong" });
      } else {
        createCookie(res, user);
        return res.status(200).json({ message: "Logged in successfully" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//check-authentication
app.get("/check-auth", authenticateUser, (req, res) => {
  res.status(200).json({ authenticated: true, user: req.user });
});

//create-post
app.post("/create", authenticateUser, async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id);
    const { title, description, price, quota } = req.body;
    await Post.create({
      title,
      description,
      price,
      quota,
      author_id: user.id,
      author: user.name,
    });
    res.status(200).json({ message: "Post Success" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// // get-post
// app.get("/post", authenticateUser, async (req, res) => {
//   try {
//     // Get the page and limit from query parameters
//     const page = parseInt(req.query.page) || 1; // Default to page 1
//     const limit = parseInt(req.query.limit) || 6; // Default to 6 posts per page

//     // Calculate the offset (skip) for MongoDB query
//     const skip = (page - 1) * limit;

//     // Fetch paginated posts
//     const posts = await Post.find({})
//       .skip(skip) // Skip posts for previous pages
//       .limit(limit); // Limit the number of posts per page

//     // Get the total number of posts for calculating totalPages
//     const totalPosts = await Post.countDocuments();

//     // Calculate the total number of pages
//     const totalPages = Math.ceil(totalPosts / limit);

//     // Send the paginated data with total pages and total posts count
//     res.status(200).json({ posts, totalPages, totalPosts });
//   } catch (error) {
//     console.error("Error fetching posts:", error);
//     res.status(500).json({ message: error.message });
//   }
// });

//get-post
app.get("/post", async (req, res) => {
  try {
    const data = await Post.find({});
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//log-out
app.post("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hash the password before saving
async function hashPassword(plainPassword) {
  const saltRounds = 10; // Salt rounds for bcrypt
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
  return hashedPassword;
}
//Create cookie
function createCookie(res, user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, name: user.name, status: user.status },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1h",
    }
  );
  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 3600000,
  });
}
//authenticateUser
async function authenticateUser(req, res, next) {
  const token = req.cookies.token;
  console.log("token");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded; // Attach user data to request
    if (decoded.status === "Not approved")
      return res
        .status(401)
        .json({ message: "Unauthorized: User not approved" });
    next(); // Proceed to the next middlewar
  } catch {
    res.clearCookie("token");
    return res.status(403).json({ message: "Forbidden: Invalid token" });
  }
}
