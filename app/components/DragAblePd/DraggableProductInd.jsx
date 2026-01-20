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

const SortableProduct = ({ product, handleDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <s-stack direction="inline" alignItems="center" justifyContent="space-between">
        <div className='dragInd' style={{ cursor: 'pointer', paddingTop: '7px' }}  {...listeners}>
          <s-icon
            type="drag-handle"
          />
        </div>

        <s-thumbnail
          src={product?.image ?? '/images/noImage.png'}
          alt={product.handle}
          size="small"
        />
        <s-stack
          inlineSize="70%"
        >
          <s-text>{product.title}</s-text>
        </s-stack>


        <s-button
          accessibilityLabel="Delete"
          onClick={() => handleDelete(product.id)}
          variant="tertiary"
          icon="delete"
        />

      </s-stack>
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

    <div style={{ maxHeight: '500px', overflow: 'auto' }}>
      <s-stack gap={'small'} paddingBlockStart={'base'} paddingBlockEnd={'small-200'}>
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
      </s-stack>
    </div>

  );
};

export default DraggableProductInd;
