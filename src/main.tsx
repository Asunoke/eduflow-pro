import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  const root = document.getElementById("root");
  if (!root) throw new Error("Root element not found");
  createRoot(root).render(<App />);
} catch (error: any) {
  console.error("Critical Failure:", error);
  alert("Erreur critique au démarrage : " + error.message);
}
