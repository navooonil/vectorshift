import { useState, useRef } from 'react';
import { useStore } from './store';

export const SubmitButton = () => {
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const nodeIDs = useStore((state) => state.nodeIDs);
    const setPipeline = useStore((state) => state.setPipeline);
    const [toast, setToast] = useState(null);
    const fileInputRef = useRef(null);

    const showToast = (title, message, isError = false) => {
        setToast({ title, message, isError });
        setTimeout(() => setToast(null), 5000);
    };

    const handleExport = () => {
        try {
            const pipelineData = JSON.stringify({ nodes, edges, nodeIDs }, null, 2);
            const blob = new Blob([pipelineData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `pipeline_${new Date().getTime()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            showToast('Export Successful', 'Pipeline saved to your computer.');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Export Failed', 'Could not export pipeline.', true);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.nodes || !data.edges) throw new Error('Invalid pipeline format');
                
                setPipeline(data.nodes, data.edges, data.nodeIDs || {});
                showToast('Import Successful', 'Pipeline loaded perfectly.');
            } catch (error) {
                console.error('Import error:', error);
                showToast('Import Failed', 'The JSON file is invalid or corrupted.', true);
            }
            // Reset input so the same file can be loaded again if needed
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear the entire canvas?")) {
            setPipeline([], [], {});
            showToast('Canvas Cleared', 'You have a fresh workspace.');
        }
    };

    const updateNodeField = useStore((state) => state.updateNodeField);

    const handleSubmit = async () => {
        // Reset all node statuses before starting
        nodes.forEach(node => {
            updateNodeField(node.id, 'status', 'idle');
            updateNodeField(node.id, 'result', null);
        });

        try {
            // ---------------------------------------------------------
            // PART 4 REQUIREMENT: Pipeline Parsing & Validation
            // We hit the /pipelines/parse endpoint to validate the graph
            // and get the mathematically calculated DAG stats.
            // ---------------------------------------------------------
            const parseResponse = await fetch('http://localhost:8000/pipelines/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes, edges })
            });
            const parseData = await parseResponse.json();
            
            // Show the required alert/toast with DAG statistics
            showToast(
                'Pipeline Parsed Successfully',
                `Nodes: ${parseData.num_nodes} | Edges: ${parseData.num_edges} | DAG: ${parseData.is_dag ? 'Yes' : 'No'}`
            );

            if (!parseData.is_dag) {
                showToast('Execution Blocked', 'Cannot execute because the pipeline contains cycles (Not a DAG).', true);
                return;
            }

            // ---------------------------------------------------------
            // EXTENDED FEATURE: The Visual Execution Engine
            // If the graph is a valid DAG, we hit the execution endpoint.
            // ---------------------------------------------------------
            const executeResponse = await fetch('http://localhost:8000/pipelines/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes, edges })
            });

            const executeData = await executeResponse.json();
            
            if (!executeResponse.ok) {
                showToast('Execution Error', executeData.detail || 'Pipeline contains errors.', true);
                return;
            }

            // ---------------------------------------------------------
            // Orchestrate the Visual Animation
            // We step through the chronological `log` returned by the backend
            // and light up the React Flow nodes sequentially.
            // ---------------------------------------------------------
            const log = executeData.log || [];
            let i = 0;
            
            const animateNextNode = () => {
                if (i >= log.length) {
                    showToast('Execution Complete', 'Pipeline finished successfully.');
                    return;
                }
                
                const step = log[i];
                
                if (step.status === 'skipped') {
                    updateNodeField(step.node, 'status', 'skipped');
                    updateNodeField(step.node, 'result', 'Branch Skipped');
                    
                    setTimeout(() => {
                        i++;
                        animateNextNode();
                    }, 400); // Faster skip animation
                    return;
                }

                // Mark the node as running (pulsing blue)
                updateNodeField(step.node, 'status', 'running');
                
                // Simulate processing time visually
                setTimeout(() => {
                    // Mark as success and set output (green)
                    updateNodeField(step.node, 'status', 'success');
                    updateNodeField(step.node, 'result', step.output);
                    
                    i++;
                    animateNextNode();
                }, 800); // 800ms animation delay per node
            };
            
            animateNextNode();

        } catch (error) {
            console.error('Error executing pipeline:', error);
            showToast('Connection Error', 'Failed to connect to the FastAPI backend.', true);
        }
    };

    const handleLoadCreatorTemplate = () => {
        const templateNodes = [
            { id: 'customInput-creator', type: 'customInput', position: { x: 50, y: 150 }, data: { id: 'customInput-creator', nodeType: 'customInput', inputName: "Rough Idea", inputType: "Text", inputValue: "A 30-second short about how AI is changing the world" } },
            { id: 'text-creator', type: 'text', position: { x: 350, y: 150 }, data: { id: 'text-creator', nodeType: 'text', text: "You are an expert YouTube script writer. Turn this rough idea into a short 30-second script for a video:\n\nIdea: {{idea}}" } },
            { id: 'llm-creator', type: 'llm', position: { x: 650, y: 150 }, data: { id: 'llm-creator', nodeType: 'llm', model: "gpt-4o" } },
            { id: 'speech-creator', type: 'speech', position: { x: 950, y: 150 }, data: { id: 'speech-creator', nodeType: 'speech', voice: "alloy" } },
            { id: 'customOutput-creator', type: 'customOutput', position: { x: 1250, y: 150 }, data: { id: 'customOutput-creator', nodeType: 'customOutput', outputName: "Final Result", outputType: "Text" } }
        ];

        const templateEdges = [
            { id: 'edge-1', source: 'customInput-creator', sourceHandle: 'customInput-creator-value', target: 'text-creator', targetHandle: 'text-creator-idea', type: 'smoothstep', animated: true, markerEnd: {type: 'arrow', height: '20px', width: '20px'} },
            { id: 'edge-2', source: 'text-creator', sourceHandle: 'text-creator-output', target: 'llm-creator', targetHandle: 'llm-creator-prompt', type: 'smoothstep', animated: true, markerEnd: {type: 'arrow', height: '20px', width: '20px'} },
            { id: 'edge-3', source: 'llm-creator', sourceHandle: 'llm-creator-response', target: 'speech-creator', targetHandle: 'speech-creator-text', type: 'smoothstep', animated: true, markerEnd: {type: 'arrow', height: '20px', width: '20px'} },
            { id: 'edge-4', source: 'speech-creator', sourceHandle: 'speech-creator-audio', target: 'customOutput-creator', targetHandle: 'customOutput-creator-value', type: 'smoothstep', animated: true, markerEnd: {type: 'arrow', height: '20px', width: '20px'} }
        ];

        const templateNodeIDs = {
            customInput: 1,
            text: 1,
            llm: 1,
            speech: 1,
            customOutput: 1
        };

        if (window.confirm("This will replace your current workspace. Do you want to load the Creator Template?")) {
            setPipeline(templateNodes, templateEdges, templateNodeIDs);
            showToast('Template Loaded', 'Rough Idea to Script to Voice template is ready.');
        }
    };

    return (
        <>
            <div className="submit-container" style={{ display: 'flex', gap: '12px' }}>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept=".json" 
                    onChange={handleFileChange} 
                />
                
                <button type="button" className="submit-btn secondary" onClick={handleLoadCreatorTemplate} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', border: 'none', color: '#fff' }}>
                    Creator Template
                </button>
                <button type="button" className="submit-btn secondary" onClick={handleExport} style={{ background: 'transparent', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                    Export
                </button>
                <button type="button" className="submit-btn secondary" onClick={handleImportClick} style={{ background: 'transparent', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                    Import
                </button>
                <button type="button" className="submit-btn secondary" onClick={handleClear} style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>
                    Clear
                </button>
                <button type="button" className="submit-btn" onClick={handleSubmit}>
                    Run Pipeline
                </button>
            </div>

            {toast && (
                <div className="toast-overlay" style={{ borderLeftColor: toast.isError ? '#ef4444' : 'var(--accent)' }}>
                    <button className="toast-close" onClick={() => setToast(null)}>×</button>
                    <div className="toast-title">{toast.title}</div>
                    <div className="toast-content">{toast.message}</div>
                </div>
            )}
        </>
    );
};
