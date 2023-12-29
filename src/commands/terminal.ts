import * as vscode from 'vscode';
import { Workspace } from '../helpers/workspace';
import { CosmwasmTerminal } from '../views/cosmwasmTerminal';

export class TerminalCmds {
	public static async Register(context: vscode.ExtensionContext) {
		let terminal = new CosmwasmTerminal();

		this.registerBuildCmd(context, terminal);
		this.registerRunUnitTestsCmd(context, terminal);
		this.registerOptimizeContractCmd(context, terminal);
		this.registerGenerateSchemaCmd(context, terminal);
		this.registerSetUpDevEnvCmd(context, terminal);
	}

	private static registerBuildCmd(context: vscode.ExtensionContext, terminal: CosmwasmTerminal) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.build', async () => {
			terminal.build();
		});

		context.subscriptions.push(disposable);
	}

	private static registerRunUnitTestsCmd(context: vscode.ExtensionContext, terminal: CosmwasmTerminal) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.runUnitTests', async () => {
			terminal.unitTests();
		});

		context.subscriptions.push(disposable);
	}

	private static registerOptimizeContractCmd(context: vscode.ExtensionContext, terminal: CosmwasmTerminal) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.optimizeContract', async () => {
			terminal.optimize();
		});

		context.subscriptions.push(disposable);
	}

	private static registerGenerateSchemaCmd(context: vscode.ExtensionContext, terminal: CosmwasmTerminal) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.generateSchema', async () => {
			terminal.schema();
			const schema = [{
				fileMatch: [
					"*.json"
				],
				url: "/schema/execute_msg.json"
			}, {
				fileMatch: [
					"*.json"
				],
				url: "/schema/query_msg.json"
			}, {
				fileMatch: [
					"*.json"
				],
				url: "/schema/instantiate_msg.json"
			}, {
				fileMatch: [
					"*.json"
				],
				url: "/schema/migrate_msg.json"
			}, {
				fileMatch: [
					"*.json"
				],
				url: "/schema/raw/execute.json"
			}, {
				fileMatch: [
					"*.json"
				],
				url: "/schema/raw/query.json"
			}, {
				fileMatch: [
					"*.json"
				],
				url: "/schema/raw/instantiate.json"
			}, {
				fileMatch: [
					"*.json"
				],
				url: "/schema/raw/migrate.json"
			}];
			Workspace.SetWorkspaceSchemaAutoComplete(schema);
		});

		context.subscriptions.push(disposable);
	}

	private static registerSetUpDevEnvCmd(context: vscode.ExtensionContext, terminal: CosmwasmTerminal) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.setupDevEnv', async () => {
			terminal.setupDevEnv();
		});

		context.subscriptions.push(disposable);
	}

}