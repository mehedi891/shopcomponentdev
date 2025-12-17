import { Controller, useForm } from "react-hook-form";

const TransactionModal = ({
  name = "",
  email = "",
  pendingCommission = 0,
  affiliateId=null,
  affTransactionFormSubmit,
  currencySymbol="$",
}) => {
  const {  handleSubmit, control,watch } = useForm({
    defaultValues: {
      commissionPaid: pendingCommission,
      transactionDetails: "",
      affiliateId: Number(affiliateId) || null,
    }
  });

const watchedValues = watch();
  return (
    <s-modal id="transaction-modal" heading="Payment Details for Affiliate">
      <form method="post" onSubmit={handleSubmit(affTransactionFormSubmit)}>
        <s-box>

          <s-stack
            paddingBlockEnd="small-100"
          >
            <s-text type="strong">Commission Payment</s-text>
            <s-text>Pay pending commission to {name}</s-text>
          </s-stack>

          <s-stack
            gap="small"
            background="subdued"
            padding="small"
            borderRadius="small"
          >
            <s-stack
              direction="inline"
              justifyContent="space-between"
            >
              <s-text>Affiliate</s-text>
              <s-text>{name}</s-text>
            </s-stack>

            <s-stack
              direction="inline"
              justifyContent="space-between"
            >
              <s-text>Email</s-text>
              <s-text>{email}</s-text>
            </s-stack>

            <s-divider />

            <s-stack
              direction="inline"
              justifyContent="space-between"
            >
              <s-text>Pending Commission</s-text>
              <s-text type="strong">{currencySymbol}{pendingCommission}</s-text>
            </s-stack>

          </s-stack>

          <s-stack
            paddingBlockStart="small-100"
            gap="small"
          >

            <Controller
              name="commissionPaid"
              control={control}
              rules={{
                maxLength: {
                  value: 100,
                  message: "Transaction details cannot exceed 100 characters",
                }
              }}
              render={({ field, fieldState }) => (
                <s-number-field
                  label="Amount to Pay"
                  prefix={currencySymbol}
                  value={field.value}
                  details="Input amount between to pay"
                  min={1}
                  max={pendingCommission}
                  onChange={(value) => field.onChange(value)}
                />
              )}
            />



            <Controller
              name="transactionDetails"
              control={control}
              rules={{
                maxLength: {
                  value: 100,
                  message: "Transaction details cannot exceed 100 characters",
                }
              }}
              render={({ field, fieldState }) => (
                <s-text-field
                  label="Add Transaction Id/Details"
                  name="transactionDetails"
                  value={field.value}
                  details="Add optional note/transction details for this transaction"
                  placeholder="Transaction Id/Details"
                  error={fieldState.error?.message}
                  maxLength={100}
                  minLength={1}
                  onChange={(value) => field.onChange(value)}
                />
              )}
            />

          </s-stack>

          <s-stack
            direction="inline"
            paddingBlockStart="base"
            paddingBlockEnd="small-300"
            gap="small-300"
            justifyContent="end"
          >
            <s-button  commandFor="transaction-modal" command="--hide">
              Cancel
            </s-button>
            <s-button
              variant="primary"
              commandFor="transaction-modal"
              command="--hide"
              type="submit"
            >
              Pay now {watchedValues.commissionPaid ? ` ${currencySymbol+watchedValues.commissionPaid}` : ""}
            </s-button>

          </s-stack>

        </s-box>


      </form>
    </s-modal>
  )
}

export default TransactionModal