import { useState } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

/**
 * TimerNode Component
 * 
 * Introduces custom latency or pause timers inside the pipeline.
 * It is highly beneficial when rate-limiting external API calls or 
 * pacing LLM responses.
 *
 * Connection Ports:
 * - Left Handle (Target): Receives input trigger signaling that the timer should begin.
 * - Right Handle (Source): Continues pipeline execution after the time-delay finishes.
 *
 * @param {object} props
 * @param {string} props.id - Unique ID assigned by React Flow.
 * @param {object} props.data - Node data properties (duration in seconds, status state).
 * @param {boolean} props.selected - Canvas node selection status.
 */
export const TimerNode = ({ id, data, selected }) => {
  // Local state to manage delay in seconds (defaults to 1.0 seconds)
  const [delay, setDelay] = useState(data?.delay || 1);
  
  // Hook from Zustand global store
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Connection ports: Left-hand side trigger slot and Right-hand side next pipeline slot
  const handles = [
    { id: `${id}-trigger`, type: 'target', position: Position.Left },
    { id: `${id}-next`, type: 'source', position: Position.Right }
  ];

  return (
    <BaseNode 
      id={id} 
      label="Timer Delay" 
      icon="⏱️" 
      color="#eab308" 
      selected={selected} 
      handles={handles} 
      status={data?.status} 
      result={data?.result}
    >
      {/* Node configuration field for setting custom Delay Duration */}
      <div className="node-field">
        <label>Delay (Seconds)</label>
        <input 
          type="number" 
          value={delay} 
          min="0.1"
          step="0.1"
          onChange={(e) => {
            setDelay(e.target.value);
            updateNodeField(id, 'delay', e.target.value);
          }} 
        />
      </div>
    </BaseNode>
  );
};

