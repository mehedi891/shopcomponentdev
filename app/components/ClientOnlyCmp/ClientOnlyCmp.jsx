import { useEffect, useState } from "react";

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

export default ClientOnlyCmp