// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // הכתובת של השרת שלך
  withCredentials: true,            // שולח/מקבל קוקיז
});

export default api;