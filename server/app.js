import express from "express"; // Importing Express library to create the server
import cors from "cors"; // Importing CORS to allow cross-origin requests
import dotenv from "dotenv"; // Importing dotenv to load environment variables from .env file
import userRoutes from "./routes/userRoutes.js"; 
import productRoutes from "./routes/productRoutes.js"; 
import orderRoutes from "./routes/orderRoutes.js";
import generalRoutes from "./routes/generalRoutes.js"; 
import linksRoutes from "./routes/SupplierOwnerlinksRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js"

dotenv.config(); // This will load variables from .env into process.env

// Create an Express application
const app = express(); 
const PORT = process.env.PORT || 3000; 

app.use(cors()); // Enabling CORS (Cross-Origin Resource Sharing) so the server can accept requests from different domains
app.use(express.json()); //  accept incoming requests with JSON payload

app.use('/uploads', express.static('uploads'));
app.use("/user", userRoutes); 
app.use("/products", productRoutes); 
app.use("/order", orderRoutes); 
app.use("/geo", generalRoutes);
app.use("/links", linksRoutes); 
app.use("/settings", settingsRoutes); 



app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`); 
});
