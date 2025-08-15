import { BlockStack, Box, Card, Grid, InlineStack, Popover, Text, TextField } from "@shopify/polaris";
import { useCallback, useState } from "react";

const CustomColorPicker = ({
  label = "Bundle Title Text Color",
  defaultColor,
  defaultOpacity,
  onColorChange,
  onOpacityChange,
}) => {
  const [open, setOpen] = useState(false);
  const toggleOpen = useCallback(() => setOpen((active) => !active), []);

  //   const [color, setColor] = useState(defaultColor);
  //   const [opacity, setOpacity] = useState(1);

  const activator = (
    <div
      style={{
        cursor: "pointer",
        backgroundColor: defaultColor,
        opacity: defaultOpacity,
        width: "5.25rem",
        height: "2.5rem",
        borderRadius: "4px",
        border: "1px solid #E5E5E5",
      }}
      onClick={toggleOpen}
    ></div>
  );
  return (
    <InlineStack align="space-between" blockAlign="center">
      <Text as="p" variant="bodyMd" fontWeight="regular">
        {label}
      </Text>
      <Popover active={open} activator={activator} onClose={toggleOpen}>
        <Popover.Pane fixed>
          <Popover.Section>
            <ColorPallateWithTextField
              defaultColor={defaultColor}
              defaultOpacity={defaultOpacity}
              onColorChange={onColorChange}
              onOpacityChange={onOpacityChange}
            />
          </Popover.Section>
        </Popover.Pane>
      </Popover>
    </InlineStack>
  );
};

const ColorPallateWithTextField = ({
  defaultColor,
  defaultOpacity,
  onColorChange,
  onOpacityChange,
}) => {
  const pallates = [
    "#000000",
    "#E51C00",
    "#FFE600",
    "#00FF00",
    "#00EDED",
    "#0000FF",
    "#FF00FF",
    "#C1272D",
    "#F15A24",
    "#D9E021",
    "#8CC63F",
    "#25E82B",
    "#136F45",
    "#C0E1FF",
    "#51C0FF",
    "#005BD3",
    "#E2E7FF",
    "#AA95FF",
    "#5700D1",
    "#FCDFFC",
    "#E156E1",
    "#791A79",
    "#FFE1E8",
    "#FE8EB1",
    "#8D0448",
    "#998675",
    "#7C5800",
    "#FFE600",
    "#C5B200",
    "#332E00",
  ];
  return (
    <Box paddingBlock={"100"} maxWidth="14rem">
      <BlockStack gap={"200"}>
        <Card>
          <Grid columns={{ lg: 6 }}>
            {pallates.map((pallate, index) => (
              <div
                key={pallate + index}
                style={{
                  backgroundColor: pallate,
                  width: "1.2rem",
                  height: "1.2rem",
                  borderRadius: "2px",

                  cursor: "pointer",
                  ...(pallate === defaultColor
                    ? {
                        outline: `3px solid var(--p-color-border-tertiary)`,
                      }
                    : {}),
                }}
                onClick={() => onColorChange(pallate)}
              />
            ))}
          </Grid>
        </Card>
        <Grid gap={{ lg: "5px" }}>
          <Grid.Cell columnSpan={{ xs: 6, lg: 8 }}>
            <TextField
              label
              labelHidden
              autoComplete="off"
              value={defaultColor}
              onChange={onColorChange}
            />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, lg: 4 }}>
            <div className="color_pallate_number_field">
              {/* <TextField
                label
                labelHidden
                autoComplete="off"
                suffix="%"
                max={100}
                step={1}
                value={String(defaultOpacity * 100)}
                onChange={(v) => {
                  let num = Number(v);
                  if (num > 100) num = 100;
                  if (num < 0) num = 0;
                  onOpacityChange(String(num / 100));
                }}
                type="number"
                //   inputMode="decimal"
              /> */}
            </div>
          </Grid.Cell>
        </Grid>
      </BlockStack>
    </Box>
  );
};


export default CustomColorPicker