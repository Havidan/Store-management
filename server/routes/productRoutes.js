import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  addProduct, 
  getProductsBySupplier, 
  deleteProduct, 
  updateProductStock,
  updateStockAfterOrder 
} from "../../database/productDB.js"; 

const router = express.Router();

// הגדרת multer לטיפול בהעלאת תמונות
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/images/';
    // יצירת התיקיה אם היא לא קיימת
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // יצירת שם ייחודי לתמונה
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // בדיקה שזה קובץ תמונה
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('רק קבצי תמונה מותרים'));
    }
  }
});

router.post("/add", upload.single('image'), async (req, res) => {
  const { supplier_id, product_name, unit_price, min_quantity, stock_quantity } = req.body;
  
  try {
    let image_url = null;
    if (req.file) {
      image_url = `/uploads/images/${req.file.filename}`;
    }

    const productId = await addProduct(
      supplier_id,
      product_name,
      unit_price,
      min_quantity,
      stock_quantity || 0,
      image_url
    );

    res.status(201).json({
      message: "Product added successfully",
      productId: productId,
      image_url: image_url
    });
  } catch (error) {
    // מחיקת הקובץ אם הייתה שגיאה בשמירה למסד הנתונים
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res
      .status(500)
      .json({ message: "Error adding product", error: error.message });
  }
});

router.post("/get-products-by-supplier", async (req, res) => {
  const { supplier_id } = req.body;
  console.log(supplier_id);
  try {
    const products = await getProductsBySupplier(supplier_id);
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
});

router.delete("/delete/:productId", async (req, res) => {
  const { productId } = req.params;
  const { supplier_id } = req.body;
  
  try {
    const result = await deleteProduct(productId, supplier_id);
    res.status(200).json(result);
  } catch (error) {
    res
      .status(400)
      .json({ message: error.message });
  }
});

router.put("/update-stock/:productId", async (req, res) => {
  const { productId } = req.params;
  const { stock_quantity } = req.body;
  
  try {
    const result = await updateProductStock(productId, stock_quantity);
    res.status(200).json(result);
  } catch (error) {
    res
      .status(400)
      .json({ message: error.message });
  }
});

export default router;