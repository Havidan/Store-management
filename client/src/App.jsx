import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Public
import Login from "./components/Login/Login";
import SignUp from "./components/SignUp/SignUp";
import ContactForm from "./components/ContactForm/ContactForm";

// Layouts
import StoreLayout from "./components/Layouts/StoreLayout";
import SupplierLayout from "./components/Layouts/SupplierLayout";

// StoreOwner pages
import StoreOwnerPage from "./components/StoreOwnerHome/StoreOwnerPage";
import StoreOwnerLinksPage from "./components/StoreOwnerHome/Links/StoreOwnerLinksPage";
import StoreLinksActive from "./components/StoreOwnerHome/Links/StoreLinksActive";
import StoreLinksPending from "./components/StoreOwnerHome/Links/StoreLinksPending";
import StoreLinksDiscover from "./components/StoreOwnerHome/Links/StoreLinksDiscover";
import StoreOwnerSettingsPage from "./components/StoreOwnerHome/StoreOwnerSettingsPage";
import OrderDrafts from "./components/StoreOwnerHome/OrderDrafts";


// Supplier pages
import SupplierPage from "./components/SupplierHome/SupplierPage";
import SupplierLinksPage from "./components/SupplierHome/Links/SupplierLinksPage";
import SupplierLinksPending from "./components/SupplierHome/Links/SupplierLinksPending";
import SupplierLinksActive from "./components/SupplierHome/Links/SupplierLinksActive";
import SupplierSettingsPage from "./components/SupplierHome/SupplierSettingsPage";
import EditProductsList from "./components/EditProductsList/EditProductsList";

// Auth (חדשים)
import AuthProvider from "./auth/AuthContext";
import { ProtectedRoute, RoleRoute } from "./auth/ProtectedRoute";

export default function AppWrapper() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />
          <Route path="/SignUp" element={<SignUp />} />

          {/* StoreOwner area with persistent Sidebar */}
          <Route element={<StoreLayout />}>
            <Route path="/StoreOwnerHome" element={<StoreOwnerPage />} />
            <Route path="/OrderDrafts" element={<OrderDrafts />} />
            <Route path="/StoreOwnerLinks" element={<StoreOwnerLinksPage />}>
              <Route index element={<StoreLinksActive />} />
              <Route path="active" element={<StoreLinksActive />} />
              <Route path="pending" element={<StoreLinksPending />} />
              <Route path="discover" element={<StoreLinksDiscover />} />
            </Route>
            {/* הגנה מדורגת רק על דף אחד בשלב זה */}
            <Route
              path="/StoreOwnerSettings"
              element={
                <ProtectedRoute>
                  <RoleRoute role="StoreOwner">
                    <StoreOwnerSettingsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route path="/ContactForm" element={<ContactForm />} />
          </Route>

          {/* Supplier area with persistent Sidebar */}
          <Route element={<SupplierLayout />}>
            <Route path="/SupplierHome" element={<SupplierPage />} />
            <Route path="/SupplierLinks" element={<SupplierLinksPage />}>
              <Route index element={<SupplierLinksActive />} />
              <Route path="pending" element={<SupplierLinksPending />} />
              <Route path="active" element={<SupplierLinksActive />} />
            </Route>
            {/* נשאיר ללא הגנה בשלב זה (נרחיב בהמשך) */}
            <Route path="/SupplierSettings" element={<SupplierSettingsPage />} />
            <Route path="/ContactForm" element={<ContactForm />} />
            <Route path="/EditProducts" element={<EditProductsList />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
