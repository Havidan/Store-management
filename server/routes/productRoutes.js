import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  addProduct, 
  getProductsBySupplier, 
  deleteProduct, 
  updateProductStock,
  updateStockAfterOrder,
  updateProduct
} from "../../database/productDB.js"; 

// חדשים
import authRequired from "../middlewares/authRequired.js";
import requireRole from "../middlewares/requireRole.js";

const router = express.Router();

// multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/images/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('רק קבצי תמונה מותרים'));
  }
});

/** ========= ישנים (עם supplier_id מהלקוח) ========= */
router.post("/add", upload.single('image'), async (req, res) => {
  const { supplier_id, product_name, unit_price, min_quantity, stock_quantity } = req.body;
  try {
    let image_url = null;
    if (req.file) image_url = `/uploads/images/${req.file.filename}`;
    const productId = await addProduct(
      supplier_id, product_name, unit_price, min_quantity, stock_quantity || 0, image_url
    );
    res.status(201).json({ message: "Product added successfully", productId, image_url });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, ()=>{});
    res.status(500).json({ message: "Error adding product", error: error.message });
  }
});

router.post("/get-products-by-supplier", async (req, res) => {
  const { supplier_id } = req.body;
  try {
    const products = await getProductsBySupplier(supplier_id);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
});

router.delete("/delete/:productId", async (req, res) => {
  const { productId } = req.params;
  const { supplier_id } = req.body;
  try {
    const result = await deleteProduct(productId, supplier_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/update-stock/:productId", async (req, res) => {
  const { productId } = req.params;
  const { stock_quantity } = req.body;
  try {
    const result = await updateProductStock(productId, stock_quantity);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/update/:productId", async (req, res) => {
  const { productId } = req.params;
  const { product_name, unit_price, min_quantity } = req.body;
  try {
    if (!product_name?.trim()) return res.status(400).json({ message: "שם המוצר חובה" });
    if (!unit_price || unit_price <= 0) return res.status(400).json({ message: "מחיר לא תקין" });
    if (!min_quantity || min_quantity <= 0) return res.status(400).json({ message: "כמות מינימלית לא תקינה" });

    const result = await updateProduct(productId, product_name, unit_price, min_quantity);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/** ========= חדשים (מבוססי Session) ========= */
router.post("/add/session", authRequired, requireRole("Supplier"), upload.single('image'), async (req, res) => {
  const supplier_id = req.session.user.id;
  const { product_name, unit_price, min_quantity, stock_quantity } = req.body;
  try {
    let image_url = null;
    if (req.file) image_url = `/uploads/images/${req.file.filename}`;
    const productId = await addProduct(
      supplier_id, product_name, unit_price, min_quantity, stock_quantity || 0, image_url
    );
    res.status(201).json({ message: "Product added successfully", productId, image_url });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, ()=>{});
    res.status(500).json({ message: "Error adding product", error: error.message });
  }
});

router.get("/my", authRequired, requireRole("Supplier"), async (req, res) => {
  const supplier_id = req.session.user.id;
  try {
    const products = await getProductsBySupplier(supplier_id);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
});

router.delete("/delete/session/:productId", authRequired, requireRole("Supplier"), async (req, res) => {
  const supplier_id = req.session.user.id;
  const { productId } = req.params;
  try {
    const result = await deleteProduct(productId, supplier_id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/update-stock/session/:productId", authRequired, requireRole("Supplier"), async (req, res) => {
  const { productId } = req.params;
  const { stock_quantity } = req.body;
  try {
    const result = await updateProductStock(productId, stock_quantity);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/update/session/:productId", authRequired, requireRole("Supplier"), async (req, res) => {
  const { productId } = req.params;
  const { product_name, unit_price, min_quantity } = req.body;
  try {
    const result = await updateProduct(productId, product_name, unit_price, min_quantity);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
