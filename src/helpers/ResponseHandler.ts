import * as vscode from 'vscode';
import { CosmwasmTerminal } from '../views/cosmwasmTerminal';
import { CosmwasmResponseView, Workspace } from './workspace';

export class ResponseHandler {
    public static OutputSuccess(input: string, response: string, action: string) {
        let output = "// Input: \n";
        output += input + "\n\n";
        output += "// " + action + " output: \n"
        output += response;
        this.output(output);
    }

    public static OutputError(input: string, error: any, action: string) {
        let output = "// Input: \n";
		output += input + "\n\n";
		output += "// ⚠️ " + action + " failed \n\n";
		output += error;
        this.output(output);
    }

    private static output(outputText: string) {
        let config = Workspace.GetCosmwasmResponseView()
        switch(config) {
            case CosmwasmResponseView.NewFile:
                return this.outputToFile(outputText);
            case CosmwasmResponseView.Terminal:
                return this.outputToTerminal(outputText);
            default:
                return;
        }
    }

    private static outputToFile(outputText: string) {
        vscode.workspace.openTextDocument({
			language: "jsonc"
		}).then(doc => {
			vscode.window.showTextDocument(doc).then(editor => {
				editor.insertSnippet(new vscode.SnippetString(outputText));
			});
		});

    }

    private static outputToTerminal(outputText: string) {
        CosmwasmTerminal.output("\n\n"+ outputText);
    }
}