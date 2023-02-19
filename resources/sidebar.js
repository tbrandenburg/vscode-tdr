// Create instance of vs code api
const tsVscode = acquireVsCodeApi();

// Create reference to existing html elements
var techDebtFilterHigh = document.getElementById('techdebt-filter-high'),
  techDebtFilterMedium = document.getElementById('techdebt-filter-medium'),
  techDebtFilterLow = document.getElementById('techdebt-filter-low'),
  techDebtList = document.getElementById('techdebt-list');

// Add listener to checkboxes to trigger update
techDebtFilterHigh.addEventListener('change', update);
techDebtFilterMedium.addEventListener('change', update);
techDebtFilterLow.addEventListener('change', update);

// Do update if last interaction was after 500ms
let updateTimeout = null;
function update() {
  // Clear timeout if pending
  clearTimeout(updateTimeout);

  // Get tech debt filter options
  var options = (techDebtFilterHigh.checked ? 'h' : '') +
    (techDebtFilterMedium.checked ? 'm' : '') +
    (techDebtFilterLow.checked ? 'l' : '');

  // Set new timeout to prevent multiple calls on text input
  updateTimeout = setTimeout(function () {
    // Check if values are not empty
    if (options == '') {
      techDebtList.innerHTML = '';
      tsVscode.postMessage({ type: 'onError', message: 'Select at least one checkbox option' });
      return;
    } else {
      techDebtList.innerHTML = options;
    }
  }, 500);
}

// Listen for incoming messages
window.addEventListener('message', event => {
  switch (event.data.type) {
    case 'init':
      // Init tech debt list
      techDebtList.innerHTML = event.data.data;

      // Start update listener
      update();
      
      break;
  }
});

// Request dummy initially
tsVscode.postMessage({ type: 'tdsbInit' });