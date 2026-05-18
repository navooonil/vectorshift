/**
 * DraggableNode Component
 * 
 * Represents a draggable item inside the sidebar toolbar panel.
 * It uses the native HTML5 Drag and Drop API to transfer node type identifiers
 * from the sidebar list onto the main React Flow editing canvas.
 *
 * @param {object} props
 * @param {string} props.type - The registry key mapping to the specific node category (e.g. 'llm', 'customInput').
 * @param {string} props.label - Human-readable label displayed on the toolbar icon.
 */
export const DraggableNode = ({ type, label }) => {
    // Fired when the user starts dragging the node from the sidebar panel
    const onDragStart = (event, nodeType) => {
      const appData = { nodeType };
      event.target.style.cursor = 'grabbing';
      
      // Store the node type metadata in the drag event dataTransfer registry
      event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
      event.dataTransfer.effectAllowed = 'move';
    };
  
    // Helper function returning the visual icon corresponding to each unique node category type
    const getIcon = (t) => {
      switch(t) {
        case 'customInput': return '📥';
        case 'llm': return '🧠';
        case 'customOutput': return '📤';
        case 'text': return '📝';
        case 'api': return '🌐';
        case 'timer': return '⏱️';
        case 'condition': return '🔀';
        case 'transform': return '⚡';
        case 'webhook': return '🪝';
        default: return '✨';
      }
    };

    return (
      <div
        className={`draggable-node ${type}`}
        onDragStart={(event) => onDragStart(event, type)}
        onDragEnd={(event) => (event.target.style.cursor = 'grab')}
        draggable
        data-tooltip={`Add ${label} Node`}
      >
          <span className="node-icon">{getIcon(type)}</span>
          <span>{label}</span>
      </div>
    );
};

  