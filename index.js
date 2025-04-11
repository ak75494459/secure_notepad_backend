const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Load .env
const mongoose = require("mongoose");
const User = require("./model/User");
const multer = require("multer");
const Gallery = require("./model/Gallery");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = 8000;
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json()); // Parse JSON body

// DB Connection
mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING)
  .then(() => console.log("✅ Connected to DB"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

// Routes
app.get("/health", (req, res) => {
  res.send("health is ok");
});

app.post("/signUp", async (req, res) => {
  try {
    const { password } = req.body;
    const user = new User({ password });
    const result = await user.save();
    res.send({ result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Something went wrong" });
  }
});

app.get("/api/secure-gallery/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const gallery = await Gallery.find({ user: userId });

    if (!gallery || gallery.length === 0) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    res.json(gallery);
  } catch (error) {
    console.error("Error in fetching image:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post(
  "/api/secure-gallery/:id",
  upload.array("imageFile", 10),
  async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      const imageUrls = await Promise.all(
        files.map((file) => uploadImage(file))
      );

      const userId = req.params.id;

      const gallery = new Gallery({
        imageUrl: imageUrls,
        user: userId,
      });

      await gallery.save();
      res.status(201).json(gallery);
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

const uploadImage = async (file) => {
  try {
    const base64Image = Buffer.from(file.buffer).toString("base64");
    const dataURI = `data:${file.mimetype};base64,${base64Image}`;

    const uploadResponse = await cloudinary.uploader.upload(dataURI); // ✅ FIXED
    return uploadResponse.url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
};

app.get("/api/secure-gallery", async (req, res) => {
  try {
    const userId = req.query.user;
    const gallery = await Gallery.find({ user: userId });

    if (!gallery || gallery.length === 0) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    res.json(gallery);
  } catch (error) {
    console.error("Error in fetching image:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
