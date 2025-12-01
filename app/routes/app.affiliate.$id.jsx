import { useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from "@remix-run/react"
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { AFFILIATE_STATUS, COMISSION_CRITERIA, FIXED_COMISSION } from "../constants/constants";
import TieredCommission from "../components/TieredCommission/TieredCommission";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { SaveBar } from "@shopify/app-bridge-react";
import { useEffect } from "react";

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const { id } = params;
  const affData = await db.affiliate.findUnique({
    where: {
      id: Number(id)
    }
  });

  return {
    affData
  }
}
const Updateaffiliate = () => {
  const { affData } = useLoaderData();
  console.log("affData:", affData);
  const navigation = useNavigation();
  const actionData = useActionData();
  const submit = useSubmit();
  const payoutMethods = ['Paypal', 'Debit card', 'Bank transfer', 'Other'];
  const { register, setError, getValues, handleSubmit, reset, formState: { errors, isDirty }, control, watch, setValue } = useForm({
    defaultValues: {
      name: affData?.name || "",
      email: affData?.email || "",
      phone: affData?.phone || "",
      website: affData?.website || "",
      address: affData?.address || "",
      notes: affData?.notes || "",
      commissionCiteria: affData?.commissionCiteria || COMISSION_CRITERIA.fixed,
      payoutMethods: affData?.payoutMethods || {
        method: payoutMethods[0],
        value: '',
      },
      fixedCommission: affData?.fixedCommission || {
        value: 0,
        type: FIXED_COMISSION.percentage
      },
      tieredCommission: affData?.tieredCommission || [{ from: 0, to: 1, rate: 0, type: 'percentage' }],
      status: affData?.status || AFFILIATE_STATUS.active,
      affTrackingCode: affData?.affTrackingCode || "",
      shopId: affData?.shopId

    }
  });



  const { fields, append, remove, insert, replace } = useFieldArray({
    control,
    name: "tieredCommission",
  });
  const watchedValues = watch();

  useEffect(() => {
    if (actionData?.success) {
      shopify.toast.show(actionData.message, {
        duration: 1000,
      });
    } else if (actionData?.success === false) {
      shopify.toast.show(actionData.message, {
        duration: 1000,
      });

    }


  }, [actionData]);
  const affFormHandleSubmit = (data) => {
    const updatedData = {
      ...data,
      tieredCommission: JSON.stringify(data.tieredCommission),
      payoutMethods: JSON.stringify(data.payoutMethods),
      fixedCommission: JSON.stringify(data.fixedCommission)
    };
    //console.log('Affiliate form data submitted:', updatedData);
    submit(updatedData, { method: 'post', });
  }

  const handleDiscard = () => {
    reset();
  }

  return (navigation.state === "loading" ? <LoadingSkeleton /> :

    <s-page heading="EmbedUp - Sell Anywhere" inlineSize="base">

      <s-stack gap="small-200" padding="large-200 none none none" alignItems="center">
        <s-heading>Turn Passion into Profit — Join the Affiliate Revolution</s-heading>
        <s-text>Simple setup, transparent tracking, and real rewards — start growing today!</s-text>
      </s-stack>

      <SaveBar id="spc-save-bar">
        <button type="submit" variant="primary"
          {...(navigation.state === 'submitting' ? { 'loading': '' } : {})}
        ></button>
        <button
          type="button"
          onClick={() => {
            handleDiscard();
          }}
        >
        </button>
      </SaveBar>

      <s-box padding="large none none none">
        <s-section >
          <s-query-container>
            <form method="post" onSubmit={handleSubmit(affFormHandleSubmit)} data-save-bar onReset={() => reset()}>
              <s-box background="base" border="base" borderRadius="large">
                <s-stack gap="medium-400" padding="small-200 small-200 small-200 large-100">
                  <s-heading size="small">Affiliate information</s-heading>
                  <s-text>Set affiliate basic information</s-text>
                </s-stack>
                <s-divider />
                <s-box padding="large-100">

                  <s-grid
                    gridTemplateColumns="@container (inline-size < 500px) 1fr, 1fr 1fr"
                    gap="small"
                    justifyContent="center"
                  >

                    <Controller
                      name="name"
                      control={control}
                      rules={{
                        required: "Name is required",
                        maxLength: {
                          value: 100,
                          message: "Name cannot exceed 100 characters",
                        }
                      }}
                      render={({ field, fieldState }) => (

                        <s-text-field
                          name="name"
                          label="Name"
                          defaultValue={field.value}
                          placeholder="Enter affiliate name"
                          error={fieldState.error?.message || actionData?.errors?.name}
                          maxLength={100}
                          minLength={3}
                          required
                          onChange={(value) => field.onChange(value)}
                        />
                      )}
                    />


                    <Controller
                      name="email"
                      control={control}
                      rules={{
                        required: "Email is required",
                        maxLength: {
                          value: 100,
                          message: "Email cannot exceed 100 characters",
                        }
                      }}
                      render={({ field, fieldState }) => (

                        <s-email-field
                          name="email"
                          label="Email"
                          defaultValue={field.value}
                          placeholder="Enter affiliate email"
                          error={fieldState.error?.message || actionData?.errors?.email}
                          maxLength={100}
                          minLength={3}
                          required
                          onChange={(value) => field.onChange(value)}
                        />
                      )}
                    />

                    <Controller
                      name="phone"
                      control={control}
                      rules={{
                        maxLength: {
                          value: 20,
                          message: "Phone cannot exceed 20 characters",
                        }
                      }}
                      render={({ field, fieldState }) => (

                        <s-text-field
                          name="phone"
                          label="Phone (WhatsApp/others)"
                          defaultValue={field.value}
                          placeholder="Enter phone number"
                          error={fieldState.error?.message || actionData?.errors?.phone}
                          maxLength={20}
                          minLength={10}
                          onChange={(value) => field.onChange(value)}
                        />
                      )}
                    />


                    <Controller
                      name="website"
                      control={control}
                      rules={{
                        maxLength: {
                          value: 100,
                          message: "Email cannot exceed 100 characters",
                        }
                      }}
                      render={({ field, fieldState }) => (

                        <s-url-field
                          name="website"
                          label="Website"
                          defaultValue={field.value}
                          placeholder="Enter personal website URL"
                          error={fieldState.error?.message || actionData?.errors?.website}
                          onChange={(value) => field.onChange(value)}
                        />
                      )}
                    />

                    <Controller
                      name="address"
                      control={control}
                      rules={{
                        maxLength: {
                          value: 150,
                          message: "Address cannot exceed 150 characters",
                        }
                      }}
                      render={({ field, fieldState }) => (
                        <s-text-field
                          name="address"
                          label="Address"
                          defaultValue={field.value}
                          placeholder="Enter address"
                          error={fieldState.error?.message || actionData?.errors?.address}
                          onChange={(value) => field.onChange(value)}
                        />
                      )}
                    />

                    <Controller
                      name="notes"
                      control={control}
                      rules={{
                        maxLength: {
                          value: 150,
                          message: "Address cannot exceed 150 characters",
                        }
                      }}
                      render={({ field, fieldState }) => (
                        <s-text-field
                          name="notes"
                          label="Additional notes"
                          defaultValue={field.value}
                          placeholder="Enter notes"
                          error={fieldState.error?.message || actionData?.errors?.notes}
                          onChange={(value) => field.onChange(value)}
                        />
                      )}
                    />

                  </s-grid>

                </s-box>

              </s-box>


              <s-box padding="large-200 none none none">
                <s-box background="base" border="base" borderRadius="large">
                  <s-stack gap="medium-400" padding="small-200 small-200 small-200 large-100">
                    <s-heading size="small">Comission</s-heading>
                    <s-text>Set affiliate comission</s-text>
                  </s-stack>
                  <s-divider />

                  <s-box padding="large-100 large-100 none large-100">
                    <Controller
                      name="commissionCiteria"

                      control={control}
                      render={({ field, fieldState }) => (
                        <s-choice-list
                          label="Commission Citeria"
                          name="commissionCiteria"
                          error={fieldState.error?.message || actionData?.errors?.commissionCiteria}
                          onChange={(event) => field.onChange(event.currentTarget.values[0])}
                        >
                          <s-choice value={COMISSION_CRITERIA.fixed} defaultSelected={watchedValues.commissionCiteria === COMISSION_CRITERIA.fixed}>Fixed</s-choice>
                          <s-choice value={COMISSION_CRITERIA.tiered} defaultSelected={watchedValues.commissionCiteria === COMISSION_CRITERIA.tiered} >Tiered</s-choice>
                        </s-choice-list>
                      )}
                    />
                    {watchedValues.commissionCiteria === COMISSION_CRITERIA.fixed &&
                      <s-grid
                        gridTemplateColumns="@container (inline-size < 500px) 1fr, 1fr 1fr"
                        gap="small"
                        justifyContent="center"
                        padding="small-100 none"
                      >
                        <Controller
                          name="fixedCommission.type"
                          control={control}
                          render={({ field, fieldState }) => (
                            <s-select label="Commission type" onChange={(event) => field.onChange(event.currentTarget.value)}>
                              <s-option value={FIXED_COMISSION.percentage}>Percent of sale</s-option>
                              <s-option value={FIXED_COMISSION.amount}>Order amount</s-option>
                            </s-select>
                          )}
                        />

                        <Controller
                          name="fixedCommission.value"
                          control={control}
                          render={({ field, fieldState }) => (
                            <s-number-field
                              label="Commission amount"
                              name="fixedCommission.value"
                              error={fieldState.error?.message || actionData?.errors?.fixedCommission?.value}
                              onChange={(value) => field.onChange(value)}
                              value={field.value}
                              prefix={watchedValues.fixedCommission.type === FIXED_COMISSION.percentage ? "%" : "$"}
                            />
                          )}
                        />


                      </s-grid>
                    }

                    {watchedValues.commissionCiteria === COMISSION_CRITERIA.tiered &&
                      <s-box padding="small-100 none">
                        {/* Heading start */}
                        <s-grid
                          gridTemplateColumns="repeat(7, 1fr)"
                          gap="large-200"
                          justifyContent="center"
                          alignItems="center"
                          padding="small-100"
                          background="subdued"
                          borderRadius="large large none none"
                        >
                          <s-grid-item gridColumn="span 2">
                            <s-text>Quantity</s-text>
                          </s-grid-item>
                          <s-grid-item gridColumn="span 2">
                            <s-text>Commission type</s-text>
                          </s-grid-item>

                          <s-grid-item gridColumn="span 2">
                            <s-text>Commission amount</s-text>
                          </s-grid-item>

                        </s-grid>


                        {fields.map((field, index) => {


                          return (
                            <TieredCommission
                              key={index}
                              field={field}
                              index={index}
                              register={register}
                              watch={watch}
                              remove={remove}
                              length={fields.length}
                            />
                          );
                        })}

                        <s-box padding="small-200 none none none">
                          <s-stack gap="base">
                            <s-button
                              icon="plus"
                              variant="secondary"
                              type="button"
                              disabled={fields.length >= 10}
                              onClick={() => {
                                const tiers = getValues('tieredCommission') || [];
                                const lastTier = tiers[tiers.length - 1];

                                const lastFrom = Number(lastTier?.from) || 0;
                                const nextFrom = lastFrom + 1;

                                const lastTo = Number(lastTier?.to) || 0;
                                const nextTo = lastTo + 1;

                                append({
                                  from: nextFrom,
                                  to: nextTo,
                                  rate: 0,
                                  type: FIXED_COMISSION.percentage,
                                });
                              }}
                            >
                              Add new level
                            </s-button>
                            {fields.length >= 10 &&
                              <s-text tone="info">Maximum 10 tiers can be added</s-text>
                            }
                          </s-stack>
                        </s-box>


                      </s-box>
                    }


                  </s-box>

                </s-box>
              </s-box>

              <s-box padding="large-200 none">
                <s-box background="base" border="base" borderRadius="large">
                  <s-stack gap="medium-400" padding="small-200 small-200 small-200 large-100">
                    <s-heading size="small">Manual payouts</s-heading>
                    <s-text>Set payment method below</s-text>
                  </s-stack>
                  <s-divider />

                  <s-box padding="small-200 small-200 small-200 large-100">
                    <Controller
                      name="payoutMethods.method"
                      control={control}
                      render={({ field, fieldState }) => (
                        <s-choice-list
                          label="Status"
                          labelAccessibilityVisibility="exclusive"
                          name="payoutMethods.method"
                          error={fieldState.error?.message || actionData?.errors?.payoutMethods.method}
                          onChange={(event) => field.onChange(event.currentTarget.values[0])}
                        >


                          {payoutMethods.length > 0 && payoutMethods.map((method, index) => (

                            <s-choice key={index} defaultSelected={watchedValues.payoutMethods.method === method} value={method}>
                              {method}
                            </s-choice>
                          ))

                          }
                        </s-choice-list>
                      )}
                    />

                    <Controller
                      name="payoutMethods.value"
                      control={control}
                      rules={{
                        required: "Payout method details are required",
                        maxLength: {
                          value: 100,
                          message: "Payout details cannot exceed 100 characters",
                        },
                      }}
                      render={({ field, fieldState }) => (
                        <s-box inlineSize="500px" padding="large-100 none small-100 none">
                          <s-text-field
                            label="Payment details"
                            labelAccessibilityVisibility="exclusive"
                            name="payoutMethods.value"
                            placeholder={`Enter ${watchedValues.payoutMethods.method} details`}
                            value={field.value ?? ''}
                            error={fieldState.error?.message || actionData?.errors?.payoutMethods?.value}
                            maxLength={100}
                            minLength={3}
                            required
                            onChange={(value) => { field.onChange(value) }}
                          />
                        </s-box>
                      )}
                    />

                  </s-box>

                </s-box>
              </s-box>


              <s-box padding="none">
                <s-box background="base" border="base" borderRadius="large">
                  <s-stack gap="medium-400" padding="small-200 small-200 small-200 large-100">
                    <s-heading size="small">Status</s-heading>
                    <s-text>Set affiliate status</s-text>
                  </s-stack>
                  <s-divider />

                  <s-box padding="small-200 small-200 small-200 large-100">
                    <Controller
                      name="status"
                      control={control}
                      render={({ field, fieldState }) => (
                        <s-choice-list
                          label="Status"
                          labelAccessibilityVisibility="exclusive"
                          name="status"
                          error={fieldState.error?.message || actionData?.errors?.status}
                          onChange={(event) => field.onChange(event.currentTarget.values[0])}
                        >
                          <s-choice value={AFFILIATE_STATUS.active} defaultSelected={watchedValues.status === AFFILIATE_STATUS.active}>Active</s-choice>
                          <s-choice value={AFFILIATE_STATUS.inactive} defaultSelected={watchedValues.status === AFFILIATE_STATUS.inactive}>Deactive</s-choice>
                        </s-choice-list>
                      )}
                    />
                  </s-box>

                </s-box>
              </s-box>

              <s-box padding="large-100 none">
                <s-stack direction="inline" gap="base">
                  <s-button type="submit" disabled={!isDirty} variant="primary" loading={navigation.state == 'submitting'}>Update Affiliate</s-button>
                  <s-button onClick={() => reset()} disabled={!isDirty} variant="secondary">Discard</s-button>
                </s-stack>
              </s-box>
            </form>
          </s-query-container>
        </s-section>
      </s-box>

    </s-page>


  );
}

export default Updateaffiliate


export const action = async ({ request, params }) => {
  await authenticate.admin(request);

  const { id } = params;
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  if (request.method === 'POST') {
    const affData = await db.affiliate.update({
      where: {
        id: Number(id)
      },
      data: {
        ...data,
        tieredCommission: JSON.parse(data.tieredCommission),
        payoutMethods: JSON.parse(data.payoutMethods),
        fixedCommission: JSON.parse(data.fixedCommission),
        shopId: Number(data.shopId)
      }
    });
    if (affData?.id) {
      return {
        success: true,
        message: "Affiliate updated successfully."
      }
    }
  }else if (request.method === 'PUT'){
    console.log('status:',data,data.status);
    const affData = await db.affiliate.update({
      where: {
        id: Number(id)
      },
      data: {
        status: data.status
      }
    });
    if (affData?.id) {
      return {
        success: true,
        message: "Affiliate status updated successfully."
      }
    }
  }else if (request.method === 'DELETE'){
    const affData = await db.affiliate.delete({
      where: {
        id: Number(id)
      }
    });
    if (affData?.id) {
      return {
        success: true,
        message: "Affiliate deleted successfully."
      }
    }
  }else{
    return {
      success: false,
      message: "Method not allowed."
    }
  }

  return {
    success: false,
    message: "Something went wrong. Please try again."
  }
}