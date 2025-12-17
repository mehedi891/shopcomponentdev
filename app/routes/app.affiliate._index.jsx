import { useFetcher, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import { AFFILIATE_STATUS } from "../constants/constants";
import { useEffect } from "react";
import EmptyStateGeneric from "../components/EmptyStateGeneric/EmptyStateGeneric";
import getSymbolFromCurrency from "currency-symbol-map";


export const loader = async ({ request }) => {
  const { session,admin } = await authenticate.admin(request);

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
      totalOrderValue: true
    },
  });

  let affData = [];

  affData = await db.affiliate.findMany({
    where: {
      shop: {
        shopifyDomain: session.shop,
      },
      isDefault: false
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
        }
      },
      _sum: {
        commission: true,
        totalValue: true,

      }
    });

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



  console.log('affSalesData:', affSalesData);


  return {
    affData: affData || [],
    shopData: shopData || {},
    shopCurrency: shopCurrency || 'USD',
  }
}

const Affiliate = () => {
  const { affData, shopCurrency } = useLoaderData();

  console.log('affData',affData);

  const navigation = useNavigation();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const tableHeaders = [
    "ID",
    "Name",
    "Email",
    "Total Orders",
    "Total Sales",
    "Total Commission",
    "Assign Component",
    "Status",
    "More"
  ]

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

const currencySymbol = getSymbolFromCurrency(shopCurrency || "USD") || "$";

  return (navigation.state === "loading" ? <LoadingSkeleton /> :
    <s-page inlineSize="large">
      <s-query-container>
        <s-grid
          gridTemplateColumns="@container (inline-size < 500px) 1fr 1fr, 1fr 1fr 1fr 1fr"
          gap="base"
          padding="large-200 none large-100 none"
        >
          <s-section>
            <s-stack gap="small-100">
              <s-text>Total Orders</s-text>
              <s-text type="strong">{currencySymbol+totalSales.toFixed(2) ?? 0}</s-text>
            </s-stack>
          </s-section>

          <s-section>
            <s-stack gap="small-100">
              <s-text>Commission Paid</s-text>
              <s-text type="strong">{currencySymbol+totalCommissionPaid.toFixed(2)}</s-text>
            </s-stack>
          </s-section>

          <s-section>
            <s-stack gap="small-100">
              <s-text>Pending Commission</s-text>
              <s-text type="strong">{currencySymbol}{(totalCommission - totalCommissionPaid).toFixed(2)}</s-text>
            </s-stack>
          </s-section>

          <s-section>
            <s-stack gap="small-100">
              <s-text>Total Affiliates</s-text>
              <s-text type="strong">{affData?.length ?? 0}</s-text>
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
                  <s-button icon="plus" variant="primary"
                    onClick={() => { navigate('/app/affiliate/new') }}
                  >Create new</s-button>
                </s-stack>
              </s-stack>

              <s-table variant="auto" loading={fetcher.state !== 'idle'}>

                <s-table-header-row>
                  {tableHeaders.map((title, index) => (
                    <s-table-header listSlot={index === 0 ? "primary" : index === 1 ? "secondary" : "labeled"} key={index}>{title}</s-table-header>
                  ))

                  }
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
                      <s-table-cell>{currencySymbol}{item.totalOrderValue.toFixed(2)}</s-table-cell>
                      <s-table-cell>{currencySymbol}{item?.lifetTimetotalCommission.toFixed(2) ?? 0}</s-table-cell>
                      <s-table-cell>{item?.components?.length > 0 ? item?.components?.length : 0}</s-table-cell>
                      <s-table-cell>

                        <s-badge
                          tone={item.status === AFFILIATE_STATUS.active ? 'success' : 'critical'}
                        >{item.status === AFFILIATE_STATUS.active ? 'Active' : 'Inactive'}</s-badge>
                      </s-table-cell>
                      <s-table-cell>
                        <s-button accessibilityLabel="More" commandFor={`affliate-popover_` + item.id} variant="secondary" icon="menu-horizontal" />
                        <s-popover id={`affliate-popover_` + item.id} inlineSize="8">
                          <s-stack slots="children" direction="block" padding="small small">
                            <s-button href={`/app/affiliate/details/${item.id}`} accessibilityLabel="See details" icon="info" variant="tertiary"
                            >
                              View details
                            </s-button>
                            <s-button accessibilityLabel="Edit" icon="edit" variant="tertiary"
                              onClick={() => { navigate(`/app/affiliate/${item.id}`) }}
                            >Edit Affiliate</s-button>

                            <s-button accessibilityLabel={item.status === AFFILIATE_STATUS.active ? 'Deactivate' : 'Activate'} icon={item.status === AFFILIATE_STATUS.active ? 'disabled' : 'check-circle'} variant="tertiary"
                              onClick={() => handleStatusChange(item.id, item.status === AFFILIATE_STATUS.active ? AFFILIATE_STATUS.inactive : AFFILIATE_STATUS.active)}
                            >{item.status === AFFILIATE_STATUS.active ? 'Deactivate' : 'Activate'}</s-button>

                            <s-button accessibilityLabel="Delete" tone="critical" icon="delete" variant="tertiary" commandFor={`delete_modal_` + item.id}>Delete</s-button>

                            <s-modal id={`delete_modal_` + item.id} heading="Delete Affiliate — This action cannot be undone" accessibilityLabel="Delete Affiliate">

                              <s-paragraph>If you delete this affiliate, it will be permanently removed and cannot be restored. All associated performance data will also be permanently deleted.</s-paragraph>

                              <s-button
                                slot="secondary-actions"
                                commandFor={`delete_modal_` + item.id}
                              >
                                Cancel
                              </s-button>



                              <s-button
                                slot="primary-action"
                                variant="primary"
                                tone="critical"
                                onClick={() => handleDeleteAffiliate(item.id)}
                                loading={fetcher.state !== 'idle'}
                              >
                                Delete
                              </s-button>
                            </s-modal>

                          </s-stack>
                        </s-popover>

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