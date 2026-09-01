const API_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL";

let html5QrCode;
let processing = false;


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
        document.getElementById(
            "resultOverlay"
        );


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
        document.getElementById(
            "resultOverlay"
        );


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
        document.getElementById(
            "resultOverlay"
        );


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
        document.getElementById(
            "resultOverlay"
        );


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

        html5QrCode.resume();

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
// START APP
// =========================

startScanner();
