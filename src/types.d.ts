/* eslint-disable no-var */

import { ChainConfig } from "./helpers/workspace";
import { AccountDataProvider } from "./views/accountDataProvider";
import { ContractDataProvider } from "./views/contractDataProvider";

declare global {
  var accountViewProvider: AccountDataProvider;
  var contractViewProvider: ContractDataProvider;
  var workspaceChain: ChainConfig;
}

export { };
