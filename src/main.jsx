import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./ThemeContext.jsx";
import { LanguageProvider } from "./LanguageContext.jsx";
import UpdatePrompt from "./UpdatePrompt.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
        <UpdatePrompt />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
