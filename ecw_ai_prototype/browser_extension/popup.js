document.addEventListener('DOMContentLoaded', () => {
  const btnSummary = document.getElementById('btn-summary');
  const btnPriorAuth = document.getElementById('btn-prior-auth');
  const statusDiv = document.getElementById('status');
  const targetInput = document.getElementById('target-req');

  function showStatus(msg) {
    statusDiv.style.display = 'block';
    statusDiv.textContent = msg;
  }

  function executeAction(action, target = null) {
    showStatus('Extracting data from eCW...');
    
    // Send message to the content script in the active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { command: "scrape_patient_data" }, (response) => {
        if (chrome.runtime.lastError) {
          showStatus('Error: Could not connect to the page. Make sure you are on a patient chart.');
          return;
        }

        if (response && response.data) {
          showStatus('Data extracted. Sending to local Gemma4 model...');
          
          // Send to local Python API
          const payload = {
            action: action,
            patient_data: response.data,
            target: target
          };

          fetch('http://localhost:8080', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              showStatus('Error from Local AI: ' + data.error);
            } else {
              showStatus('Result:\n\n' + data.result);
            }
          })
          .catch(err => {
            showStatus('Failed to connect to Local AI server. Is server.py running on port 8080?\n' + err);
          });

        } else {
          showStatus('Failed to extract data.');
        }
      });
    });
  }

  btnSummary.addEventListener('click', () => {
    executeAction('generate_summary');
  });

  btnPriorAuth.addEventListener('click', () => {
    const target = targetInput.value.trim();
    if (!target) {
      showStatus('Please enter a target request (e.g. MRI Left Knee) for the Prior Auth.');
      return;
    }
    executeAction('generate_prior_auth', target);
  });
});
