// @ts-check
import { execSync } from "child_process";
import { resolve } from "path";
import { ensureConfiguredEnvVars } from "./ciUtils.mjs";

/**
 * @typedef { import("./sf.interface").ISFDataQuery<IScratchOrgInfo> } ISFDataQueryOfIScratchOrgInfo
 * @typedef { import("./sf.interface").ISFOrgCreateScratch } ISFOrgCreateScratch
 * @typedef { import("./sf.interface").ISFOrgDeleteScratch } ISFOrgDeleteScratch
 * @typedef { import("./sf.interface").ISFOrgLoginJWT } ISFOrgLoginJWT
 * @typedef { import("./sf.interface").ISFOrgLoginJWTResult } ISFOrgLoginJWTResult
 * @typedef { import("./sf.interface").ISFOrgGeneratePassword } ISFOrgGeneratePassword
 * @typedef { import("./sf.interface").IScratchOrgInfo } IScratchOrgInfo
 * @typedef { import("./sf.interface").ISFOrgDisplay } ISFOrgDisplay
 * @typedef { import("./gitlab.interface").IUpdateProjectVariableResponse } IUpdateGitlabEnvResponse
 * @typedef { import("./gitlab.interface").IGeneralResponse } IGitlabGeneralResponse
 * @typedef { import("./github.interface").IUpdateRepositoryVariableResponse } IUpdateGithubEnvResponse
 */

export class CIScratchOrgHandler {
  #ciPlatform = process.env.CI_PLATFORM ?? "Github";
  #ciEnvVarUrl = process.env.CI_ENV_VAR_URL;
  #ciJobToken = process.env.CI_ADMIN_TOKEN;
  #devhubClientId = process.env.DEV_HUB_CLIENT_ID;
  #devhubPrivateKeyPath = process.env.DEV_HUB_PRIVATE_KEY_PATH;
  #testOrgName = process.env.TEST_ORG_NAME;

  #scratchDefinitionPath = resolve(
    process.env.SCRATCH_DEF_PATH ?? "config/project-scratch-def.json"
  );

  constructor() {
    ensureConfiguredEnvVars([
      "TEST_ORG_NAME",
      "CI_ENV_VAR_URL",
      "CI_ADMIN_TOKEN",
      "DEV_HUB_CLIENT_ID",
      "DEV_HUB_PRIVATE_KEY_PATH"
    ]);
  }

  execute = () => {
    // Check if test org exists
    console.log(`===== ⬇️ Retrieving Org ${this.#testOrgName}... =====`);

    const testOrg = this.#getTestOrgInstance();

    if (testOrg) {
      // authenticate to test org
      console.log(
        `===== 🪪 Authenticating into Org ${this.#testOrgName}... =====`
      );
      this.#logIn(testOrg);
    } else {
      console.log(
        `===== 🫨 Org ${this.#testOrgName} is no longer valid. Creating new scratch org... =====`
      );
      // create a new one
      this.#createScratchOrg();
      // result contains login credentials already
    }

    console.log(
      `===== 👏 Successfully connected to ${this.#testOrgName} =====`
    );
    // Virtual deployment to scratch org will be handled in later steps in CI
  };

  /**
   * Get a test org instance. If not exists, create a new one.
   * @returns { IScratchOrgInfo }
   */
  #getTestOrgInstance = () => {
    const command = `sf data query --query "SELECT Id, SignupUsername, LoginUrl, ExpirationDate, Status, OrgName, Description, ScratchOrg FROM ScratchOrgInfo WHERE Status = 'Active' AND OrgName = '${this.#testOrgName}'" --json`;

    /** @type { ISFDataQueryOfIScratchOrgInfo } */
    const output = JSON.parse(execSync(command, { encoding: "utf-8" }));

    return output.result.records[0];
  };

  /**
   * Create a new org instance.
   * @returns { ISFOrgCreateScratch }
   */
  #createScratchOrg = () => {
    const createScratchOrgCommand = `sf org create scratch --alias "${this.#testOrgName}" --name "${this.#testOrgName}" --definition-file "${this.#scratchDefinitionPath}" --duration-days 30 --no-namespace --json`;

    /** @type { ISFOrgCreateScratch } */
    const createScratchOrgOutput = JSON.parse(
      execSync(createScratchOrgCommand, { encoding: "utf-8" })
    );

    if (createScratchOrgOutput.status !== 0) {
      throw new Error(
        `Failed to create scratch org: ${JSON.stringify(createScratchOrgOutput.warnings)}`
      );
    }

    const orgInfo = createScratchOrgOutput.result.scratchOrgInfo;

    // Store credentials
    this.#setTestUserCredentials(
      orgInfo.LoginUrl,
      createScratchOrgOutput.result.username
    );

    return createScratchOrgOutput;
  };

  /**
   * @param {string} loginURL
   * @param {string} username
   */
  #setTestUserCredentials = (loginURL, username) => {
    // Set password
    const setPasswordCommand = `sf org generate password --target-org "${this.#testOrgName}" --json`;

    /** @type { ISFOrgGeneratePassword } */
    const setPasswordOutput = JSON.parse(
      execSync(setPasswordCommand, { encoding: "utf-8" })
    );

    this.#updateCIEnvVar(
      "TEST_CREDENTIALS",
      JSON.stringify({
        loginUrl: loginURL,
        username: username,
        password: setPasswordOutput.result.password
      })
    );

    return setPasswordOutput;
  };

  /**
   * @param {string} key
   * @param {string} value
   * @returns { unknown } // IUpdateGitlabEnvResponse | IGitlabGeneralResponse | IUpdateGithubEnvResponse | null
   */
  #updateCIEnvVar = (key, value) => {
    const sanitizedValue = value.replace(/&/g, "\\&");

    if (this.#ciPlatform === "Github") {
      return this.#updateGithubCIEnvVar(key, sanitizedValue);
    } else if (this.#ciPlatform === "Gitlab") {
      return this.#updateGitlabCIEnvVar(key, sanitizedValue);
    } else {
      throw new Error(`CI platform ${this.#ciPlatform} is not supported.`);
    }
  };

  /**
   * @param {string} key
   * @param {string} value
   * @returns { IUpdateGithubEnvResponse }
   */
  #updateGithubCIEnvVar = (key, value) => {
    // Additionally, need to escape double quotes
    const sanitizedValue = value.replace(/"/g, '\\"');

    const setEnvVarCommand = `curl -L -X PATCH -H "Accept: application/vnd.github+json" -H "Authorization: Bearer ${this.#ciJobToken}" -H "X-GitHub-Api-Version: 2022-11-28" "${this.#ciEnvVarUrl}/${key}" -d '{"value": "${sanitizedValue}"}' --silent`;

    /** @type { string | null } */
    const rawOutput = execSync(setEnvVarCommand, { encoding: "utf-8" });

    /** @type { IUpdateGithubEnvResponse } */
    const setEnvVarOutput = rawOutput ? JSON.parse(rawOutput) : {};

    if (setEnvVarOutput?.status && setEnvVarOutput.status !== "200") {
      throw new Error(
        // @ts-ignore
        `Failed to update Github CI environment variable: ${JSON.stringify(setEnvVarOutput.message)}`
      );
    }

    return setEnvVarOutput;
  };

  /**
   * @param {string} key
   * @param {string} value assumed to be sanitized
   * @returns { IUpdateGitlabEnvResponse }
   */
  #updateGitlabCIEnvVar = (key, value) => {
    const setEnvVarCommand = `curl --request PUT --header "PRIVATE-TOKEN: ${this.#ciJobToken}" --form "value=${value}" "${this.#ciEnvVarUrl}/${key}" --silent`;

    /** @type { IUpdateGitlabEnvResponse | IGitlabGeneralResponse } */
    const setEnvVarOutput = JSON.parse(
      execSync(setEnvVarCommand, { encoding: "utf-8" })
    );

    // @ts-ignore
    if (!setEnvVarOutput.key) {
      throw new Error(
        // @ts-ignore
        `Failed to update Gitlab CI environment variable: ${JSON.stringify(setEnvVarOutput.message)}`
      );
    }

    // @ts-ignore
    return setEnvVarOutput;
  };

  /**
   * Authenticate to an org with JWT Bearer Token Flow.
   * @param { IScratchOrgInfo } orgInfo
   * @returns { ISFOrgLoginJWTResult }
   */
  #logIn = (orgInfo) => {
    const command = `sf org login jwt --alias "${this.#testOrgName}" --client-id ${this.#devhubClientId} --jwt-key-file ${this.#devhubPrivateKeyPath} --username ${orgInfo.SignupUsername} --instance-url ${orgInfo.LoginUrl} --json`;

    /** @type { ISFOrgLoginJWT } */
    const output = JSON.parse(execSync(command, { encoding: "utf-8" }));

    if (output.status !== 0) {
      throw new Error(`Failed to authenticate to org.`);
    }

    return output.result;
  };
}

new CIScratchOrgHandler().execute();
