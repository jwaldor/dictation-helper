"use server";

import { createSpeechmaticsJWT } from "@speechmatics/auth";

export type StartLivekitResponse =
  | {
      success: true;
      livekitURL: string;
      livekitToken: string;
      sessionID: string;
    }
  | { success: false; error: string };

export async function start(formData: FormData): Promise<StartLivekitResponse> {
  try {
    const template = formData.get("template")?.toString();
    if (!template) {
      throw new Error("Missing template");
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("Please set the API_KEY environment variable");
    }

    const jwt = await createSpeechmaticsJWT({
      type: "flow",
      apiKey,
    });

    const persona = formData.get("persona")?.toString();

    const response = await fetch(
      "https://flow.api.speechmatics.com/v1/flow/livekit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(startMesasage(template, persona)),
      }
    );

    if (response.status === 401) {
      throw new Error("Invalid JWT");
    }

    let json: Record<string, unknown>;

    try {
      json = await response.json();
    } catch (e) {
      throw new Error(
        `Failed to parse response with status ${response.status}`
      );
    }

    if (response.status !== 200) {
      throw new Error(`Got ${response.status} response: ${json.detail}`);
    }

    return {
      success: true as const,
      livekitURL: json.url as string,
      livekitToken: json.token as string,
      sessionID: json.session_id as string,
    };
  } catch (e) {
    console.error(e);
    return {
      success: false as const,
      error: "Failed to start LiveKit session",
    };
  }
}

const startMesasage = (template: string, persona?: string) => ({
  message: "StartConversation",
  conversation_config: {
    template_id: template,
    template_variables: {
      timezone: "America/New_York",
      persona,
      // You can add a system message here to control the agent's behavior
      // This overrides the default system message in the template
      context:
        "You are a kind and helpful AI assistant that helps the user with writing and editing a document.",
    },
  },
  // Enable debug mode to see the system prompt and LLM interactions
  debug: {
    llm: true,
  },
  // Add tools
  tools: [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get the current weather for a location",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city or location to get weather for",
            },
          },
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "replace_document_content",
        description:
          "Replace the content of the document. This replaces the existing content.",
        parameters: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The content to set in the document",
            },
          },
          required: ["content"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "view_document_content",
        description:
          "Enables you to view the content of the document that the user sees.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    },
  ],
});
