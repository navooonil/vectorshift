import { useState } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

/**
 * ConditionNode Component
 * 
 * A branching decision node within the visual builder workflow.
 * It evaluates incoming text data against user-specified rules (Contains, Equals, Not Contain).
 * 
 * Conditional Routing (Part of visual execution engine):
 * - Left Handle (Target): Receives input text to evaluate.
 * - Top-Right Handle (Source - True): Activated and traversed if the condition evaluates to TRUE.
 * - Bottom-Right Handle (Source - False): Activated and traversed if the condition evaluates to FALSE.
 *
 * @param {object} props
 * @param {string} props.id - Unique ID assigned by React Flow.
 * @param {object} props.data - Initial comparison rules, operators, statuses, and outputs.
 * @param {boolean} props.selected - Canvas node selection status.
 */
export const ConditionNode = ({ id, data, selected }) => {
  // Local state for comparison rule: 'contains', 'equals', 'not_contains'
  const [operator, setOperator] = useState(data?.operator || 'contains');
  
  // Local state for the static validation pattern string
  const [value, setValue] = useState(data?.value || '');
  
  // Zustand storage hook to synchronize field updates across the canvas
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Define port handles: One input on Left, two output branches (True/False) on Right
  const handles = [
    { id: `${id}-input`, type: 'target', position: Position.Left },
    { id: `${id}-true`, type: 'source', position: Position.Right, style: { top: '33%' } },
    { id: `${id}-false`, type: 'source', position: Position.Right, style: { top: '66%' } }
  ];

  return (
    <BaseNode 
      id={id} 
      label="Condition" 
      icon="🔀" 
      color="#f43f5e" 
      selected={selected} 
      handles={handles} 
      status={data?.status} 
      result={data?.result}
    >
      {/* Operator dropdown selector (Comparison operator selection) */}
      <div className="node-field">
        <label>Operator</label>
        <select 
          value={operator} 
          onChange={(e) => {
            setOperator(e.target.value);
            updateNodeField(id, 'operator', e.target.value);
          }}
        >
          <option value="contains">Contains</option>
          <option value="equals">Equals</option>
          <option value="not_contains">Does Not Contain</option>
        </select>
      </div>

      {/* Target match value configuration */}
      <div className="node-field">
        <label>Value to Check</label>
        <input 
          type="text" 
          value={value} 
          onChange={(e) => {
            setValue(e.target.value);
            updateNodeField(id, 'value', e.target.value);
          }} 
        />
      </div>
    </BaseNode>
  );
};

