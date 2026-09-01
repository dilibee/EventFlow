const API_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL";

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
            // Ignore scan errors
        }

    )
    .catch(error => {

        console.log(error);

        document.getElementById("status").innerHTML =
        "Camera failed";

    });

}



// Check ticket
function checkTicket(ticketID) {


    document.getElementById("status").innerHTML =
    "🔎 Checking ticket...";


    fetch(API_URL + "?id=" + encodeURIComponent(ticketID))

    .then(response => response.json())

    .then(data => {


        if (data.success) {


            showResult(
                true,
                "✅ APPROVED",
                data.name,
                ""
            );


            if(navigator.vibrate){
                navigator.vibrate(200);
            }


        } 
        
        else {


            showResult(
                false,
                "❌ DENIED",
                data.message,
                data.name || ""
            );


            if(navigator.vibrate){
                navigator.vibrate([200,100,200]);
            }

        }



        setTimeout(() => {


            hideResult();


            document.getElementById("status").innerHTML =
            "Ready to scan...";


            processing = false;


            html5QrCode.resume();


        },1500);



    })


    .catch(error => {


        console.log(error);


        showResult(
            false,
            "❌ ERROR",
            "Database connection failed",
            ""
        );


        setTimeout(()=>{

            hideResult();

            processing=false;

            html5QrCode.resume();

        },1500);


    });

}



// Full screen result
function showResult(success,title,name,guests){


    let overlay =
    document.getElementById("resultOverlay");


    overlay.className =
    success ? "approvedScreen" : "deniedScreen";


    document.getElementById("resultTitle").innerHTML =
    title;


    document.getElementById("resultName").innerHTML =
    name;
}



function hideResult(){

    document.getElementById("resultOverlay").className="";

}



startScanner();
