import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CartCountBuble from "./CartCountBuble";

const FLAG = "__EFOLI_CART_BUBBLE_MOUNTED__";
const ROOT_ID = "efoli-cart-bubble-root";

function ensureRoot() {
  let el = document.getElementById(ROOT_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = ROOT_ID;
    document.body.appendChild(el);
  }
  return el;
}

export default function CartBubleWrapper() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // already mounted somewhere? then don’t render
    if (window[FLAG]) return;

    // claim the singleton & render
    window[FLAG] = true;
    setShouldRender(true);

    // if this component unmounts, release the singleton
    return () => {
      window[FLAG] = false;
      const root = document.getElementById(ROOT_ID);
      // optional: clean up the portal root
      if (root && root.childElementCount === 0) {
        root.remove();
      }
    };
  }, []);

  if (!shouldRender) return null;

  // Mount into one stable DOM node so it’s not duplicated
  return createPortal(<CartCountBuble />, ensureRoot());
}
