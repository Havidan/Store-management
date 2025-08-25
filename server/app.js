import express from "express"; // Importing Express library to create the server
import cors from "cors"; // Importing CORS to allow cross-origin requests
import dotenv from "dotenv"; // Importing dotenv to load environment variables from .env file
import session from "express-session";              // <-- חדש

import userRoutes from "./routes/userRoutes.js"; 
import productRoutes from "./routes/productRoutes.js"; 
import orderRoutes from "./routes/orderRoutes.js";
import generalRoutes from "./routes/generalRoutes.js"; 
import linksRoutes from "./routes/SupplierOwnerlinksRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js"
import authRoutes from "./routes/auth.js";


dotenv.config(); // This will load variables from .env into process.env

// Create an Express application
const app = express(); 
const PORT = process.env.PORT || 3000; 

app.use(
  cors({
    origin: "http://localhost:5173", // כתובת ה-Vite שלך
    credentials: true,               // חשוב לקוקי!
  })
);

app.use(express.json());

// *** Session setup (HttpOnly cookie) ***
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // secure: true, // להדליק ב-HTTPS אמיתי בפרודקשן
      // maxAge: 8 * 60 * 60 * 1000, // אופציונלי: 8 שעות
    },
  })
);


app.use('/uploads', express.static('uploads'));
app.use("/user", userRoutes); 
app.use("/products", productRoutes); 
app.use("/order", orderRoutes); 
app.use("/geo", generalRoutes);
app.use("/links", linksRoutes); 
app.use("/settings", settingsRoutes); 
app.use("/auth", authRoutes);



app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`); 
});
