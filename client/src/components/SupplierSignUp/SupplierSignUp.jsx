import React, { useState } from "react";
import styles from "./SupplierSignUp.module.css";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 

function SupplierSignUp() {
  //the user data are saved in local storage even after rendering. when the user sign up restart the data.
  localStorage.removeItem("userType");
  localStorage.removeItem("username");
  localStorage.removeItem("supplierId");

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {

    e.preventDefault();
    const userData = {
      username,
      password,
      companyName,
      contactName,
      phone: contactPhone,
      userType: "Supplier",
    };

    try {
      //call the server to add new supplier
      const response = await axios.post(
        "http://localhost:3000/user/register",
        userData,
      );

      //unnecessary - can come immediately to catch section
      if (response.status === 201) {
        //save in local storage for saving after render
        localStorage.setItem("username", username);
        localStorage.setItem("userType", "Supplier");
        localStorage.setItem("userId", response.data.userId);
        //after register move to adding available product to this supllier
        navigate("/EditProducts");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert("שגיאה בהוספת הספק");
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>רישום ספק</h2>

        <label className={styles.label}>שם החברה</label>
        <input
          className={styles.input}
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="הכנס שם חברה עבורה אתה מספק מוצרים"
          required
        />

        <label className={styles.label}>שם איש הקשר</label>
        <input
          className={styles.input}
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="הכנס שם איש קשר"
          required
        />

        <label className={styles.label}>טלפון איש קשר</label>
        <input
          className={styles.input}
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="הכנס טלפון של איש הקשר"
          required
        />

        <label className={styles.label}>שם משתמש</label>
        <input
          className={styles.input}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="בחר שם משתמש"
          required
        />

        <label className={styles.label}>סיסמה</label>
        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="בחר סיסמה"
          required
        />

        <button type="submit" className={styles.button}>
          שמור פרטי ספק ועבור להוספת מוצרים
        </button>
      </form>
    </div>
  );
}

export default SupplierSignUp;
