'use client';
import { useFlow, useFlowEventListener } from '@speechmatics/flow-client-react';
import { useCallback, useState, useEffect } from 'react';
import Card from '@/components/Card';

interface ToolInvocation {
  id: string;
  function: {
    name: string;
    arguments: Record<string, any>;
  };
  timestamp: number;
}

export function ToolHandler() {
  const { socketState, sendToolResult } = useFlow();
  const [toolInvocations, setToolInvocations] = useState<ToolInvocation[]>([]);
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  const handleToolInvoke = useCallback(
    (event: any) => {
      const toolInvoke = event.detail;
      console.log('Tool invoked:', toolInvoke);

      // Add the tool invocation to our list with a timestamp
      setToolInvocations((prev) => [
        ...prev,
        {
          ...toolInvoke,
          timestamp: Date.now(),
        },
      ]);

      // Handle the weather tool
      if (toolInvoke.function.name === 'get_weather') {
        const { location } = toolInvoke.function.arguments || {};

        // Simulate a weather response
        const weatherContent = `The weather in ${location || 'your location'} is currently sunny and 72°F.`;

        // Set the last response for display
        setLastResponse(`Responded with weather for ${location || 'your location'}`);

        // Send the response back to the Flow API
        setTimeout(() => {
          sendToolResult({
            id: toolInvoke.id,
            status: 'ok',
            content: weatherContent,
          });
        }, 500); // Small delay to simulate API call
      }
    },
    [sendToolResult]
  );

  // Listen for tool invocations
  useFlowEventListener('toolInvoke', handleToolInvoke);

  // Only show the component if the socket is open
  if (socketState !== 'open') {
    return null;
  }

  return (
    <Card>
      <h2 className="text-lg font-bold mb-2">Tool Invocations</h2>
      {toolInvocations.length === 0 ? (
        <p className="text-gray-500">No tools have been invoked yet. Try asking about the weather!</p>
      ) : (
        <div className="space-y-2">
          {toolInvocations.map((invocation, index) => (
            <div key={index} className="p-2 bg-gray-100 rounded">
              <p className="font-medium">
                Function: {invocation.function.name}
              </p>
              <p className="text-sm">
                Arguments: {JSON.stringify(invocation.function.arguments)}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(invocation.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))}
          {lastResponse && (
            <div className="mt-4 p-2 bg-green-100 rounded">
              <p className="font-medium">Last Response:</p>
              <p>{lastResponse}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
