import { createContext, useEffect, useRef, useState } from "react";
import getExistCart from "../../spc-front-components/utilities/getExistCart";

export const ContextComponent = createContext(null);

const ContextWrapper = ({ children }) => {
  const [cartData, setCartData] = useState({});
  const [cartTotalCount, setCartTotalCount] = useState(0);

  const cartModal = useRef(null);


  const cartRef = useRef({ cartData, setCartData, cartTotalCount, setCartTotalCount });

  useEffect(() => {
    cartRef.current = { cartData, setCartData, cartTotalCount, setCartTotalCount };
  }, [cartData, cartTotalCount]);

  // useEffect(() => {
  //   const existCartData = localStorage.getItem('embedup_cart_data')
  //     ? JSON.parse(localStorage.getItem('embedup_cart_data'))
  //     : null;

  //   if (existCartData) {
  //     setCartData(existCartData);
  //     setCartTotalCount(existCartData.totalQuantity);
  //   }
  // }, []);

  // tiny helper
const safeParse = (s) => {
  try { return JSON.parse(s); } catch { return null; }
};

const getCartFnc = async () => {
  const raw = localStorage.getItem("embedup_store_info");
  if (!raw) return null;

  const info = safeParse(raw);
  if (!info) return null;

  const { token, store } = info;
  if (!token || !store) return null;

  const cartId = localStorage.getItem("shopcomponent_cartId") || "";
  if (!cartId) return null;

  try {
    const res = await getExistCart(cartId, token, store);
    return res?.success ? res.cartData ?? null : null;
  } catch (e) {
    console.warn("getCartFnc failed:", e);
    return null;
  }
};

useEffect(() => {
  let cancelled = false;
  //console.log('from useEffect');
  (async () => {
    const cart = await getCartFnc();

    if (cancelled) return;

    if (cart?.id) {
      setCartData(cart);
      setCartTotalCount(cart.totalQuantity ?? 0);
    } else {
      setCartData({});
      setCartTotalCount(0);
    }
  })();

  return () => { cancelled = true; };
}, []);


  //console.log("cartDataFromContext:", cartData);

  const contextVal = {
    cartModal,
    cartData,
    setCartData,
    cartTotalCount,
    setCartTotalCount,
    cartRef,
  };

  return (
    <ContextComponent.Provider value={contextVal}>
      {children}
    </ContextComponent.Provider>
  );
};

export default ContextWrapper;
