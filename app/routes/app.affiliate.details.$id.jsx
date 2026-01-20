import { useFetcher, useLoaderData, useNavigation } from "react-router";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { AFFILIATE_STATUS, COMISSION_CRITERIA } from "../constants/constants";
import { useEffect, useState } from "react";
import EmptyStateGeneric from "../components/EmptyStateGeneric/EmptyStateGeneric";
import { capitalizeFirstCaracter } from "../utilis/generalUtils";
import TransactionModal from "../components/TransactionModal/TransactionModal";
import getSymbolFromCurrency from "currency-symbol-map";
import { getCurrentTier } from "../utilis/calculateCommission";




export const loader = async ({ request, params }) => {
  const { admin, } = await authenticate.admin(request);
  const { id } = params;

  const response = await admin.graphql(
    `#graphql
      query{
        shop{
          currencyCode
        }
      }
    `
  );

  const data = await response.json();
  const shopCurrency = data.data.shop.currencyCode;



  let affData = {};

  affData = await db.affiliate.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      components: {
        select: {
          id: true,
          title: true,
        },
      }

    },
  });

  let orderTotalsByComponent = [];
  let affOrderTotals = [];
  affOrderTotals = await db.order.aggregate({
    where: {
      affiliateId: Number(id),
      isCancelled: false
    },
    _sum: {
      totalValue: true,
      subTotalValue: true,
      commissionalValue: true,
      fulFilledValue: true,
      refundValue: true,
      commission: true
    }
  });
  if (affData?.components?.length > 0) {
    orderTotalsByComponent = await db.order.groupBy({
      by: ['componentId'],
      where: {
        affiliateId: Number(id),
        isCancelled: false
      },
      _sum: {
        totalValue: true,
        subTotalValue: true,
        commissionalValue: true,
        fulFilledValue: true,
        refundValue: true,
        commission: true
      },
    });
  }


  affData = {
    ...affData,
    lifeTimeTotalValue: affOrderTotals?._sum.totalValue ?? 0,
    lifeTimeSubTotalValue: affOrderTotals?._sum.subTotalValue ?? 0,
    lifeTimeCommissionalValue: affOrderTotals?._sum.commissionalValue ?? 0,
    lifeTimeFulFilledValue: affOrderTotals?._sum.fulFilledValue ?? 0,
    lifeTimeRefundValue: affOrderTotals?._sum.refundValue ?? 0,
    lifeTimeCommission: affOrderTotals?._sum.commission ?? 0,
    components: affData?.components?.length > 0 ? affData.components.map((cmp => {
      const group = orderTotalsByComponent.find(g => g.componentId === cmp.id);
      return {
        ...cmp,
        lifeTimeTotalValue: group?._sum.totalValue ?? 0,
        lifeTimeSubTotalValue: group?._sum.subTotalValue ?? 0,
        lifeTimeCommissionalValue: group?._sum.commissionalValue ?? 0,
        lifeTimeFulFilledValue: group?._sum.fulFilledValue ?? 0,
        lifeTimeRefundValue: group?._sum.refundValue ?? 0,
        lifeTimeCommission: group?._sum.commission ?? 0,
      }
    })) : []
  }

  // console.dir(orderTotalsByComponent, { depth: null });



  const currentCommission = affData?.commissionCiteria === COMISSION_CRITERIA.fixed ? affData?.fixedCommission : getCurrentTier(affData?.tieredCommission, affData?.lifeTimeSubTotalValue);


  if (affData?.id) {
    return {
      affData,
      spOrders: [],
      components: affData?.components || [],
      shopCurrency: shopCurrency,
      currentCommission: currentCommission
    }
  }



  return {
    affData: {},
    shopCurrency: shopCurrency,
    components: [],
    spOrders: []
  }
}
const Affiliatedetails = () => {
  const { affData, spOrders, components, shopCurrency, currentCommission } = useLoaderData();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const [showOrderDataRange, setShowOrderDataRange] = useState({
    title: "Today",
    value: 0
  });


  const data2 = spOrders.map((order) => ({
    key: order?.createdAt,
    value: Number(order.currentTotalPriceSet?.shopMoney?.amount),
  })).sort((a, b) => a.key - b.key);


  const currencySymbol = getSymbolFromCurrency(shopCurrency || "USD") || "$";

  //console.log(data2);
  //console.log("orderData:", spOrders);
  //console.log("components:", components);
  //console.log("affData:", affData);
  //console.log("refundData:", refundData);
  const data = [
    {
      name: "Total sales",
      data: data2,
      color: "green",
    },
  ];

  //console.log(data);

 

  const pendingCommission = (affData?.lifeTimeCommission - affData?.totalCommissionPaid) || 0;

  const affTransactionFormSubmit = (data) => {

    console.log('Aff Transaction Form Submit:', data);

    fetcher.submit(data, {
      method: "post",
      action: `/app/affiliate/transactions/${affData?.id}`,
    });
  }

  useEffect(() => {
    if (fetcher.data?.forTransaction) {
      if (fetcher.data?.success) {
        shopify.toast.show(fetcher.data.message, {
          duration: 1000,
        });
      } else {
        shopify.toast.show(fetcher.data.message, {
          duration: 1000,
        });
      }
    }

  }, [fetcher.data]);



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
            {/* <s-button commandFor="order_date_picker" icon="calendar" variant="secondary">{showOrderDataRange.title}</s-button>
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
            </s-popover>¸ */}

          </s-stack>

          <s-grid
            gap="small"
            gridTemplateColumns="@container (inline-size < 500px) 1fr, 5fr 7fr"
            paddingBlockEnd="large-100"
          >


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

                <s-text type="strong">Affiliate Summary</s-text>
                <s-stack
                  gap="small-300"
                >
                  <s-stack
                    direction="inline"
                    gap="small-300"
                    justifyContent="start"
                    alignItems="center"
                  >
                    <s-text type="neutral">Commission Type: </s-text>
                    <s-text>{capitalizeFirstCaracter(affData?.commissionCiteria)}</s-text>
                  </s-stack>

                  <s-stack
                    direction="inline"
                    gap="small-300"
                    justifyContent="start"
                    alignItems="center"
                  >
                    <s-text type="neutral">Current Comission Rate: </s-text>
                    <s-text>{currentCommission.type !== 'percentage' && getSymbolFromCurrency(shopCurrency)}{currentCommission.rate || currentCommission.value}{currentCommission.type === 'percentage' && '%'}</s-text>
                  </s-stack>

                  <s-stack
                    direction="inline"
                    gap="small-300"
                    justifyContent="start"
                    alignItems="center"
                  >
                    <s-text type="neutral">Number of Assigned Components: </s-text>
                    <s-text>{affData?.components?.length}</s-text>
                  </s-stack>

                  <s-stack
                    direction="inline"
                    gap="small-300"
                    justifyContent="start"
                    alignItems="center"
                  >
                    <s-text type="neutral">Payout Method: </s-text>
                    <s-text>{affData?.payoutMethods?.method}</s-text>
                  </s-stack>

                </s-stack>

              </s-stack>

            </s-section>

            <s-stack
              background="base"
              padding="large"
              borderRadius="large"
              border="base"
            >
              <s-stack
                direction="inline"
                gap="small"
                alignItems="center"
                paddingBlockEnd="large"
              >
                <s-text type="strong">Affiliate Analytics</s-text>
                {/* <s-button href={`/app/affiliate/details/analytics/${affData?.id}`} variant="secondary">View more details</s-button> */}
              </s-stack>

              <s-grid
                gridTemplateColumns="@container (inline-size < 500px) 1fr 1fr, 1fr 1fr"
                gap="base"
              >
                <s-section>
                  <s-stack gap="small-100">
                    <s-text>Total Sales</s-text>
                    <s-text type="strong">{currencySymbol}{(affData?.lifeTimeTotalValue || 0).toFixed(2)}</s-text>
                  </s-stack>
                </s-section>

                <s-section>
                  <s-stack gap="small-100">
                    <s-text>Total Commission</s-text>
                    <s-text type="strong">{currencySymbol}{(affData?.lifeTimeCommission || 0).toFixed(2)}</s-text>
                  </s-stack>
                </s-section>

                <s-section>
                  <s-stack gap="small-100">
                    <s-text>Pending Commission</s-text>
                    <s-text type="strong">{currencySymbol}{(pendingCommission || 0).toFixed(2)}</s-text>
                  </s-stack>
                </s-section>

                <s-section>
                  <s-stack gap="small-100">
                    <s-text>Commission Paid</s-text>
                    <s-text type="strong">{currencySymbol}{(affData?.totalCommissionPaid || 0).toFixed(2)}</s-text>
                  </s-stack>
                </s-section>
              </s-grid>

            </s-stack>
          </s-grid>




          <s-box paddingBlockEnd="large-100">
            {components?.length > 0 ?
              <s-section padding="none">
                <s-stack
                  direction="inline"
                  padding="small-100 small"
                  justifyContent="space-between"
                >
                  <s-heading>Assigned Components</s-heading>
                  <s-stack
                    direction="inline"
                    gap="small"
                    alignItems="center"
                  >
                    <s-button
                      disabled={pendingCommission <= 0}
                      commandFor="transaction-modal"
                      command="--show"
                      loading={fetcher.state !== "idle" ? true : false}
                    >Add Transaction</s-button>
                    <TransactionModal
                      name={affData?.name}
                      email={affData?.email}
                      pendingCommission={pendingCommission}
                      affiliateId={affData?.id}
                      currencySymbol={currencySymbol}
                      affTransactionFormSubmit={affTransactionFormSubmit}
                    />
                    <s-button variant="secondary" href={`/app/affiliate/transactions/${affData?.id}`}>View All Transactions</s-button>
                  </s-stack>
                </s-stack>

                <s-table>
                  <s-table-header-row>
                    <s-table-header>Component Name</s-table-header>
                    <s-table-header>Total Sales</s-table-header>
                    <s-table-header>
                      <s-stack
                        direction="inline"
                        justifyContent="start"
                        alignItems="center"
                        gap="small-300"
                      >
                        <s-text>Subtotal Sales</s-text>
                        <s-icon
                          interestFor="subTotalSalesInfo"
                          type="info"
                          tone="info"
                        />
                      </s-stack>
                      <s-tooltip id="subTotalSalesInfo">Subtotal sales is excluding the shipping and taxes</s-tooltip>
                    </s-table-header>
                    <s-table-header>Fulfilled</s-table-header>
                    <s-table-header>Refund</s-table-header>
                    <s-table-header>
                      <s-stack
                        direction="inline"
                        justifyContent="start"
                        alignItems="center"
                        gap="small-300"
                      >
                        <s-text>Comission</s-text>
                        <s-icon
                          interestFor="comissionInfo"
                          type="info"
                          tone="info"
                        />
                      </s-stack>
                      <s-tooltip id="comissionInfo">Commission will calculate on the basis of Subtotal sales and deduct the refund.</s-tooltip>
                    </s-table-header>
                  </s-table-header-row>
                  <s-table-body>

                    {components?.map((cmp, index) => (
                      <s-table-row key={index}>
                        <s-table-cell>{cmp.title}</s-table-cell>
                        <s-table-cell>{currencySymbol}{(cmp?.lifeTimeTotalValue || 0).toFixed(2)}</s-table-cell>
                        <s-table-cell >{currencySymbol}{(cmp?.lifeTimeSubTotalValue || 0).toFixed(2)}</s-table-cell>
                        <s-table-cell>{currencySymbol}{(cmp?.lifeTimeFulFilledValue || 0).toFixed(2)}</s-table-cell>
                        <s-table-cell>{currencySymbol}{(cmp?.lifeTimeRefundValue || 0).toFixed(2)}</s-table-cell>
                        <s-table-cell>
                          <s-table-cell>{currencySymbol}{(cmp?.lifeTimeCommission || 0).toFixed(2)}</s-table-cell>
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
                btnHref="/app/componentslist"
              />
            }
          </s-box>

          {/* <s-section padding="none">
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

          </s-section> */}








          {/* <s-grid
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
                      labelFormatter: (value) => `$${value}`,
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


          </s-grid> */}






        </s-query-container>
      </s-page>

  )
}

export default Affiliatedetails