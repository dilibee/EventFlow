const DASHBOARD_SLIDE_ID = "YOUR_GOOGLE_SLIDES_ID";

function getDashboardSlide() {

  const presentation =
    SlidesApp.openById(DASHBOARD_SLIDE_ID);

  const slides =
    presentation.getSlides();

  return slides[0];
}

function findElementByTitle(slide, title) {

  const elements = slide.getPageElements();

  for (let i = 0; i < elements.length; i++) {

    const element = elements[i];

    const elementTitle =
      String(element.getTitle()).trim();

    const elementDescription =
      String(element.getDescription()).trim();


    if (
      elementTitle === title ||
      elementDescription === title
    ) {

      return element;

    }

  }

  return null;
}

function setElementText(slide, title, value) {

  const element =
    findElementByTitle(slide, title);

  if (element === null) {
    throw new Error(
      "Dashboard element not found: " + title
    );
  }

  element
    .asShape()
    .getText()
    .setText(String(value));
}

function getConfigValue(settingName) {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const configSheet =
    ss.getSheetByName(CONFIG_SHEET);

  const data =
    configSheet.getDataRange().getValues();


  for (let i = 1; i < data.length; i++) {

    const setting =
      String(data[i][0]).trim();

    if (setting === settingName) {

      return data[i][1];

    }

  }

  return null;
}

function getGuestStats() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const guestSheet =
    ss.getSheetByName(GUESTS_SHEET);

  const data =
    guestSheet.getDataRange().getValues();


  let totalGuests = 0;
  let checkedInGuests = 0;

  let totalParties = 0;
  let checkedInParties = 0;


  // Start at 1 to skip the header row
  for (let i = 1; i < data.length; i++) {

    const ticketID =
      String(data[i][0]).trim();

    // Ignore completely blank rows
    if (!ticketID) {
      continue;
    }


    const partySize =
      Number(data[i][2]) || 0;

    const checkedIn =
      String(data[i][3])
        .trim()
        .toUpperCase();


    // Every valid row represents one party
    totalParties++;

    // Add everyone in that party
    totalGuests += partySize;


    if (checkedIn === "YES") {

      checkedInParties++;

      checkedInGuests += partySize;

    }

  }


  const notArrivedGuests =
    totalGuests - checkedInGuests;


  return {
    totalGuests: totalGuests,
    checkedInGuests: checkedInGuests,
    notArrivedGuests: notArrivedGuests,
    totalParties: totalParties,
    checkedInParties: checkedInParties
  };

}

function updateMainGuestStats() {

  const slide = getDashboardSlide();

  const stats = getGuestStats();


  setElementText(
    slide,
    "CHECKED_IN_GUESTS",
    stats.checkedInGuests
  );


  setElementText(
    slide,
    "NOT_ARRIVED_GUESTS",
    stats.notArrivedGuests
  );


  setElementText(
    slide,
    "TOTAL_GUESTS",
    stats.totalGuests
  );

}

function updateAttendanceVisualizer() {

  const slide = getDashboardSlide();

  const stats = getGuestStats();


  // Calculate attendance percentage
  let attendancePercent = 0;

  if (stats.totalGuests > 0) {

    attendancePercent =
      Math.round(
        (stats.checkedInGuests / stats.totalGuests) * 100
      );

  }


  // Update visible percentage text
  setElementText(
    slide,
    "ATTENDANCE_PERCENT",
    attendancePercent + "%"
  );


  // Find both progress bar shapes
  const backgroundBar =
    findElementByTitle(
      slide,
      "ATTENDANCE_BAR_BG"
    );

  const attendanceBar =
    findElementByTitle(
      slide,
      "ATTENDANCE_BAR"
    );


  if (backgroundBar === null) {
    throw new Error(
      "ATTENDANCE_BAR_BG was not found."
    );
  }


  if (attendanceBar === null) {
    throw new Error(
      "ATTENDANCE_BAR was not found."
    );
  }


  // Grey background = the full 100% width
  const fullWidth =
    backgroundBar.getWidth();


  // Convert percentage into a decimal
  const attendanceRatio =
    attendancePercent / 100;


  // Calculate how wide the blue bar should be
  const newWidth =
    fullWidth * attendanceRatio;


  // Resize blue attendance bar
  attendanceBar.setWidth(
    Math.max(newWidth, 0.1)
  );

}

function updatePartyStats() {

  const slide = getDashboardSlide();

  const stats = getGuestStats();


  setElementText(
    slide,
    "CHECKED_IN_PARTIES",
    stats.checkedInParties
  );


  setElementText(
    slide,
    "TOTAL_PARTIES",
    stats.totalParties
  );

}

function getRecentArrivals() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const logsSheet =
    ss.getSheetByName(LOGS_SHEET);

  const lastRow =
    logsSheet.getLastRow();


  // No check-ins yet
  if (lastRow < 2) {
    return [];
  }


  const data =
    logsSheet
      .getRange(
        2,
        1,
        lastRow - 1,
        6
      )
      .getValues();


  const approvedLogs =
    data.filter(row => {

      const result =
        String(row[5])
          .trim()
          .toUpperCase();

      return result === "APPROVED";

    });


  // Take the most recent 3
  return approvedLogs
    .slice(-3)
    .reverse();

}

function formatDashboardTime(timestamp) {

  if (!timestamp) {
    return "-";
  }

  return Utilities.formatDate(
    new Date(timestamp),
    Session.getScriptTimeZone(),
    "h:mm a"
  );

}

function updateRecentArrivals() {

  const slide =
    getDashboardSlide();

  const recent =
    getRecentArrivals();


  for (let i = 0; i < 3; i++) {

    let name = "-";
    let party = "-";
    let time = "-";


    if (i < recent.length) {

      name =
        recent[i][2];

      party =
        "Party of " + recent[i][3];

      time =
        formatDashboardTime(
          recent[i][0]
        );

    }


    setElementText(
      slide,
      "NAME" + (i + 1),
      name
    );


    setElementText(
      slide,
      "PARTY" + (i + 1),
      party
    );


    setElementText(
      slide,
      "TIME" + (i + 1),
      time
    );

  }

}

function updateLastUpdated() {

  const slide = getDashboardSlide();

  const now = new Date();

  const formattedTime =
    Utilities.formatDate(
      now,
      Session.getScriptTimeZone(),
      "h:mm a"
    );

  setElementText(
    slide,
    "LAST_UPDATED",
    "Last Updated " + formattedTime
  );

}

function updateDashboard() {

  updateMainGuestStats();

  updateAttendanceVisualizer();

  updatePartyStats();

  updateRecentArrivals();

  updateLastUpdated();

}
