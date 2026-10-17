import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type CompiledDraft,
  compileDraft,
  loadPlanProject,
} from "@naraframe/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const events = vi.hoisted(() => [] as string[]);
const renderMedia = vi.hoisted(() => vi.fn());
const selectComposition = vi.hoisted(() => vi.fn());
const openBrowser = vi.hoisted(() => vi.fn());

vi.mock("@remotion/bundler", () => ({
  bundle: vi.fn(async () => "http://localhost/serve"),
}));
vi.mock("@remotion/renderer", () => ({
  makeCancelSignal: () => ({ cancel: () => undefined, cancelSignal: {} }),
  openBrowser,
  renderMedia,
  selectComposition,
}));

import { visualPreflightProperty } from "../../src/remotion/visual-preflight.js";
import { releaseBrowser, renderDraft } from "../../src/render-draft.js";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);

const makeBrowser = (close?: () => Promise<void>) => {
  const browser = {
    close: vi.fn(async () => {
      events.push("close");
      await close?.();
    }),
    runner: {
      forgetEventLoop: vi.fn(() => {
        events.push("forget");
      }),
    },
  };
  return browser;
};

const roots: string[] = [];
let draft: CompiledDraft;
let root: string;

const composition = (issues: unknown[] = []) => ({
  props: {
    ...draft,
    [visualPreflightProperty]: { issues, frames: [] },
  },
  durationInFrames: draft.totalFrames,
  width: draft.width,
  height: draft.height,
  fps: draft.fps,
});

const render = (signal?: AbortSignal) =>
  renderDraft({
    draft,
    projectRoot: root,
    outputPath: join(root, "out.mp4"),
    browserExecutable: process.execPath,
    ...(signal ? { signal } : {}),
  });

beforeEach(async () => {
  events.length = 0;
  const loaded = await loadPlanProject(sampleRoot);
  if (!loaded.ok) throw new Error("sample must load");
  const compiled = compileDraft(loaded.value.source);
  if (!compiled.ok) throw new Error("sample must compile");
  draft = compiled.value;
  root = await mkdtemp(join(tmpdir(), "naraframe-browser-release-"));
  roots.push(root);
  selectComposition.mockResolvedValue(composition());
  renderMedia.mockResolvedValue(undefined);
});

afterEach(async () => {
  openBrowser.mockReset();
  renderMedia.mockReset();
  selectComposition.mockReset();
  await Promise.all(
    roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("browser release", () => {
  it("closes the selection browser and the render browser and releases both sets of pipes", async () => {
    const selectBrowser = makeBrowser();
    const renderBrowser = makeBrowser();
    openBrowser
      .mockResolvedValueOnce(selectBrowser)
      .mockResolvedValueOnce(renderBrowser);

    await render();

    expect(openBrowser).toHaveBeenCalledTimes(2);
    const selectCall = selectComposition.mock.calls[0] as unknown as [
      Record<string, unknown>,
    ];
    const renderCall = renderMedia.mock.calls[0] as unknown as [
      Record<string, unknown>,
    ];
    expect(selectCall[0].puppeteerInstance).toBe(selectBrowser);
    expect(renderCall[0].puppeteerInstance).toBe(renderBrowser);
    for (const browser of [selectBrowser, renderBrowser]) {
      expect(browser.close).toHaveBeenCalledTimes(1);
      expect(browser.close).toHaveBeenCalledWith({ silent: true });
      expect(browser.runner.forgetEventLoop).toHaveBeenCalledTimes(1);
    }
    expect(events).toEqual(["close", "forget", "close", "forget"]);
  });

  it("releases the selection browser when composition selection fails", async () => {
    const selectBrowser = makeBrowser();
    openBrowser.mockResolvedValueOnce(selectBrowser);
    selectComposition.mockRejectedValue(new Error("select failed"));

    await expect(render()).rejects.toThrow("select failed");

    expect(openBrowser).toHaveBeenCalledTimes(1);
    expect(selectBrowser.close).toHaveBeenCalledTimes(1);
    expect(selectBrowser.runner.forgetEventLoop).toHaveBeenCalledTimes(1);
  });

  it("releases the render browser when the render fails", async () => {
    const selectBrowser = makeBrowser();
    const renderBrowser = makeBrowser();
    openBrowser
      .mockResolvedValueOnce(selectBrowser)
      .mockResolvedValueOnce(renderBrowser);
    renderMedia.mockRejectedValue(new Error("render failed"));

    await expect(render()).rejects.toThrow("render failed");

    expect(renderBrowser.close).toHaveBeenCalledTimes(1);
    expect(renderBrowser.runner.forgetEventLoop).toHaveBeenCalledTimes(1);
    expect(selectBrowser.close).toHaveBeenCalledTimes(1);
  });

  it("does not open a render browser when visual preflight rejects the draft", async () => {
    const selectBrowser = makeBrowser();
    openBrowser.mockResolvedValueOnce(selectBrowser);
    selectComposition.mockResolvedValue(
      composition([
        {
          code: "TEXT_OVERFLOW",
          severity: "error",
          responsible: "agent",
          artifact: "scenes.json",
          path: "/scenes/0",
          message: "Text overflows.",
          suggestion: "Shorten it.",
        },
      ]),
    );

    await expect(render()).rejects.toMatchObject({
      name: "VisualPreflightError",
    });

    expect(openBrowser).toHaveBeenCalledTimes(1);
    expect(renderMedia).not.toHaveBeenCalled();
    expect(selectBrowser.close).toHaveBeenCalledTimes(1);
    expect(selectBrowser.runner.forgetEventLoop).toHaveBeenCalledTimes(1);
  });

  it("releases the render browser when the render is interrupted", async () => {
    const selectBrowser = makeBrowser();
    const renderBrowser = makeBrowser();
    openBrowser
      .mockResolvedValueOnce(selectBrowser)
      .mockResolvedValueOnce(renderBrowser);
    const controller = new AbortController();
    renderMedia.mockImplementation(async () => {
      controller.abort();
      throw new Error("cancelled by Remotion");
    });

    await expect(render(controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });

    expect(renderBrowser.close).toHaveBeenCalledTimes(1);
    expect(renderBrowser.runner.forgetEventLoop).toHaveBeenCalledTimes(1);
  });

  it("does not open a browser when already interrupted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(render(controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });

    expect(openBrowser).not.toHaveBeenCalled();
  });
});

describe("releaseBrowser", () => {
  it("still drops the pipes when closing fails, without throwing", async () => {
    const browser = makeBrowser(async () => {
      throw new Error("Target closed");
    });

    await expect(releaseBrowser(browser)).resolves.toBeUndefined();

    expect(browser.runner.forgetEventLoop).toHaveBeenCalledTimes(1);
  });

  it("tolerates a transport that is already gone", async () => {
    const browser = makeBrowser();
    browser.runner.forgetEventLoop.mockImplementation(() => {
      throw new TypeError("Cannot read properties of null");
    });

    await expect(releaseBrowser(browser)).resolves.toBeUndefined();
  });
});
