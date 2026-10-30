// GoHighLevel chat widget ID (GHL → Sites → Chat Widget → data-widget-id). Empty = widget disabled.
export const GHL_WIDGET_ID = "";

export function loadGhlWidget() {
  if (!GHL_WIDGET_ID || typeof document === "undefined" || document.getElementById("ghl-chat-widget")) return;
  const s = document.createElement("script");
  s.id = "ghl-chat-widget";
  s.src = "https://widgets.leadconnectorhq.com/loader.js";
  s.setAttribute("data-resources-url", "https://widgets.leadconnectorhq.com/chat-widget/loader.js");
  s.setAttribute("data-widget-id", GHL_WIDGET_ID);
  s.async = true;
  document.body.appendChild(s);
}
