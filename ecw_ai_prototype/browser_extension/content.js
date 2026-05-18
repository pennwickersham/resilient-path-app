chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "scrape_patient_data") {
    
    // NOTE: These selectors are highly dependent on the specific version of eClinicalWorks Web you are using.
    // They usually use iFrames or specific div IDs. This is a heuristic/generic scraper for the prototype.
    
    function extractTextByLabel(labelText) {
      // Very naive DOM search for a label and its adjacent value
      const elements = Array.from(document.querySelectorAll('label, span, div'));
      const label = elements.find(el => el.textContent.toLowerCase().includes(labelText.toLowerCase()));
      if (label && label.nextElementSibling) {
        return label.nextElementSibling.textContent.trim();
      }
      return "Not found";
    }

    // Try to get all text from the main encounter/chart area (often an iframe or a specific container)
    // As a fallback, we grab the body's innerText, but that can be very noisy.
    const fullPageText = document.body.innerText;
    
    // Heuristic data object
    const patientData = {
      demographics: {
        name: extractTextByLabel("Patient Name") || extractTextByLabel("Name"),
        dob: extractTextByLabel("DOB") || extractTextByLabel("Date of Birth"),
      },
      history: {
        // eCW often stores problem lists in a table with specific classes.
        // We capture the raw text of the page and let the LLM sort it out for this prototype,
        // but ideally you'd want: `document.querySelector('#problemListTable').innerText`
        raw_clinical_text: fullPageText.substring(0, 5000) // First 5k chars to avoid token limits
      }
    };

    sendResponse({ data: patientData });
  }
  return true;
});
