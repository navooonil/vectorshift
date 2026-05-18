import { useState } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

/**
 * TextNode Component
 * 
 * A key dynamic component that acts as a Prompt Template generator. 
 * Allows builders to create templates containing variables enclosed in `{{curly_braces}}`.
 * 
 * Dynamic Features (Part 3 Requirements):
 * 1. Auto-Resize: Auto-calculates text-area height and width depending on character density.
 * 2. Dynamic Handles: Scans text content for variable patterns on render and automatically registers
 *    corresponding target handles on the Left hand side to let downstream variables inject upstream.
 * 
 * Connection Ports:
 * - Left Handles (Dynamic Targets): Created per matched `{{variable}}` key.
 * - Right Handle (Source): Outputs the compiled prompt string.
 *
 * @param {object} props
 * @param {string} props.id - Unique ID assigned by React Flow.
 * @param {object} props.data - Node configs (prompt template, execution state, output values).
 * @param {boolean} props.selected - visual selector.
 */
export const TextNode = ({ id, data, selected }) => {
  // Local state for the editable template value
  const [currText, setCurrText] = useState(data?.text || '{{input}}');
  
  // Zustand store update action
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Updates local text state and triggers automatic dimensions scaling
  const handleTextChange = (e) => {
    const val = e.target.value;
    setCurrText(val);
    updateNodeField(id, 'text', val);
    
    // Auto-resize logic (Part 3 Requirement: Height & Width adjustment)
    // Dynamic Height expansion based on line scroll height
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    
    // Calculate required width based on text content length to ensure visibility
    const newWidth = Math.max(200, val.length * 8); 
    e.target.style.width = newWidth + 'px';
  };

  // -------------------------------------------------------------
  // Part 3 Requirement: Dynamic Variables
  // Extract all unique {{ variables }} dynamically on every render
  // -------------------------------------------------------------
  // Regex to capture safe variable name structures matching {{ variableName }}
  const regex = /{{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*}}/g;
  let matches;
  const foundVars = new Set();
  
  // Dynamic scanning for pattern matches
  while ((matches = regex.exec(currText)) !== null) {
    foundVars.add(matches[1]);
  }
  
  const variables = Array.from(foundVars);

  // Default Right-Side output source handle (Outputs template result)
  const handles = [
    { id: `${id}-output`, type: 'source', position: Position.Right }
  ];
  
  // Calculate relative top positions to distribute multiple Left target handles evenly
  const totalVars = variables.length;
  variables.forEach((variable, index) => {
    const topPosition = totalVars === 1 ? '50%' : `${25 + (50 / (totalVars - 1)) * index}%`;
    
    handles.push({
      id: `${id}-${variable}`,
      type: 'target',
      position: Position.Left,
      style: { top: topPosition }
    });
  });

  return (
    <BaseNode 
      id={id} 
      label="Text" 
      icon="📝" 
      color="#f59e0b" 
      selected={selected} 
      handles={handles} 
      status={data?.status} 
      result={data?.result}
    >
      {/* Node field to modify Text/Prompt Template content */}
      <div className="node-field">
        <label>Text Content</label>
        <textarea 
          value={currText} 
          onChange={handleTextChange} 
          placeholder="Type something. Use {{var}} for variables."
        />
      </div>
    </BaseNode>
  );
};

