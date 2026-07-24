import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { registerServiceWorker, requestPersistentStorageQuietly } from "./registerSW.js";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/animations.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

registerServiceWorker();
requestPersistentStorageQuietly();
