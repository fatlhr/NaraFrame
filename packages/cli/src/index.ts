#!/usr/bin/env node

import { corePackage } from "@naraframe/core";
import { rendererPackage } from "@naraframe/renderer-remotion";

export const cliPackage = "@naraframe/cli";
export const cliDependencies = [corePackage, rendererPackage] as const;
