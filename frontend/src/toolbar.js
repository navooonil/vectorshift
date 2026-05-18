import { DraggableNode } from './draggableNode';

export const PipelineToolbar = () => {
    return (
        <div className="toolbar-container">
            <div className="toolbar-title">AI Workflow Builder</div>
            <DraggableNode type='customInput' label='Input' />
            <DraggableNode type='text' label='Text' />
            <DraggableNode type='llm' label='LLM' />
            <DraggableNode type='api' label='API' />
            <DraggableNode type='timer' label='Timer' />
            <DraggableNode type='condition' label='Condition' />
            <DraggableNode type='transform' label='Transform' />
            <DraggableNode type='webhook' label='Webhook' />
            <DraggableNode type='speech' label='Speech' />
            <DraggableNode type='customOutput' label='Output' />
        </div>
    );
};
