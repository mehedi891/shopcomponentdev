   function limitTotalVariants(products, maxTotal = 12) {
        let totalVariants = 0;

        return products.reduce((result, product) => {

            const remaining = maxTotal - totalVariants;
            const productInfo = {
                id: product.id,
                title: product.title,
                handle: product.handle,
                image: product.images[0].originalSrc,
                variants: product.variants,
            }
            const variants = productInfo.variants || [];

           

            if (remaining <= 0) {
                return result;
            }

             const availableForSaleVariants = variants?.filter(variant => variant.availableForSale) || [];

             //console.log('availableForSaleVariants', availableForSaleVariants);

            const slicedVariants = availableForSaleVariants.slice(0, remaining).map(variant => {
                // if(variant.availableForSale){

                // }

                return {
                    id: variant.id,
                    quantity: 1,
                    availableForSale: variant.availableForSale,
                    title: variant.title === "Default Title" ? 'Quantity' : variant.title,
                    image: variant?.image ? variant?.image?.originalSrc : null
                }

            });


            totalVariants += slicedVariants.length;

            if (slicedVariants.length > 0) {
                result.push({ ...productInfo, variants: slicedVariants });
            }

            return result;
        }, []);
    }

    export {
        limitTotalVariants
    }