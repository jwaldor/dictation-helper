'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { start, type StartLivekitResponse } from '../actions';
import {
  ControlBar,
  LiveKitRoom,
  RoomAudioRenderer,
  useDataChannel,
} from '@livekit/components-react';
import '@livekit/components-styles';
import type { fetchPersonas } from '@speechmatics/flow-client-react';
import TranscriptManager from '@/lib/transcript-manager';
import type {
  TranscriptGroup,
  TranscriptUpdateEvent,
} from '@/lib/transcript-types';
import { TranscriptContainer } from '@/components/TranscriptView';
import { ToolHandler } from './ToolHandler';
import { Document } from '@/components/Document';

export function Room({
  personas,
}: {
  personas: Awaited<ReturnType<typeof fetchPersonas>>;
}) {
  const [state, formAction, pending] = useActionState<
    StartLivekitResponse | null,
    FormData
  >((_, formData: FormData) => start(formData), null);

  // Get the second persona in the list for default selection
  const personaEntries = Object.entries(personas);
  const defaultPersona = personaEntries.length > 1 ? personaEntries[1][0] : personaEntries[0]?.[0] || "";

  // Set up a timer to disconnect after 60 seconds
  useEffect(() => {
    // Only run the timer if we're connected to a room
    if (state?.success && state.livekitURL && state.livekitToken) {
      console.log('Starting 60-second timer for automatic disconnection');
      // Start a 60-second timer when the conversation begins
      const timer = setTimeout(() => {
        console.log('60-second timer expired, reloading page to disconnect');
        // Simply reload the page to disconnect
        window.location.reload();
      }, 3000000); // 3000 seconds

      // Clean up the timer if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [state]);

  if (!state || !state.success) {
    return (
      <form
        className="flex flex-col container m-auto gap-4 p-4"
        action={formAction}
      >
        <h1>Livekit example</h1>
        <select
          name="template"
          className="select select-bordered w-full max-w-x"
          required
          defaultValue={defaultPersona}
        >
          <option value="" disabled>
            Select a template
          </option>
          {personaEntries.map(([id, persona]) => (
            <option key={id} value={id} label={persona.name} />
          ))}
        </select>
        <textarea
          className="textarea textarea-bordered h-32"
          name="persona"
          placeholder="Describe your persona"
          maxLength={500}
        />
        <button className="btn btn-success btn-lg w-full" type="submit" aria-busy={pending}>
          {pending ? (
            <span className="loading loading-spinner" />
          ) : (
            'Begin Session'
          )}
        </button>
        {!!state?.error && (
          <div role="alert" className="alert alert-error">
            <span>{state.error}</span>
          </div>
        )}
      </form>
    );
  }

  const { livekitURL, livekitToken, sessionID } = state;

  return (
    <LiveKitRoom
      serverUrl={livekitURL}
      token={livekitToken}
      // Set audio to true to unmute the microphone by default
      audio={true}
      onConnected={() => {
        console.log('Connected to room, starting 60-second timer');
      }}
      onDisconnected={() => {
        // TODO find a better way to reset
        window.location.reload();
      }}
      className="flex flex-col h-full"
    >
      <Transcript sessionId={sessionID} />
      <DocumentWithTranscript />
      <div className="my-6">
        <ToolHandler />
      </div>
      <RoomAudioRenderer />
      <ControlBar controls={{ camera: false, screenShare: false }} />
    </LiveKitRoom>
  );
}

function Transcript({ sessionId }: { sessionId: string }) {
  const transcriptGroups = useTranscript(sessionId);

  return <TranscriptContainer transcripts={transcriptGroups} />;
}

function DocumentWithTranscript() {
  return (
    <div className="my-6">
      <Document />
    </div>
  );
}

function useTranscript(sessionId: string) {
  const decoder = useMemo(() => new TextDecoder(), []);
  const transcriptManager = useMemo(() => new TranscriptManager(), []);

  useDataChannel((e) => {
    const stringData = decoder.decode(e.payload);
    const data = JSON.parse(stringData);
    transcriptManager.handleMessage(data);
  });

  const [transcriptGroups, setTranscriptGroups] = useState<TranscriptGroup[]>(
    [],
  );

  // Clear transcripts when session changes
  useEffect(() => {
    if (sessionId) {
      transcriptManager.clearTranscripts();
    }
  }, [sessionId, transcriptManager]);

  useEffect(() => {
    const handleUpdate = (event: TranscriptUpdateEvent) => {
      setTranscriptGroups(event.transcriptGroups);
    };

    transcriptManager.addEventListener('update', handleUpdate);
    return () => {
      transcriptManager.removeEventListener('update', handleUpdate);
    };
  }, [transcriptManager]);

  return transcriptGroups;
}
