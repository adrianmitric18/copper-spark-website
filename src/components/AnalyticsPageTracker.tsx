import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

const AnalyticsPageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    const path = location.pathname + location.search;
    const url = window.location.origin + path;

    window.gtag("event", "page_view", {
      page_path: path,
      page_location: url,
      page_title: document.title,
      send_to: "G-FVMP3D980B",
    });
  }, [location]);

  return null;
};

export default AnalyticsPageTracker;
