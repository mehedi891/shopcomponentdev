import { useFetcher, useLoaderData, useNavigate, useNavigation } from "react-router";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { authenticate } from "../shopify.server";
import { useEffect, useState } from "react";
import db from "../db.server";
import getSymbolFromCurrency from "currency-symbol-map";
import ClientOnlyCmp from "../components/ClientOnlyCmp/ClientOnlyCmp";
import { BarChart, LineChart, StackedAreaChart } from "@shopify/polaris-viz";
import redis from "../utilis/redis.init";
import AnalyticsUpgrade from "../components/AnalyticsUpgrade/AnalyticsUpgrade";
import { PLAN_NAME } from "../constants/constants";
import { getRemainingTrialDays } from "../utilis/remainTrialDaysCount";


export const loader = async ({ request }) => {
  const { session,redirect } = await authenticate.admin(request);
  const days = 7;
  const componentId = null;
  const dateRange =
    new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0] + 'T00:00:00.000Z';


  const isExist = await redis.get(`analytics:${session.shop}:${dateRange}:${componentId}`);
  if (isExist) {
    return {
      analyticsData: JSON.parse(isExist),
    }
  }

  const shopData = await db.shop.findUnique({
    where: {
      shopifyDomain: session.shop
    },
    select: {
      id: true,
      shopifyDomain: true,
      currencyCode: true,
      createdAt: true,
      trialDays: true,
      orders: {
        where: {
          createdAt: {
            gte: dateRange,
          },
          // isCancelled: false,
          shop: {
            shopifyDomain: session.shop,
          },
          ...(componentId ? { componentId: Number(componentId) } : {}),
        },
        select: {
          id: true,
          totalValue: true,
          createdAt: true,
          subTotalValue: true,
          componentId: true
        },
      },
      affiliates: {
        where: {
          shop: {
            shopifyDomain: session.shop,
          },
        },
        orderBy: {
          totalOrderValue: 'desc',
        },
        select: {
          id: true,
          name: true,
          totalOrderValue: true
        }
      },
      components: {
        select: {
          id: true,
          title: true,
        }
      },
      plan:{
        select: {
          planName: true,
          isTestPlan: true
        }
      }
    }
  });

   if(!shopData?.plan){
    throw redirect('/app/plans');
  }

   if (shopData?.plan?.isTestPlan) {
    const remaingTrialDays = getRemainingTrialDays(shopData?.createdAt, shopData?.trialDays);

    if (!shopData?.plan || (shopData?.plan?.isTestPlan && remaingTrialDays < 1)) {
      throw redirect('/app/plans');
    }
  }


  const summary = (shopData?.orders ?? []).reduce(
    (acc, item) => {
      const totalValue = Number(item.totalValue || 0);
      const dayKey = new Date(item.createdAt).toISOString().slice(0, 10);

      // totals
      acc.totalSales += totalValue;
      acc.count += 1;

      // ✅ sales total by day
      acc.salesByDayMap[dayKey] = (acc.salesByDayMap[dayKey] || 0) + totalValue;

      // ✅ count by day
      acc.countByDayMap[dayKey] = (acc.countByDayMap[dayKey] || 0) + 1;

      return acc;
    },
    {
      totalSales: 0,
      count: 0,
      salesByDayMap: {},
      countByDayMap: {},
    }
  );

  // ✅ chart data (sorted)
  const salesByDayChartData = Object.entries(summary.salesByDayMap)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const countByDayChartData = Object.entries(summary.countByDayMap)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));




  const averageOrderValue = summary.totalSales / summary.count;


  let analuticsFromServer = {};
  try {
    const url = `${process.env.DATA_API}/shop/shopData/?shopifyDomain=${session.shop}&dateRange=${dateRange}&componentId=${componentId}`;
    const analytics = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    // console.log('analytics::',analytics.ok,analytics);
    if (analytics?.ok) {
      analuticsFromServer = await analytics.json();
    } else {
      analuticsFromServer = {result: {}};
    }

  } catch (error) {
    console.log("error:::", error);
  }

  const result = {
    shopData: {
      plan: shopData?.plan,
      id: shopData?.id,
      shopifyDomain: shopData?.shopifyDomain,
      currencyCode: shopData?.currencyCode,
      components: shopData?.components || [],
    },
    affiliateDataFirstFive: shopData?.affiliates || [],
    totalOrderCount: summary?.count || 0,
    countByDayMapCartData: countByDayChartData || [],
    orderdataChart: salesByDayChartData || [],
    totalSales: summary?.totalSales || 0,
    dateRange,
    analyticsData: analuticsFromServer.result || {},
    averageOrderValue: averageOrderValue || 0,
  }

  await redis.set(`analytics:${session.shop}:${dateRange}:${componentId}`, JSON.stringify(result), 'EX', 60 * 4);



  return {
    analyticsData: result || {}
  };
};

const Analytics = () => {
  const [showOrderDataRange, setShowOrderDataRange] = useState({
    title: "Last 7 days",
    value: 7
  });
  const [selectComponent, setSelectComponent] = useState({
    title: "All Components",
    value: null
  });
  const [disabledContentByPlan, setDisabledContentByPlan] = useState(false);
  const [disabledContentProPlan, setDisabledContentProPlan] = useState(false);
  const fetcher = useFetcher();
  const { analyticsData } = useLoaderData();



  const navigation = useNavigation();
  const navgate = useNavigate();

  const requestData = (data) => {
    //console.log("Data:::", data);
    fetcher.submit(data, { method: 'post', action: '/api/analytics' });
  }

  const fData = fetcher?.data || analyticsData;


  //console.log("fdata:", fData);

  const orderRange = [
    {
      title: "Today",
      value: 0
    },
    {
      title: "Last 7 days",
      value: 7
    },
    {
      title: "Last 15 days",
      value: 15
    },
    {
      title: "Last 30 days",
      value: 30
    },
    {
      title: "Last 3 months",
      value: 90
    },
    {
      title: "Last 6 months",
      value: 180
    },
    {
      title: "Last 1 year",
      value: 365
    },
  ]

  useEffect(() => {
    setDisabledContentByPlan(fData?.shopData?.plan?.planName === PLAN_NAME.free ? true : false)
    setDisabledContentProPlan(fData?.shopData?.plan?.planName !== PLAN_NAME.pro ? true : false)
  }, [fData?.shopData]);

  //console.log("disCon:",disabledContentByPlan,'Pro::',disabledContentProPlan);

  return (navigation.state === "loading" ? <LoadingSkeleton /> :
    <s-page
      inlineSize="large"
    >
      <s-query-container>
        <s-stack
          padding="large-100 none large none"
          direction="inline"
          gap="small"
          justifyContent="start"
          alignItems="center"
        >
          <s-button onClick={() => navgate(-1)} accessibilityLabel="Back to analytics" icon="arrow-left" variant="tertiary"></s-button>
          <s-text type="strong">Analytics</s-text>

          <s-button
            commandFor="order_date_picker"
            variant="secondary"
            loading={fetcher?.state !== 'idle' ? true : false}
          ><s-stack
            direction="inline"
            gap="small-300"
            alignItems="center"
          >
              <s-icon type="calendar" />
              <s-text>{showOrderDataRange.title}</s-text>
            </s-stack>
          </s-button>

          <s-popover id="order_date_picker">
            <s-stack direction="block" padding="small-300">
              {orderRange.map((item, index) => (
                <s-button
                  key={index}
                  disabled={(fetcher?.state !== 'idle') || (item.title === showOrderDataRange.title) ? true : false}
                  commandFor="order_date_picker"
                  onClick={() => {
                    setShowOrderDataRange(item);
                    requestData({
                      componentId: selectComponent.value || null,
                      days: item.value
                    });
                  }} variant="tertiary">{item.title}</s-button>
              ))}
            </s-stack>
          </s-popover>

          <s-text>Showing for</s-text>

          <s-button
            commandFor="select_component"
            variant="secondary"
            loading={fetcher?.state !== 'idle' ? true : false}
          ><s-stack
            direction="inline"
            gap="small-300"
            alignItems="center"
          >
              <s-icon type="file-list" />
              <s-text>{(selectComponent.title || '').length > 40
                ? selectComponent.title.substring(0, 40) + "..."
                : selectComponent.title}</s-text>
            </s-stack>
          </s-button>

          <s-popover id="select_component">
            <s-stack direction="block" padding="small-300">
              <s-button commandFor="select_component" onClick={() => {
                setSelectComponent({
                  title: 'All Components',
                  value: null
                });
                requestData({
                  componentId: null,
                  days: showOrderDataRange.value,
                })
              }} variant="tertiary">All Components</s-button>

              {fData?.shopData?.components?.map((component) => (
                <s-button key={component.id} disabled={(fetcher?.state !== 'idle') || (component.title === selectComponent.title) ? true : false} commandFor="select_component" onClick={() => {
                  setSelectComponent({ title: component.title, value: component.id });
                  requestData({
                    componentId: component.id,
                    days: showOrderDataRange.value,
                  })
                }} variant="tertiary">{component.title}</s-button>
              ))
              }
            </s-stack>
          </s-popover>

        </s-stack>

        {/* <s-button onClick={requestData}>Submit</s-button> */}

        {/* <s-grid
          gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))"
          gap="base"
          padding="none none large-100 none"
        >
          <s-section>
            <s-stack gap="small-100">
              <s-text>Total Sales</s-text>
              <s-text type="strong">{getSymbolFromCurrency(fData?.shopData?.currencyCode || "USD")}{(fData?.totalSales || 0).toFixed(2)}</s-text>
            </s-stack>
          </s-section>

          <s-section>
            <s-stack gap="small-100">
              <s-text>Total Order Count</s-text>
              <s-text type="strong">{fData?.totalOrderCount || 0}</s-text>
            </s-stack>
          </s-section>

          <s-section>
            <s-stack gap="small-100">
              <s-text>Visitor</s-text>
              <s-text type="strong">{fData?.analyticsData?.totalVisitors || 0}</s-text>
            </s-stack>
          </s-section>

          <s-section>
            <s-stack gap="small-100">
              <s-text>Avarage Order Value</s-text>
              <s-text type="strong">{(fData?.averageOrderValue || 0).toFixed(2)}</s-text>
            </s-stack>
          </s-section>

        </s-grid> */}

        <s-grid
          // gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
          gridTemplateColumns="@container (inline-size < 600px) 1fr, 1fr 1fr 1fr"
          gap="base"
          padding="large-100 none large-100 none"
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
                <s-text type="strong">{getSymbolFromCurrency(fData?.shopData?.currencyCode || "USD")}{(fData?.totalSales || 0).toFixed(2)}</s-text>
              </s-stack>


              <ClientOnlyCmp>
                <LineChart
                  data={[
                    {
                      data: fData?.orderdataChart || [],
                      name: showOrderDataRange.title || 'Today',
                      color: '#000'
                    }
                  ]}
                  xAxisOptions={{
                    labelFormatter: (key) => new Date(key).toLocaleDateString(),
                  }}
                  yAxisOptions={{
                    labelFormatter: (value) => `${getSymbolFromCurrency(fData?.shopData?.currencyCode || "USD")}${value}`,
                  }}
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
                <s-text size="small">Total Orders</s-text>
                <s-text type="strong">{fData?.totalOrderCount || 0}</s-text>
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
                      data: fData?.countByDayMapCartData || [],
                      color: '#000',
                      isComparison: false,
                      name: showOrderDataRange.title || 'Today'

                    },
                  ]}

                />
              </ClientOnlyCmp>


            </s-box>
          </s-grid-item>

          <s-grid-item>
            <div style={{ display: 'grid' }}>
              <div style={{ gridArea: '1/1' }}>
                <s-box
                  background="base"
                  borderRadius="small-100"
                  padding="small-200"
                  overflox="visible"
                  maxBlockSize="300px"
                  minBlockSize="290px"
                >
                  <s-stack
                    gap="small-300"
                    padding="small-300 none none small"
                  >
                    <s-stack
                      direction="inline"
                      gap="small-300"
                      alignItems="center"
                    >
                      <s-text size="small">Traffic Sources</s-text>
                      <s-icon type="info" tone="info" interestFor="spc_traffic_source_tooltip" />
                      <s-tooltip id="spc_traffic_source_tooltip">Traffic Source will show the lifetime total unique visitors by Components</s-tooltip>

                    </s-stack>
                    <s-text type="strong">{fData?.analyticsData?.trafficSources?.length || 0}</s-text>
                  </s-stack>



                  <div style={{ maxHeight: '230px', overflow: 'auto' }}>
                    <s-stack

                      padding="small-300 none none small"

                    >
                      {(fData?.analyticsData?.trafficSources || []).map((item, index) => (
                        <s-stack
                          key={index}
                          direction="inline"
                          alignItems="center"
                          justifyContent="space-between"
                          padding="small-200 small small-200 small"
                          background={index % 2 === 0 ? 'base' : 'subdued'}
                          borderRadius="small"
                        >
                          <s-stack
                            maxInineSize="70%"
                          >
                            <s-link href={item?.trafficSource || '#'} target="_blank"><s-text size="small">{(item?.trafficSource || '').slice(0, 40).concat('...')}</s-text></s-link>
                          </s-stack>
                          <s-text>{item?.lifeTimeTotalUniqueVisits || 0}</s-text>
                        </s-stack>
                      ))

                      }



                    </s-stack>
                  </div>


                </s-box>
              </div>
              {disabledContentByPlan &&
                <AnalyticsUpgrade />
              }
            </div>

          </s-grid-item>

          <s-grid-item>
            <div style={{ display: 'grid' }}>
              <div style={{ gridArea: '1/1' }}>
                <s-box
                  background="base"
                  borderRadius="small-100"
                  padding="small-200"
                  minBlockSize="290px"
                >
                  <s-stack
                    gap="small-300"
                    padding="small-300 none large-200 small"
                  >
                    <s-text size="small">Visitors</s-text>
                    <s-text type="strong">{fData?.analyticsData?.totalVisitors || 0}</s-text>
                  </s-stack>


                  <ClientOnlyCmp>
                    <StackedAreaChart
                      xAxisOptions={{
                        labelFormatter: (x) => {
                          return `${x}`
                        }
                      }}
                      emptyStateText="Visitor not Found"
                      yAxisOptions={{
                        labelFormatter: (y) => {
                          return `${y}`
                        }
                      }}
                      data={[
                        {
                          data: fData?.analyticsData?.uniqueVisitorChartData || [],
                          color: 'green',
                          isComparison: true,
                          name: showOrderDataRange.title || 'Today'
                        },

                      ]}

                    />
                  </ClientOnlyCmp>


                </s-box>

              </div>
              {disabledContentByPlan &&
                <AnalyticsUpgrade />
              }
            </div>

          </s-grid-item>

          <s-grid-item>
            <div style={{ display: 'grid' }}>
              <div style={{ gridArea: '1/1' }}>
                <s-box
                  background="base"
                  borderRadius="small-100"
                  padding="small-200"
                >
                  <s-stack
                    gap="small-300"
                    padding="small-300 none large-200 small"
                  >
                    <s-text size="small">Add to Cart Click</s-text>
                    <s-text type="strong">{fData?.analyticsData?.totalAddToCartClickCount || 0}</s-text>
                  </s-stack>


                  <ClientOnlyCmp>
                    <LineChart
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
                          data: fData?.analyticsData?.addToCartClickChartData || [],
                          color: 'green',
                          isComparison: false,
                          name: showOrderDataRange.title || 'Today'
                        },


                      ]}

                    />
                  </ClientOnlyCmp>


                </s-box>
              </div>
              {disabledContentByPlan &&
                <AnalyticsUpgrade />
              }
            </div>
          </s-grid-item>

          <s-grid-item>
            <div style={{ display: 'grid' }}>
              <div style={{ gridArea: '1/1' }}>
                <s-box
                  background="base"
                  borderRadius="small-100"
                  padding="small-200"
                  overflox="visible"
                  maxBlockSize="300px"
                  minBlockSize="290px"
                >
                  <s-stack
                    gap="small-300"
                    padding="small-300 none none small"
                  >
                    <s-stack
                      direction="inline"
                      gap="small-300"
                      alignItems="center"
                    >
                      <s-text size="small">Top Affiliates</s-text>
                      <s-icon type="info" tone="info" interestFor="spc_traffic_top_affilite" />
                      <s-tooltip id="spc_traffic_top_affilite">Top 5 affiliates are shown.Others will show on affiliate page.</s-tooltip>

                    </s-stack>
                    <s-text type="strong">{fData?.affiliateDataFirstFive?.length || 0}</s-text>
                  </s-stack>



                  <div style={{ maxHeight: '230px', overflow: 'auto' }}>
                    <s-stack

                      padding="small-300 none none small"

                    >
                      {(fData?.affiliateDataFirstFive || []).map((item, index) => (
                        <s-stack
                          key={index}
                          direction="inline"
                          alignItems="center"
                          justifyContent="space-between"
                          padding="base small small-200 base"
                          background={index % 2 === 0 ? 'base' : 'subdued'}
                          borderRadius="small"
                        >
                          <s-stack
                            maxInineSize="70%"
                          >
                            <s-link href={`/app/affiliate/details/${item?.id}`}>{item?.name}</s-link>
                          </s-stack>
                          <s-text>{getSymbolFromCurrency(fData?.shopData?.currencyCode || 'USD') + (item?.totalOrderValue || 0).toFixed(2)}</s-text>
                        </s-stack>
                      ))

                      }



                    </s-stack>
                  </div>


                </s-box>
              </div>
              {disabledContentProPlan &&
                <AnalyticsUpgrade />
              }
            </div>
          </s-grid-item>


        </s-grid>






      </s-query-container>

      {/* <s-stack>
          <s-text type="strong">Analytics</s-text>
          <s-text>Total Visitors : {data?.lifeTimeTotalUniqueVisits} </s-text>
          <s-text>Add To Cart : {data?.lifeTimeTotalAddToCartClicks} </s-text>
        </s-stack>


        <s-stack>
          <s-text type="strong">Traffic Sources</s-text>
          {data.trafficSources?.map((item, index) => {
            return (
              <s-stack key={index}>
                <s-text>{item.trafficSource} : {item.lifeTimeTotalUniqueVisits} </s-text>
              </s-stack>
            )
          })

          }
        </s-stack>  */}
    </s-page>
  )
}

export default Analytics

