import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App.jsx";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convex = convexUrl && !convexUrl.includes("placeholder") ? new ConvexReactClient(convexUrl) : null;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {convex ? (
        <ConvexProvider client={convex}>
          <App />
        </ConvexProvider>
      ) : (
        <App />
      )}
    </BrowserRouter>
  </StrictMode>
);
