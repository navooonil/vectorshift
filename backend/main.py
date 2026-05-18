import os
import asyncio
import re
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import openai
import google.generativeai as genai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static/audio", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get('/')
def read_root():
    return {'Ping': 'Pong'}

def get_topological_sort(nodes, edges):
    """
    Helper to validate if the graph is a Directed Acyclic Graph (DAG) 
    and return the execution order using Kahn's Algorithm.
    
    Why Kahn's Algorithm?
    It's an optimal O(V+E) approach to detect cycles in a workflow pipeline.
    If a cycle exists (e.g. Node A -> Node B -> Node A), the pipeline cannot execute.
    """
    adj = {node['id']: [] for node in nodes}
    in_degree = {node['id']: 0 for node in nodes}
    
    for edge in edges:
        source = edge.get('source')
        target = edge.get('target')
        if source in adj and target in adj:
            adj[source].append(target)
            in_degree[target] += 1
            
    queue = [n for n in in_degree if in_degree[n] == 0]
    execution_order = []
    
    while queue:
        node = queue.pop(0)
        execution_order.append(node)
        for neighbor in adj.get(node, []):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
                
    is_dag = len(execution_order) == len(nodes)
    return is_dag, execution_order

@app.post('/pipelines/parse')
async def parse_pipeline(request: Request):
    data = await request.json()
    nodes = data.get('nodes', [])
    edges = data.get('edges', [])
    
    is_dag, _ = get_topological_sort(nodes, edges)
    
    return {'num_nodes': len(nodes), 'num_edges': len(edges), 'is_dag': is_dag}

@app.post('/pipelines/execute')
async def execute_pipeline(request: Request):
    """
    Production-grade execution orchestrator.
    Traverses the graph in topological order, passing state between nodes.
    """
    data = await request.json()
    nodes = {n['id']: n for n in data.get('nodes', [])}
    edges = data.get('edges', [])
    
    is_dag, execution_order = get_topological_sort(list(nodes.values()), edges)
    
    if not is_dag:
        raise HTTPException(status_code=400, detail="Cannot execute: Pipeline contains cycles (not a DAG).")
    
    # The global state dictionary passing data between nodes (Node ID -> Result String)
    context = {}
    # Stores the chronological step-by-step trace of the execution
    execution_log = []
    
    # Tracks nodes that shouldn't execute because their parent failed or branched away
    skipped_nodes = set()
    active_handles = {}  # Tracks {node_id: active_source_handle_name}
    
    for node_id in execution_order:
        node = nodes[node_id]
        node_type = node.get('type')
        node_data = node.get('data', {})
        
        # --- Skip Logic ---
        skip_node = False
        for edge in edges:
            if edge.get('target') == node_id:
                source_id = edge.get('source')
                source_handle = edge.get('sourceHandle')
                
                # If dependency was entirely skipped
                if source_id in skipped_nodes:
                    skip_node = True
                    break
                    
                # If dependency is conditional, and edge is connected to a non-active branch
                if source_id in active_handles:
                    if active_handles[source_id] != source_handle:
                        skip_node = True
                        break
                        
        if skip_node:
            skipped_nodes.add(node_id)
            execution_log.append({"node": node_id, "type": node_type, "output": "SKIPPED", "status": "skipped"})
            continue
            
        result = None
        
        # 1. Input Node: Starts the chain with a default value
        if node_type == 'customInput':
            input_val = node_data.get('inputValue')
            input_name = node_data.get('inputName', 'default_input')
            result = input_val if input_val else f"Data from {input_name}"
            
        # 2. Text Node / Prompt Template: Interpolates {{variables}} from upstream edges
        elif node_type == 'text':
            text_content = node_data.get('text', '')
            
            # Find all {{vars}} and replace them with values from the exact connected edge
            def replace_var(match):
                var_name = match.group(1)
                # Look for an edge that targets this node, specifically targeting the handle `{node_id}-{var_name}`
                for edge in edges:
                    if edge.get('target') == node_id and edge.get('targetHandle') == f"{node_id}-{var_name}":
                        source_id = edge.get('source')
                        return str(context.get(source_id, ""))
                return f"[{var_name}]"
                
            result = re.sub(r'{{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*}}', replace_var, text_content)
            
        # 3. LLM Node: Securely makes API calls to OpenAI or Google
        # This handles the core AI functionality of the workflow
        elif node_type == 'llm':
            model = node_data.get('model', 'gpt-4o')
            system_prompt = "You are a helpful AI assistant."
            user_prompt = "No prompt provided."
            
            # Resolve system and prompt inputs from edges
            for edge in edges:
                if edge.get('target') == node_id:
                    handle = edge.get('targetHandle')
                    source_id = edge.get('source')
                    if handle == f"{node_id}-system":
                        system_prompt = context.get(source_id, system_prompt)
                    elif handle == f"{node_id}-prompt":
                        user_prompt = context.get(source_id, user_prompt)
            
            try:
                if model == 'gpt-4' or model == 'gpt-4o':
                    api_key = os.getenv('OPENAI_API_KEY')
                    if not api_key:
                        result = "Error: OPENAI_API_KEY environment variable not found. Please set it in your backend terminal or .env file."
                    else:
                        client = openai.AsyncOpenAI(api_key=api_key)
                        resp = await client.chat.completions.create(
                            model=model,
                            messages=[
                                {"role": "system", "content": str(system_prompt)},
                                {"role": "user", "content": str(user_prompt)}
                            ]
                        )
                        result = f"🧠 {model.upper()} Response:\n\n{resp.choices[0].message.content}"
                        
                elif model == 'gemini-1.5-flash':
                    api_key = os.getenv('GEMINI_API_KEY')
                    if not api_key:
                        result = "Error: GEMINI_API_KEY environment variable not found. Please set it in your backend terminal or .env file."
                    else:
                        genai.configure(api_key=api_key)
                        genai_model = genai.GenerativeModel('gemini-1.5-flash')
                        full_prompt = f"System Instructions: {system_prompt}\n\nUser: {user_prompt}"
                        
                        # Use asyncio.to_thread since the old genai SDK might be sync
                        resp = await asyncio.to_thread(genai_model.generate_content, full_prompt)
                        result = f"✨ Gemini Response:\n\n{resp.text}"
                        
                else:
                    # Mock execution
                    await asyncio.sleep(1.5) 
                    result = f"🤖 Simulated Output:\n\nReceived System Context:\n\"{str(system_prompt)[:50]}...\"\n\nReceived User Prompt:\n\"{str(user_prompt)[:50]}...\"\n\nThis is a mock response because 'Mock Model' was selected."
            except Exception as e:
                result = f"LLM Error:\n{str(e)}"
            
        # 4. Output Node: Final terminal node
        elif node_type == 'customOutput':
            # Resolve incoming edge
            output_data = "No data connected."
            for edge in edges:
                if edge.get('target') == node_id and edge.get('targetHandle') == f"{node_id}-value":
                    source_id = edge.get('source')
                    output_data = context.get(source_id, output_data)
            
            result = f"Final Pipeline Output:\n{output_data}"
            
        # 5. Condition Node: Branching logic
        elif node_type == 'condition':
            operator = node_data.get('operator', 'contains')
            value_to_check = node_data.get('value', '').lower()
            
            # Resolve input
            input_val = ""
            for edge in edges:
                if edge.get('target') == node_id and edge.get('targetHandle') == f"{node_id}-input":
                    source_id = edge.get('source')
                    input_val = str(context.get(source_id, "")).lower()
            
            condition_met = False
            if operator == 'contains':
                condition_met = value_to_check in input_val
            elif operator == 'equals':
                condition_met = value_to_check == input_val
            elif operator == 'not_contains':
                condition_met = value_to_check not in input_val
                
            active_branch = f"{node_id}-true" if condition_met else f"{node_id}-false"
            active_handles[node_id] = active_branch
            
            result = f"Evaluated: {condition_met}\nBranch Taken: {active_branch.split('-')[-1].upper()}"
            
        # 6. API Node: Makes actual async network requests
        # Allows the AI workflow to interface with external internet resources
        elif node_type == 'api':
            method = node_data.get('method', 'GET').upper()
            url = node_data.get('url', '')
            
            if not url:
                result = "Error: No URL provided."
            else:
                try:
                    # Using httpx.AsyncClient to prevent blocking the FastAPI event loop
                    async with httpx.AsyncClient() as client:
                        # Attempt to resolve any incoming payload from the input edge
                        payload = None
                        for edge in edges:
                            if edge.get('target') == node_id and edge.get('targetHandle') == f"{node_id}-trigger":
                                source_id = edge.get('source')
                                payload = context.get(source_id)
                        
                        kwargs = {}
                        if payload and method in ['POST', 'PUT']:
                            # If payload is a dict/json string, we send it as json. Else as text.
                            kwargs['content'] = str(payload)
                        
                        req = client.build_request(method, url, **kwargs)
                        resp = await client.send(req, timeout=10.0)
                        
                        # Format the actual real response
                        resp_text = resp.text[:500] + ('...' if len(resp.text) > 500 else '')
                        result = f"[{method}] {url}\nStatus: {resp.status_code}\nResponse:\n{resp_text}"
                except Exception as e:
                    result = f"[{method}] {url}\nError: {str(e)}"
                
        # 7. Timer Node
        elif node_type == 'timer':
            delay = float(node_data.get('delay', 1.0))
            await asyncio.sleep(delay)
            result = f"Timer complete. Waited {delay} seconds."
            
        # 8. Webhook Node
        elif node_type == 'webhook':
            route = node_data.get('route', '/webhook')
            result = f"Listening on {route}...\nTrigger received!"
            
        # 9. Transform Node
        elif node_type == 'transform':
            code = node_data.get('code', 'return input.toUpperCase();')
            
            input_val = ""
            for edge in edges:
                if edge.get('target') == node_id and edge.get('targetHandle') == f"{node_id}-input":
                    source_id = edge.get('source')
                    input_val = str(context.get(source_id, ""))
                    
            # Safe mock execution of the JS code
            if 'toUpperCase()' in code:
                result = input_val.upper()
            elif 'toLowerCase()' in code:
                result = input_val.lower()
            else:
                result = f"JS Transformed:\n{input_val}"

        # 10. Speech Node (Text-to-Speech)
        elif node_type == 'speech':
            voice = node_data.get('voice', 'alloy')
            text_to_speak = "No text provided."
            
            for edge in edges:
                if edge.get('target') == node_id:
                    handle = edge.get('targetHandle')
                    source_id = edge.get('source')
                    if handle == f"{node_id}-text":
                        text_to_speak = context.get(source_id, text_to_speak)
            
            try:
                api_key = os.getenv('OPENAI_API_KEY')
                if not api_key:
                    result = f"🔊 [MOCK VOICE: {voice.upper()}]\n\"{text_to_speak[:100]}...\"\n\n(Connect OpenAI API Key for real audio generation)"
                else:
                    client = openai.AsyncOpenAI(api_key=api_key)
                    # Clean filename to avoid issues
                    filename = f"audio_{node_id}.mp3"
                    filepath = os.path.join("static", "audio", filename)
                    
                    response = await client.audio.speech.create(
                        model="tts-1",
                        voice=voice,
                        input=text_to_speak
                    )
                    
                    await asyncio.to_thread(response.write_to_file, filepath)
                    result = f"AUDIO_URL:http://localhost:8000/static/audio/{filename}"
            except Exception as e:
                result = f"Speech Generation Error: {str(e)}"
            
        # Store result in context for downstream nodes
        context[node_id] = result
        execution_log.append({"node": node_id, "type": node_type, "output": result, "status": "success"})
        
    return {
        "status": "success",
        "log": execution_log,
        "final_context": context
    }
