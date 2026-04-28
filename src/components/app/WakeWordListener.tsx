"use client";

import { useEffect, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

// Match "hey joshy" and common mishears. We're permissive on purpose —
// recognition will mangle "joshy" into things like "joshie", "josie", etc.
const WAKE_REGEX = /\b(hey|hi|ok|okay|yo)\s+(joshy|joshie|josh|josie|joshi|jose)\b/i;

export default function WakeWordListener({
  enabled,
  paused,
  onWake,
  onError,
}: {
  enabled: boolean;
  // When true, the listener stops (e.g. while the modal mic is in use).
  paused: boolean;
  // Receives whatever the user said AFTER "hey joshy" in the same utterance
  // (empty string if they said only the wake phrase).
  onWake: (tail: string) => void;
  onError?: (msg: string) => void;
}) {
  const recognitionRef = useRef<AnyRecognition>(null);
  const shouldListenRef = useRef(false);
  const lastWakeRef = useRef(0);

  // ── Build the recognizer once ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Ctor) {
      onError?.("Speech recognition not supported in this browser");
      return;
    }

    const rec: AnyRecognition = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: AnyRecognition) => {
      // Only act on FINAL results so we capture everything the user said
      // in the same utterance (e.g. "hey joshy pink's bandage needs changing").
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;
        const transcript = String(result[0].transcript || "");
        const match = WAKE_REGEX.exec(transcript);
        if (!match) continue;

        // Debounce: ignore repeated wake hits within 800ms. (Was 2s, but
        // staff hitting Joshy with rapid back-to-back commands were having
        // the second one dropped. 800ms still suppresses recognition echoes
        // while letting an intentional second wake through.)
        const now = Date.now();
        if (now - lastWakeRef.current < 800) return;
        lastWakeRef.current = now;

        // Slice off the wake phrase and any leading punctuation/whitespace.
        const tailStart = match.index + match[0].length;
        const tail = transcript.slice(tailStart).replace(/^[\s,.;:!?-]+/, "").trim();

        shouldListenRef.current = false;
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
        onWake(tail);
        return;
      }
    };

    rec.onend = () => {
      // Browsers (especially Chrome) stop continuous recognition after pauses.
      // Auto-restart if we're still supposed to be listening.
      if (shouldListenRef.current) {
        try {
          rec.start();
        } catch {
          /* ignore "already started" */
        }
      }
    };

    rec.onerror = (e: AnyRecognition) => {
      const err = String(e?.error || "");
      if (err === "not-allowed" || err === "service-not-allowed") {
        shouldListenRef.current = false;
        onError?.("Microphone permission denied. Enable it in your browser settings.");
      }
      // "no-speech" / "aborted" / "audio-capture" → let onend handle restart.
    };

    recognitionRef.current = rec;
    return () => {
      shouldListenRef.current = false;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, [onError, onWake]);

  // ── Start/stop based on enabled + paused ──
  // When transitioning from paused → unpaused (i.e. the modal just closed),
  // Chrome's speech recognition may still be in a pending "stopping" state
  // from the previous start(). Calling start() in that window throws an
  // InvalidStateError. We retry with a short backoff so the wake listener
  // reliably comes back online after a Joshy command — without this, two
  // back-to-back "Hey Joshy" utterances often saw the second one dropped.
  useEffect(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    const shouldRun = enabled && !paused;
    shouldListenRef.current = shouldRun;
    if (shouldRun) {
      const tryStart = (attempts = 0) => {
        try {
          rec.start();
        } catch {
          // "InvalidStateError: recognition is already started/stopping" —
          // back off briefly and retry, up to ~2 seconds total.
          if (attempts < 8 && shouldListenRef.current) {
            setTimeout(() => tryStart(attempts + 1), 250);
          }
        }
      };
      tryStart();
    } else {
      try {
        rec.stop();
      } catch {
        /* not running */
      }
    }
  }, [enabled, paused]);

  return null;
}
