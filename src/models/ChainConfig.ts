import * as vscode from 'vscode';

export class ChainConfig {
    chainName!: string;
    addressPrefix!: string;
    rpcEndpoint!: string;


    public static GetWorkspaceChainConfig(): ChainConfig {
        let config = new ChainConfig();

        const chainName = vscode.workspace.getConfiguration().get<string>("chainName");
        if (!chainName) {
            vscode.window.showErrorMessage("Chain Name not set");
        }
        else {
            config.chainName = chainName;
        }
        const addressPrefix = vscode.workspace.getConfiguration().get<string>("addressPrefix");
        if (!addressPrefix) {
            vscode.window.showErrorMessage("Address prefix not set");
        }
        else {
            config.addressPrefix = addressPrefix;
        }
        const rpcEndpoint = vscode.workspace.getConfiguration().get<string>("rpcEndpoint");
        if (!rpcEndpoint) {
            vscode.window.showErrorMessage("RPC endpoint not set");
        }
        else {
            config.rpcEndpoint = rpcEndpoint;
        }

        return config;
    }
}