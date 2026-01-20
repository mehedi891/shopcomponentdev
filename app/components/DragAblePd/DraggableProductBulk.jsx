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


const SortableProduct = ({ product, handleDelete, watchedValues, handleDeleteProductBulk, handleChangeQuantityDefault }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className='Polaris-Box'>

      <s-stack>
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
        {product?.variants?.length > 0 && product?.variants?.map((variant) => (
          <s-box key={variant.id} paddingBlockStart={'small'} paddingBlockEnd={'small'} paddingInlineStart={'large-400'} >

            <s-stack direction="inline" alignItems="center" justifyContent="start" gap={'small-300'}>
              <s-thumbnail size="small" src={variant?.image ? variant.image : '/images/noImage.png'}
                alt={variant.title} />

              <s-stack gap={'none'}>
                <s-box paddingInline={'small-200'}>
                  <s-stack direction="inline" gap={'small-200'} justifyContent="space-between" alignItems="center">
                    <s-text>{variant.title}</s-text>

                    <s-button variant="tertiary" icon="x" accessibilityLabel="Delete variants" onClick={() => { handleDeleteProductBulk(variant.id, 'variant') }} />
                  </s-stack>
                </s-box>
                {!watchedValues.enableQtyField &&
                  <s-box maxInlineSize="100px">
                    <s-number-field
                      label='Quantity'
                      labelAccessibilityVisibility="exclusive"
                      value={variant.quantity || 0}
                      onChange={(e) => { handleChangeQuantityDefault(variant.id, e.currentTarget.value) }}
                      align="center"
                      size="slim"
                      type="number"
                      min={1}
                      disabled={watchedValues?.enableQtyField === true ? true : false}
                    />
                  </s-box>

                }

              </s-stack>

            </s-stack>
          </s-box>
        ))

        }
      </s-stack>

      <s-divider />
      <s-box paddingBlockStart={'small'}></s-box>

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

    <s-stack gap={'small'} paddingBlockStart={'base'} paddingBlockEnd={'small-200'}>
      <div style={{maxHeight:'500px',overflow:'auto'}}>
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
      </div>
    </s-stack>

  );
};

export default DraggableProductBulk;
