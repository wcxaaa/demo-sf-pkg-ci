// @ts-check
import { execSync } from "child_process";

/**
 * @typedef { import("./sf.interface").ISFOrgDeleteScratch } ISFOrgDeleteScratch
 */

/**
 * Delete a scratch org.
 * @param { string } orgName
 * @returns { ISFOrgDeleteScratch["result"] }
 */
export const deleteTestOrg = (orgName) => {
  const command = `sf org delete scratch --target-org ${orgName} --no-prompt --json`;

  /** @type { ISFOrgDeleteScratch } */
  const output = JSON.parse(execSync(command, { encoding: "utf-8" }));

  return output.result;
};

/**
 *
 * @param { string[] } requiredVars
 */
export const ensureConfiguredEnvVars = (requiredVars) => {
  const nonPassingVars = requiredVars.filter((key) => !process.env[key]);
  if (nonPassingVars.length > 0) {
    throw new Error(
      `Environment variables must be set: ${nonPassingVars.join(", ")}`
    );
  }
};
