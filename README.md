# Pit Salesforce Hello Packages

![GithubActionBadge](https://github.com/xmj-alliance/pit-salesforce-hello-packages/actions/workflows/main.yaml/badge.svg)

A pit to discover Salesforce Development CI flows based on scratch orgs and unlocked packages

## Overview

| _GitHub Actions_                                   | _Gitlab CI_                                    |
| -------------------------------------------------- | ---------------------------------------------- |
| ![GithubActionImg](https://imgur.com/F7Z185m.jpeg) | ![GithubLabCI](https://imgur.com/twB4alS.jpeg) |

This is a proposed CI workflow with scratch orgs and unlocked packages.

This workflow works on Github and Gitlab.

On each push to development branches, a scratch org is reused to run validation-only deployments.

When the "develop" branches are merged into the "main" branch, an Unlocked Package Version is created and installed in the "QA" environment.

A "QA" environment can be any intended sandbox or production org. In this workflow, the "QA" environment is the same as the Dev Hub.

The workflow consists of the following actions.

- Install
  Collect Node.js modules to be used in later steps.
- LWC Test
  Scan and run all LWC Jest tests within the project
- Deployment
  Perform validation-only deployment to the test scratch org for development branches, or create a package and install it to "QA" for the "main" branch.

## Major Workflow Steps

The locations of CI definitions are:

- Github: `./.github/workflows/main.yaml`
- Gitlab: `./.gitlab-ci.yml`

### Install

This step installs the node modules in a Node.js container.

These Node packages are managed by `pnpm`. The `pnpm.lock` file locks the package version to install.

At the end of this step, the `node_modules` folder is uploaded as a temporary artifact. It is then available to be downloaded in later steps.

### LWC Test

This step runs after "Install".

In this step, all the LWC Jest test files within the project are scanned and run. The step is marked as passing when all the tests pass.

Currently the `--passWithNoTests` parameter fails this step with a weird error (TypeError: mixin.wrap is not a function). Therefore without it, this step will fail when there are no tests detected.

### Deployment (Mock)

This step runs on pushes to all branches except the `main` branch.

The step will

1. Perform authentication to a dev hub

- with JWT Bearer Token Flow

2. Attempt to connect to the specified test scratch org

- whose name alias is specified in the CI variable
- If the specified scratch org exists
  - Use that scratch org
- If it does not exist or has expired
  - Creates a new scratch org with the same name
  - Store the updated admin login credentials in the CI variable
  - Use the new scratch org

3. Perform validation-only deployment

- Using `--dry-run` parameter of `sf project deploy start`.
  - All changes are rolled back in the end. No changes will be made to the test org.
  - The default project is specified in `sfdx-project.json`
    - So that SF CLI knows which path to validate
- Run local Apex tests, and output the result
- If the Apex test fails
  - Show the content of `junit.xml`, where test results are stored, to the console.

### Deployment

The real deployment step runs only on pushes to the `main` branch.

This step assumes that the Apex tests are all passing.

This step will:

1. Perform authentication to a dev hub

- with JWT Bearer Token Flow

2. Create an Unlocked Package **Version**

- Appends ISO Date String to the package version number

  - e.g. `PitHello@1.0.0-1` becomes `PitHello@1.0.0-1-2025_01_26T17_51_29.422Z`

- Note:
  - Package information is specified in `sfdx-project.json`
  - What it creates is a Package **Version** rather than a Package definition
  - Package definition needs to be created manually in advance, for just once.

3. Install the newly created package version to the target QA org.

- In this workflow, the target QA org is hard-coded as "devhub" (the same parent org).

## Dev Hub Setup

In Certificate and Key Management

- Generate a self-signed certificate
  - Exportable Private Key: True
- Export to Keystore
  - Set a temporary password
  - Click "Export"

Extract private key

- Open the downloaded ".jks" file with [KeyStore Explorer][keyStoreExplorer]
  - Right-click on your new item, Export -> Export Private Key
  - Select "OpenSSL"
  - Uncheck "Encrypt", Check PEM
  - Save the private key
- Export certificate with KeyStore Explorer
  - (Or) Download from Salesforce "Certificate and Key Management" page

Create a Connected App

- Note: External Client ID App is not yet supported. A "C-1016" error will occur.

- OAuth settings

  - OAuth - enabled
  - Callback URL: http://localhost:1717/OauthRedirect
  - OAuth scopes: "api", "web", "refresh_token"
  - Enable JWT Bearer Flow
  - Upload the certificate generated in the previous section

- Policies

  - Permitted Users: Admin-approved users are pre-authorized
  - Profiles: System Administrator
  - (Optional) Permission set: (CI Management permission set)

- View and record the Consumer Key of this app.

## CI Setup

The following variables should be configured on the CI platform.

| Name                     | Required On   | Description                                                                                                                                               |
| ------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI_DEP_BOT_USERNAME      | Github        | Github Dependabot username                                                                                                                                |
| CI_ENV_VAR_URL           | Github,Gitlab | URL for the CI to update CI variables. Remove the trailing slash.                                                                                         |
| CI_ADMIN_TOKEN           | Github,Gitlab | Admin Token which has full access to API, that is used to update ci env var.                                                                              |
| DEV_HUB_CLIENT_ID        | Github,Gitlab | Consumer Key of the Connected app                                                                                                                         |
| DEV_HUB_PRIVATE_KEY      | Github        | Private key content. Used to connect to the Org with JWT Bearer token flow                                                                                |
| DEV_HUB_PRIVATE_KEY_PATH | Github,Gitlab | Path to the private key file. On Github, this is a path e.g. `/tmp/github.key`. On Gitlab, this is a File type secret, containing the private key content |
| DEV_HUB_USERNAME         | Github,Gitlab | Admin username of Dev Hub                                                                                                                                 |
| DEV_HUB_MY_DOMAIN_URL    | Github,Gitlab | Dev Hub "My Domain" URL, including "https://"                                                                                                             |
| TEST_ORG_NAME            | Github,Gitlab | Alias of the test scratch org to use. E.g. `ciTest`                                                                                                       |
| PACKAGE_INSTALLATION_KEY | Github,Gitlab | Password to install the built package                                                                                                                     |

## Repository Setup

- In `config/project-scratch-def.json`
  - Check the scratch org definition. Adjust it if needed.
- In `sfdx-project.json`
  - Specify the package path in `packageDirectories`
  - Mark `default` as `true`
- Create an unlocked package definition with `sf package create`
  - See the commands in the "Appendix - Involved SF commands" section

## Process to make a package release

- Manually bump the version in `sfdx-project.json`
- Manually create a package, specifying `--code-coverage`
- Manually promote the package
- Install the package to your target environment
- See the commands in the "Appendix - Involved SF commands" section

## Appendix - Involved SF commands

### Package creation

```shell

# Create a definition
sf package create --name PitHello --package-type Unlocked --path pit-hello --no-namespace

# Create a Version
sf package version create --package PitHello --code-coverage --installation-key $(PASSWORD) --wait 10

# Install a package
# > In a real scenario, remember always to specify `--target-org`
sf package install --package PitHello@x.x.x-x --target-org $(TARGET_ORG) --installation-key $(PASSWORD) --wait 10 --publish-wait 10

# Create a release
sf package version promote --package PitHello@x.x.x-x

```

### Scratch org creation

```shell

# Create a Scratch Org
sf org create scratch --alias dev --name "[Dev]" --definition-file config/project-scratch-def.json --duration-days 30 --no-namespace --set-default

# Display Org credentials
sf org display --target-org $(DEV_HUB_ORG) --verbose

# Open a Scratch Org
sf org open --target-org dev

# List Scratch Orgs in the Dev Hub
sf data query --query "SELECT Id, SignupUsername, LoginUrl, ExpirationDate, Status, OrgName, Description, ScratchOrg FROM ScratchOrgInfo WHERE Status = 'Active'" --target-org $(DEV_HUB_ORG)

# > (alternatively)
sf data query --query 'SELECT Id, Name, OrgName, CreatedDate, Description, ScratchOrg, SignupUsername FROM ActiveScratchOrg' --target-org $(DEV_HUB_ORG)

# Log in with SFDX URL
echo $URL | sf org login sfdx-url --alias dev --sfdx-url-stdin

# Log in with JWT
sf org login jwt --alias dev --client-id $(DEV_HUB_CLIENT_ID) --jwt-key-file $(DEV_HUB_PRIVATE_KEY_PATH) --username $(SIGNUP_USERNAME) --instance-url $(LOGIN_URL) --json

# Generate a password for the scratch org user
sf org generate password --target-org $(DEV_HUB_ORG)

# Delete a scratch Org
sf org delete scratch --target-org dev

```

## Appendix - Salesforce DX Project: Next Steps

Now that you’ve created a Salesforce DX project, what’s next? Here are some documentation resources to get you started.

### How Do You Plan to Deploy Your Changes?

Do you want to deploy a set of changes, or create a self-contained application? Choose a [development model](https://developer.salesforce.com/tools/vscode/en/user-guide/development-models).

### Configure Your Salesforce DX Project

The `sfdx-project.json` file contains useful configuration information for your project. See [Salesforce DX Project Configuration](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_ws_config.htm) in the _Salesforce DX Developer Guide_ for details about this file.

### Read All About It

- [Salesforce Extensions Documentation](https://developer.salesforce.com/tools/vscode/)
- [Salesforce CLI Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)

<!-- Refs -->

[keyStoreExplorer]: https://keystore-explorer.org
