import { useFetcher, useLoaderData } from "@remix-run/react";
import { Button, Card, Layout, Page } from "@shopify/polaris"
import { authenticate } from "../shopify.server";
import db from '../db.server'
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

   

  const response = await admin.graphql(
  `#graphql
  query {
    appByHandle(handle: "shopcomponentdev2") {
      apiKey
      id
    }
  }`,
);

const data = await response.json();
  
  const orders = await db.order.findUnique({
    where:{
      id:6
    }
  });
  return {
    storefrontAccessToken,
    orders,
    data:data?.data?.appByHandle ?? {}
  }
}

const DeleteToken = () => {
  const { storefrontAccessToken,orders,data } = useLoaderData();
  console.log('orders', JSON.parse(orders.orderObj));
  console.log('data', data);
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