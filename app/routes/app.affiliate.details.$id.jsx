import { useLoaderData, useNavigation } from "@remix-run/react";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { AFFILIATE_STATUS } from "../constants/constants";
// import ClientOnlyCmp from "../components/ClientOnlyCmp/ClientOnlyCmp";
// import { BarChart, LineChart } from "@shopify/polaris-viz";

export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);

  const { id } = params;


  const affData = await db.affiliate.findUnique({
    where: {
      id: Number(id)
    }
  });


  const from = new Date();
  from.setDate(from.getDate() - 1200); // fetch from 1200 days ago
  const fromStr = from.toISOString().split('T')[0];

  const query = `#graphql
  query OrdersForChart($cursor: String) {
    orders(
      first: 250
      after: $cursor
      query: "created_at:>='${fromStr}' fulfillment_status:fulfilled"
      sortKey: CREATED_AT
    ) {
      edges {
        node {
          id
          name
          createdAt
          sourceName
          currencyCode
          fulfillable
          currentSubtotalPriceSet{presentmentMoney {amount currencyCode}}
        }
      }
      pageInfo {
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
`;



  const jsonRes = await admin.graphql(query);
  const jsonData = await jsonRes.json();


  if (affData?.id) {
    return {
      affData,
      series: jsonData.data.orders.edges
    }
  }



  return {
    affData: {}
  }
}
const Affiliatedetails = () => {
  const { affData, series } = useLoaderData();
  const navigation = useNavigation();
  console.log("Series:", series);
  const data = [
    {
      name: "Total sales",
      data: [
        // October 2025
        { key: "2025-10-01", value: 1450.75 },
        { key: "2025-10-05", value: 1600.50 },
        { key: "2025-10-10", value: 1985.75 },
        { key: "2025-10-15", value: 1750.30 },
        { key: "2025-10-20", value: 1905.85 },

        // November 2025
        { key: "2025-11-01", value: 2100.50 },
        { key: "2025-11-05", value: 2230.75 },
        { key: "2025-11-10", value: 2450.90 },
        { key: "2025-11-15", value: 2335.40 },
        { key: "2025-11-20", value: 2200.60 },

        // December 2025
        { key: "2025-12-01", value: 2500.25 },
        { key: "2025-12-05", value: 2650.10 },
        { key: "2025-12-10", value: 2800.75 },
        { key: "2025-12-15", value: 2685.90 },
        { key: "2025-12-20", value: 2905.30 },

        // January 2026
        { key: "2026-01-01", value: 3100.15 },
        { key: "2026-01-05", value: 3230.50 },
        { key: "2026-01-10", value: 3400.75 },
        { key: "2026-01-15", value: 3325.60 },
        { key: "2026-01-20", value: 3455.85 },

        // February 2026
        { key: "2026-02-01", value: 3550.40 },
        { key: "2026-02-05", value: 3750.25 },
        { key: "2026-02-10", value: 3800.90 },
        { key: "2026-02-15", value: 3690.10 },
        { key: "2026-02-20", value: 3955.60 },

        // March 2026
        { key: "2026-03-01", value: 4100.30 },
        { key: "2026-03-05", value: 4250.45 },
        { key: "2026-03-10", value: 4450.60 },
        { key: "2026-03-15", value: 4325.80 },
        { key: "2026-03-20", value: 4550.95 },

        // April 2026
        { key: "2026-04-01", value: 4750.80 },
        { key: "2026-04-05", value: 4800.90 },
        { key: "2026-04-10", value: 4999.25 },
        { key: "2026-04-15", value: 4900.35 },
        { key: "2026-04-20", value: 5100.45 },

        // May 2026
        { key: "2026-05-01", value: 5300.60 },
        { key: "2026-05-05", value: 5400.70 },
        { key: "2026-05-10", value: 5500.90 },
        { key: "2026-05-15", value: 5600.25 },
        { key: "2026-05-20", value: 5700.40 },

        // June 2026
        { key: "2026-06-01", value: 5850.55 },
        { key: "2026-06-05", value: 6000.60 },
        { key: "2026-06-10", value: 6150.30 },
        { key: "2026-06-15", value: 6200.80 },
        { key: "2026-06-20", value: 6300.95 },

        // July 2026
        { key: "2026-07-01", value: 6400.10 },
        { key: "2026-07-05", value: 6550.25 },
        { key: "2026-07-10", value: 6700.80 },
        { key: "2026-07-15", value: 6750.95 },
        { key: "2026-07-20", value: 6900.60 },

        // August 2026
        { key: "2026-08-01", value: 7050.75 },
        { key: "2026-08-05", value: 7200.85 },
        { key: "2026-08-10", value: 7350.95 },
        { key: "2026-08-15", value: 7400.25 },
        { key: "2026-08-20", value: 7500.40 },

        // September 2026
        { key: "2026-09-01", value: 7600.55 },
        { key: "2026-09-05", value: 7750.60 },
        { key: "2026-09-10", value: 7900.75 },
        { key: "2026-09-15", value: 8000.95 },
        { key: "2026-09-20", value: 8100.10 },
      ],
      color: "green",
    },
  ];



  return (
    navigation.state === 'loading' ? <LoadingSkeleton /> :
      <s-page inlineSize="large">
        <s-query-container>
          <s-stack
            padding="large-100 none large none"
            direction="inline"
            gap="small"
            justifyContent="start"
            alignItems="center"
          >
            <s-button href="/app/affiliate" accessibilityLabel="Back to affiliate" icon="arrow-left" variant="tertiary"></s-button>
            <s-text type="strong">Back to Affiliate</s-text>
            <s-button icon="calendar" variant="secondary">Today</s-button>
            <s-button icon="calendar" variant="secondary">Oct 16,2025</s-button>

          </s-stack>
          <s-section>

            <s-stack

              gap="small"

            >
              <s-stack
                direction="inline"
                gap="small"
                justifyContent="start"
                alignItems="center"
              >
                <s-heading>{affData?.name}</s-heading>
                <s-badge tone={affData?.status === AFFILIATE_STATUS.active ? "success" : "critical"}>{affData?.status === AFFILIATE_STATUS.active ? "Active" : "Inactive"}</s-badge>
              </s-stack>

              <s-stack
                direction="inline"
                gap="small"
                justifyContent="start"
                alignItems="center"
              >

                <s-stack
                  direction="inline"
                  gap="small-300"
                  justifyContent="start"
                  alignItems="center"
                >
                  <s-icon type="email" />
                  <s-text tone="neutral" type="generic">{affData?.email}</s-text>
                </s-stack>

                <s-stack
                  direction="inline"
                  gap="small-300"
                  justifyContent="start"
                  alignItems="center"
                >
                  <s-icon type="calendar" />
                  <s-text tone="neutral" type="generic">Joined {new Date(affData?.createdAt).toLocaleDateString("en-GB")}
                  </s-text>
                </s-stack>

              </s-stack>

            </s-stack>

          </s-section>


          <s-grid
            gridTemplateColumns="@container (inline-size < 500px) 1fr 1fr, 1fr 1fr 1fr 1fr"
            gap="base"
            padding="large-200 none large-100 none"
          >
            <s-section>
              <s-stack gap="small-100">
                <s-text>Total Sales</s-text>
                <s-text type="strong">$12000</s-text>
              </s-stack>
            </s-section>

            <s-section>
              <s-stack gap="small-100">
                <s-text>Total Commission</s-text>
                <s-text type="strong">$1000</s-text>
              </s-stack>
            </s-section>

            <s-section>
              <s-stack gap="small-100">
                <s-text>Pending Commission</s-text>
                <s-text type="strong">$2000</s-text>
              </s-stack>
            </s-section>

            <s-section>
              <s-stack gap="small-100">
                <s-text>Commission Paid</s-text>
                <s-text type="strong">{0}</s-text>
              </s-stack>
            </s-section>
          </s-grid>

          <s-section padding="none">
            <s-stack
              padding="small-100 small"
            >
              <s-heading>All Transactions</s-heading>
            </s-stack>

            <s-table>
              <s-table-header-row>
                <s-table-header>Date</s-table-header>
                <s-table-header>TX ID</s-table-header>
                <s-table-header>Component</s-table-header>
                <s-table-header>Sale amount</s-table-header>
                <s-table-header>Commission</s-table-header>
                <s-table-header>Status</s-table-header>
                <s-table-header accessibilityLabel="Pay now"></s-table-header>
              </s-table-header-row>
              <s-table-body>
                <s-table-row>
                  <s-table-cell>25/11/2024</s-table-cell>
                  <s-table-cell>ORD49890PI</s-table-cell>
                  <s-table-cell>Component 1</s-table-cell>
                  <s-table-cell>$2500</s-table-cell>
                  <s-table-cell>$250</s-table-cell>
                  <s-table-cell>
                    <s-badge tone="success">Paid</s-badge>
                  </s-table-cell>
                  <s-table-cell>
                    <s-button>Pay now</s-button>
                  </s-table-cell>
                </s-table-row>

                <s-table-row>
                  <s-table-cell>25/11/2024</s-table-cell>
                  <s-table-cell>ORD49890PI</s-table-cell>
                  <s-table-cell>Component 1</s-table-cell>
                  <s-table-cell>$2500</s-table-cell>
                  <s-table-cell>$250</s-table-cell>
                  <s-table-cell>
                    <s-badge tone="success">Paid</s-badge>
                  </s-table-cell>
                  <s-table-cell>
                    <s-button>Pay now</s-button>
                  </s-table-cell>
                </s-table-row>

                <s-table-row>
                  <s-table-cell>25/11/2024</s-table-cell>
                  <s-table-cell>ORD49890PI</s-table-cell>
                  <s-table-cell>Component 1</s-table-cell>
                  <s-table-cell>$2500</s-table-cell>
                  <s-table-cell>$250</s-table-cell>
                  <s-table-cell>
                    <s-badge tone="warning">Unpaid</s-badge>
                  </s-table-cell>
                  <s-table-cell>
                    <s-button>Pay now</s-button>
                  </s-table-cell>
                </s-table-row>


              </s-table-body>
            </s-table>

          </s-section>



          {/* <ClientOnly>

            {() => (

              <s-grid
                gridTemplateColumns="@container (inline-size < 500px) 1fr, 1fr 1fr"
                gap="small"
                justifyContent="space-between"
                paddingBlockStart="large-200"
                paddingBlockEnd="small-100"

              >
                <s-grid-item>
                  <s-box
                    background="base"
                    borderRadius="small-100"
                    padding="small-200"
                  >
                    <s-stack
                      gap="small-300"
                      padding="small-300 none large-200 small"
                    >
                      <s-text size="small">Total sales</s-text>
                      <s-text type="strong">$12000</s-text>
                    </s-stack>

                    <PolarisVizProvider>
                      <LineChart
                        xAxisOptions={{
                          labelFormatter: (key) => new Date(key).toLocaleDateString(),
                        }}
                        yAxisOptions={{
                          labelFormatter: (value) => `$${value.toFixed(2)}`,
                        }}
                        data={data}
                      />

                    </PolarisVizProvider>

                  </s-box>
                </s-grid-item>

                <s-grid-item>
                  <s-box
                    background="base"
                    borderRadius="small-100"
                    padding="small-200"
                  >
                    <s-stack
                      gap="small-300"
                      padding="small-300 none large-200 small"
                    >
                      <s-text size="small">Total sales</s-text>
                      <s-text type="strong">$12000</s-text>
                    </s-stack>

                    <PolarisVizProvider>
                      <BarChart
                        xAxisOptions={{
                          labelFormatter: (x) => {
                            return `${x}`
                          }
                        }}
                        yAxisOptions={{
                          labelFormatter: (y) => {
                            return `${y}`
                          }
                        }}
                        data={[
                          {
                            ...data[0],
                            color: 'red',
                            isComparison: false
                          },

                        ]}

                      />
                    </PolarisVizProvider>

                  </s-box>
                </s-grid-item>


              </s-grid>

            )}

          </ClientOnly> */}



{/* 
          <s-grid
            gridTemplateColumns="@container (inline-size < 500px) 1fr, 1fr 1fr"
            gap="small"
            justifyContent="space-between"
            paddingBlockStart="large-200"
            paddingBlockEnd="small-100"

          >
            <s-grid-item>
              <s-box
                background="base"
                borderRadius="small-100"
                padding="small-200"
              >
                <s-stack
                  gap="small-300"
                  padding="small-300 none large-200 small"
                >
                  <s-text size="small">Total sales</s-text>
                  <s-text type="strong">$12000</s-text>
                </s-stack>

            
                  <ClientOnlyCmp>
                    <LineChart
                      xAxisOptions={{
                        labelFormatter: (key) => new Date(key).toLocaleDateString(),
                      }}
                      yAxisOptions={{
                        labelFormatter: (value) => `$${value.toFixed(2)}`,
                      }}
                      data={data}
                    />
                  </ClientOnlyCmp>
               

              </s-box>
            </s-grid-item>

            <s-grid-item>
              <s-box
                background="base"
                borderRadius="small-100"
                padding="small-200"
              >
                <s-stack
                  gap="small-300"
                  padding="small-300 none large-200 small"
                >
                  <s-text size="small">Total sales</s-text>
                  <s-text type="strong">$12000</s-text>
                </s-stack>

              
                  <ClientOnlyCmp>
                    <BarChart
                      xAxisOptions={{
                        labelFormatter: (x) => {
                          return `${x}`
                        }
                      }}
                      yAxisOptions={{
                        labelFormatter: (y) => {
                          return `${y}`
                        }
                      }}
                      data={[
                        {
                          ...data[0],
                          color: 'red',
                          isComparison: false
                        },

                      ]}

                    />
                  </ClientOnlyCmp>
             

              </s-box>
            </s-grid-item>


          </s-grid> */}






        </s-query-container>
      </s-page>

  )
}

export default Affiliatedetails