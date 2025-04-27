import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { msalInstance } from "./auth.js";
import { MsalProvider } from "@azure/msal-react";

createRoot(document.getElementById("root")).render(
  <MsalProvider instance={msalInstance}>
    <StrictMode>
      <App />
    </StrictMode>
  </MsalProvider>
);
