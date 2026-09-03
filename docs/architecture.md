# EventFlow Architecture

```mermaid
flowchart LR

    Staff[Event Staff]

    Frontend[EventFlow Frontend<br/>GitHub Pages]

    QR[QR Scanner<br/>html5-qrcode]
    Search[Manual Guest Search]

    API[Google Apps Script<br/>Web API]

    CheckIn[Shared Check-In Logic<br/>checkInGuest]

    Guests[(Guests Sheet)]
    Logs[(Logs Sheet)]
    Config[(Config Sheet)]

    Dashboard[Google Slides<br/>Live Dashboard]

    Staff --> Frontend

    Frontend --> QR
    Frontend --> Search

    QR --> API
    Search --> API

    API --> CheckIn

    CheckIn --> Guests
    CheckIn --> Logs

    Config --> API

    Guests --> Dashboard
    Logs --> Dashboard
    Config --> Dashboard
