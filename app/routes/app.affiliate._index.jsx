import { useFetcher, useLoaderData, useNavigate, useNavigation } from "react-router";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import { AFFILIATE_STATUS, PLAN_NAME } from "../constants/constants";
import { useEffect, useState } from "react";
import EmptyStateGeneric from "../components/EmptyStateGeneric/EmptyStateGeneric";
import getSymbolFromCurrency from "currency-symbol-map";
import { getRemainingTrialDays } from "../utilis/remainTrialDaysCount";


export const loader = async ({ request }) => {
  const { session, admin, redirect } = await authenticate.admin(request);

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

  const shopData = await db.shop.findUnique({
    where: { shopifyDomain: session.shop },
    select: {
      id: true,
      totalOrderCount: true,
      totalOrderValue: true,
      createdAt: true,
      trialDays: true,
      plan: {
        select: {
          planName: true,
          isTestPlan: true
        }
      }
    },
  });

  if (!shopData?.plan) {
    throw redirect('/app/plans');
  }

  if (shopData?.plan?.isTestPlan) {
    const remaingTrialDays = getRemainingTrialDays(shopData?.createdAt, shopData?.trialDays);

    if (!shopData?.plan || (shopData?.plan?.isTestPlan && remaingTrialDays < 1)) {
      throw redirect('/app/plans');
    }
  }

  let affData = [];

  affData = await db.affiliate.findMany({
    where: {
      shop: {
        shopifyDomain: session.shop,
      },
      //isDefault: false
    },
    include: {
      shop: {
        select: {
          id: true
        }
      },
      components: {
        select: {
          id: true
        }
      }
    },
    orderBy: {
      id: 'desc',
    }
  });

  let affSalesData = [];

  if (affData?.length > 0) {

    affSalesData = await db.order.groupBy({
      by: ['affiliateId'],
      where: {
        affiliateId: {
          in: affData.map(aff => aff.id)
        },
        isCancelled: false
      },
      _sum: {
        commission: true,
        totalValue: true,

      }
    });

    //console.log('affSalesData',affSalesData);

    if (affSalesData?.length > 0) {
      affData = affData.map(aff => {
        const salesData = affSalesData.find(sale => sale.affiliateId === aff.id);
        return {
          ...aff,
          lifetTimetotalCommission: salesData?._sum.commission || 0,
          lifeTimeTotalSales: salesData?._sum.totalValue || 0
        }
      })

    }

  }




  return {
    affData: affData || [],
    shopData: shopData || {},
    shopCurrency: shopCurrency || 'USD',
  }
}

const Affiliate = () => {
  const { affData, shopCurrency, shopData } = useLoaderData();

  //console.log('affData:',affData);

  const navigation = useNavigation();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [disabledContentProPlan, setDisabledContentProPlan] = useState(false);


  const handleStatusChange = (id, status) => {
    const updatedData = { status: status };
    fetcher.submit(updatedData, { method: 'put', action: `/app/affiliate/${id}` });
  }

  const handleDeleteAffiliate = (id) => {
    const updatedData = { id };
    fetcher.submit(updatedData, { method: 'delete', action: `/app/affiliate/${id}` });
  }

  useEffect(() => {
    if (fetcher.data && fetcher.data.success) {
      shopify.toast.show(fetcher.data.message, {
        duration: 1000,
      });
    } else if (fetcher.data && !fetcher.data.success) {
      shopify.toast.show(fetcher.data.message, {
        duration: 1000,
      });
    }
  }, [fetcher.data]);

  // console.log('fetcherData:',fetcher.data);

  const {
    totalCommissionPaid,
    totalCommission,
    totalSales,
  } = (affData ?? []).reduce(
    (acc, aff) => {
      acc.totalCommissionPaid += Number(aff?.totalCommissionPaid || 0);
      acc.totalCommission += Number(aff?.lifetTimetotalCommission || 0);
      acc.totalSales += Number(aff?.lifeTimeTotalSales || 0);
      return acc;
    },
    {
      totalCommissionPaid: 0,
      totalCommission: 0,
      totalSales: 0,
    }
  );

  useEffect(() => {
    setDisabledContentProPlan(shopData?.plan?.planName === PLAN_NAME.pro ? false : true)
  }, [shopData?.plan?.planName]);

  const currencySymbol = getSymbolFromCurrency(shopCurrency || "USD") || "$";


  return (navigation.state === "loading" ? <LoadingSkeleton /> :
    <s-page inlineSize="large">
      <s-query-container>
        {disabledContentProPlan &&
          <s-stack>
            <s-banner heading="Attention!!" tone="warning">
              Upgrade the plan to use the Affiliate feature
              <s-button href="/app/plans" slot="secondary-actions">Upgrade to pro</s-button>
            </s-banner>
          </s-stack>
        }
        <s-grid
          gridTemplateColumns="@container (inline-size < 500px) 1fr 1fr, 1fr 1fr 1fr 1fr"
          gap="base"
          padding="large-200 none large-100 none"
        >
          <s-section>
            <s-stack gap="small-100">
              <s-text>Total Orders Amount</s-text>
              <s-text type="strong">{currencySymbol + (totalSales || 0).toFixed(2)}</s-text>
            </s-stack>
          </s-section>

          <s-section>
            <s-stack gap="small-100">
              <s-text>Commission Paid</s-text>
              <s-text type="strong">{currencySymbol + (totalCommissionPaid || 0).toFixed(2)}</s-text>
            </s-stack>
          </s-section>

          <s-section>
            <s-stack gap="small-100">
              <s-text>Pending Commission</s-text>
              <s-text type="strong">{currencySymbol}{((totalCommission - totalCommissionPaid) || 0).toFixed(2)}</s-text>
            </s-stack>
          </s-section>

          <s-section>
            <s-stack gap="small-100">
              <s-text>Total Affiliates</s-text>
              <s-text type="strong">{affData?.length || 0}</s-text>
            </s-stack>
          </s-section>
        </s-grid>

        <s-box>
          {affData?.length > 0 ?
            <s-section padding="none">
              <s-stack gap="small-100" direction="inline" justifyContent="space-between" padding="small-100 large-100" >
                <s-text type="strong">Affiliates</s-text>
                <s-stack direction="inline" gap="base">
                  {fetcher.state !== 'idle' &&
                    <s-spinner accessibilityLabel="Loading" size="base" />
                  }
                  <s-button icon="plus" variant="primary" accessibilityLabel="Create new affiliate"
                    onClick={() => { navigate('/app/affiliate/new') }}
                  >Create new</s-button>
                </s-stack>
              </s-stack>

              <s-table variant="auto" loading={fetcher.state !== 'idle' || disabledContentProPlan}>

                <s-table-header-row>
                  <s-table-header listSlot="primary">ID</s-table-header>
                  <s-table-header listSlot="inline">Name</s-table-header>
                  <s-table-header listSlot="labeled">Email</s-table-header>
                  <s-table-header listSlot="labeled">Total Orders</s-table-header>
                  <s-table-header listSlot="labeled">Total Sales</s-table-header>
                  <s-table-header listSlot="labeled">Total Commission</s-table-header>
                  <s-table-header listSlot="labeled">Assign Component</s-table-header>
                  <s-table-header listSlot="labeled">Status</s-table-header>
                  <s-table-header listSlot="labeled">More</s-table-header>
                </s-table-header-row>

                <s-table-body>

                  {affData?.length > 0 && affData?.map((item, index) => (
                    <s-table-row
                      key={index}
                      clickDelegate={'spc_' + item.id}
                    >

                      <s-table-cell>
                        <s-link accessibilityLabel="See details" id={'spc_' + item.id} onClick={() => { navigate('/app/affiliate/details/' + item.id) }}>

                        </s-link>

                        <s-text >{`#${1000 + item.id}`}</s-text>

                      </s-table-cell>
                      <s-table-cell>{item.name}</s-table-cell>
                      <s-table-cell>{item.email}</s-table-cell>
                      <s-table-cell>{item.totalOrderCount}</s-table-cell>
                      <s-table-cell>{currencySymbol}{(item?.totalOrderValue || 0).toFixed(2)}</s-table-cell>
                      <s-table-cell>{currencySymbol}{(item?.lifetTimetotalCommission || 0).toFixed(2)}</s-table-cell>
                      <s-table-cell>{item?.components?.length > 0 ? item?.components?.length : 0}</s-table-cell>
                      <s-table-cell>

                        <s-badge
                          tone={item.status === AFFILIATE_STATUS.active ? 'success' : 'critical'}
                        >{item.status === AFFILIATE_STATUS.active ? 'Approved' : 'Inactive/Reject'}</s-badge>
                      </s-table-cell>
                      <s-table-cell>
                        <s-button accessibilityLabel="More" command="--show" commandFor={`affliate-popover_` + item.id} variant="secondary" icon="menu-horizontal" />
                        <s-menu id={`affliate-popover_` + item.id} accessibilityLabel="Affiliate actions">
                          <s-button
                            disabled={disabledContentProPlan}
                            href={`/app/affiliate/details/${item.id}`}
                            accessibilityLabel="See details"
                            icon="info"
                          >View details</s-button>

                          <s-button
                            disabled={disabledContentProPlan}
                            onClick={() => { navigate(`/app/affiliate/${item.id}`) }}
                            accessibilityLabel="Edit Affiliate"
                            icon="edit"
                          >Edit Affiliate</s-button>

                          <s-button
                            disabled={disabledContentProPlan}
                            onClick={() => handleStatusChange(item.id, item.status === AFFILIATE_STATUS.active ? AFFILIATE_STATUS.inactive : AFFILIATE_STATUS.active)}
                            accessibilityLabel="Status change"
                            icon={item.status === AFFILIATE_STATUS.active ? 'disabled' : 'check-circle'}
                          >{item.status === AFFILIATE_STATUS.active ? 'Deactivate' : 'Activate'}</s-button>

                          <s-button
                            disabled={disabledContentProPlan}
                            commandFor={`delete_modal_` + item.id}
                            command="--show"
                            accessibilityLabel="Delete Affiliate"
                            icon="delete"
                            tone="critical"

                          >Delete</s-button>
                        </s-menu>

                        <s-modal id={`delete_modal_` + item.id} heading={`Delete Affiliate — This action cannot be undone (${item?.name})`} accessibilityLabel="Delete Affiliate">

                          <s-paragraph>If you delete this affiliate, it will be permanently removed and cannot be restored. All associated performance data will also be permanently deleted.</s-paragraph>

                          <s-button
                            slot="secondary-actions"
                            commandFor={`delete_modal_` + item.id}
                            commad="--hide"
                          >
                            Cancel
                          </s-button>

                          <s-button
                            slot="primary-action"
                            variant="primary"
                            tone="critical"
                            onClick={() => handleDeleteAffiliate(item.id)}
                            loading={fetcher.state !== 'idle'}
                            commandFor={`delete_modal_` + item.id}
                            commad="--hide"
                          >
                            Delete
                          </s-button>
                        </s-modal>

                      </s-table-cell>
                    </s-table-row>
                  ))

                  }
                  <s-link id="spc_6"></s-link>
                </s-table-body>
              </s-table>
            </s-section>
            :
            <EmptyStateGeneric />
          }

        </s-box>
      </s-query-container>
    </s-page>
  );
}

export default Affiliate