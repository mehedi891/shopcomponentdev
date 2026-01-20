import { useActionData, useLoaderData, useLocation, useNavigate, useNavigation, useSearchParams, useSubmit } from "react-router"
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { AFFILIATE_STATUS, COMISSION_CRITERIA, FIXED_COMISSION, TIERED_COMISSION_TYPE } from "../constants/constants";
import TieredCommission from "../components/TieredCommission/TieredCommission";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
import redis from "../utilis/redis.init";

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
  const shopify = useAppBridge();
  const { affData } = useLoaderData();
  //console.log("affData:", affData);
  const navigation = useNavigation();
  const navigate = useNavigate();
  const actionData = useActionData();
  const submit = useSubmit();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const params = new URLSearchParams(location.search);
  const [showNewCreatedBanner, setShowNewCreatedBanner] = useState(params.get("new_created") === "true");
  const payoutMethods = ['Paypal', 'Debit card', 'Bank transfer', 'Other'];
  const { register, getValues, handleSubmit, reset, formState: { errors, isDirty }, control, watch, } = useForm({
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
      tieredCommissionType: affData?.tieredCommissionType || TIERED_COMISSION_TYPE.quantity,
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






  const affFormHandleSubmit = (data) => {
    const updatedData = {
      ...data,
      tieredCommission: JSON.stringify(data.tieredCommission),
      payoutMethods: JSON.stringify(data.payoutMethods),
      fixedCommission: JSON.stringify(data.fixedCommission)
    };
    //console.log('Affiliate form data submitted:', updatedData);
    submit(updatedData, { method: 'post' });
    setShowNewCreatedBanner(false);
  }

  const handleDiscard = () => {
    reset();
    shopify.saveBar.hide('spc-save-bar_affiliate')
  }

  useEffect(() => {
    if (searchParams.toString()) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    if (actionData?.success) {
      shopify.toast.show(actionData.message, { duration: 1000 });

      const current = getValues();
      reset(current);

    } else if (actionData?.success === false) {
      shopify.toast.show(actionData.message, { duration: 1000 });
    }
  }, [actionData, getValues, reset, shopify]);


  useEffect(() => {
    if (isDirty) {
      shopify.saveBar.show('spc-save-bar_affiliate');

    } else {
      reset(getValues());

    }
  }, [isDirty]);


  useEffect(() => {
    if (window) {
      window.addEventListener('popstate', function (event) {
        reset(getValues());
      });
    }
  }, []);



  return (navigation.state === "loading" ? <LoadingSkeleton /> :

    <s-page heading="EmbedUp - Sell Anywhere" inlineSize="base">

      <s-query-container>
        <form method="post" onSubmit={handleSubmit(affFormHandleSubmit)} onReset={() => reset()}>
          <SaveBar id="spc-save-bar_affiliate">
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
          <s-stack
            padding="large-100 none none none"
            direction="inline"
            gap="small"
            justifyContent="start"
            alignItems="center"
          >
            <s-button disabled={isDirty ? true : false} onClick={() => navigate('/app/affiliate')} accessibilityLabel="Back to affiliate" icon="arrow-left" variant="tertiary"></s-button>
            <s-text type="strong">Update: {affData?.name}</s-text>
          </s-stack>

          {showNewCreatedBanner &&
            <s-stack paddingBlockStart="large">
              <s-banner heading="Affiliated created successfully" tone="success" dismissible>
                <s-stack
                  direction="inline"
                  gap="small"
                  justifyContent="start"
                  alignItems="center"
                >
                  <s-link href="/app/affiliate">Back to Affiliates</s-link>
                  <s-link href="/app">Back to dasboard</s-link>

                </s-stack>
              </s-banner>
            </s-stack>
          }

          <s-box padding="large none none none">
            <s-section >

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
                        },
                        validate: (v) => {
                          const trimmed = (v ?? "").trim();
                          if (!trimmed) return "Name cannot be empty or only spaces";
                          return true;
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
                        },
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Please enter a valid email address",
                        },
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

                        {/* <s-box padding="none none large-100 none" maxInlineSize="400px">
                          <Controller
                            name="tieredCommissionType"
                            control={control}
                            render={({ field, fieldState }) => (
                              <s-select label="Tiered type" onChange={(event) => field.onChange(event.currentTarget.value)}>
                                <s-option selected={TIERED_COMISSION_TYPE.quantity === watchedValues.tieredCommissionType} value={TIERED_COMISSION_TYPE.quantity}>Orders quantity</s-option>
                                <s-option selected={TIERED_COMISSION_TYPE.orderAmount === watchedValues.tieredCommissionType} value={TIERED_COMISSION_TYPE.orderAmount}>Orders amount</s-option>
                              </s-select>
                            )}
                          />
                        </s-box> */}

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
                            <s-text>{watchedValues.tieredCommissionType === TIERED_COMISSION_TYPE.quantity ? "Orders quantity range" : "Orders amount range"}</s-text>
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
                                const lastTo = Number(lastTier?.to) || 0;
                                //const lastFrom = Number(lastTier?.from) || 0;
                                const nextFrom = lastTo + 1;
                                const nextTo = nextFrom + 1;

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
                          value: 300,
                          message: "Payout details cannot exceed 300 characters",
                        },
                        validate: (v) => {
                          const trimmed = (v ?? "").trim();
                          if (!trimmed) return "Payout method details cannot be empty or only spaces";
                          return true;
                        }
                      }}
                      render={({ field, fieldState }) => (
                        <s-box inlineSize="500px" padding="large-100 none small-100 none">
                          <s-text-area
                            label="Payment details"
                            labelAccessibilityVisibility="exclusive"
                            name="payoutMethods.value"
                            placeholder={`Enter ${watchedValues.payoutMethods.method} details`}
                            value={field.value ?? ''}
                            error={fieldState.error?.message || actionData?.errors?.payoutMethods?.value}
                            maxLength={300}
                            minLength={3}
                            required
                            row={1}
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
                          <s-choice value={AFFILIATE_STATUS.active} defaultSelected={watchedValues.status === AFFILIATE_STATUS.active}>Approved</s-choice>
                          <s-choice value={AFFILIATE_STATUS.pending} defaultSelected={watchedValues.status === AFFILIATE_STATUS.pending}>Pending</s-choice>
                          <s-choice value={AFFILIATE_STATUS.inactive} defaultSelected={watchedValues.status === AFFILIATE_STATUS.inactive}>Reject/Deactive</s-choice>
                        </s-choice-list>
                      )}
                    />
                  </s-box>

                </s-box>
              </s-box>

              <s-box padding="large-100 none">
                <s-stack direction="inline" gap="base">
                  <s-button type="submit" disabled={!isDirty} variant="primary" loading={navigation.state == 'submitting'}>Update Affiliate</s-button>
                  <s-button onClick={() => { reset(); }} disabled={!isDirty} variant="secondary">Discard</s-button>
                </s-stack>
              </s-box>

            </s-section>
          </s-box>
        </form>
      </s-query-container>

    </s-page>


  );
}

export default Updateaffiliate


export const action = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);

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
  } else if (request.method === 'PUT') {
    console.log('status:', data, data.status);
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
  } else if (request.method === 'DELETE') {
    // redis invalided the cache if exist start
    const pattern = `analytics:${session.shop}:*`;
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== "0");
    // redis invalided the cache if exist end
    try {
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
    } catch (error) {
      console.log("Error DeletingAff:::>>>", error);
      return {
        success: false,
        message: "Something went wrong. Please try again."
      }
    }

  } else {
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