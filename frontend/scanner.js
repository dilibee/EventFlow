const API_URL = "https://script.google.com/macros/s/AKfycbw1i4OOsleUchpFMur7gAz6uSXIT_86o4BCeM2Zqgzq095UwKSNHf2JBa6b751W7Q1J/exec";

let html5QrCode;
let processing = false;


// Start scanner
function startScanner() {

    html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(

        {
            facingMode: "environment"
        },

        {
            fps: 20,
            qrbox: 300
        },

        (decodedText) => {

            if (processing) return;

            processing = true;

            html5QrCode.pause();

            checkTicket(decodedText);

        },

        () => {
            // Ignore scan errors while camera searches for a QR code
        }

    )
    .catch(error => {

        console.log(error);

        document.getElementById("status").innerHTML =
            "Camera failed to start.";

    });

}



// Send ticket ID to EventFlow backend
function checkTicket(ticketID) {

    document.getElementById("status").innerHTML =
        "Checking ticket...";

    fetch(API_URL + "?id=" + encodeURIComponent(ticketID))

    .then(response => response.json())

    .then(data => {

        if (data.success) {

            showResult(
                true,
                "APPROVED",
                data.name
            );

            if (navigator.vibrate) {
                navigator.vibrate(200);
            }

        } else {

            showResult(
                false,
                "DENIED",
                data.message
            );

            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }

        }


        setTimeout(() => {

            hideResult();

            document.getElementById("status").innerHTML =
                "Ready to scan...";

            processing = false;

            html5QrCode.resume();

        }, 1500);

    })

    .catch(error => {

        console.log(error);

        showResult(
            false,
            "ERROR",
            "Unable to connect to EventFlow."
        );

        setTimeout(() => {

            hideResult();

            document.getElementById("status").innerHTML =
                "Ready to scan...";

            processing = false;

            html5QrCode.resume();

        }, 1500);

    });

}



// Show full-screen scan result
function showResult(success, title, message) {

    const overlay =
        document.getElementById("resultOverlay");

    overlay.className =
        success ? "approvedScreen" : "deniedScreen";

    document.getElementById("resultTitle").innerHTML =
        title;

    document.getElementById("resultName").innerHTML =
        message;

}



// Hide result screen
function hideResult() {

    document.getElementById("resultOverlay").className = "";

}



startScanner();
