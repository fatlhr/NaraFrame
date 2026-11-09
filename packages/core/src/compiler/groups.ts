import type { Layer } from "../schema/scene.js";

/**
 * Nested group lookups shared by the compiler, its checks and the renderer.
 * Browser-safe: it imports only types. Validation has already refused
 * cycles, shared members and missing ids, so these walks terminate.
 */
export type GroupLayer = Extract<Layer, { type: "group" }>;

export interface GroupTree {
  /** The group that directly holds each grouped layer or group. */
  parentOf: Map<string, GroupLayer>;
  byId: Map<string, Layer>;
}

export const groupTree = (layers: readonly Layer[]): GroupTree => {
  const parentOf = new Map<string, GroupLayer>();
  const byId = new Map<string, Layer>();
  for (const layer of layers) {
    byId.set(layer.id, layer);
    if (layer.type !== "group") continue;
    for (const memberId of layer.memberIds) {
      if (!parentOf.has(memberId)) parentOf.set(memberId, layer);
    }
  }
  return { parentOf, byId };
};

/** The groups that hold a layer, innermost first. */
export const ancestorsOf = (tree: GroupTree, id: string): GroupLayer[] => {
  const chain: GroupLayer[] = [];
  const seen = new Set<string>([id]);
  let parent = tree.parentOf.get(id);
  while (parent && !seen.has(parent.id)) {
    chain.push(parent);
    seen.add(parent.id);
    parent = tree.parentOf.get(parent.id);
  }
  return chain;
};

/** The outermost group holding a layer, which places it in its plane. */
export const rootGroupOf = (
  tree: GroupTree,
  id: string,
): GroupLayer | undefined => ancestorsOf(tree, id).at(-1);

/** The plain layers inside a group at any depth, in member order. */
export const leafMembersOf = (
  tree: GroupTree,
  group: GroupLayer,
): Array<Exclude<Layer, { type: "group" }>> => {
  const leaves: Array<Exclude<Layer, { type: "group" }>> = [];
  const visit = (current: GroupLayer, seen: Set<string>) => {
    for (const memberId of current.memberIds) {
      const member = tree.byId.get(memberId);
      if (!member || seen.has(memberId)) continue;
      if (member.type === "group") {
        visit(member, new Set([...seen, memberId]));
      } else {
        leaves.push(member);
      }
    }
  };
  visit(group, new Set([group.id]));
  return leaves;
};

/** The box around a group's plain layers at any depth, in design pixels. */
export const groupBoundsOf = (
  tree: GroupTree,
  group: GroupLayer,
): { x: number; y: number; width: number; height: number } | undefined => {
  const leaves = leafMembersOf(tree, group);
  if (leaves.length === 0) return undefined;
  const left = Math.min(...leaves.map((leaf) => leaf.frame.x));
  const top = Math.min(...leaves.map((leaf) => leaf.frame.y));
  const right = Math.max(
    ...leaves.map((leaf) => leaf.frame.x + leaf.frame.width),
  );
  const bottom = Math.max(
    ...leaves.map((leaf) => leaf.frame.y + leaf.frame.height),
  );
  return { x: left, y: top, width: right - left, height: bottom - top };
};
