import express from "express";
import {
  addOrder,
  addOrderItem,
  getOrdersById,
  updateStatusOrder,
} from "../../database/orderDB.js";

const router = express.Router();

router.post("/add", async (req, res) => {
    console.log("REQ BODY:", req.body);

  const { supplier_id, owner_id, products_list } = req.body;

  try {
    const orderId = await addOrder(supplier_id, owner_id, "בוצעה", new Date());
    for (const product of products_list) {
      const { product_id, quantity } = product;
      if (quantity > 0) {
        await addOrderItem(product_id, orderId, quantity);
      }
    }
    res.status(201).json({ message: "Order added successfully", orderId });
  } catch (error) {
    console.error("Error adding order:", error);
    res.status(500).json({ message: "Error adding order" });
  }
});
/*
router.get("/all", async (req, res) => {

  try {
    const orders = await getAllOrders();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error retrieving orders:", error);
    res.status(500).json({ message: "Error retrieving orders" });
  }
});*/

router.post("/by-id", async (req, res) => {
  const { id, userType } = req.body;
console.log("In orderRoutes - received id:", id, "userType:", userType);
  try {
    const orders = await getOrdersById(id, userType);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error retrieving orders for supplier:", error);
    res.status(500).json({ message: "Error retrieving orders for supplier" });
  }
});

router.put("/update-status/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const result = await updateStatusOrder(orderId, status);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Error updating order status" });
  }
});

export default router;
