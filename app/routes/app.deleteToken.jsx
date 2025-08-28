import { useFetcher, useLoaderData } from "@remix-run/react";
import { Button, Card, Layout, Page } from "@shopify/polaris"
import { authenticate } from "../shopify.server";
export const loader = async ({ request }) => {
  const {admin} =await authenticate.admin(request);

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
    storefrontAccessToken
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
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <Button variant="primary" loading={fetcher.state === 'loading' || fetcher?.data} onClick={handleDeleteAll}>DeleteAll</Button>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
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