/* eslint-disable no-var */

import { ChainConfig } from "./helpers/Workspace";
import { AccountDataProvider } from "./views/AccountDataProvider";
import { ContractDataProvider } from "./views/ContractDataProvider";

declare global {
  var accountViewProvider: AccountDataProvider;
  var contractViewProvider: ContractDataProvider;
  var workspaceChain: ChainConfig;
}

export { };
