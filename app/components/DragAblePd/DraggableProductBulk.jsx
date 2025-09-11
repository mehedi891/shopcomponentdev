import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, InlineStack, Thumbnail, Text, Button, Icon, BlockStack, Divider, TextField } from '@shopify/polaris';
import { DeleteIcon, DragHandleIcon, XIcon } from '@shopify/polaris-icons';

const SortableProduct = ({ product, handleDelete, watchedValues, handleDeleteProductBulk, handleChangeQuantityDefault }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className='Polaris-Box'>
      <InlineStack blockAlign='start' gap={'100'}>
        <div style={{ cursor: 'pointer',paddingTop:'var(--p-space-150)' }} {...listeners}>
          <Icon
            source={DragHandleIcon}
          />
        </div>


        <Box minWidth='90%'>
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap={'200'} blockAlign="center">
              <Thumbnail size="small" source={product?.image ? product?.image : '/images/noImage.png'}
                alt={product.handle} />
              <Text variant="bodyMd" fontWeight="medium">{product.title}</Text>
            </InlineStack>
            <Button size="large" variant="monochromePlain" onClick={() => { handleDeleteProductBulk(product.id, 'product') }}>
              <Icon tone="subdued" source={DeleteIcon} />
            </Button>
          </InlineStack>

          {product?.variants?.length > 0 && product?.variants?.map((variant) => (
            <Box key={variant.id} paddingBlockStart={'200'} paddingBlockEnd={'200'} paddingInlineStart={'400'} >

              <InlineStack align="start" blockAlign="center" gap={'200'}>
                <Thumbnail size="small" source={variant?.image ? variant.image : '/images/noImage.png'}
                  alt={variant.title} />

                <BlockStack gap={'100'}>

                  <Box paddingInline={'100'}>
                    <InlineStack gap={'200'} align="space-between" blockAlign="center">
                      <Text variant="bodySm">{variant.title}</Text>

                      <Button size="medium" variant="monochromePlain" onClick={() => { handleDeleteProductBulk(variant.id, 'variant') }} >
                        <Icon tone="subdued" source={XIcon} />
                      </Button>
                    </InlineStack>
                  </Box>
                  {!watchedValues.enableQtyField &&
                    <Box maxWidth="100px">
                      <TextField
                        label='Quantity'
                        labelHidden
                        value={variant.quantity || 0}
                        onChange={(value) => { handleChangeQuantityDefault(variant.id, value) }}
                        align="center"
                        size="slim"
                        type="number"
                        min={1}
                        disabled={watchedValues?.enableQtyField === true ? true : false}

                      />
                    </Box>

                  }

                </BlockStack>

              </InlineStack>
            </Box>
          ))

          }
          <Divider />

        </Box>

      </InlineStack>



    </div>

  );
};

const DraggableProductBulk = ({ selectedProductsBulk, setSelectedProductsBulk, watchedValues, handleDeleteProductBulk, handleChangeQuantityDefault }) => {
  const sensors = useSensors(useSensor(PointerSensor));


  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedProductsBulk.findIndex((p) => p.id === active.id);
    const newIndex = selectedProductsBulk.findIndex((p) => p.id === over.id);

    setSelectedProductsBulk(arrayMove(selectedProductsBulk, oldIndex, newIndex));
  };

  return (
   
      <BlockStack gap={'400'}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={selectedProductsBulk} strategy={verticalListSortingStrategy}>
            {selectedProductsBulk?.map((product) => (
              <SortableProduct
                key={product.id}
                product={product}
                watchedValues={watchedValues}
                handleDeleteProductBulk={handleDeleteProductBulk}
                handleChangeQuantityDefault={handleChangeQuantityDefault}
              />
            ))}
          </SortableContext>
        </DndContext>
      </BlockStack>
    
  );
};

export default DraggableProductBulk;
