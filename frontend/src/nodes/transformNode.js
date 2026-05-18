import { useState } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

/**
 * TransformNode Component
 * 
 * Permits raw JavaScript text manipulations or mapping transformations
 * directly inside the pipeline executions.
 *
 * Connection Ports:
 * - Left Handle (Target): Consumes data string that needs to be manipulated.
 * - Right Handle (Source): Outputs the transformed final data value.
 *
 * @param {object} props
 * @param {string} props.id - Unique ID assigned by React Flow.
 * @param {object} props.data - Initial code snippets, execution states, and output records.
 * @param {boolean} props.selected - visual selector.
 */
export const TransformNode = ({ id, data, selected }) => {
  // Local state to store custom JavaScript code string (defaults to toUpperCase snippet)
  const [code, setCode] = useState(data?.code || 'return input.toUpperCase();');
  
  // Zustand store reference to update data fields globally
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Connection ports: Left-hand side input value and Right-hand side output results
  const handles = [
    { id: `${id}-input`, type: 'target', position: Position.Left },
    { id: `${id}-output`, type: 'source', position: Position.Right }
  ];

  return (
    <BaseNode 
      id={id} 
      label="JS Transform" 
      icon="⚡" 
      color="#10b981" 
      selected={selected} 
      handles={handles} 
      status={data?.status} 
      result={data?.result}
    >
      {/* Monospaced code-editor text area */}
      <div className="node-field">
        <label>JavaScript Code</label>
        <textarea 
          value={code} 
          onChange={(e) => {
            setCode(e.target.value);
            updateNodeField(id, 'code', e.target.value);
          }} 
          placeholder="return input;"
          style={{ fontFamily: 'monospace' }}
        />
      </div>
    </BaseNode>
  );
};

