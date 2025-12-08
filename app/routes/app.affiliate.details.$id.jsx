import { useLoaderData, useNavigation } from "@remix-run/react";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { AFFILIATE_STATUS, COMISSION_CRITERIA } from "../constants/constants";
import ClientOnlyCmp from "../components/ClientOnlyCmp/ClientOnlyCmp";
import { BarChart, LineChart } from "@shopify/polaris-viz";
import buildOrderQuery from "../utilis/buildOrderQuery";
import { useState } from "react";
import calculateComponentTotalOrders from "../utilis/calculateComponentTotalOrders";
import EmptyStateGeneric from "../components/EmptyStateGeneric/EmptyStateGeneric";
import calcCurrMonthPendingCommision from "../utilis/calcCurrMonthPendingCommision";


export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);

  const { id } = params;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const affData = await db.affiliate.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      components: {
        select: {
          id: true,
          title: true,
          orders: {
            where: {
              createdAt: {
                gte: startOfMonth,
                lt: endOfMonth
              }
            }
          }
        }
      },
      orders: true
    }
  });

  

  let spOrders = [];

  let jsonData = {};
  if (affData?.orders?.length > 0) {
    const query = buildOrderQuery(affData?.orders);
    const jsonRes = await admin.graphql(query);
    jsonData = await jsonRes.json();

  }



  let components = [];

  if (jsonData?.data) {
    spOrders = Object.values(jsonData.data);
    components = calculateComponentTotalOrders(affData?.components || [], spOrders || [], affData?.commissionCiteria, affData?.commissionCiteria === COMISSION_CRITERIA.fixed ? affData?.fixedCommission : affData?.tieredCommission, affData?.tieredCommissionType);
  }

  let currMonthTotalPendingCommission = 0;

  if (affData?.orders?.length > 0) {
    currMonthTotalPendingCommission = calcCurrMonthPendingCommision(spOrders, affData?.commissionCiteria, affData?.commissionCiteria === COMISSION_CRITERIA.fixed ? affData?.fixedCommission : affData?.tieredCommission, affData?.tieredCommissionType);
  }

  if (affData?.id) {
    return {
      affData,
      spOrders: spOrders || [],
      components,
      currMonthTotalPendingCommission:currMonthTotalPendingCommission ?? 0
    }
  }



  return {
    affData: {}
  }
}
const Affiliatedetails = () => {
  const { affData, spOrders, components,currMonthTotalPendingCommission } = useLoaderData();
  const navigation = useNavigation();
  const [showOrderDataRange, setShowOrderDataRange] = useState({
    title: "Today",
    value: 0
  });


  const data2 = spOrders.map((order) => ({
    key: order?.createdAt,
    value: Number(order.currentTotalPriceSet?.shopMoney?.amount),
  })).sort((a, b) => a.key - b.key);


  //console.log(data2);
  console.log("orderData:", spOrders);
  console.log("components:", components);
  console.log("affData:", affData);
  const data = [
    {
      name: "Total sales",
      data: data2,
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
            <s-button commandFor="order_date_picker" icon="calendar" variant="secondary">{showOrderDataRange.title}</s-button>
            <s-popover id="order_date_picker">
              <s-stack direction="block" padding="small-300">
                <s-button commandFor="order_date_picker" onClick={() => setShowOrderDataRange({ title: "Today", value: 0 })} variant="tertiary">Today</s-button>
                <s-button commandFor="order_date_picker" onClick={() => setShowOrderDataRange({ title: "Last 7 days", value: 7 })} variant="tertiary">Last 7 days</s-button>
                <s-button commandFor="order_date_picker" onClick={() => setShowOrderDataRange({ title: "Last 15 days", value: 15 })} variant="tertiary">Last 15 days</s-button>
                <s-button commandFor="order_date_picker" onClick={() => setShowOrderDataRange({ title: "Last 30 days", value: 30 })} variant="tertiary">Last 30 days</s-button>
                <s-button commandFor="order_date_picker" onClick={() => setShowOrderDataRange({ title: "Last 3 months", value: 90 })} variant="tertiary">Last 3 months</s-button>
                <s-button commandFor="order_date_picker" onClick={() => setShowOrderDataRange({ title: "Last 6 months", value: 180 })} variant="tertiary">Last 6 months</s-button>
                <s-button commandFor="order_date_picker" onClick={() => setShowOrderDataRange({ title: "Last 1 year", value: 365 })} variant="tertiary">Last 1 year</s-button>
              </s-stack>
            </s-popover>¸

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
                <s-text type="strong">${affData?.totalOrderValue ?? 0}</s-text>
              </s-stack>
            </s-section>

            <s-section>
              <s-stack gap="small-100">
                <s-text>Total Commission</s-text>
                <s-text type="strong">{Number(affData?.totalCommission.toFixed(2)) + Number(currMonthTotalPendingCommission.toFixed(2)) ?? 0}</s-text>
              </s-stack>
            </s-section>

            <s-section>
              <s-stack gap="small-100">
                <s-text>Pending Commission</s-text>
                <s-text type="strong">{currMonthTotalPendingCommission.toFixed(2) ?? 0}</s-text>
              </s-stack>
            </s-section>

            <s-section>
              <s-stack gap="small-100">
                <s-text>Commission Paid</s-text>
                <s-text type="strong">{0}</s-text>
              </s-stack>
            </s-section>
          </s-grid>


          <s-box paddingBlockEnd="large-100">
            {components?.length > 0 ?
              <s-section padding="none">
                <s-stack
                  padding="small-100 small"
                >
                  <s-heading>Assigned Components</s-heading>
                </s-stack>

                <s-table>
                  <s-table-header-row>
                    <s-table-header>Component ID</s-table-header>
                    <s-table-header>Component Name</s-table-header>
                    <s-table-header>Total Sales</s-table-header>
                    <s-table-header>Sale amount</s-table-header>
                    <s-table-header>Commission</s-table-header>
                    <s-table-header>Status</s-table-header>
                  </s-table-header-row>
                  <s-table-body>

                    {components?.map((cmp, index) => (
                      <s-table-row key={index}>
                        <s-table-cell>{cmp.id}</s-table-cell>
                        <s-table-cell>{cmp.title}</s-table-cell>
                        <s-table-cell>{cmp?.currMonthTotalOrders ?? 0}</s-table-cell>
                        <s-table-cell>{cmp?.currMonthTotalValue.toFixed(2) ?? 0}</s-table-cell>
                        <s-table-cell>{cmp?.currMonthPendingCommission.toFixed(2) ?? 0}</s-table-cell>
                        <s-table-cell>
                          <s-badge tone="warning">Unpaid</s-badge>
                        </s-table-cell>

                      </s-table-row>
                    ))



                    }



                  </s-table-body>
                </s-table>

              </s-section> :
              <EmptyStateGeneric 
              title="No Assigned Component found"
              text="Assign a component to get started"
              btnText="Assign a component"
              btnHref="/app/"
              />
            }
          </s-box>

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




          <s-grid
            gridTemplateColumns="@container (inline-size < 500px) 1fr, 1fr 1fr"
            gap="small"
            justifyContent="space-between"
            paddingBlockStart="large-200"
            paddingBlockEnd="small-100"
            maxBlockSize="300px"
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
                    emptyStateText="No Sales found"
                    errorText="Something went wrong"
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
                    emptyStateText="Commision not Found"
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


          </s-grid>






        </s-query-container>
      </s-page>

  )
}

export default Affiliatedetails