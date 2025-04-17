'use client';

import { useDataChannel } from '@livekit/components-react';
import { useState } from 'react';
import Card from '@/components/Card';
import { useDocumentStore } from '@/store/documentStore';

interface ToolInvocation {
  id: string;
  function: {
    name: string;
    arguments: Record<string, any>;
  };
  timestamp: number;
}

export function ToolHandler() {
  const [toolInvocations, setToolInvocations] = useState<ToolInvocation[]>([]);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const { content, setContent } = useDocumentStore();

  // This is the correct way to use useDataChannel in LiveKit
  // It takes a callback function that receives data channel messages
  const dataChannel = useDataChannel((e) => {
    try {
      // Decode the binary data to a string
      const decoder = new TextDecoder();
      const stringData = decoder.decode(e.payload);
      const data = JSON.parse(stringData);

      // Check if this is a tool invocation
      if (data.message === 'ToolInvoke') {
        console.log('Tool invoked:', data);

        // Add the tool invocation to our list with a timestamp
        setToolInvocations((prev) => [
          ...prev,
          {
            ...data,
            timestamp: Date.now(),
          },
        ]);

        // Handle tools
        if (data.function.name === 'get_weather') {
          const { location } = data.function.arguments || {};

          // Simulate a weather response
          const weatherContent = `The weather in ${location || 'your location'} is currently sunny and 72°F.`;

          // Set the last response for display
          setLastResponse(`Responded with weather for ${location || 'your location'}`);

          // Send the response back to the Flow API
          setTimeout(() => {
            const response = {
              message: 'ToolResult',
              id: data.id,
              status: 'ok',
              content: weatherContent,
            };

            if (dataChannel) {
              // Convert the JSON string to a Uint8Array before sending
              const encoder = new TextEncoder();
              const jsonString = JSON.stringify(response);
              const data = encoder.encode(jsonString);
              dataChannel.send(data, {});
              console.log('Sent tool response:', response);
            }
          }, 500); // Small delay to simulate API call
        }
        // Handle replace_document_content tool
        else if (data.function.name === 'replace_document_content') {
          const { content } = data.function.arguments || {};

          // Update the document content in the store
          if (content !== undefined) {
            setContent(content);

            // Asynchronously send the content to the API endpoint for logging
            // This won't block the UI since we're not awaiting the response
            fetch('/api/log-document', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ content }),
            }).catch(error => {
              // Just log any errors to the console, don't block the UI
              console.error('Error sending document content to API:', error);
            });
          }

          // Set the last response for display
          setLastResponse(`Document content updated`);

          // Send the response back to the Flow API
          setTimeout(() => {
            const response = {
              message: 'ToolResult',
              id: data.id,
              status: 'ok',
              content: 'Document content has been updated successfully.',
            };

            if (dataChannel) {
              // Convert the JSON string to a Uint8Array before sending
              const encoder = new TextEncoder();
              const jsonString = JSON.stringify(response);
              const data = encoder.encode(jsonString);
              dataChannel.send(data, {});
              console.log('Sent tool response:', response);
            }
          }, 500); // Small delay to simulate API call
        }
        // Handle view_document_content tool
        else if (data.function.name === 'view_document_content') {
          // Get the current document content from the store
          const documentContent = content || 'The document is currently empty.';

          // Set the last response for display
          setLastResponse(`Retrieved document content`);

          // Send the response back to the Flow API
          setTimeout(() => {
            const response = {
              message: 'ToolResult',
              id: data.id,
              status: 'ok',
              content: documentContent,
            };

            if (dataChannel) {
              // Convert the JSON string to a Uint8Array before sending
              const encoder = new TextEncoder();
              const jsonString = JSON.stringify(response);
              const data = encoder.encode(jsonString);
              dataChannel.send(data, {});
              console.log('Sent tool response:', response);
            }
          }, 500); // Small delay to simulate API call
        }
      }
    } catch (error) {
      console.error('Error handling data channel message:', error);
    }
  });

  // Only show if we have tool invocations
  if (toolInvocations.length === 0) {
    return (
      <Card>
        <h2 className="text-lg font-bold mb-2">Tool Invocations</h2>
        <p className="text-gray-500">No tools have been invoked yet. Try asking about the weather!</p>
      </Card>
    );
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
