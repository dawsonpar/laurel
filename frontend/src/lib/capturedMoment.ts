export interface CapturedMoment {
  /** 1-3 JPEG frames in chronological order. Sent to Gemini Vision. */
  frames: Blob[];
  /** Optional WebM clip for playback. Null when MediaRecorder is unavailable. */
  clip: Blob | null;
  /** Mime type of the clip, when present. */
  clipMime: string | null;
}
