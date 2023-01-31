import path = require('path');
import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import { TerminalCmds } from '../commands/terminal';
import * as cp from "child_process";
import { spawn } from 'child_process';

export class TestExplorer {
    private testController: vscode.TestController;
    private runProfile: vscode.TestRunProfile
    private terminal: vscode.Terminal;

    public constructor() {
        this.testController = vscode.tests.createTestController(
            'cosmwasm',
            vscode.l10n.t('Cosmwasm Tests')
        );
        this.runProfile = this.testController.createRunProfile(
            'Run',
            vscode.TestRunProfileKind.Run,
            (request, token) => {
                this.runHandler(request, token);
            }
        );
        // maybe someday, come back to this and instead of string parse, do via cargo 
        this.testController.resolveHandler = async test => {
            // const workingDir = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
            // let res = cp.spawnSync("cargo", ["test", "--", "--list", "--format=terse"], {
            //     cwd: workingDir
            // });
            // const decoder = new TextDecoder()
            // let testsText = decoder.decode(res.stdout)

            const wf = vscode.workspace.workspaceFolders;
            if (wf) {
                if (test && test.uri) {
                    const testFile = test.uri;
                    const content = new TextDecoder().decode(await vscode.workspace.fs.readFile(testFile));
                    const lines = content.split('\n');
                    for (let line = 0; line < lines.length; line++) {
                        if (lines[line].trim() == "#[test]") {
                            const testLineIndex = line + 1;
                            const testName = getTestName(lines[testLineIndex]);
                            const testCase = this.testController.createTestItem(testName, testName, testFile);
                            testCase.range = new vscode.Range(new vscode.Position(testLineIndex, 0), new vscode.Position(testLineIndex, lines[testLineIndex].length));
                            testCase.canResolveChildren = false;
                            test.children.add(testCase);
                            continue;
                        }
                    }
                }
                else {
                    const files = await vscode.workspace.findFiles('**/*.rs');
                    for (const file of files) {
                        const content = new TextDecoder().decode(await vscode.workspace.fs.readFile(file));
                        const lines = content.split('\n');
                        for (let line = 0; line < lines.length; line++) {
                            if (lines[line] == "#[cfg(test)]") {
                                const testFile = this.testController.createTestItem(file.path, path.basename(file.path), file);
                                testFile.range = new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, "#[cfg(test)]".length));
                                testFile.canResolveChildren = true;
                                this.testController.items.add(testFile);
                                continue;
                            }
                        }
                    }
                }
            }

            // Dont judge me. No mood for regex right now 
            function getTestName(line: string): string {
                return line.replace("fn", "").trim().split('(')[0];
            }
        };
        this.terminal = vscode.window.createTerminal({
            hideFromUser: true,
            location: vscode.TerminalLocation.Panel,
            name: "Cosmwasm Tests",
            message: "Cosmwasm test terminal - created by Cosmy Wasmy ⚛️"
        });
    }

    private async runHandler(request: vscode.TestRunRequest, token: vscode.CancellationToken) {
        // todo
        const run = this.testController.createTestRun(request);
        const queue: vscode.TestItem[] = [];
        const decoder = new TextDecoder()

        // Loop through all included tests, or all known tests, and add them to our queue
        if (request.include) {
            request.include.forEach(test => queue.push(test));
        } else {
            this.testController.items.forEach(test => queue.push(test));
        }

        while (queue.length > 0 && !token.isCancellationRequested) {
            const test = queue.pop()!;

            // Skip tests the user asked to exclude
            if (request.exclude?.includes(test)) {
                continue;
            }


            if (!test.canResolveChildren) {
                const start = Date.now();

                run.appendOutput(`Running test - ${test.label}\r\n`);
                run.started(test);
                test.busy = true;

                const workingDir = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

                let res = cp.spawnSync("cargo", ["test", test.label], {
                    cwd: workingDir
                });
                test.busy = false;
                if (res) {
                    run.appendOutput(decoder.decode(res.stdout))
                    if (res.status == 0) {
                        run.passed(test, Date.now() - start);
                    }
                    else {
                        run.appendOutput(decoder.decode(res.stderr))
                        run.failed(test, new vscode.TestMessage("Test failed with status : " + res.status), Date.now() - start);
                    }
                }
                else {
                    run.failed(test, new vscode.TestMessage("Test failed in unexpected state"), Date.now() - start);
                }
            }

            test.children.forEach(test => queue.push(test));
        }

        // Make sure to end the run after all tests have been executed:
        run.end();

    }
}