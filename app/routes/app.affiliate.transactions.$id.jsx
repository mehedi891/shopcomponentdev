import { useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import EmptyStateGeneric from "../components/EmptyStateGeneric/EmptyStateGeneric";

export const loader = async ({ request, params }) => {
  await authenticate.admin(request);
  const affiliateId = Number(params.id);

  const transactions = await db.affiliateTransaction.findMany({
    where: {
      affiliateId: affiliateId,
    },
    orderBy: {
      createdAt: "desc",
    }
  });

  return {
    transactions: transactions || [],
    affiliateId: affiliateId,
  };
}

const AffiliateTransaction = () => {
  const { transactions,affiliateId } = useLoaderData();
  const navigation = useNavigation();
  const navigate = useNavigate();
  return (
    navigation.state === "loading" ? <LoadingSkeleton /> :
      <s-page inlineSize="base">
        <s-query-container>
          <s-stack
            padding="large-100 none large none"
            direction="inline"
            gap="small"
            justifyContent="start"
            alignItems="center"
          >
            <s-button onClick={() => navigate(-1)} accessibilityLabel="Back to affiliate" icon="arrow-left" variant="tertiary"></s-button>
            <s-text type="strong">Back to Affiliate</s-text>
          </s-stack>

          {transactions.length > 0 ?
            <s-section padding="none">
              <s-stack
                padding="small none small small"
              >
                <s-text type="heading-2">Transactions for Affiliate</s-text>
              </s-stack>
              <s-table>
                <s-table-header-row>
                  <s-table-header>Date</s-table-header>
                  <s-table-header>Transaction ID/Note</s-table-header>
                  <s-table-header>Amount Paid</s-table-header>
                </s-table-header-row>
                <s-table-body>

                  {transactions.map((transaction) => (
                    <s-table-row key={transaction.id}>
                      <s-table-cell>{transaction.createdAt.split("T")[0]}</s-table-cell>
                      <s-table-cell><s-text>{transaction.transactionDetails}</s-text></s-table-cell>
                      <s-table-cell>${transaction.commissionPaid}</s-table-cell>
                    </s-table-row>
                  ))

                  }
                </s-table-body>
              </s-table>
            </s-section> :
          <EmptyStateGeneric
            title="No transactions found"
            text="Create affiliate transactions to keep track of payments made to your affiliates."
            btnText="Back to Affiliate"
            btnHref={`/app/affiliate/details/${Number(affiliateId)}`}
          />
          }


        </s-query-container>
      </s-page>
  )
}

export default AffiliateTransaction


export const action = async ({ request, params }) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const finalData = {
    ...data,
    affiliateId: Number(data.affiliateId),
    commissionPaid: Number(data.commissionPaid),
  }

  try {
    const transaction = await db.$transaction(async (tx) => {
      const createdTx = await tx.affiliateTransaction.create({
        data: finalData,
      });

      await tx.affiliate.update({
        where: {
          id: Number(data.affiliateId),
        },
        data: {
          totalCommissionPaid: {
            increment: Number(data.commissionPaid),
          },
        },
      });

      return createdTx;
    });

    if (transaction?.id) {
      return {
        success: true,
        message: "Transaction created successfully.",
        forTransaction: true,
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Something went wrong. Please try again.",
      forTransaction: true,
    }
  }

  return {
    success: true
  };
}