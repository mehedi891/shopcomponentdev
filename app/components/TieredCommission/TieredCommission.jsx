import { FIXED_COMISSION } from "../../constants/constants";

const TieredCommission = ({ field, index, register, watch, remove, length }) => {
  const typeFieldName = `tieredCommission.${index}.type`;
  const typeValue = watch(typeFieldName);
  return (
    <s-box key={field.id}>
      {index === 0 &&
        <s-divider />
      }
      <s-grid
        gridTemplateColumns="repeat(7, 1fr)"
        gap="large"
        justifyContent="center"
        alignItems="center"
        padding="small-100"
      >
        {/* FROM – TO */}
        <s-grid-item gridColumn="span 2">
          <s-grid
            gridTemplateColumns="repeat(5, 1fr)"
            gap="none"
            justifyContent="center"
            alignItems="center"
            alignContent="end"
            justifyItems="center"
          >
            <s-grid-item gridColumn="span 2">
              <s-number-field
                label="From"
                labelAccessibilityVisibility="exclusive"
                {...register(`tieredCommission.${index}.from`, {
                  valueAsNumber: true,
                })}
                name={`tieredCommission.${index}.from`}
                value={field.from}
              />
            </s-grid-item>

            <s-grid-item gridColumn="span 1">
              <s-text>to</s-text>
            </s-grid-item>

            <s-grid-item gridColumn="span 2">
              <s-number-field
              label="To"
              labelAccessibilityVisibility="exclusive"
                {...register(`tieredCommission.${index}.to`, {
                  valueAsNumber: true,
                })}
                name={`tieredCommission.${index}.to`}
                value={field.to}
              />
            </s-grid-item>
          </s-grid>
        </s-grid-item>

        {/* TYPE (percentage / amount) */}
        <s-grid-item gridColumn="span 2">
          <s-select
            label="Type"
            labelAccessibilityVisibility="exclusive"
            {...register(`tieredCommission.${index}.type`)}
            name={typeFieldName}
            value={typeValue ?? field.type}
          >
            <s-option value={FIXED_COMISSION.percentage}>Percentage</s-option>
            <s-option value={FIXED_COMISSION.amount}>Fixed amount</s-option>
          </s-select>
        </s-grid-item>

        {/* RATE */}
        <s-grid-item gridColumn="span 2">
          <s-number-field
          label="Rate"
          labelAccessibilityVisibility="exclusive"
            {...register(`tieredCommission.${index}.rate`, {
              valueAsNumber: true,
            })}
            name={`tieredCommission.${index}.rate`}
            value={field.rate}
            prefix={
              (typeValue ?? field.type) === FIXED_COMISSION.percentage ? '%' : '$'
            }
          />
        </s-grid-item>

        {/* DELETE BUTTON */}
        { length > 1 &&
          <s-grid-item gridColumn="span 1">
            <s-button
              icon="delete"
              variant="secondary"
              accessibilityLabel="Delete tiered"
              onClick={() => remove(index)}
            />
          </s-grid-item>
        }
      </s-grid>
      <s-divider />
    </s-box>
  )
}

export default TieredCommission