import { useState } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

/**
 * LLMNode Component
 * 
 * Configures and represents the secure Large Language Model (LLM) execution stage.
 * It integrates with top-tier artificial intelligence services (OpenAI, Google Gemini).
 * 
 * Connection Ports:
 * - Top Left Handle (Target): Receives the System Role prompt instruction context.
 * - Bottom Left Handle (Target): Receives the User/Query prompt seed.
 * - Right Handle (Source): Outputs the generated model completion string.
 *
 * @param {object} props
 * @param {string} props.id - Unique ID assigned by React Flow.
 * @param {object} props.data - Node initial and persistence values (model provider, status, and generated texts).
 * @param {boolean} props.selected - visual selector.
 */
export const LLMNode = ({ id, data, selected }) => {
  // Local state to manage the selected AI engine (e.g. gpt-4o, gemini-1.5-flash, mock simulator)
  const [model, setModel] = useState(data?.model || 'gpt-4o');
  
  // Zustand state manager reference
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Dynamic field update synchronizer
  const handleModelChange = (e) => {
    setModel(e.target.value);
    updateNodeField(id, 'model', e.target.value);
  };

  // Configure connections: Two target slots on the left (System directive & User query), one response source on right
  const handles = [
    { id: `${id}-system`, type: 'target', position: Position.Left, style: { top: '33%' } },
    { id: `${id}-prompt`, type: 'target', position: Position.Left, style: { top: '66%' } },
    { id: `${id}-response`, type: 'source', position: Position.Right }
  ];

  return (
    <BaseNode 
      id={id} 
      label="LLM" 
      icon="🧠" 
      color="#8b5cf6" 
      selected={selected} 
      handles={handles} 
      status={data?.status} 
      result={data?.result}
    >
      {/* Model Selection Dropdown (OpenAI vs Google Gemini vs Local Simulation) */}
      <div className="node-field">
        <label>Model Provider</label>
        <select value={model} onChange={handleModelChange}>
          <option value="gpt-4o">GPT-4o (OpenAI)</option>
          <option value="gemini-1.5-flash">Gemini 1.5 (Google)</option>
          <option value="mock">Mock Model (Simulated)</option>
        </select>
      </div>

      {/* Dynamic guidance helper text inside the node body */}
      <div className="node-content-text" style={{marginTop: '8px'}}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          Connect System & Prompt handles.
        </span>
      </div>
    </BaseNode>
  );
};

