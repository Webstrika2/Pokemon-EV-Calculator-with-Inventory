
import React, { useState, ReactNode, useRef } from 'react';
import { Item } from '../types'; 
import InventoryItemInput from './InventoryItemInput'; // Assuming InventoryItemInput is in the same folder or path is adjusted
import { ITEMS as DEFAULT_ITEMS } from '../constants'; // To get item details from ID

interface CollapsibleSectionProps {
  title: string;
  children?: ReactNode; // Made optional as children are now derived from itemIds
  defaultOpen?: boolean;
  category: Item['category']; 
  onResetCategory: (category: Item['category']) => void;
  itemIds: string[]; // Array of item IDs in the desired order for this category
  onReorderItems: (newItemOrder: string[]) => void; // Callback to update order in App.tsx
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  children, // Added children to destructuring
  defaultOpen = false, 
  category, 
  onResetCategory,
  itemIds,
  onReorderItems
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const sectionContentRef = useRef<HTMLDivElement>(null);

  const handleResetCategoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to reset all items in the ${category} category to 0?`)) {
      onResetCategory(category);
    }
  };

  // --- HTML5 Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId); // Required for Firefox
    // Optionally, add a class for visual feedback
    e.currentTarget.classList.add('opacity-50', 'bg-slate-600'); 
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
    
    // Visual indication for drop target (optional)
    const targetElement = e.currentTarget;
    if (targetElement.dataset.itemId !== draggedItemId) {
        // Simple visual cue: maybe a border. Complex logic for placeholder insertion is harder with pure HTML5 DND.
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null);
      return;
    }

    const currentOrder = [...itemIds];
    const draggedItemIndex = currentOrder.indexOf(draggedItemId);
    const targetItemIndex = currentOrder.indexOf(targetItemId);

    if (draggedItemIndex === -1 || targetItemIndex === -1) {
      console.error("Drag/drop item ID not found in current order.");
      setDraggedItemId(null);
      return;
    }

    // Remove dragged item and insert it before the target item
    const newOrder = [...currentOrder];
    const [removedItem] = newOrder.splice(draggedItemIndex, 1);
    
    // Adjust target index if dragged item was before target
    const adjustedTargetIndex = newOrder.indexOf(targetItemId); 
    newOrder.splice(adjustedTargetIndex, 0, removedItem);
    
    onReorderItems(newOrder);
    setDraggedItemId(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50', 'bg-slate-600');
    setDraggedItemId(null);
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const targetElement = e.currentTarget;
    if (targetElement.dataset.itemId !== draggedItemId && draggedItemId) {
        targetElement.classList.add('bg-slate-500/50'); // Highlight potential drop target
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-slate-500/50');
  };


  // The children prop is no longer used directly, items are rendered from itemIds
  const renderInventoryItems = () => {
    return itemIds.map((itemId, index) => {
      const item = DEFAULT_ITEMS.find(i => i.id === itemId);
      if (!item) return null;

      // The InventoryItemInput itself should not be draggable.
      // We wrap it in a div that is draggable.
      return (
        <div
          key={item.id}
          draggable={true}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item.id)}
          onDragEnd={handleDragEnd}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          data-item-id={item.id} // For identification
          className={`mb-1 rounded transition-shadow ${draggedItemId === item.id ? 'shadow-xl' : ''}`}
        >
          {/* InventoryItemInput is passed from App.tsx, so we need to pass props to it */}
          {/* This part requires InventoryItemInput to be passed as a child or for App.tsx to render it */}
          {/* For simplicity, I'll assume App.tsx passes down necessary props to render InventoryItemInput here */}
          {/* This means CollapsibleSection needs onQuantityChange and activeForVoiceInput related props if they are used by InventoryItemInput */}
          {/* This is getting complex. Simpler: CollapsibleSection receives the actual fully-formed InventoryItemInput components as children, and reorders those children. */}
          {/* Let's stick to itemIds and render InventoryItemInput directly here for clarity, App.tsx will manage state needed by InventoryItemInput */}
          {/* Child of CollapsibleSection in App.tsx will now be empty. */}
           <InventoryItemInput
              item={item}
              quantity={0} // This needs to come from App's inventory state
              onQuantityChange={() => {}} // This needs to be proxied from App
              // activeForVoiceInput will also need to be managed by App
              draggableId={item.id}
              index={index}
            />
        </div>
      );
    });
  };


  return (
    <div className="mb-4 bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-lg text-slate-100 bg-slate-700 hover:bg-slate-600 transition-colors focus:outline-none"
        aria-expanded={isOpen}
      >
        <span className="truncate max-w-[calc(100%-250px)] md:max-w-[calc(100%-200px)]">{title}</span> 
        <div className="flex items-center">
          {onResetCategory && (
             <button
              onClick={handleResetCategoryClick}
              className="mr-3 text-xs text-slate-300 hover:text-white bg-red-600 hover:bg-red-700 font-semibold py-1 px-2 rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label={`Reset ${category} inventory`}
              title={`Reset all ${category} items to 0`}
            >
              Reset Category
            </button>
          )}
          {/* OCR Button Removed */}
          <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
            ▼
          </span>
        </div>
      </button>
      {isOpen && (
        <div ref={sectionContentRef} className="p-4 space-y-0"> {/* Reduced space-y for tighter drag-drop feel */}
          {/* Children are now rendered based on itemIds prop from App.tsx */}
          {/* The actual InventoryItemInput components will be rendered by App.tsx inside this CollapsibleSection, matching the itemIds order */}
          {/* This means children prop IS used, and App.tsx maps itemIds to <InventoryItemInput ... /> */}
          {/* The drag handlers here are on the WRAPPER divs that CollapsibleSection will create around each child. */}
          {itemIds.map((itemId) => { // Iterate over itemIds, index is not strictly needed for finding child if IDs are unique
             // This mapping logic now needs to be in App.tsx, which passes fully formed <InventoryItemInput> elements as children
             // This component (CollapsibleSection) will just provide the draggable wrappers for those children.
             // This is incorrect based on how props are set up. The children are passed from App.tsx.
             // Let's assume App.tsx renders <InventoryItemInput> components as children, ordered by itemIds.
             // The drag-and-drop here needs to reorder those actual children.
             // This is very hard with just HTML5 DND on opaque children.
             // Reverting to rendering InventoryItemInput directly based on itemIds if children are not passed as fully formed components.
             // The prompt implies <CollapsibleSection> {itemsInSection.map(...)} </CollapsibleSection> in App.tsx
             // So, the `children` prop would contain the items.
             // This means the drag and drop logic here has to operate on these opaque children.

             // Simpler approach: App.tsx iterates itemIds and passes FULL <InventoryItemInput> to CollapsibleSection
             // CollapsibleSection then wraps *each child* with a draggable div.

             // Let's assume `children` contains the already rendered InventoryItemInputs from App.tsx, ordered by itemIds.
             // const childArray = React.Children.toArray(children);
             // const childToRender = childArray[index]; // This assumes children are already ordered correctly by App.tsx
             // const itemIdForChild = (childToRender as React.ReactElement<any>)?.props?.item?.id || `child-${index}`;


            const childToRender = React.Children.toArray(children).find(
                (child) => (child as React.ReactElement<any>)?.props?.item?.id === itemId
            );

            if (!childToRender) {
                // Optionally handle cases where a child for an ID might be missing, though ideally App.tsx ensures consistency.
                // console.warn(`CollapsibleSection: Child for itemId ${itemId} not found.`);
                return null; 
            }

            return (
                <div
                    key={itemId} // Use itemId from the explicit list for keying wrappers
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, itemId)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, itemId)}
                    onDragEnd={handleDragEnd}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    data-item-id={itemId} // For identification
                    className={`mb-1 rounded transition-shadow ${draggedItemId === itemId ? 'shadow-xl' : ''}`}
                >
                    {/* This child is the InventoryItemInput passed from App.tsx */}
                    {childToRender}
                </div>
            );

          })}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
