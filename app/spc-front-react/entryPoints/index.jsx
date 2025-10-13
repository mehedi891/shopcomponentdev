import { createRoot } from "react-dom/client";
import Main from "../spc-front-components/Main/Main";
import ContextWrapper from './ContextWrapper/ContextWrapper.jsx';


if (!window.__SPC_BOOTED__) {
  window.__SPC_BOOTED__ = true;

  let host = document.getElementById("embedup-app");
  if (!host) {
    host = document.createElement("div");
    host.id = "embedup-app";
    document.body.appendChild(host);
  }

  console.log(
    "%c EmbedUp app loaded.. ",
    `background: linear-gradient(
    135deg,
    #FDDDE6 0%,
    #F4B7FF 25%,
    #B499FF 50%,
    #9AC5FF 75%,
    #FFE4B5 100%
  ); 
  color: white; 
  font-weight: bold; 
  font-size: 16px; 
  padding: 6px 14px; 
  border-radius: 6px;`
  );

  createRoot(host).render(
    <ContextWrapper>
      <Main />
    </ContextWrapper>
  );
}
