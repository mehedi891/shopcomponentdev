import { Controller } from "react-hook-form";


const ColorFieldController = ({
  control,
  name,
  defaultValue = "#FFF",
  label = "Color",
}) => {

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={"#FFFFFF"}
      rules={{
        required: 'Valid color code is required. Ex: ' + defaultValue,
        validate: (v) => {
          const isColorValid = /^#([0-9A-F]{3}){1,2}$/i.test(v);
          if (!v || v.trim() === "" || !isColorValid) {
            return "Valid color code is required. Ex: " + defaultValue;
          }
          return true;
        },
      }}
      render={({ field, fieldState }) => (
        <s-color-field
          label={label}
          name={field.name}
          value={field.value || ""}
          error={fieldState.error?.message}
          placeholder="Pick a color or enter a hex value"
          details={"Choose color in hex format e.g. " + defaultValue}
          required
          onChange={(e) => {
            const val = e?.detail?.value ?? e.currentTarget.value;
            // update RHF
            field.onChange(val);
          }}
          onBlur={field.onBlur}
        />
      )}
    />
  );
};

export default ColorFieldController;
