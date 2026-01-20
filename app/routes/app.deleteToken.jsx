import { useFetcher, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const shopResponse = await admin.graphql(
    `#graphql
            query shopInfo{
                shop{
                  id
                  storefrontAccessTokens(first: 100) {
        edges {
          node {
            id
            accessToken
            accessScopes {
              handle
            }
            createdAt
            title
          }
        }
      }
                }
        }`,

  );

  const shop = await shopResponse.json();

  const storefrontAccessToken = shop.data.shop.storefrontAccessTokens.edges;



  return {

    storefrontAccessToken,
  }
}
const DeleteToken = () => {
  const { storefrontAccessToken } = useLoaderData();
  console.log('storefrontAccessToken', storefrontAccessToken);
  const fetcher = useFetcher();
  const handleDeleteAll = () => {
    fetcher.submit(null, { method: 'delete' });
  }

  return (
    <s-page inlinesize='small'>
      <s-box
        padding="large-100 none large none"

      >
        <s-section padding="large">
          <s-stack
            direction="inline"
            gap="small"
            justifyContent="space-between"
            alignItems="center"
          >
            <s-button variant="primary" loading={fetcher.state === 'loading' || fetcher?.data} onClick={handleDeleteAll}>DeleteAll</s-button>
            <s-text type="strong">Total active tokens: {storefrontAccessToken.length}</s-text>
          </s-stack>

        </s-section>
      </s-box>

    </s-page>
  )
}

export default DeleteToken

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);


  const shopResponse = await admin.graphql(
    `#graphql
            query shopInfo{
                shop{
                  id
                  storefrontAccessTokens(first: 100) {
        edges {
          node {
            id
            accessToken
            accessScopes {
              handle
            }
            createdAt
            title
          }
        }
      }
                }
        }`,

  );

  const shop = await shopResponse.json();

  const storefrontAccessToken = shop.data.shop.storefrontAccessTokens.edges;

  for (let i = 0; i < storefrontAccessToken.length; i++) {
    await admin.graphql(
      `#graphql
  mutation storefrontAccessTokenDelete($input: StorefrontAccessTokenDeleteInput!) {
    storefrontAccessTokenDelete(input: $input) {
      deletedStorefrontAccessTokenId
      userErrors {
        field
        message
      }
    }
  }`,
      {
        variables: {
          "input": {
            "id": storefrontAccessToken[i].node.id
          }
        },
      },
    );

  }
  return {
    success: true
  }
}