import { create } from 'zustand';

/**
 * Dev-only gameplay clip recorder (for trailers/ads in the promo project).
 *
 * `arm()` asks once for permission to capture this tab; after that clips can be recorded
 * repeatedly without new prompts until the capture is stopped. In `npm run dev` finished clips
 * are POSTed to the Vite dev server, which saves them to `recordings/`; otherwise (or if that
 * fails) they are downloaded by the browser.
 */

interface RecorderState {
  armed: boolean;
  recording: boolean;
  startedAt: number;
  lastSaved: string | null;
  error: string | null;
}

export const useClipRecorder = create<RecorderState>(() => ({
  armed: false,
  recording: false,
  startedAt: 0,
  lastSaved: null,
  error: null,
}));

let stream: MediaStream | null = null;
let recorder: MediaRecorder | null = null;
let autoStop: ReturnType<typeof setTimeout> | null = null;
let originalTitle = '';

const MIME = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(
  (m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m),
);

export async function armClipRecorder() {
  if (stream) return;
  try {
    // preferCurrentTab / selfBrowserSurface make Chrome offer "this tab" directly.
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 60 }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'exclude',
    } as DisplayMediaStreamOptions);
    stream.getVideoTracks()[0]?.addEventListener('ended', disarmClipRecorder);
    useClipRecorder.setState({ armed: true, error: null });
  } catch (e) {
    stream = null;
    useClipRecorder.setState({ armed: false, error: e instanceof Error ? e.message : String(e) });
  }
}

export function disarmClipRecorder() {
  if (recorder?.state === 'recording') recorder.stop();
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  useClipRecorder.setState({ armed: false, recording: false });
}

/** Starts a clip; stops automatically after `seconds` if given, otherwise on `stopClip()`. */
export function startClip(seconds?: number) {
  if (!stream || recorder?.state === 'recording') return;
  const chunks: Blob[] = [];
  recorder = new MediaRecorder(stream, { mimeType: MIME, videoBitsPerSecond: 16_000_000 });
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = () => {
    if (autoStop) clearTimeout(autoStop);
    document.title = originalTitle;
    useClipRecorder.setState({ recording: false });
    void saveClip(new Blob(chunks, { type: 'video/webm' }));
  };
  recorder.start(250);
  originalTitle = document.title;
  document.title = '● REC – ' + originalTitle; // shows in the tab strip, not in the capture
  useClipRecorder.setState({ recording: true, startedAt: Date.now(), error: null });
  if (seconds) autoStop = setTimeout(stopClip, seconds * 1000);
}

export function stopClip() {
  if (recorder?.state === 'recording') recorder.stop();
}

export function toggleClip() {
  if (useClipRecorder.getState().recording) stopClip();
  else startClip();
}

async function saveClip(blob: Blob) {
  const hash = window.location.hash.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'game';
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const name = `${stamp}_${hash}.webm`;
  try {
    const res = await fetch(`/__debug/save-clip?name=${encodeURIComponent(name)}`, {
      method: 'POST',
      body: blob,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    useClipRecorder.setState({ lastSaved: `recordings/${name}` });
  } catch {
    // Not running under the Vite dev server – fall back to a browser download.
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    useClipRecorder.setState({ lastSaved: `Downloads/${name}` });
  }
}
