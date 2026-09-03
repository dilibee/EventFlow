const API_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL";

let html5QrCode;
let processing = false;
let currentView = "scan";


// =========================
// START SCANNER
// =========================

function startScanner() {

    updateStatus("Starting camera...");

    html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(

        {
            facingMode: "environment"
        },

        {
            fps: 20,
            qrbox: 280
        },

        (decodedText) => {

            if (processing) return;

            processing = true;

            html5QrCode.pause();

            checkTicket(decodedText);

        },

        () => {
            // Ignore normal scan errors
        }

    )
    .then(() => {

        updateStatus("Ready to scan...");
        setConnectionStatus(true);

    })
    .catch(error => {

        console.log(error);

        updateStatus("Camera failed to start.");
        setConnectionStatus(false);

    });

}


// =========================
// QR CHECK-IN
// =========================

function checkTicket(ticketID) {

    updateStatus("Checking ticket...");

    fetch(
        API_URL +
        "?id=" +
        encodeURIComponent(ticketID)
    )

    .then(response => {

        if (!response.ok) {
            throw new Error("API request failed");
        }

        return response.json();

    })

    .then(data => {

        setConnectionStatus(true);


        if (data.success) {

            showSuccessResult(
                ticketID,
                data.name,
                data.partySize
            );

        }

        else if (
            data.message === "Already Checked In"
        ) {

            showDuplicateResult(
                data.name
            );

        }

        else {

            showInvalidResult(
                data.message
            );

        }


        resetScannerAfterDelay();

    })

    .catch(error => {

        console.log(error);

        setConnectionStatus(false);

        showConnectionError();

        resetScannerAfterDelay();

    });

}


// =========================
// SEARCH GUESTS
// =========================

function searchGuests() {

    const input =
        document.getElementById(
            "guestSearchInput"
        );

    const query =
        input.value.trim();

    const status =
        document.getElementById(
            "searchStatus"
        );

    const resultsContainer =
        document.getElementById(
            "searchResults"
        );


    resultsContainer.innerHTML = "";


    if (!query) {

        status.textContent =
            "Enter a guest name to search.";

        return;

    }


    status.textContent =
        "Searching...";


    fetch(
        API_URL +
        "?action=search&q=" +
        encodeURIComponent(query)
    )

    .then(response => {

        if (!response.ok) {
            throw new Error(
                "Search request failed"
            );
        }

        return response.json();

    })

    .then(data => {

        setConnectionStatus(true);


        if (
            !data.success ||
            !data.results
        ) {

            throw new Error(
                "Invalid search response"
            );

        }


        displaySearchResults(
            data.results
        );

    })

    .catch(error => {

        console.log(error);

        setConnectionStatus(false);

        status.textContent =
            "Unable to search EventFlow.";

    });

}


// =========================
// DISPLAY SEARCH RESULTS
// =========================

function displaySearchResults(results) {

    const status =
        document.getElementById(
            "searchStatus"
        );

    const container =
        document.getElementById(
            "searchResults"
        );


    container.innerHTML = "";


    if (results.length === 0) {

        status.textContent =
            "No guests found.";

        return;

    }


    status.textContent =
        results.length === 1
            ? "1 guest found."
            : results.length +
              " guests found.";


    results.forEach(guest => {

        const card =
            document.createElement("div");

        card.className =
            "guest-result-card";


        // -------------------------
        // Guest Name
        // -------------------------

        const name =
            document.createElement("h3");

        name.className =
            "guest-result-name";

        name.textContent =
            guest.name;


        // -------------------------
        // Party Size
        // -------------------------

        const party =
            document.createElement("div");

        party.className =
            "guest-result-info";

        party.textContent =
            "Party of " +
            guest.partySize;


        // -------------------------
        // Ticket ID
        // -------------------------

        const ticket =
            document.createElement("div");

        ticket.className =
            "guest-result-info";

        ticket.textContent =
            "Ticket ID: " +
            guest.ticketID;


        // -------------------------
        // Status
        // -------------------------

        const guestStatus =
            document.createElement("div");

        guestStatus.className =
            "guest-result-info";


        if (guest.checkedIn) {

            guestStatus.textContent =
                "✓ Already Checked In";

        }
        else {

            guestStatus.textContent =
                "Not Checked In";

        }


        // -------------------------
        // Check-In Button
        // -------------------------

        const button =
            document.createElement("button");

        button.className =
            "manual-checkin-button";


        if (guest.checkedIn) {

            button.textContent =
                "Already Checked In";

            button.disabled = true;

        }
        else {

            button.textContent =
                "Check In";

            button.addEventListener(
                "click",
                () => {

                    manualCheckIn(
                        guest,
                        button
                    );

                }
            );

        }


        // Add everything to card

        card.appendChild(name);
        card.appendChild(party);
        card.appendChild(ticket);
        card.appendChild(guestStatus);
        card.appendChild(button);


        container.appendChild(card);

    });

}


// =========================
// MANUAL CHECK-IN
// =========================

function manualCheckIn(
    guest,
    button
) {

    if (processing) return;

    processing = true;


    button.disabled = true;
    button.textContent =
        "Checking In...";


    const status =
        document.getElementById(
            "searchStatus"
        );

    status.textContent =
        "Checking in " +
        guest.name +
        "...";


    fetch(
        API_URL +
        "?action=manual-checkin&id=" +
        encodeURIComponent(
            guest.ticketID
        )
    )

    .then(response => {

        if (!response.ok) {

            throw new Error(
                "Manual check-in request failed"
            );

        }

        return response.json();

    })

    .then(data => {

        setConnectionStatus(true);


        if (data.success) {

            showSuccessResult(
                guest.ticketID,
                data.name,
                data.partySize
            );

        }

        else if (
            data.message ===
            "Already Checked In"
        ) {

            showDuplicateResult(
                data.name
            );

        }

        else {

            showInvalidResult(
                data.message
            );

        }


        resetManualCheckInAfterDelay();

    })

    .catch(error => {

        console.log(error);

        setConnectionStatus(false);

        showConnectionError();

        resetManualCheckInAfterDelay();

    });

}


// =========================
// SUCCESS RESULT
// =========================

function showSuccessResult(
    ticketID,
    name,
    partySize
) {

    const overlay =
        document.getElementById(
            "resultOverlay"
        );


    overlay.className =
        "approvedScreen";


    document.getElementById(
        "resultIcon"
    ).textContent =
        "✓";


    document.getElementById(
        "resultTitle"
    ).textContent =
        "CHECK-IN COMPLETE";


    document.getElementById(
        "resultTicket"
    ).textContent =
        "Ticket ID: " +
        ticketID;


    document.getElementById(
        "resultName"
    ).textContent =
        name;


    document.getElementById(
        "resultDetails"
    ).textContent =
        "Party Size: " +
        partySize;

}


// =========================
// DUPLICATE RESULT
// =========================

function showDuplicateResult(name) {

    const overlay =
        document.getElementById(
            "resultOverlay"
        );


    overlay.className =
        "warningScreen";


    document.getElementById(
        "resultIcon"
    ).textContent =
        "!";


    document.getElementById(
        "resultTitle"
    ).textContent =
        "ALREADY CHECKED IN";


    document.getElementById(
        "resultTicket"
    ).textContent =
        "";


    document.getElementById(
        "resultName"
    ).textContent =
        name;


    document.getElementById(
        "resultDetails"
    ).textContent =
        "No action required.";

}


// =========================
// INVALID TICKET RESULT
// =========================

function showInvalidResult(message) {

    const overlay =
        document.getElementById(
            "resultOverlay"
        );


    overlay.className =
        "deniedScreen";


    document.getElementById(
        "resultIcon"
    ).textContent =
        "×";


    document.getElementById(
        "resultTitle"
    ).textContent =
        "INVALID TICKET";


    document.getElementById(
        "resultTicket"
    ).textContent =
        "";


    document.getElementById(
        "resultName"
    ).textContent =
        message ||
        "Guest Not Found";


    document.getElementById(
        "resultDetails"
    ).textContent =
        "Please verify the ticket and try again.";

}


// =========================
// CONNECTION ERROR
// =========================

function showConnectionError() {

    const overlay =
        document.getElementById(
            "resultOverlay"
        );


    overlay.className =
        "deniedScreen";


    document.getElementById(
        "resultIcon"
    ).textContent =
        "!";


    document.getElementById(
        "resultTitle"
    ).textContent =
        "CONNECTION ERROR";


    document.getElementById(
        "resultTicket"
    ).textContent =
        "";


    document.getElementById(
        "resultName"
    ).textContent =
        "Unable to reach EventFlow.";


    document.getElementById(
        "resultDetails"
    ).textContent =
        "Check your connection and try again.";

}


// =========================
// RESET QR SCANNER
// =========================

function resetScannerAfterDelay() {

    setTimeout(() => {

        hideResult();

        updateStatus(
            "Ready to scan..."
        );

        processing = false;


        if (
            currentView === "scan" &&
            html5QrCode
        ) {

            try {

                html5QrCode.resume();

            }
            catch (error) {

                console.log(error);

            }

        }

    }, 2000);

}


// =========================
// RESET MANUAL CHECK-IN
// =========================

function resetManualCheckInAfterDelay() {

    setTimeout(() => {

        hideResult();

        processing = false;


        // Refresh current search so the
        // guest immediately shows as checked in
        if (currentView === "search") {

            searchGuests();

        }

    }, 2000);

}


// =========================
// HIDE RESULT
// =========================

function hideResult() {

    document.getElementById(
        "resultOverlay"
    ).className =
        "";

}


// =========================
// STATUS HELPERS
// =========================

function updateStatus(message) {

    document.getElementById(
        "status"
    ).textContent =
        message;

}


function setConnectionStatus(
    connected
) {

    const container =
        document.getElementById(
            "connectionStatus"
        );

    const text =
        document.getElementById(
            "connectionText"
        );


    if (connected) {

        container.className =
            "connection-status connected";

        text.textContent =
            "Connected";

    }

    else {

        container.className =
            "connection-status error";

        text.textContent =
            "Connection Error";

    }

}


// =========================
// NAVIGATION
// =========================

function showScanView() {

    currentView =
        "scan";


    document
        .getElementById(
            "scanView"
        )
        .classList.add(
            "active-view"
        );


    document
        .getElementById(
            "searchView"
        )
        .classList.remove(
            "active-view"
        );


    document
        .getElementById(
            "scanNav"
        )
        .classList.add(
            "active"
        );


    document
        .getElementById(
            "searchNav"
        )
        .classList.remove(
            "active"
        );


    if (
        html5QrCode &&
        !processing
    ) {

        try {

            html5QrCode.resume();

        }
        catch (error) {

            console.log(error);

        }

    }

}


function showSearchView() {

    currentView =
        "search";


    document
        .getElementById(
            "searchView"
        )
        .classList.add(
            "active-view"
        );


    document
        .getElementById(
            "scanView"
        )
        .classList.remove(
            "active-view"
        );


    document
        .getElementById(
            "searchNav"
        )
        .classList.add(
            "active"
        );


    document
        .getElementById(
            "scanNav"
        )
        .classList.remove(
            "active"
        );


    if (
        html5QrCode &&
        !processing
    ) {

        try {

            html5QrCode.pause(true);

        }
        catch (error) {

            console.log(error);

        }

    }


    setTimeout(() => {

        document
            .getElementById(
                "guestSearchInput"
            )
            .focus();

    }, 100);

}


// =========================
// BUTTON EVENTS
// =========================

document
    .getElementById(
        "scanNav"
    )
    .addEventListener(
        "click",
        showScanView
    );


document
    .getElementById(
        "searchNav"
    )
    .addEventListener(
        "click",
        showSearchView
    );


document
    .getElementById(
        "guestSearchButton"
    )
    .addEventListener(
        "click",
        searchGuests
    );


document
    .getElementById(
        "guestSearchInput"
    )
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                searchGuests();

            }

        }
    );


// =========================
// START APP
// =========================

startScanner();
