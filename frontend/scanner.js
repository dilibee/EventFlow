const API_URL = "https://script.google.com/macros/s/AKfycbw1i4OOsleUchpFMur7gAz6uSXIT_86o4BCeM2Zqgzq095UwKSNHf2JBa6b751W7Q1J/exec";

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
// CHECK TICKET
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


        // VALID TICKET
        if (data.success) {

            showSuccessResult(
                ticketID,
                data.name,
                data.partySize
            );

        }


        // DUPLICATE TICKET
        else if (
            data.message === "Already Checked In"
        ) {

            showDuplicateResult(
                data.name
            );

        }


        // INVALID TICKET
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
// SUCCESS RESULT
// =========================

function showSuccessResult(
    ticketID,
    name,
    partySize
) {

    const overlay =
        document.getElementById("resultOverlay");


    overlay.className =
        "approvedScreen";


    document.getElementById(
        "resultIcon"
    ).innerHTML = "✓";


    document.getElementById(
        "resultTitle"
    ).innerHTML =
        "CHECK-IN COMPLETE";


    document.getElementById(
        "resultTicket"
    ).innerHTML =
        "Ticket ID: " + ticketID;


    document.getElementById(
        "resultName"
    ).innerHTML =
        name;


    document.getElementById(
        "resultDetails"
    ).innerHTML =
        "Party Size: " + partySize;

}



// =========================
// DUPLICATE RESULT
// =========================

function showDuplicateResult(name) {

    const overlay =
        document.getElementById("resultOverlay");


    overlay.className =
        "warningScreen";


    document.getElementById(
        "resultIcon"
    ).innerHTML = "!";


    document.getElementById(
        "resultTitle"
    ).innerHTML =
        "ALREADY CHECKED IN";


    document.getElementById(
        "resultTicket"
    ).innerHTML =
        "";


    document.getElementById(
        "resultName"
    ).innerHTML =
        name;


    document.getElementById(
        "resultDetails"
    ).innerHTML =
        "No action required.";

}



// =========================
// INVALID TICKET RESULT
// =========================

function showInvalidResult(message) {

    const overlay =
        document.getElementById("resultOverlay");


    overlay.className =
        "deniedScreen";


    document.getElementById(
        "resultIcon"
    ).innerHTML = "×";


    document.getElementById(
        "resultTitle"
    ).innerHTML =
        "INVALID TICKET";


    document.getElementById(
        "resultTicket"
    ).innerHTML =
        "";


    document.getElementById(
        "resultName"
    ).innerHTML =
        message || "Guest Not Found";


    document.getElementById(
        "resultDetails"
    ).innerHTML =
        "Please verify the ticket and try again.";

}



// =========================
// CONNECTION ERROR
// =========================

function showConnectionError() {

    const overlay =
        document.getElementById("resultOverlay");


    overlay.className =
        "deniedScreen";


    document.getElementById(
        "resultIcon"
    ).innerHTML = "!";


    document.getElementById(
        "resultTitle"
    ).innerHTML =
        "CONNECTION ERROR";


    document.getElementById(
        "resultTicket"
    ).innerHTML =
        "";


    document.getElementById(
        "resultName"
    ).innerHTML =
        "Unable to reach EventFlow.";


    document.getElementById(
        "resultDetails"
    ).innerHTML =
        "Check your connection and try again.";

}



// =========================
// RESET SCANNER
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

            } catch (error) {

                console.log(error);

            }

        }

    }, 2000);

}



function hideResult() {

    document.getElementById(
        "resultOverlay"
    ).className = "";

}



// =========================
// STATUS HELPERS
// =========================

function updateStatus(message) {

    document.getElementById(
        "status"
    ).innerHTML =
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

        text.innerHTML =
            "Connected";

    }

    else {

        container.className =
            "connection-status error";

        text.innerHTML =
            "Connection Error";

    }

}



// =========================
// NAVIGATION
// =========================

function showScanView() {

    currentView = "scan";


    document
        .getElementById("scanView")
        .classList.add("active-view");


    document
        .getElementById("searchView")
        .classList.remove("active-view");


    document
        .getElementById("scanNav")
        .classList.add("active");


    document
        .getElementById("searchNav")
        .classList.remove("active");


    // Resume scanner when returning
    // to the Scan tab
    if (
        html5QrCode &&
        !processing
    ) {

        try {

            html5QrCode.resume();

        } catch (error) {

            console.log(error);

        }

    }

}



function showSearchView() {

    currentView = "search";


    document
        .getElementById("searchView")
        .classList.add("active-view");


    document
        .getElementById("scanView")
        .classList.remove("active-view");


    document
        .getElementById("searchNav")
        .classList.add("active");


    document
        .getElementById("scanNav")
        .classList.remove("active");


    // Pause scanner while using Search
    if (
        html5QrCode &&
        !processing
    ) {

        try {

            html5QrCode.pause(true);

        } catch (error) {

            console.log(error);

        }

    }

}



// =========================
// NAV BUTTON EVENTS
// =========================

document
    .getElementById("scanNav")
    .addEventListener(
        "click",
        showScanView
    );


document
    .getElementById("searchNav")
    .addEventListener(
        "click",
        showSearchView
    );



// =========================
// START APP
// =========================

startScanner();
