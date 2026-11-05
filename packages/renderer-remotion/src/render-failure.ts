export type RenderStage = "bundle" | "browser-launch" | "preflight" | "render";

/** Carries stage context internally; the CLI exposes only curated diagnostics. */
export class RenderFailure extends Error {
  constructor(
    readonly stage: RenderStage,
    cause: unknown,
  ) {
    super(cause instanceof Error ? cause.message : String(cause), { cause });
    this.name = "RenderFailure";
  }
}

export const duringRenderStage = async <T>(
  stage: RenderStage,
  operation: () => Promise<T>,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (
      error instanceof RenderFailure ||
      (error instanceof Error && error.name === "AbortError")
    )
      throw error;
    throw new RenderFailure(stage, error);
  }
};
