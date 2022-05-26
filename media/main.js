//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    document.querySelector('#exec-button').addEventListener('click', () => {
        const input = document.getElementById('input-text').value;
        console.log(input);
        vscode.postMessage({ type: 'exec-text', value: input });
    });

}());