const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function main() {
  const howdyButton = document.getElementById("howdy");
  howdyButton.addEventListener("click", handleHowdyClick);

  document.getElementById('basic-grid').rowsData = [
	{Header1: 'Cell Data', Header2: 'Cell Data', Header3: 'Cell Data', Header4: 'Cell Data'},
	{Header1: 'Cell Data', Header2: 'Cell Data', Header3: 'Cell Data', Header4: 'Cell Data'},
	{Header1: 'Cell Data', Header2: 'Cell Data', Header3: 'Cell Data', Header4: 'Cell Data'},
];
}

function handleHowdyClick() {
  vscode.postMessage({
    command: "hello",
    text: "Hey there partner! 🤠",
  });
}

