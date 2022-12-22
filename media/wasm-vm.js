const vscode = acquireVsCodeApi();

window.addEventListener("load", main);
var responses = [];

function main() {
  const instantiateButton = document.getElementById("instantiateBtn");
  instantiateButton.addEventListener("click", handleInstantiateClick);

  const executeButton = document.getElementById("executeBtn");
  executeButton.addEventListener("click", handleExecuteClick);

  const queryButton = document.getElementById("queryBtn");
  queryButton.addEventListener("click", handleQueryClick);

  document.getElementById('vm-responses-grid').rowsData = [];
  document.getElementById('vm-responses-grid').columnDefinitions = [
    { title: '#', columnDataKey: 'Header1' },
    { title: '✅', columnDataKey: 'Header2' },
    { title: 'Event Type', columnDataKey: 'Header3' },
    { title: 'Attribute', columnDataKey: 'Header4' },
    { title: 'Value', columnDataKey: 'Header5' },
  ];

  document.getElementById('contracts-grid').rowsData = [{}];
  document.getElementById('contracts-grid').columnDefinitions = [
    { title: '#', columnDataKey: 'Header1' },
    { title: 'Label', columnDataKey: 'Header3' },
    { title: 'Address', columnDataKey: 'Header4' },
  ];

  // Handle the message inside the webview
  window.addEventListener('message', event => {
    const message = event.data; // The JSON data the extension sent
    switch (message.command) {
      case 'instantiate-res':
        responses.push(message.value);
        displayResponseDataGrid();
        document.getElementById('response').value = JSON.stringify(message.value.val.data, undefined, 2);
        break;
      case 'execute-res':
        responses.push(message.value);
        displayResponseDataGrid();
        document.getElementById('response').value = JSON.stringify(message.value.val.data, undefined, 2);
        break;
      case 'query-res':
        document.getElementById('response').value = JSON.stringify(message.value.val, undefined, 2);
        break;
      case 'append-contract':
        const length = document.getElementById('contracts-grid').rowsData.length;
        document.getElementById('contracts-grid').rowsData.push({ Header1: length, Header3: message.value.label, Header4: message.value.address});
        break;
    }
  });

}

function displayResponseDataGrid() {
  document.getElementById('vm-responses-grid').rowsData = [{}];
  let count = responses.length;
  const reverseArr = responses.slice().reverse();
  for (const message of reverseArr) {
    if (message.ok && !message.err) {
      document.getElementById('vm-responses-grid').rowsData.push({ Header1: count, Header2: '🎉' });
      for (const event of message.val.events) {
        for (const attribute of event.attributes) {
          document.getElementById('vm-responses-grid').rowsData.push({ Header3: event.type, Header4: attribute.key, Header5: attribute.value });
        }
      }
    }
    else {
      document.getElementById('vm-responses-grid').rowsData.push({ Header1: count, Header2: '❌', Header3: message.val, Header4: message._stack });
    }
    count -= 1;
  }
}

function handleInstantiateClick() {
  const instantiateSenderAddr = document.getElementById("instantiateSenderAddr").value;
  const instantiateLabel = document.getElementById("instantiateLabel").value;
  const instantiateFunds = document.getElementById("instantiateFunds").value;
  const instantiateInput = document.getElementById("instantiateInput").value;

  vscode.postMessage({
    command: "instantiate",
    value: {
      senderAddr: instantiateSenderAddr,
      label: instantiateLabel,
      funds: instantiateFunds,
      input: instantiateInput
    },
  });
}

function handleExecuteClick() {
  const executeContractAddr = document.getElementById("executeContractAddr").value;
  const executeSenderAddr = document.getElementById("executeSenderAddr").value;
  const executeFunds = document.getElementById("executeFunds").value;
  const executeInput = document.getElementById("executeInput").value;

  vscode.postMessage({
    command: "execute",
    value: {
      ContractAddr: executeContractAddr,
      senderAddr: executeSenderAddr,
      funds: executeFunds,
      input: executeInput
    },
  });
}

function handleQueryClick() {
  const queryContractAddr = document.getElementById("queryContractAddr").value; 
  const queryInput = document.getElementById("queryInput").value;

  vscode.postMessage({
    command: "query",
    value: {
      ContractAddr: queryContractAddr,
      input: queryInput
    },
  });
}

