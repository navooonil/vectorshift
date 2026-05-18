import { useState } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

/**
 * OutputNode Component
 * 
 * Represents the final terminal stage of our execution pipeline.
 * It is responsible for consuming calculated data from upstream nodes
 * and displaying the output results (e.g. standard text, generated voice URLs).
 *
 * Connection Ports:
 * - Left Handle (Target): Receives the compiled output values to print or save.
 *
 * @param {object} props
 * @param {string} props.id - Unique ID assigned by React Flow.
 * @param {object} props.data - Node states (variable name, content types, execution result state).
 * @param {boolean} props.selected - visual selector.
 */
export const OutputNode = ({ id, data, selected }) => {
  // Local state for the output variable name identifier
  const [currName, setCurrName] = useState(data?.outputName || id.replace('customOutput-', 'output_'));
  
  // Local state for the expected payload display type (Text representation vs Rendered Image path)
  const [outputType, setOutputType] = useState(data?.outputType || 'Text');
  
  // Zustand store dynamic updater selector
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Synchronize field change for the output key name
  const handleNameChange = (e) => {
    setCurrName(e.target.value);
    updateNodeField(id, 'outputName', e.target.value);
  };

  // Synchronize field change for the output rendering type selection
  const handleTypeChange = (e) => {
    setOutputType(e.target.value);
    updateNodeField(id, 'outputType', e.target.value);
  };

  // Connection ports: One left-hand side target slot to accept incoming results
  const handles = [
    { id: `${id}-value`, type: 'target', position: Position.Left }
  ];

  return (
    <BaseNode 
      id={id} 
      label="Output" 
      icon="📤" 
      color="#14b8a6" 
      selected={selected} 
      handles={handles} 
      status={data?.status} 
      result={data?.result}
    >
      {/* Node configuration field for Variable Name */}
      <div className="node-field">
        <label>Name</label>
        <input 
          type="text" 
          value={currName} 
          onChange={handleNameChange} 
        />
      </div>

      {/* Node configuration field for output content type representation */}
      <div className="node-field">
        <label>Type</label>
        <select value={outputType} onChange={handleTypeChange}>
          <option value="Text">Text</option>
          <option value="Image">Image</option>
        </select>
      </div>
    </BaseNode>
  );
};

