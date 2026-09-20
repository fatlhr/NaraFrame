import { createFakeTtsProvider } from "@naraframe/core";
import { describe, expect, it } from "vitest";

const request = (text: string) => ({
  text,
  languageCode: "id-ID",
  voiceId: "id-fake-voice-1",
});

describe("createFakeTtsProvider", () => {
  it("splits Indonesian text into contiguous, non-overlapping phrases", async () => {
    const provider = createFakeTtsProvider();
    const result = await provider.synthesize(
      request(
        "Krakatau meletus pada tahun 1883. Letusannya terdengar hingga ribuan kilometer jauhnya, dan abunya menutupi langit selama berbulan-bulan.",
      ),
    );

    expect(result.phrases).toHaveLength(3);
    expect(result.phrases[0]?.startMs).toBe(0);
    for (let i = 1; i < result.phrases.length; i += 1) {
      const previous = result.phrases[i - 1];
      const current = result.phrases[i];
      expect(current?.startMs).toBe(
        (previous?.startMs ?? 0) + (previous?.durationMs ?? 0),
      );
    }
    expect(result.durationMs).toBe(
      result.phrases.reduce((sum, phrase) => sum + phrase.durationMs, 0),
    );
  });

  it("is deterministic: identical input reproduces identical audio hash and cost", async () => {
    const provider = createFakeTtsProvider();
    const first = await provider.synthesize(request("Halo dunia."));
    const second = await provider.synthesize(request("Halo dunia."));

    expect(second.audioSha256).toBe(first.audioSha256);
    expect(second.cost).toEqual(first.cost);
    expect(first.audioSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes the audio hash when the voice changes for identical text", async () => {
    const provider = createFakeTtsProvider();
    const voiceOne = await provider.synthesize({
      text: "Halo dunia.",
      languageCode: "id-ID",
      voiceId: "id-fake-voice-1",
    });
    const voiceTwo = await provider.synthesize({
      text: "Halo dunia.",
      languageCode: "id-ID",
      voiceId: "id-fake-voice-2",
    });

    expect(voiceTwo.audioSha256).not.toBe(voiceOne.audioSha256);
  });

  it("estimates the same cost synthesize() actually settles for", async () => {
    const provider = createFakeTtsProvider();
    const text = "Ini contoh naskah narasi.";
    const estimate = provider.estimate(request(text));
    const result = await provider.synthesize(request(text));

    expect(result.cost).toEqual(estimate);
    expect(estimate.currency).toBe("IDR");
    expect(estimate.amount).toBeGreaterThan(0);
  });
});
