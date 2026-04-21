import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA service worker registration — strictly guarded.
// Rules:
// - Never register inside an iframe (Lovable preview)
// - Never register on Lovable preview hosts
// - Only register when the user lands on /admin (PWA scope)
// - In all other cases: actively unregister any existing SW to avoid stale caches
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const host = window.location.hostname;
const isPreviewHost =
  host.includes("id-preview--") ||
  host.includes("lovableproject.com") ||
  host === "localhost" ||
  host === "127.0.0.1";

const isAdminPath = window.location.pathname.startsWith("/admin");

if (isInIframe || isPreviewHost || !isAdminPath) {
  // Cleanup any previously registered service workers in unsupported contexts
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
  }
} else if ("serviceWorker" in navigator) {
  // Production /admin only: dynamically import the virtual PWA register module.
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {
      /* no-op: PWA support is optional */
    });
}

createRoot(document.getElementById("root")!).render(<App />);
