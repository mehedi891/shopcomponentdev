export const CART_FIELDS = `#graphql
  fragment CartFields on Cart {
    id
    updatedAt
    checkoutUrl
    totalQuantity
    appliedGiftCards { id lastCharacters }
    lines(first: 250) {
      nodes {
        id
        quantity
        cost {
          totalAmount { amount currencyCode }
          compareAtAmountPerQuantity { amount currencyCode }
          subtotalAmount { amount currencyCode }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            image { url }
            product { title }
          }
        }
        attributes { key value }
      }
    }
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
      totalDutyAmount { amount currencyCode }
      totalTaxAmount { amount currencyCode }
    }
    note
    attributes { key value }
    discountCodes { code }
    discountAllocations { discountedAmount { amount currencyCode } }
  }
`;
