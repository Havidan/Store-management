import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Login.module.css";
import axios from "axios";

function Login() {

  localStorage.removeItem("userType");
  localStorage.removeItem("username");
  localStorage.removeItem("supplierId");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/user/login", {
        username,
        password,
      });

      const { userType, id } = response.data;

      //save in local storage for save the data if the user will render the page by himself
      localStorage.setItem("userType", userType);
      localStorage.setItem("userId", id);
      localStorage.setItem("username", username);

      //use navigate to avoid rendering the page. navigate to home page for supplier or owner.
      if (userType == "Supplier") {
        navigate("/SupplierHome");
      } else {
        navigate("/StoreOwnerHome");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("שם משתמש או סיסמה שגויים");
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>התחברות</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={styles.input}
          placeholder="הכנס שם משתמש"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          placeholder="הכנס סיסמה"
          required
        />
        <button type="submit" className={styles.button}>
          התחבר
        </button>
        {/*use link to avoid rendering the page*/}
        <Link to="/SupplierSignUp" className={styles.link}>
          רישום עבור ספק
        </Link>
      </form>
    </div>
  );
}

export default Login;
