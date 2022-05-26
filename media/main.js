//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    document.querySelector('#sign-button').addEventListener('click', () => {
        const input = document.getElementById('input-text').value;
        console.log(input);
        vscode.postMessage({ type: 'sign-text', value: input });
    });

}());