import { useState } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

/**
 * WebhookNode Component
 * 
 * Acting as an event-driven trigger for external applications.
 * Exposes a specific route/endpoint that triggers pipeline execution 
 * upon receiving incoming HTTP calls.
 *
 * Connection Ports:
 * - Right Handle (Source): Fires trigger/payload to downstream nodes when event occurs.
 *
 * @param {object} props
 * @param {string} props.id - Unique ID assigned by React Flow.
 * @param {object} props.data - Node configurations (route path, event state records).
 * @param {boolean} props.selected - visual selector.
 */
export const WebhookNode = ({ id, data, selected }) => {
  // Local state to hold the exposed relative webhook route path (defaults to '/webhook')
  const [route, setRoute] = useState(data?.route || '/webhook');
  
  // Zustand store hook
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Connection ports: One Right source handle to initiate pipelines downstream
  const handles = [
    { id: `${id}-trigger`, type: 'source', position: Position.Right }
  ];

  return (
    <BaseNode 
      id={id} 
      label="Webhook Trigger" 
      icon="🪝" 
      color="#d946ef" 
      selected={selected} 
      handles={handles} 
      status={data?.status} 
      result={data?.result}
    >
      {/* Configuration field for defining relative Route endpoint path */}
      <div className="node-field">
        <label>Route</label>
        <input 
          type="text" 
          value={route} 
          onChange={(e) => {
            setRoute(e.target.value);
            updateNodeField(id, 'route', e.target.value);
          }} 
        />
      </div>
    </BaseNode>
  );
};

