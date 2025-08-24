import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

const handleClick = () => {
  alert("Button clicked!");
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <button onClick={handleClick}>Click Me</button>
    <App />
  </StrictMode>,
);
