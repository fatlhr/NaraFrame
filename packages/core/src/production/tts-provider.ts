import type { Money } from "../schema/production.js";

export interface TtsSynthesisRequest {
  text: string;
  languageCode: string;
  voiceId: string;
}

export interface TtsPhrase {
  text: string;
  startMs: number;
  durationMs: number;
}

export interface TtsSynthesisResult {
  audioSha256: string;
  /** Absolute path of the synthesized clip, when the provider writes one. */
  audioPath?: string;
  durationMs: number;
  phrases: TtsPhrase[];
  cost: Money;
}

export interface TtsProvider {
  readonly id: string;
  estimate(request: TtsSynthesisRequest): Money;
  synthesize(request: TtsSynthesisRequest): Promise<TtsSynthesisResult>;
}
