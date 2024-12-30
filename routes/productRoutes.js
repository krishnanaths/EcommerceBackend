// routes/postRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');


const {
  createProduct,
  deleteProduct,
  editProduct,
  listProducts,
  listParticularProduct,
  uploadFile
} = require('../controllers/productController');

router.post('/',protect,uploadFile, createProduct);
router.delete('/delete/:id', protect, deleteProduct);
router.put('/update/:id', uploadFile,protect, editProduct);
router.get('/listproducts',protect, listProducts);
router.get('/products/:id',protect, listParticularProduct);

module.exports = router;