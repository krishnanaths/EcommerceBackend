const multer = require("multer");
const path = require("path");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const uploadFile = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // Set a limit for file size (5MB in this case)
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    // Check if the file is a valid image type
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images only!");
    }
  },
}).array("images", 10);

const createProduct = async (req, res) => {
  const {
    productName,
    description,
    price,
    quantity,
    category,
    color,
    size,
    gender,
    compareAtPrice,
  } = req.body;
  console.log(req.files);
  const images = req.files.map((file) => file.path);

  const token = req.headers.authorization.split(" ")[1];
  let userId;

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    userId = decodedToken.id;
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const newProduct = new Product({
      productName,
      description,
      price,
      quantity,
      category,
      color,
      size,
      gender,
      images,
      compareAtPrice,
      user: userId, // Attach the user ID
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Error creating product" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete product", details: error.message });
  }
};

const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const product = await Product.findByIdAndUpdate(id, updates, { new: true });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update product", details: error.message });
  }
};

const listProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch products", details: error.message });
  }
};

const listParticularProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch product", details: error.message });
  }
};

module.exports = {
  createProduct,
  deleteProduct,
  editProduct,
  listProducts,
  listParticularProduct,
  uploadFile,
};
