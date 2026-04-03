import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("Mounting App to #root...");
createRoot(document.getElementById("root")!).render(<App />);
console.log("App mounted.");
console.log("Application initialization complete.");
