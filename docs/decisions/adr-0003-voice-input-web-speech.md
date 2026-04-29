# ADR-0003: Voice input via Web Speech API

**Status:** Accepted
**Date:** 2026-04-28
**Deciders:** Dawson Par + agent

## Context

Demo Scenario B in the PRD asks the user to verbally ask "Is this a big deal? What was the previous record?" Voice input is a UX win on mobile but adds vendor risk if we use a paid STT service.

## Decision

Use the browser-native **Web Speech API** (`SpeechRecognition` interface) for speech-to-text. No backend involvement, no third-party vendor.

We do **not** add TTS (text-to-speech) for responses. Out of scope for the MVP.

## Rationale

- Free, supported in Chrome, Edge, and modern Safari (with `webkitSpeechRecognition` prefix on iOS).
- Zero new vendor relationships during a 2-week sprint.
- No backend audio handling required: text from the API is appended to the input field; user can edit before sending.
- AssemblyAI or Deepgram would give better accuracy but are not worth the integration cost for a demo.

## Rejected alternatives

- **AssemblyAI WebSocket streaming.** What clicky uses. Higher quality, but new vendor + auth + cost.
- **Whisper via OpenAI API.** Not in our stack and brings cross-vendor concerns.
- **Server-side STT through Google Cloud Speech-to-Text.** Adds latency (audio upload required) and another GCP service to provision.

## Consequences

- iOS Safari support is currently flaky in some versions. Voice is treated as **enhancement, not core**: text input is always available and is the default fallback.
- Demo filming will use a known-good device (recent iPhone or Android) to ensure the on-camera moment lands.
