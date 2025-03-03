const express = require("express");
const Blog = require("../models/Blog");
const User = require("../models/User");
const auth = require("../middleware/auth");
const router = express.Router();
const upload = require("../middleware/multer");
const uploadOnCloudinary = require("../utils/cloudinary");

router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Authenticated user:", req.user);
    const { title, location, country, date, category, content } = req.body;
    if (!req.file) {
      return res.status(400).json({
        message: "Image file is required",
      });
    }
    const uploadedImage = await uploadOnCloudinary(req.file);
    if (!uploadedImage || !uploadedImage.url) {
      return res.status(500).json({
        message: "Failed to upload image",
      });
    }
    const blog = new Blog({
      title,
      location,
      country,
      date,
      category,
      content,
      image: uploadedImage.url,
      user: req.user.id,
    });
    console.log("Attempting to save blog:", blog);
    const savedBlog = await blog.save();
    console.log("Blog saved successfully:", savedBlog);
    res.status(201).send({
      message: "Blog created successfully",
      blog: savedBlog,
    });
  } catch (err) {
    console.error("Blog creation error:", err);
    res.status(500).send({
      message: "Server error while creating blog",
      error: err.message,
    });
  }
});

// Fetch blogs with optional search query
router.get("/", async (req, res) => {
  const { search } = req.query;
  const query = {};

  if (search) {
    const user = await User.findOne({
      username: { $regex: search, $options: "i" },
    });
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
      { user: user ? user._id : null },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const blogs = await Blog.find(query)
      .populate("user", "username profileImage")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "user",
      "username email profileImage"
    );

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/:id/comments", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    const user = await User.findById(req.user.id);
    user.password = null;
    // Create new comment
    const newComment = {
      text,
      user: {
        username: user.username,
        _id: user._id,
        profileImage: user.profileImage,
      },
      createdAt: new Date(),
    };

    blog.comments.push(newComment);
    await blog.save();

    res.status(201).json({
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add this route to test token validity
router.get("/test-auth", auth, (req, res) => {
  try {
    res.json({ message: "Token is valid", user: req.user });
  } catch (error) {
    res.status(401).json({ message: "Token validation failed" });
  }
});

module.exports = router;
