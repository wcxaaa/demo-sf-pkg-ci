export interface ISFDataQuery<T> {
  status: number;
  result: ISFDataQueryResult<T>;
  warnings: unknown[];
}

export interface ISFDataQueryResult<T> {
  records: T[];
  totalSize: number;
  done: boolean;
}

export interface ISFOrgCreateScratch {
  status: number;
  result: ISFOrgCreateScratchResult;
  warnings: unknown[];
}

export interface ISFOrgCreateScratchResult {
  orgId: string;
  username: string;
  scratchOrgInfo: IScratchOrgInfo;
  authFields: ISFOrgCreateScratchAuthFields;
  warnings: unknown[];
}

export interface ISFOrgCreateScratchAuthFields {
  accessToken: string;
  instanceUrl: string;
  orgId: string;
  username: string;
  loginUrl: string;
  refreshToken: string;
  clientId: string;
  expirationDate: string;
  isScratch: string;
  tracksSource: boolean;
  instanceApiVersion: string;
}

export interface ISFOrgDisplay {
  status: number;
  result: ISFOrgDisplayResult;
  warnings: string[];
}

export interface ISFOrgDisplayResult {
  id: string;
  devHubId: string;
  apiVersion: string;
  accessToken: string;
  instanceUrl: string;
  username: string;
  clientId: string;
  status: string;
  expirationDate: string;
  createdBy: string;
  edition: string;
  orgName: string;
  createdDate: string;
  signupUsername: string;
  sfdxAuthUrl: string;
}

export interface ISFLoginSfdxUrl {
  status: number;
  result: ISFLoginSfdxUrlResult;
  warnings: unknown[];
}

export interface ISFLoginSfdxUrlResult {
  clientSecret: string;
  orgId: string;
  username: string;
  accessToken: string;
  instanceUrl: string;
  loginUrl: string;
  refreshToken: string;
  clientId: string;
}

export interface ISFOrgLoginJWT {
  status: number;
  result: ISFOrgLoginJWTResult;
  warnings: unknown[];
}

export interface ISFOrgLoginJWTResult {
  accessToken: string;
  orgId: string;
  loginUrl: string;
  privateKey: string;
  clientId: string;
  instanceUrl: string;
  username: string;
}

export interface ISFOrgGeneratePassword {
  status: number;
  result: {
    username: string;
    password: string;
  };
  warnings: unknown[];
}

export interface ISFOrgDeleteScratch {
  status: number;
  result: {
    username: string;
    orgId: string;
  };
  warnings: unknown[];
}

export interface ISFPackageVersionCreate {
  status: number;
  result: ISFPackageVersionCreateResult;
  warnings: string[];
}

export interface ISFPackageVersionCreateResult {
  Status: string;
  Package2Id: string;
  Package2Name: string;
  Package2VersionId: string;
  SubscriberPackageVersionId: string;
  Branch: string;
  Error: unknown[];
  CodeCoverage: number;
  VersionNumber: string;
  HasPassedCodeCoverageCheck: boolean;
}

export interface ISFPackageInstall {
  status: number;
  result: IPackageInstallRequest;
  warnings: unknown[];
}

// #region SObjects
interface ISObject {
  attributes: ISObjectAttributes;
  Id: string;
  IsDeleted: boolean;
  CreatedDate: string;
  CreatedById: string;
  LastModifiedDate: string;
  LastModifiedById: string;
  SystemModstamp: string;
}

interface ISObjectAttributes {
  type: string;
  url: string;
}

export interface IScratchOrgInfo extends ISObject {
  attributes: ISObjectAttributes;
  OwnerId: string;
  Name: string;
  Description: string | null;
  Edition: string;
  AdminEmail: string | null;
  OrgName: string;
  DurationDays: number;
  Namespace: string;
  SignupUsername: string;
  Status: string;
  ScratchOrg: string;
  SignupInstance: string;
  SignupEmail: string;
  LoginUrl: string;
  ExpirationDate: string;
}

export interface IPackageInstallRequest extends ISObject {
  SubscriberPackageVersionKey: string;
  NameConflictResolution: string;
  SecurityType: string;
  PackageInstallSource: unknown;
  ProfileMappings: unknown;
  Password: unknown;
  EnableRss: boolean;
  UpgradeType: string;
  ApexCompileType: string;
  SkipHandlers: unknown;
  Status: string;
  Errors: unknown;
}

// #endregion
