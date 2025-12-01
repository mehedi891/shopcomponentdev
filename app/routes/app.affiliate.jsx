import { Outlet } from "@remix-run/react";
import { PolarisVizProvider } from '@shopify/polaris-viz';
const Affiliate = () => {
   return (
      <PolarisVizProvider>
         <Outlet />
      </PolarisVizProvider>
   );

}

export default Affiliate