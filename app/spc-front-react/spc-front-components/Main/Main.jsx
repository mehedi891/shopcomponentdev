
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Container from "../Container/Container";


const safeParse = (s) => { try { return JSON.parse(s); } catch { return {}; } };

export default function Main() {
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    const scan = () => {
      const els = Array.from(document.querySelectorAll(".spc_rootElement"));
      const items = els.map((el, i) => ({
        el,
        props: el.dataset.props ? safeParse(el.dataset.props) : {},
        key: `${el.id + i}`  || `spc-${i}`,
      }));
      setTargets(items);
    };

    scan();
    const obs = new MutationObserver(scan);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);



  return (
    <>
      {targets.map(({ el, props, key }) =>
        createPortal(<Container {...props} />, el, key)
      )}
    </>
  );
}
