// Create instance of vs code api
const tsVscode = acquireVsCodeApi();

// Create reference to existing html elements
var techDebtFilterHigh = document.getElementById('techdebt-filter-high'),
  techDebtFilterMedium = document.getElementById('techdebt-filter-medium'),
  techDebtFilterLow = document.getElementById('techdebt-filter-low');

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
    if (options === '') {
      // TODO
    } else {
      // TODO
    }
  }, 500);
}

// Listen for incoming messages
window.addEventListener('message', event => {

  switch (event.data.type) {
    case 'init':
      break;
    case 'tdrs':
      const tableBody = document.querySelector('#techdebt-table tbody');
      const tdrs = event.data.data;

      // Assuming it's a dictionary...
      for (let key in tdrs) {
        const tr = document.createElement('tr');
        const tdId = document.createElement('td');
        const tdTitle = document.createElement('td');
        tdId.textContent = key;
        tdTitle.textContent = tdrs[key].resource.metadata.title;
        tr.appendChild(tdId);
        tr.appendChild(tdTitle);
        tableBody.appendChild(tr);
      }
      break;
    default:
      break;
  }
});

// Start update listener
update();