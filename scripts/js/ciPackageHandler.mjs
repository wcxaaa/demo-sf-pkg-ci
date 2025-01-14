// @ts-check
import { execSync } from "child_process";

import { ensureConfiguredEnvVars } from "./ciUtils.mjs";
import projectDef from "../../sfdx-project.json" with { type: "json" };

/**
 * @typedef { import("./sf.interface").ISFPackageInstall } ISFPackageInstall
 * @typedef { import("./sf.interface").IPackageInstallRequest } IPackageInstallRequest
 * @typedef { import("./sf.interface").ISFPackageVersionCreate } ISFPackageVersionCreate
 * @typedef { import("./sf.interface").ISFPackageVersionCreateResult } ISFPackageVersionCreateResult
 */

export class CIPackageHandler {
  #targetOrgName = "devhub"; // Hard-coded. Change accordingly
  #packageName = "";
  #packageInstallationKey = process.env.PACKAGE_INSTALLATION_KEY;
  #almostISOString = new Date()
    .toISOString()
    .replace(/-/g, "_")
    .replace(/:/g, "_");

  constructor() {
    ensureConfiguredEnvVars(["PACKAGE_INSTALLATION_KEY"]);
  }

  execute = () => {
    // Read package name from sfdx-project.json
    this.#packageName = this.#getLocalPackageInfo().package;

    // Create package version
    console.log(
      `===== 📦 Creating package version for ${this.#packageName}... =====`
    );
    const versionResult = this.#createPackageVersion();
    console.log(
      `===== 📦 > Test Code Coverage: ${versionResult.CodeCoverage}% =====`
    );

    const almostVersionAlias = `${this.#packageName}@${versionResult.VersionNumber}-${versionResult.Branch}`;

    // Install package
    console.log(`===== 🔧 Installing package ${almostVersionAlias}... =====`);
    console.log(
      `===== 🔧 > Subscriber Version ID: ${versionResult.SubscriberPackageVersionId} =====`
    );
    this.#installPackage(versionResult.SubscriberPackageVersionId);
  };

  #getLocalPackageInfo = () => {
    const defaultPackage = projectDef.packageDirectories.find(
      (item) => item.default === true
    );

    if (!defaultPackage) {
      throw new Error("Default package not found in sfdx-project.json");
    }

    return defaultPackage;
  };

  /**
   *
   * @returns { ISFPackageVersionCreateResult }
   */
  #createPackageVersion = () => {
    const command = `sf package version create --package ${this.#packageName} --branch "${this.#almostISOString}" --code-coverage --installation-key "${this.#packageInstallationKey}" --wait 10 --json`;

    /** @type { ISFPackageVersionCreate } */
    const output = JSON.parse(execSync(command, { encoding: "utf-8" }));

    return output.result;
  };

  /**
   *
   * @param { string } packageVersionId
   * @returns { IPackageInstallRequest }
   */
  #installPackage = (packageVersionId) => {
    const command = `sf package install --target-org "${this.#targetOrgName}" --package ${packageVersionId} --installation-key "${this.#packageInstallationKey}" --wait 10 --publish-wait 10 --json`;

    /** @type { ISFPackageInstall } */
    const output = JSON.parse(execSync(command, { encoding: "utf-8" }));

    return output.result;
  };
}

new CIPackageHandler().execute();
