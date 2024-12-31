# pit-sf-hello-packages

A pit to discover CI flows based on scratch orgs and unlocked packages

## Manual package creation

```shell

# Create a definition
sf package create --name PitHello --package-type Unlocked --path pit-hello --no-namespace

# Create a Version
sf package version create --package PitHello --code-coverage --installation-key $(PASSWORD) --wait 10

# Install a package
# > In a real scenario, remember to always speficy `--target-org`
sf package install --package PitHello@x.x.x-x --installation-key $(PASSWORD) --wait 10 --publish-wait 10

# Create a release
sf package version promote --package PitHello@x.x.x-x

```

## Scratch org creation

```shell

# Create a Scratch Org
sf org create scratch --alias dev --definition-file config/project-scratch-def.json --duration-days 30 --admin-email $(ADMIN_EMAIL) --no-namespace --set-default

# Open a Scratch Org
sf org open --target-org dev

# List Scratch Orgs in the Dev Hub
sf data query --query='SELECT Id, Name, OrgName, CreatedDate, Description, ScratchOrg, SignupUsername FROM ActiveScratchOrg' --target-org $(DEV_HUB_ORG)

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
