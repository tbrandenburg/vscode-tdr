// ---------------------------------------------------------------------------
// Constants and variables
// ---------------------------------------------------------------------------

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
var updateTimeout = null;

// Do update if last interaction was after 500ms
var lastTDRs = null;

// Last selected TDR ID
var curTdrId = null;

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

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

function updateInput(attribute, value) {
  var input = $("input[id='techdebt-" + attribute + "']");
  if(input) {
    input.val(value);
  }
}

function addChangeListener(attribute) {
  $(document).ready(function() {
    $("input[id='techdebt-" + attribute + "']").change(function() {
      if(lastTDRs && curTdrId) {
        // Do something when the input value changes
        var inputValue = $(this).val();
        // Change attribute
        lastTDRs[curTdrId].resource.metadata[attribute] = inputValue;
        tsVscode.postMessage({type: 'onTDChange', message: curTdrId});
      }
    });
  });
}

function displayTDR(id) {
  if(lastTDRs && id) {
    updateInput("title",             lastTDRs[id].resource.metadata.title);
    updateInput("owner",             lastTDRs[id].resource.metadata.owner);
    updateInput("status",            lastTDRs[id].resource.metadata.status);
    updateInput("resolution",        lastTDRs[id].resource.metadata.resolution);
    updateInput("type",              lastTDRs[id].resource.metadata.type);
    updateInput("severity",          lastTDRs[id].resource.metadata.severity);
    updateInput("priority",          lastTDRs[id].resource.metadata.priority);
    updateInput("workitem",          lastTDRs[id].resource.metadata.workitem);
    updateInput("cost",              lastTDRs[id].resource.metadata.cost);
    updateInput("effort",            lastTDRs[id].resource.metadata.effort);
    updateInput("detectionPhase",    lastTDRs[id].resource.metadata.detectionPhase);
    updateInput("detectionMethod",   lastTDRs[id].resource.metadata.detectionMethod);
    updateInput("injectionPhase",    lastTDRs[id].resource.metadata.injectionPhase);
    updateInput("injectionQualifier",lastTDRs[id].resource.metadata.injectionQualifier);
    updateInput("tags",              lastTDRs[id].resource.metadata.tags);
  }
}

function addChangeListeners() {
    addChangeListener("title");
    addChangeListener("owner");
    addChangeListener("status");
    addChangeListener("resolution");
    addChangeListener("type");
    addChangeListener("severity");
    addChangeListener("priority");
    addChangeListener("workitem");
    addChangeListener("cost");
    addChangeListener("effort");
    addChangeListener("detectionPhase");
    addChangeListener("detectionMethod");
    addChangeListener("injectionPhase");
    addChangeListener("injectionQualifier");
    addChangeListener("tags");
}

// ---------------------------------------------------------------------------
// Callbacks
// ---------------------------------------------------------------------------

// Listen for incoming messages
window.addEventListener('message', event => {

  switch (event.data.type) {
    case 'init':
      break;
    case 'tdrs':
      const tableBody = document.querySelector('#techdebt-table tbody');
      lastTDRs = event.data.data;

      // Initially reset content
      tableBody.innerHTML = '';

      // Assuming it's a dictionary...
      for (let key in lastTDRs) {
        const tr = document.createElement('tr');
        const tdTitle = document.createElement('td');
        tr.id = key;
        tdTitle.textContent = lastTDRs[key].resource.metadata.title;
        tr.appendChild(tdTitle);
        tableBody.appendChild(tr);
      }
      break;
    default:
      break;
  }
});

$(document).ready(function () {
  $('table').on('click','tr', function() {
    curTdrId = $(this).attr('id');

    if(curTdrId) {
      displayTDR(curTdrId);
      tsVscode.postMessage({type: 'onTDClick', message: curTdrId});
    }
  });
});

// ---------------------------------------------------------------------------
// Function calls
// ---------------------------------------------------------------------------

// Start update listener
update();

// Initialize technical debts if opened
tsVscode.postMessage({type: 'update'});

// Add change listeners
addChangeListeners();