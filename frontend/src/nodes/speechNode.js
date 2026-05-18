import { useState } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

/**
 * SpeechNode Component
 * 
 * Provides professional Text-to-Speech (TTS) voiceover capabilities in our pipelines.
 * It interfaces with advanced audio generation backends (like OpenAI's TTS-1 model).
 * 
 * Connection Ports:
 * - Left Handle (Target): Expects the source text to be read aloud by the AI.
 * - Right Handle (Source): Outputs the generated audio static file location URL.
 *
 * @param {object} props
 * @param {string} props.id - Unique ID assigned by React Flow.
 * @param {object} props.data - Node initial states (voice actor selection, execution state, and output audio urls).
 * @param {boolean} props.selected - visual selector.
 */
export const SpeechNode = ({ id, data, selected }) => {
  // Local state to manage the chosen voice actor/profile (e.g. alloy, echo, fable, onyx, nova, shimmer)
  const [voice, setVoice] = useState(data?.voice || 'alloy');
  
  // Hook from global Zustand state manager
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Synchronize field change for the selected voice profile
  const handleVoiceChange = (e) => {
    setVoice(e.target.value);
    updateNodeField(id, 'voice', e.target.value);
  };

  // Connection ports: Left-hand side text input target and Right-hand side audio output URL source
  const handles = [
    { id: `${id}-text`, type: 'target', position: Position.Left, style: { top: '50%' } },
    { id: `${id}-audio`, type: 'source', position: Position.Right }
  ];

  return (
    <BaseNode 
      id={id} 
      label="Speech" 
      icon="🔊" 
      color="#ec4899" 
      selected={selected} 
      handles={handles} 
      status={data?.status} 
      result={data?.result}
    >
      {/* Voice Actor Select dropdown list */}
      <div className="node-field">
        <label>Voice</label>
        <select value={voice} onChange={handleVoiceChange}>
          <option value="alloy">Alloy (Neutral)</option>
          <option value="echo">Echo (Male)</option>
          <option value="fable">Fable (British)</option>
          <option value="onyx">Onyx (Deep)</option>
          <option value="nova">Nova (Female)</option>
          <option value="shimmer">Shimmer (Soft)</option>
        </select>
      </div>

      {/* Helpful explanation line in the card body */}
      <div className="node-content-text" style={{marginTop: '8px'}}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          Converts input text to AI voiceover.
        </span>
      </div>
    </BaseNode>
  );
};

