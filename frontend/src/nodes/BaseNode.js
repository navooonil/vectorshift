import { Handle } from 'reactflow';

/**
 * BaseNode: The Core Abstraction (Part 1 Requirement)
 * 
 * Instead of duplicating the DOM structure, state management, and CSS classes 
 * for every single node, this component abstracts it all away. 
 * New nodes (like API, LLM, Transform) simply wrap their unique input fields 
 * inside <BaseNode> and pass down props.
 */
export const BaseNode = ({ id, label, icon = '✨', color = '#7C3AED', selected, status = 'idle', result, children, handles = [] }) => {
  return (
    <div className={`base-node ${selected ? 'selected' : ''} ${status}`}>
      <div className="node-header" style={{ borderTop: `4px solid ${color}`, boxShadow: `0 4px 20px -10px ${color}` }}>
        <span className="node-icon">{icon}</span>
        <span className="node-label">{label}</span>
        <div className={`status-dot ${status}`} title={`Status: ${status}`}></div>
      </div>
      <div className="node-content">
        {children}
      </div>
      {/* Render Output Result if successful */}
      {result && status === 'success' && (
        <div className="node-result">
           <div className="node-result-label">Output:</div>
           {typeof result === 'string' && result.startsWith('AUDIO_URL:') ? (
             <audio controls src={result.replace('AUDIO_URL:', '')} style={{ width: '100%', marginTop: '5px' }} />
           ) : (
             <div className="node-result-value">{result}</div>
           )}
        </div>
      )}
      
      {/* Dynamically map Handles (Connection Ports) passed from the parent node */}
      {handles.map((h, i) => (
        <Handle
          key={h.id}
          type={h.type}
          position={h.position}
          id={h.id}
          style={h.style || {}}
        />
      ))}
    </div>
  );
};
