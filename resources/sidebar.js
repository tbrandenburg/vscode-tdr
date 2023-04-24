// ---------------------------------------------------------------------------
// Constants and variables
// ---------------------------------------------------------------------------

// Create instance of vs code api
const tsVscode = acquireVsCodeApi();

// Create reference to existing html elements
var techDebtFilterHigh = document.getElementById('techdocrec-filter-high'),
  techDebtFilterMedium = document.getElementById('techdocrec-filter-medium'),
  techDebtFilterLow = document.getElementById('techdocrec-filter-low');

// Add listener to checkboxes to trigger update
techDebtFilterHigh.addEventListener('change', update);
techDebtFilterMedium.addEventListener('change', update);
techDebtFilterLow.addEventListener('change', update);

// Do update if last interaction was after 500ms
var updateTimeout = null;

// Last set TDRs
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
  var input = $("input[id='techdocrec-" + attribute + "']");
  if (input) {
    input.val(value);
  }
}

function addChangeListener(attribute, value) {
  $(document).ready(function () {
    $("input[id='techdocrec-" + attribute + "']").change(function () {
      notifyAttribute(attribute, $(this).val());
    });
  });
}

function notifyAttribute(attribute, value) {
  if (lastTDRs && curTdrId) {
    // Do something when the input value changes
    var inputValue = value;
    // Change attribute
    lastTDRs[curTdrId].resource.metadata[attribute] = inputValue;
    tsVscode.postMessage({ type: 'onTDChange', id: curTdrId, attribute: attribute, value: inputValue });
  }
}

function displayTDR(id) {
  if (lastTDRs && id) {
    updateInput("title", lastTDRs[id].resource.metadata.title);
    updateInput("owner", lastTDRs[id].resource.metadata.owner);
    updateInput("status", lastTDRs[id].resource.metadata.status);
    updateInput("resolution", lastTDRs[id].resource.metadata.resolution);
    updateInput("type", lastTDRs[id].resource.metadata.type);
    updateInput("severity", lastTDRs[id].resource.metadata.severity);
    updateInput("priority", lastTDRs[id].resource.metadata.priority);
    updateInput("workitem", lastTDRs[id].resource.metadata.workitem);
    updateInput("cost", lastTDRs[id].resource.metadata.cost);
    updateInput("effort", lastTDRs[id].resource.metadata.effort);
    updateInput("detectionPhase", lastTDRs[id].resource.metadata.detectionPhase);
    updateInput("detectionMethod", lastTDRs[id].resource.metadata.detectionMethod);
    updateInput("injectionPhase", lastTDRs[id].resource.metadata.injectionPhase);
    updateInput("injectionQualifier", lastTDRs[id].resource.metadata.injectionQualifier);
    updateInput("tags", lastTDRs[id].resource.metadata.tags);
    updateInput("requirements", lastTDRs[id].resource.metadata.requirements);
  }
}

function clearInputs() {
  $('input[type="text"], input[type="number"], textarea').val('');
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
      const tableBody = document.querySelector('#techdocrec-table tbody');
      lastTDRs = event.data.data;

      // Initially reset content
      tableBody.innerHTML = '';

      foundCurTdrId = false;

      // Assuming it's a dictionary...
      for (let key in lastTDRs) {
        const tr = document.createElement('tr');
        tr.id = key;

        // Type
        const tdType = document.createElement('td');
        tdType.textContent = lastTDRs[key].resource.metadata.type;
        tr.appendChild(tdType);

        // Status
        const tdStatus = document.createElement('td');
        tdStatus.textContent = lastTDRs[key].resource.metadata.status;
        tr.appendChild(tdStatus);

        // Title
        const tdTitle = document.createElement('td');
        tdTitle.textContent = lastTDRs[key].resource.metadata.title;
        tr.appendChild(tdTitle);

        // Owner
        const tdOwner = document.createElement('td');
        tdOwner.textContent = lastTDRs[key].resource.metadata.owner;
        tr.appendChild(tdOwner);

        tableBody.appendChild(tr);

        if (key === curTdrId) {
          foundCurTdrId = true;
        }
      }

      if (!foundCurTdrId) {
        curTdrId = null;
        clearInputs();
      }
      break;
    default:
      break;
  }
});

$(document).ready(function () {
  // TDR table td on-click events
  $('table').on('click', 'tr', function () {
    curTdrId = $(this).attr('id');

    if (curTdrId) {
      displayTDR(curTdrId);
      tsVscode.postMessage({ type: 'onTDClick', id: curTdrId });
    }
  });

  // TDR table th on-click events
  $('table').on('click', 'th', function () {
    var index = $(this).index();
    var rows = $(this).closest('table').find('tr');

    rows.sort(function (a, b) {
      var aValue = $(a).children("td").eq(index).text();
      var bValue = $(b).children("td").eq(index).text();

      if ($.isNumeric(aValue) && $.isNumeric(bValue)) {
        return aValue - bValue;
      } else {
        return aValue.localeCompare(bValue);
      }
    });

    $.each(rows, function (index, row) {
      $("#meineTabelle tbody").append(row);
    });
  });

  // Remove button on-click event
  $("#techdocrec-button-remove").on("click", function () {
    if (curTdrId) {
      tsVscode.postMessage({ type: 'onTDRemove', id: curTdrId });
    }
  });
});

// ---------------------------------------------------------------------------
// Function calls
// ---------------------------------------------------------------------------

// Start update listener
update();

// Initialize technical debts if opened
tsVscode.postMessage({ type: 'update' });