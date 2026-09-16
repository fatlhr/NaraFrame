import { createHash } from "node:crypto";
import type {
  TtsPhrase,
  TtsProvider,
  TtsSynthesisRequest,
} from "./tts-provider.js";

const CURRENCY = "IDR";
// Illustrative placeholder pricing/pacing, not a real vendor's rate card.
const RATE_PER_CHARACTER = 15;
const MIN_PHRASE_DURATION_MS = 400;
const MS_PER_CHARACTER = 60;

const splitPhrases = (text: string): string[] =>
  text
    .split(/(?<=[.!?,])\s+/u)
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length > 0);

const phraseTimings = (phrases: string[]): TtsPhrase[] => {
  let cursor = 0;
  return phrases.map((phrase) => {
    const durationMs = Math.max(
      MIN_PHRASE_DURATION_MS,
      Math.round(phrase.length * MS_PER_CHARACTER),
    );
    const timed: TtsPhrase = { text: phrase, startMs: cursor, durationMs };
    cursor += durationMs;
    return timed;
  });
};

const estimateFor = (request: TtsSynthesisRequest) => ({
  amount: Math.round(request.text.length * RATE_PER_CHARACTER),
  currency: CURRENCY,
});

/**
 * Deterministic, offline stand-in for a real Indonesian TTS vendor. Proves
 * the phrase-timing recipe and the ledger's request/settle cycle without
 * adding a provider SDK or key to core.
 */
export const createFakeTtsProvider = (): TtsProvider => ({
  id: "fake",
  estimate: estimateFor,
  synthesize: (request) => {
    const phrases = phraseTimings(splitPhrases(request.text));
    const durationMs = phrases.reduce(
      (sum, phrase) => sum + phrase.durationMs,
      0,
    );
    const audioSha256 = createHash("sha256")
      .update(`${request.voiceId}:${request.languageCode}:${request.text}`)
      .digest("hex");

    return Promise.resolve({
      audioSha256,
      durationMs,
      phrases,
      cost: estimateFor(request),
    });
  },
});
