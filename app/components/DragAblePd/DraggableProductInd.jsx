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
import { Box, InlineStack, Thumbnail, Text, Button, Icon, BlockStack } from '@shopify/polaris';
import { DeleteIcon, DragHandleIcon } from '@shopify/polaris-icons';

const SortableProduct = ({ product, handleDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <InlineStack blockAlign="center" align="space-between">

        <InlineStack align='start' blockAlign='start' gap={'200'}>
          <div className='Polaris-Box dragInd' style={{ cursor: 'pointer',paddingTop:'var(--p-space-150)' }}  {...listeners}>
            <Icon
              source={DragHandleIcon}
            />
          </div>
          <InlineStack blockAlign="center" gap="200">
            <Thumbnail
              source={product?.image ?? '/images/noImage.png'}
              alt={product.handle}
              size="small"
            />
            <Text fontWeight="medium">{product.title}</Text>
          </InlineStack>
        </InlineStack>
        <Button
          onClick={() => handleDelete(product.id)}
          variant="monochromePlain"
        >
          <Icon tone="subdued" source={DeleteIcon} />
        </Button>
      </InlineStack>
    </div>

  );
};

const DraggableProductInd = ({ selectedProductsInd, setSelectedProductsInd, handleDeleteProductInd }) => {
  const sensors = useSensors(useSensor(PointerSensor));


  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedProductsInd.findIndex((p) => p.id === active.id);
    const newIndex = selectedProductsInd.findIndex((p) => p.id === over.id);

    setSelectedProductsInd(arrayMove(selectedProductsInd, oldIndex, newIndex));
  };

  return (
    <Box paddingBlock="400"  paddingInline="300">
      <BlockStack gap={'300'}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={selectedProductsInd} strategy={verticalListSortingStrategy}>
            {selectedProductsInd?.map((product) => (
              <SortableProduct
                key={product.id}
                product={product}
                handleDelete={handleDeleteProductInd}
              />
            ))}
          </SortableContext>
        </DndContext>
      </BlockStack>
    </Box>
  );
};

export default DraggableProductInd;
