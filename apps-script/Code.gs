const GUESTS_SHEET = "Guests";
const LOGS_SHEET = "Logs";
const CONFIG_SHEET = "Config";

function doGet(e) {

  const action =
    String(e.parameter.action || "")
      .trim()
      .toLowerCase();


  // =========================
  // SEARCH GUESTS
  // =========================

  if (action === "search") {

    const query =
      String(e.parameter.q || "").trim();

    const results =
      searchGuests(query);

    return sendResponse({
      success: true,
      results: results
    });

  }


  // =========================
  // MANUAL CHECK-IN
  // =========================

  if (action === "manual-checkin") {

    const ticketID =
      String(e.parameter.id || "").trim();

    if (!ticketID) {

      return sendResponse({
        success: false,
        message: "No ticket ID provided"
      });

    }


    const result =
      checkInGuest(
        ticketID,
        "Manual"
      );

    return sendResponse(result);

  }


  // =========================
  // QR CHECK-IN
  // =========================

  const ticketID =
    String(e.parameter.id || "").trim();


  if (!ticketID) {

    return sendResponse({
      success: false,
      message: "No ticket ID provided"
    });

  }


  const result =
    checkInGuest(
      ticketID,
      "QR"
    );

  return sendResponse(result);

}

function findGuestByTicket(ticketID) {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const guestSheet = ss.getSheetByName(GUESTS_SHEET);

  const data = guestSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {

    const currentTicketID = String(data[i][0]).trim();

    if (currentTicketID === ticketID) {

      return {
        row: i + 1,
        ticketID: data[i][0],
        name: data[i][1],
        partySize: data[i][2],
        checkedIn: data[i][3],
        checkInTime: data[i][4]
      };

    }

  }

  return null;
}

function checkInGuest(ticketID, method = "QR") {

  const lock = LockService.getScriptLock();

  try {

    // Wait up to 5 seconds for another check-in to finish
    lock.waitLock(5000);


    const guest = findGuestByTicket(ticketID);


    // Ticket does not exist
    if (guest === null) {

      return {
        success: false,
        message: "Guest Not Found"
      };

    }


    // Guest already checked in
    if (String(guest.checkedIn).trim().toUpperCase() === "YES") {

      return {
        success: false,
        message: "Already Checked In",
        name: guest.name,
        partySize: guest.partySize,
        checkInTime: guest.checkInTime
      };

    }


    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const guestSheet = ss.getSheetByName(GUESTS_SHEET);

    const checkInTime = new Date();


    // Column D = Checked In
    guestSheet
      .getRange(guest.row, 4)
      .setValue("YES");


    // Column E = Check-In Time
    guestSheet
      .getRange(guest.row, 5)
      .setValue(checkInTime);


    // Record check-in in Logs
    logCheckIn(guest, method, "Approved");


    return {
      success: true,
      message: "Approved",
      name: guest.name,
      partySize: guest.partySize,
      checkInTime: checkInTime
    };


  } finally {

    lock.releaseLock();

  }

}

function logCheckIn(guest, method, result) {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const logsSheet = ss.getSheetByName(LOGS_SHEET);

  logsSheet.appendRow([
    new Date(),
    guest.ticketID,
    guest.name,
    guest.partySize,
    method,
    result
  ]);

}

function sendResponse(data) {

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function searchGuests(query) {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const guestSheet =
    ss.getSheetByName(GUESTS_SHEET);

  const data =
    guestSheet.getDataRange().getValues();


  const searchTerm =
    String(query)
      .trim()
      .toLowerCase();


  if (!searchTerm) {
    return [];
  }


  const results = [];


  for (let i = 1; i < data.length; i++) {

    const ticketID =
      String(data[i][0]).trim();

    const name =
      String(data[i][1]).trim();


    if (!ticketID || !name) {
      continue;
    }


    if (
      name
        .toLowerCase()
        .includes(searchTerm)
    ) {

      results.push({

        ticketID: ticketID,

        name: name,

        partySize:
          data[i][2],

        checkedIn:
          String(data[i][3])
            .trim()
            .toUpperCase() === "YES",

        checkInTime:
          data[i][4] || ""

      });

    }

  }


  return results;

}

