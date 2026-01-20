import { useEffect, useState } from "react";
import IndividualProduct from "../ApplyByProductInd/Individual/IndividualProduct";
import IndividualCollection from "../AppplyByCollectionInd/Individual/IndividualCollection";
import BulkProduct from "../ApplyByProductBulk/BulkProduct";
import CartBubleWrapper from "../ShoppingCart/CartCountBuble/CartBubleWrapper";

const Container = ({ id, token, store }) => {
  const [componentData, setComponentData] = useState({});
  const [loading, setLoading] = useState(false);

const baseApiUrl = import.meta.env.VITE_SHOPIFY_APP_URL;
//console.log(baseApiUrl);

  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {

      try {
        const url = `${baseApiUrl}/api/getcomponent?id=${id}`;
        const response = await fetch(url);
        const result = await response.json();

        if (result?.data?.id && result?.success) {

          setComponentData(result.data || {});
        }

      } catch (error) {
        setLoading(false)
        console.error("Error fetching component data:", error);
      } finally {
        setLoading(false)
      }
    }
    fetchData();

  }, [id]);


  useEffect(() => {
    if (componentData?.id) {
      const isExistWebcomJs = document.querySelector('script[src="https://cdn.shopify.com/storefront/web-components.js"]');
      if (!isExistWebcomJs) {
        const script = document.createElement('script');
        script.src = "https://cdn.shopify.com/storefront/web-components.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [componentData]);

  if (loading) return <Loader label="Loading component…" />;
  if (!componentData?.id) return null;

  return (
    <div>
      {componentData?.appliesTo === 'product' && componentData?.addToCartType?.type === 'individual' && (
        <div>
          <IndividualProduct componentData={componentData} token={token} store={store} />
        </div>
      )}
      {componentData?.appliesTo === 'collection' && (
        <div>
          <IndividualCollection componentData={componentData} token={token} store={store} />
        </div>

      )}

      {componentData?.appliesTo === 'product' && componentData?.addToCartType?.type === 'bulk' && (
        <div>
          <BulkProduct componentData={componentData} token={token} store={store} />
        </div>
      )}

       {componentData?.componentSettings?.cartBehavior === 'cart' && <CartBubleWrapper />}

    </div>
  )
}

export default Container




function Loader({ label = "Loading...", size = 24, thickness = 6 }) {
  // keep the stroke inside the viewBox
  const r = 25 - thickness / 2;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        stroke="currentColor"
        aria-hidden
      >
        <g fill="none" strokeWidth={thickness} strokeLinecap="round">
          <circle cx="25" cy="25" r={r} opacity=".25" />
          <path d={`M25 ${25 - r} a ${r} ${r} 0 1 1 0 ${2 * r}`}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 25 25"
              to="360 25 25"
              dur="0.8s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </svg>
      {label && <span>{label}</span>}
    </div>
  );
}
