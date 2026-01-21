import { useEffect, useState } from "react";
import PropTypes from "prop-types";

const ClientOnlyCmp = ({children}) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    if(typeof window !== 'undefined') {
      setIsClient(true);
    }
  },[])
  return (
    <>
      {isClient && children}
    </>
  )
}

ClientOnlyCmp.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ClientOnlyCmp