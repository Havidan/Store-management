import express from "express";
import { addProduct, getProductsBySupplier } from "../../database/productDB.js"; 

const router = express.Router();

router.post("/add", async (req, res) => {
  const { supplier_id, product_name, unit_price, min_quantity } = req.body;
  try {

    const productId = await addProduct(
      supplier_id,
      product_name,
      unit_price,
      min_quantity,
    );

    res.status(201).json({
      message: "Product added successfully",
      productId: productId, 
    });
  } catch (error) {
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

export default router;
