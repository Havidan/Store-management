import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login/Login";
import StoreOwnerPage from "./components/StoreOwnerHome/StoreOwnerPage";
import SupplierPage from "./components/SupplierHome/SupplierPage";
import SupplierSignUp from "./components/SupplierSignUp/SupplierSignUp";
import EditProductsList from "./components/EditProductsList/EditProductsList";

function App() {


  return (
    <div>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/SupplierSignUp" element={<SupplierSignUp />} />
        <Route path="/SupplierHome" element={<SupplierPage />} />
        <Route path="/StoreOwnerHome" element={<StoreOwnerPage />} />
        <Route path="/EditProducts" element={<EditProductsList />} />
      </Routes>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
