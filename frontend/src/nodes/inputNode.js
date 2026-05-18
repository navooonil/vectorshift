import { useState } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

/**
 * InputNode Component
 * 
 * This represents the starting terminal node of our execution pipeline. 
 * It allows users to feed static content, prompt seeds, or files into the downstream nodes.
 *
 * Connection Ports:
 * - Right Handle (Source): Outputs the declared input string value to target connections.
 *
 * @param {object} props
 * @param {string} props.id - Unique node ID assigned by React Flow.
 * @param {object} props.data - Holds initial/saved configurations (inputName, inputType, inputValue).
 * @param {boolean} props.selected - Selection state indicator.
 */
export const InputNode = ({ id, data, selected }) => {
  // Local state for the variable identifier name
  const [currName, setCurrName] = useState(data?.inputName || id.replace('customInput-', 'input_'));
  
  // Local state for input type configuration (Text format vs File upload path)
  const [inputType, setInputType] = useState(data?.inputType || 'Text');
  
  // Local state for storing actual content value
  const [inputValue, setInputValue] = useState(data?.inputValue || '');
  
  // Zustand store function to update fields inside React Flow nodes state
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Synchronize field change for variable name
  const handleNameChange = (e) => {
    setCurrName(e.target.value);
    updateNodeField(id, 'inputName', e.target.value);
  };

  // Synchronize field change for selected type
  const handleTypeChange = (e) => {
    setInputType(e.target.value);
    updateNodeField(id, 'inputType', e.target.value);
  };

  // Synchronize field change for input body content
  const handleValueChange = (e) => {
    setInputValue(e.target.value);
    updateNodeField(id, 'inputValue', e.target.value);
  };

  // Define port handles: One right-hand side source output
  const handles = [
    { id: `${id}-value`, type: 'source', position: Position.Right }
  ];

  return (
    <BaseNode 
      id={id} 
      label="Input" 
      icon="📥" 
      color="#3b82f6" 
      selected={selected} 
      handles={handles} 
      status={data?.status} 
      result={data?.result}
    >
      {/* Node field to specify Variable Name */}
      <div className="node-field">
        <label>Name</label>
        <input 
          type="text" 
          value={currName} 
          onChange={handleNameChange} 
        />
      </div>

      {/* Node field to determine input formatting type */}
      <div className="node-field">
        <label>Type</label>
        <select value={inputType} onChange={handleTypeChange}>
          <option value="Text">Text</option>
          <option value="File">File</option>
        </select>
      </div>

      {/* Custom Text area input content holder */}
      <div className="node-field">
        <label>Value</label>
        <textarea 
          value={inputValue} 
          onChange={handleValueChange} 
          placeholder="Enter input value here..."
          style={{ width: '100%', minHeight: '60px', marginTop: '4px' }}
        />
      </div>
    </BaseNode>
  );
};

