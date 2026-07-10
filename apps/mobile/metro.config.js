// Metro em monorepo pnpm (receita oficial Expo): observa a raiz do workspace
// e resolve node_modules do app E da raiz — sem isso, imports de
// @rise/core/@rise/api (symlinks do pnpm) não resolvem.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
