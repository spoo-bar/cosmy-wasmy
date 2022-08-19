/* eslint-disable no-var */

import { AccountDataProvider } from "./views/AccountDataProvider";
import { ContractDataProvider } from "./views/ContractDataProvider";

declare global {
    var accountViewProvider: AccountDataProvider; 
    var contractViewProvider: ContractDataProvider;
  }
  
  export {};
  