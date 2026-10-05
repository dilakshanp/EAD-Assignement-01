# Smart Solar Microgrid Trading System

**Module:** SE4040 Enterprise Application Development  
**Assessment:** Assignment 1  
**Project:** Smart Solar Microgrid Trading System  
**Repository:** ADD_GITHUB_REPOSITORY_LINK_HERE  
**Demo Video:** ADD_YOUTUBE_OR_ONEDRIVE_LINK_HERE  

## Group Members

| Student ID | Name | Main Responsibility |
| --- | --- | --- |
| IT22102928 | Denislas Coonghe J. | Backend authentication and user management |
| IT22115966 | Bavithran S. | Backend trading and node management |
| IT22273444 | Koshigawarman Y. | Web application |
| IT22297372 | Dilakshan P. | Native Android application |

---

## 1. Introduction

The Smart Solar Microgrid Trading System is an end-to-end client-server application for managing solar energy trading between solar prosumers and microgrid operators. The system includes a back-office web application, a native Android mobile application, a central ASP.NET Core Web API, and a MongoDB database.

The system supports Backoffice officers, Grid Operators, and Solar Prosumers. Backoffice users manage system users, prosumer profiles, and microgrid nodes. Grid Operators monitor reservations, update battery slot availability, and finalize energy transfers. Prosumers use the mobile application to register, manage their account, reserve energy slots, view booking history, access QR transaction codes, and locate nearby grid nodes.

## 2. Project Objectives

- Build a client-server Smart Solar Microgrid Trading System.
- Implement the central API using ASP.NET Core and MongoDB.
- Implement a responsive web application for Backoffice and Grid Operator users.
- Implement a pure native Android Java application with SQLite local persistence.
- Enforce all business rules in the central API using a FAT Service pattern.
- Integrate Google Maps and QR-based transaction verification.
- Prepare the system for IIS hosting and final demonstration.

## 3. High-Level Application Architecture

[PLACEHOLDER - Insert high-level application architecture diagram here]

Diagram should show:
- React Web Application
- Native Android Application
- ASP.NET Core Web API
- MongoDB Atlas
- Android SQLite
- Google Maps API
- QR verification flow

## 4. System Architecture Explanation

The system follows a client-server architecture. Both the web application and the Android application communicate with the backend using REST API calls. The backend API is responsible for authentication, authorization, business rules, data validation, reservation workflow, QR verification, and database communication.

The application follows a FAT Service pattern. This means the service/API layer contains the main business logic. The web and Android clients are thin clients that mainly handle user interface interactions and API communication. MongoDB is accessed only by the API, not directly by the clients.

## 5. Use Case Diagram

[PLACEHOLDER - Insert use case diagram here]

Include actors:
- Backoffice Officer
- Grid Operator
- Solar Prosumer

Include use cases:
- Login
- Manage users
- Manage prosumers
- Manage microgrid nodes
- Update battery slots
- Reserve/modify/cancel booking
- View booking history/search bookings
- Generate QR
- Scan QR and finalize transfer
- View nearby nodes on map

## 6. Data Flow Diagram

[PLACEHOLDER - Insert DFD here]

Recommended flow:
User -> Web/Android client -> REST API -> MongoDB.  
Android client -> SQLite for local persistence/cache.  
Android client -> Google Maps API for map display.

## 7. Technology Stack

| Layer | Technology |
| --- | --- |
| Backend API | ASP.NET Core Web API, C# |
| Database | MongoDB Atlas |
| Web Client | React, Vite, Tailwind CSS |
| Mobile Client | Pure Native Android Java |
| Local Mobile Storage | SQLite |
| Maps | Google Maps API |
| QR | QR generation and QR scanner verification |
| Deployment Target | Windows IIS Server |
| Version Control | GitHub |

## 8. Backend API Design

The backend API is implemented using ASP.NET Core. Controllers expose REST endpoints, while service classes contain the main business logic. MongoContext centralizes MongoDB collection access.

Key backend areas:
- Authentication and bearer token validation
- Role-based access control
- User management
- Prosumer management
- Microgrid node management
- Battery slot availability updates
- Reservation creation, update, cancellation, and approval
- QR transaction completion
- Business rule validation

### 8.1 FAT Service Pattern

The FAT Service pattern keeps business rules inside the API instead of duplicating them in the web and Android clients. This improves consistency, maintainability, and security.

Rules enforced in the API include:
- Reservations must be scheduled within 7 days.
- Updates and cancellations require at least 12 hours notice.
- Nodes cannot be deactivated while active reservations exist.
- Only Backoffice users can reactivate deactivated prosumers.
- QR completion must be verified against the central server.

### 8.2 API Endpoint Summary

[PLACEHOLDER - Insert API endpoint table or screenshot from docs/API_ENDPOINTS.md]

## 9. Database Design and Data Modelling

The MongoDB database contains four main collections.

### 9.1 Users Collection

Fields:
- id
- username
- passwordHash
- role
- status
- prosumerNic
- createdAtUtc

### 9.2 Prosumers Collection

Fields:
- nic
- fullName
- phone
- email
- address
- solarCapacityKw
- status
- createdAtUtc

### 9.3 SolarStationInfo Collection

Fields:
- id
- name
- locationName
- latitude
- longitude
- capacityKwh
- batteryStorageSlots
- isActive
- schedules

### 9.4 EnergyReservations Collection

Fields:
- id
- prosumerNic
- nodeId
- slotStartUtc
- slotEndUtc
- energyKwh
- status
- transactionCode
- createdAtUtc
- updatedAtUtc

[PLACEHOLDER - Insert database/collection diagram here]

[PLACEHOLDER - Insert MongoDB Atlas collection screenshot here]

## 10. Web Application

The web application is built with React, Vite, and Tailwind CSS. It is used by Backoffice users and Grid Operators.

### 10.1 Web Login and Role-Based Access

[PLACEHOLDER - Insert web login screenshot here]

Explain:
- Backoffice login
- Grid Operator login
- Token storage and API authorization
- Role-based navigation

### 10.2 Dashboard

[PLACEHOLDER - Insert web dashboard screenshot here]

Explain:
- Summary metrics
- Recent reservations
- Operational overview

### 10.3 User Management

[PLACEHOLDER - Insert web user management screenshot here]

Explain:
- Create Backoffice and Grid Operator users
- Edit users
- Activate/deactivate users
- Delete users

### 10.4 Prosumer Management

[PLACEHOLDER - Insert web prosumer management screenshot here]

Explain:
- Create/update prosumer profiles
- NIC as primary key
- Filter active/pending/deactivated accounts
- Approve pending deactivation/reactivate accounts

### 10.5 Microgrid Node Management

[PLACEHOLDER - Insert web node management screenshot here]

Explain:
- Create/update nodes
- GPS location
- Capacity kWh
- Battery slots
- Fixed booking slot schedules
- Deactivate/reactivate nodes

### 10.6 Reservation Management

[PLACEHOLDER - Insert web reservation management screenshot here]

Explain:
- Create reservations
- Update/cancel reservations
- Approve pending reservations
- Enforce 7-day and 12-hour rules
- QR transaction completion

## 11. Android Mobile Application

The Android application is implemented as a pure native Android Java application. It uses SQLite for local persistence/cache and communicates with the central API using REST calls.

### 11.1 Android Login

[PLACEHOLDER - Insert Android login screenshot here]

Explain:
- Prosumer login using NIC/email
- Grid Operator login using staff username/email
- Role-based home screen

### 11.2 Prosumer Registration

[PLACEHOLDER - Insert Android registration screenshot here]

Explain:
- NIC as primary key
- Profile details
- Password creation
- API registration request

### 11.3 Account Settings and Deactivation Request

[PLACEHOLDER - Insert Android account settings screenshot here]

Explain:
- Edit profile
- Optional password update
- Request account deactivation

### 11.4 Dashboard and Booking Counts

[PLACEHOLDER - Insert Android dashboard screenshot here]

Explain:
- Approved booking count
- Pending booking count
- Total/current booking count

### 11.5 Reservation Creation

[PLACEHOLDER - Insert Android reservation creation screenshot here]

Explain:
- Select grid node
- Select date
- Select available one-hour fixed slot
- Enter energy amount
- Submit booking request

### 11.6 Reservation Modification and Cancellation

[PLACEHOLDER - Insert Android modify/cancel booking screenshot here]

Explain:
- Select existing booking
- Change slot/energy amount
- Cancel booking
- 12-hour rule enforcement by API

### 11.7 Booking History and Search

[PLACEHOLDER - Insert Android booking history/search screenshot here]

Explain:
- Search bookings
- View pending bookings
- View completed/cancelled history

### 11.8 QR Code Display

[PLACEHOLDER - Insert Android QR modal/screen screenshot here]

Explain:
- QR appears for approved reservations
- QR contains secure transaction code
- QR is verified by the API during transfer completion

### 11.9 Nearby Nodes Map

[PLACEHOLDER - Insert Android Google Maps screenshot here]

Explain:
- Google Maps API integration
- Grid nodes plotted from stored latitude/longitude
- Node details shown to the user

### 11.10 Operator Mode

[PLACEHOLDER - Insert Android operator mode screenshot here]

Explain:
- Grid Operator login
- QR scanning
- Server verification
- Finalize energy transfer
- Update battery slot availability
- Monitor bookings

## 12. Business Rules

| Rule | Implementation |
| --- | --- |
| Reservation must be within 7 days | Enforced in ReservationService |
| Update/cancel requires 12 hours notice | Enforced in ReservationService |
| Deactivate node blocked with active reservations | Enforced in NodeService |
| Deactivated prosumers reactivated only by Backoffice | Enforced in ProsumersController/ProsumerService |
| QR completion must be server-verified | Enforced in ReservationService |
| Grid Operator can update battery slots | Enforced by role checks in NodesController |

## 13. Security and Configuration

Security practices:
- Passwords are hashed before storage.
- Bearer tokens are used for authenticated requests.
- Role-based access checks are enforced in the API.
- Real MongoDB credentials are stored in `.env` locally or IIS environment variables.
- Real Google Maps keys are stored in ignored `local.properties`.
- Sensitive files are ignored by Git.

[PLACEHOLDER - Insert screenshot of GitHub secret scanning resolved status if available]

## 14. Deployment

### 14.1 Backend API Deployment to IIS

[PLACEHOLDER - Insert IIS deployment screenshot here]

Deployment steps:
1. Install .NET 8 Hosting Bundle.
2. Publish the API using `dotnet publish`.
3. Copy publish output to IIS folder.
4. Create IIS site/application.
5. Set application pool to No Managed Code.
6. Configure MongoDB and auth secrets as server environment variables.
7. Test API endpoints.

### 14.2 MongoDB Atlas

[PLACEHOLDER - Insert MongoDB Atlas cluster/database screenshot here]

Explain:
- Cloud database usage
- Collections created
- Database user and network access settings

### 14.3 Google Maps API Key Restriction

[PLACEHOLDER - Insert Google Cloud API key restriction screenshot here]

Explain:
- Android app restriction
- Package name
- SHA-1 fingerprint
- Maps SDK API restriction

## 15. Testing

### 15.1 Backend API Testing

[PLACEHOLDER - Insert Postman/Swagger/API testing screenshots here]

Test cases:
- Login success/failure
- Role-based access
- Create/update users
- Create/update prosumers
- Create/update nodes
- Reservation 7-day validation
- Reservation 12-hour update/cancel validation
- QR completion validation

### 15.2 Web Application Testing

[PLACEHOLDER - Insert web testing screenshots here]

Test cases:
- Backoffice login
- Grid Operator login
- User management
- Prosumer management
- Node management
- Reservation approval/cancellation
- Responsive layout

### 15.3 Android Application Testing

[PLACEHOLDER - Insert Android testing screenshots here]

Test cases:
- Prosumer registration/login
- Profile edit/deactivation request
- Slot reservation
- Modify/cancel booking
- Booking history/search
- QR generation
- Map display
- Operator QR scan and finalize
- Battery slot update

## 16. Source Code Snippets

### 16.1 Authentication / Token Code

[PLACEHOLDER - Insert important backend auth/token code snippet here]

### 16.2 Reservation Validation Code

[PLACEHOLDER - Insert ReservationService validation code snippet here]

### 16.3 Node Deactivation Rule Code

[PLACEHOLDER - Insert NodeService deactivation code snippet here]

### 16.4 Android SQLite Code

[PLACEHOLDER - Insert LocalDb SQLite code snippet here]

### 16.5 Android QR Scan / QR Display Code

[PLACEHOLDER - Insert QR code related code snippet here]

### 16.6 Web API Call Code

[PLACEHOLDER - Insert React API helper or page code snippet here]

## 17. Individual Contributions

| Member | Contribution |
| --- | --- |
| IT22102928 Denislas Coonghe J. | Backend authentication and user management. ASP.NET Core API setup, MongoDB connection, user roles, login, bearer authentication, prosumer registration API, profile updates, activation, and deactivation. |
| IT22115966 Bavithran S. | Backend trading and node management. Microgrid node APIs, GPS/capacity/battery schedules, node deactivation rules, reservation APIs, approval workflow, and QR transaction completion. |
| IT22273444 Koshigawarman Y. | Web application. React/Tailwind interface, Backoffice dashboard, user management, prosumer management, node management, reservation management, approval controls, and QR finalization interface. |
| IT22297372 Dilakshan P. | Native Android application. Pure Android Java app, SQLite database, prosumer registration/profile UI, reservations, history/search, Google Maps, QR generation, operator login, QR scanning, and battery-slot updates. |

All members contributed to requirements analysis, documentation, source-code review, report preparation, diagram preparation, and final demonstration.

## 18. AI Collaboration Reflection

This assessment allows AI usage at Level 4. AI tools were used for brainstorming, architecture planning, code generation support, debugging, UI refinement, documentation drafting, and validation checklist preparation. The team remained responsible for reviewing, testing, explaining, and modifying all generated work.

Prompting strategies used:
- Breaking work into backend, web, Android, testing, and documentation tasks.
- Asking for step-by-step debugging when setup issues occurred.
- Asking for professional UI/UX improvements and then validating the implementation.
- Asking for checklist-based testing to ensure rubric coverage.

Validation methods:
- Running backend builds.
- Running web builds.
- Running Android Gradle builds.
- Manual testing through web UI and Android app.
- Reviewing role permissions and business rules against the assignment requirements.

## 19. Challenges and Solutions

| Challenge | Solution |
| --- | --- |
| MongoDB Atlas connection/authentication issues | Used environment variables, corrected connection string, checked network/DNS/VPN issues. |
| Secret exposure risk | Removed real secrets from README/config, used `.env` and `local.properties`, rotated exposed secrets where needed. |
| Android cleartext HTTP issue | Added network security configuration for development API calls. |
| Emulator/phone API connectivity | Used `10.0.2.2` for emulator and LAN IP for physical phone testing. |
| Booking slot UX confusion | Changed flow to node/date/fixed-slot selection with availability status. |
| QR verification security | QR completion is verified against the server before finalizing transfer. |
| Role separation | Enforced Backoffice, Grid Operator, and Prosumer access rules in the API. |

## 20. References

- Microsoft ASP.NET Core documentation
- MongoDB .NET Driver documentation
- MongoDB Atlas documentation
- Android Developers documentation
- Android SQLite documentation
- Google Maps Platform documentation
- React documentation
- Vite documentation
- Tailwind CSS documentation
- ZXing Android Embedded documentation

## Appendix A - Screenshot Checklist

Web screenshots:
- Login screen
- Dashboard
- User management
- Prosumer management
- Node management
- Reservation management
- Approval/QR finalization

Android screenshots:
- Login screen
- Registration screen
- Dashboard
- Account settings
- Reservation create flow
- Reservation modify/cancel flow
- Booking history/search
- QR display
- Nearby nodes map
- Operator QR scan/finalize
- Battery slot update

## Appendix B - Diagram Checklist

- High-level architecture diagram
- Use case diagram
- Data flow diagram
- Database collections/data model diagram
- API request flow diagram, optional

## Appendix C - Code Snippet Checklist

- Authentication/token generation
- Role-based access check
- Reservation validation
- Node deactivation blocking
- QR completion
- Android SQLite
- Android Maps/QR code
- React API helper
