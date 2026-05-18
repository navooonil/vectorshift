// store.js

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
  } from 'reactflow';

/**
 * useStore Hook
 * 
 * Central State Orchestrator built using Zustand (Part 2 and Part 3 requirements).
 * It persists the entire flow structure (nodes, connections, and metadata) to
 * localStorage so that refreshes or updates never result in data loss.
 *
 * Core State Structure:
 * - `nodes`: Array representing active elements on the screen.
 * - `edges`: Array containing connection ports linking elements.
 * - `nodeIDs`: Map tracker to calculate incremental numeric suffixes for newly initialized nodes.
 */
export const useStore = create(
  persist(
    (set, get) => ({
    nodes: [],
    edges: [],
    nodeIDs: {},
    
    // Generates a unique, incremental ID for a given node type (e.g. llm-1, llm-2, api-1)
    getNodeID: (type) => {
        const newIDs = {...get().nodeIDs};
        if (newIDs[type] === undefined) {
            newIDs[type] = 0;
        }
        newIDs[type] += 1;
        set({nodeIDs: newIDs});
        return `${type}-${newIDs[type]}`;
    },
    
    // Appends a new node payload onto the existing node list
    addNode: (node) => {
        set({
            nodes: [...get().nodes, node]
        });
    },
    
    // Standard React Flow callback invoked during user drags, movements, and select actions
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    
    // Standard React Flow callback triggered when connections are modified
    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    
    // Links two separate handles with a stylized smoothstep path arrow animation
    onConnect: (connection) => {
      set({
        edges: addEdge(
          {
            ...connection, 
            type: 'smoothstep', 
            animated: true, 
            markerEnd: {type: MarkerType.Arrow, height: '20px', width: '20px'}
          }, 
          get().edges
        ),
      });
    },
    
    // Dynamically updates values of specific nested fields inside a specific Node's data dictionary
    updateNodeField: (nodeId, fieldName, fieldValue) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, [fieldName]: fieldValue } };
          }
          return node;
        }),
      });
    },
    
    // Replaces/resets the entire workflow configuration (used in templates, clearing, and importing JSONs)
    setPipeline: (nodes, edges, nodeIDs) => {
      set({
        nodes: nodes || [],
        edges: edges || [],
        nodeIDs: nodeIDs || {}
      });
    }
  }),
  {
    name: 'ai-workflow-storage', // Key used in localStorage to store serialized JSON strings of the state
  }
));

