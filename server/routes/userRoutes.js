import express from "express";
import { checkUser, addUser, getUsers } from "../../database/userDB.js";

const router = express.Router();
router.post("/login", async (req, res) => {
    console.log("HIT /user/login:", req.body);   // <<< הוספה זמנית

  const { username, password } = req.body;
  try {
    const { userType, id } = await checkUser(username, password); 
    res.json({ userType, id }); 
  } catch (error) {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

router.post("/register", async (req, res) => {
  const { username, password, companyName, contactName, phone, userType } =
    req.body;
  try {
    const userId = await addUser(
      username,
      password,
      companyName,
      contactName,
      phone,
      userType,
    );
    res.status(201).json({ message: "User added successfully", userId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding user", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { userType } = req.query;
    const users = await getUsers(userType);
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching suppliers", error: error.message });
  }
});

export default router;
