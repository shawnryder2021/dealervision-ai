/*!
 * DealerVision embeddable widgets loader.
 *
 * Usage (paste on the dealer's site):
 *   Floating chat bubble:
 *     <script src="https://APP/embed.js" data-dealer="DEALER_SLUG" data-widget="chat"></script>
 *
 *   Inline trade-in or booking form (mounts where the script is, or into data-target):
 *     <script src="https://APP/embed.js" data-dealer="DEALER_SLUG" data-widget="trade-in" data-mode="inline"></script>
 *     <div id="dv-trade-in"></div>
 *     <script src="https://APP/embed.js" data-dealer="DEALER_SLUG" data-widget="trade-in" data-mode="inline" data-target="#dv-trade-in"></script>
 *
 * Optional attributes:
 *   data-mode   "bubble" (default for chat) | "inline" (default for trade-in/book)
 *   data-target CSS selector for the container in inline mode
 *   data-height inline iframe height in px (default 560)
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var slug = script.getAttribute("data-dealer");
  var widget = script.getAttribute("data-widget") || "chat";
  if (!slug) {
    console.error("[DealerVision] data-dealer (slug) is required on the embed script.");
    return;
  }

  // Derive the app origin from this script's own URL.
  var origin;
  try {
    origin = new URL(script.src).origin;
  } catch (e) {
    console.error("[DealerVision] could not determine embed origin.");
    return;
  }

  var defaultMode = widget === "chat" ? "bubble" : "inline";
  var mode = script.getAttribute("data-mode") || defaultMode;
  var src = origin + "/embed/" + encodeURIComponent(slug) + "/" + widget;

  function makeIframe(extraStyle) {
    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.setAttribute("title", "DealerVision widget");
    iframe.setAttribute("loading", "lazy");
    iframe.style.cssText =
      "border:0;width:100%;background:transparent;" + (extraStyle || "");
    return iframe;
  }

  if (mode === "inline") {
    var height = parseInt(script.getAttribute("data-height") || "560", 10);
    var targetSel = script.getAttribute("data-target");
    var container = targetSel ? document.querySelector(targetSel) : null;
    var iframe = makeIframe(
      "height:" + height + "px;max-width:480px;border-radius:14px;" +
        "box-shadow:0 4px 24px rgba(0,0,0,.10);"
    );
    if (container) {
      container.appendChild(iframe);
    } else {
      // Mount right after the script tag.
      script.parentNode.insertBefore(iframe, script.nextSibling);
    }
    return;
  }

  // ── Bubble mode (chat) ───────────────────────────────────────────────────
  var BTN_SIZE = 56;
  var PANEL_W = 380;
  var PANEL_H = 600;

  var btn = document.createElement("button");
  btn.setAttribute("aria-label", "Open chat");
  btn.style.cssText =
    "position:fixed;bottom:20px;right:20px;width:" + BTN_SIZE + "px;height:" + BTN_SIZE +
    "px;border-radius:50%;border:0;cursor:pointer;z-index:2147483646;" +
    "background:#0f172a;color:#fff;box-shadow:0 6px 24px rgba(0,0,0,.25);" +
    "display:flex;align-items:center;justify-content:center;font-size:24px;";
  btn.innerHTML = "💬";

  var panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;bottom:88px;right:20px;width:" + PANEL_W + "px;height:" + PANEL_H +
    "px;max-width:calc(100vw - 32px);max-height:calc(100vh - 120px);z-index:2147483646;" +
    "border-radius:16px;overflow:hidden;box-shadow:0 12px 48px rgba(0,0,0,.30);" +
    "background:#fff;display:none;";

  var panelIframe = makeIframe("height:100%;");
  panel.appendChild(panelIframe);

  var open = false;
  btn.addEventListener("click", function () {
    open = !open;
    panel.style.display = open ? "block" : "none";
    btn.innerHTML = open ? "✕" : "💬";
    btn.setAttribute("aria-label", open ? "Close chat" : "Open chat");
  });

  function mount() {
    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
