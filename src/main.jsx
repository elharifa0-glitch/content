import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./ThemeContext.jsx";
import UpdatePrompt from "./UpdatePrompt.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
      <UpdatePrompt />
    </ThemeProvider>
  </React.StrictMode>
);
