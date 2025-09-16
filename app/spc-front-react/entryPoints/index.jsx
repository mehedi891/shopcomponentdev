import './globalFnc.js'
import { createRoot } from "react-dom/client";
import Main from "../spc-front-components/Main/Main";


if (!window.__SPC_BOOTED__) {
  window.__SPC_BOOTED__ = true;

  let host = document.getElementById("shopcomponent-app");
  if (!host) {
    host = document.createElement("div");
    host.id = "shopcomponent-app";
    document.body.appendChild(host);
  }

  createRoot(host).render(<Main />);
}
