# CampusPass — Continuous Assessment 2

A campus event platform built with vanilla HTML, CSS and JavaScript, Node's HTTP module, and Express. Students discover events and manage tickets; faculty create, update and delete their own events.

## Run

Requires Node.js 20.6+ and npm.

1. Run `npm install`.
2. Install and start MongoDB locally, or create a MongoDB Atlas database. Copy `.env.example` to `.env` if it does not already exist. Set `MONGODB_URI` and optionally `MONGODB_DB`, then replace the JWT and session secret placeholders with two different long random values. Set your faculty invitation code.
3. Run `npm start` (or `npm run dev` for Nodemon).
4. Open http://localhost:3000. Opening index.html directly will not run the backend.

For Atlas, paste the driver connection string into `MONGODB_URI` and set `MONGODB_DB` to the database name you want CampusPass to use. If `querySrv ECONNREFUSED` appears, the computer's DNS service is refusing the Atlas SRV lookup; copy Atlas's standard `mongodb://` connection string from its Connect → Drivers screen, or switch to a DNS service/network that permits SRV records.

Demo student: `student@campus.edu` / `123456`.
Demo faculty: `faculty@campus.edu` / `123456`.
Select the matching role on the login screen. New faculty accounts require the invitation code configured in `.env`.

## Assessment scope and data

MongoDB is the main CampusPass storage. It persists accounts, events, bookings, wishlists, counters and server-side sessions in the database named by `MONGODB_DB`. The server creates its collections, indexes, demo accounts and seed events the first time it connects. Restarting the server no longer clears application data.

Cookies hold only the protected session identifier. The session record, including the short-lived JWT used by the server, is stored in MongoDB. Browser localStorage stores only the event-sort preference; sessionStorage stores only an unfinished booking draft and selected category for the current tab.

No React, TypeScript, WebSocket, file upload or JavaScript animation library is used. All visual animation is CSS. HTML and CSS are unrestricted. Built-in Date, Math and string methods support date display and validation. Mongoose defines the MongoDB models; `connect-mongo` keeps sessions in MongoDB.

## Lecture mapping

| Lectures | Demonstration | Main files |
| --- | --- | --- |
| 1–8 | Variables, conditions, functions, form checks | `js/03_helpers.js`, `js/11_faculty_post.js` |
| 9–14 | Arrow functions, arrays, filtering, sorting, iteration | `js/07_browse_events.js`, `server-mongodb.js` |
| 15–16 | Objects, properties, JSON | `server-data.js`, `js/01_storage.js` |
| 17–22 | DOM creation, navigation, events, form validation | `js/04_auth.js`, `js/05_event_cards.js`, `js/14_navigation.js` |
| 23 | Local storage preference and session storage booking drafts/category | `js/01_storage.js`, `js/07_browse_events.js`, `js/09_student_booking.js` |
| 24 | Template literals, spread, destructuring, default arguments | UI modules, `server-mongodb.js` |
| 25–28 | Callbacks, Promises, async/await, Fetch and JSON errors | `js/01_storage.js`, `server-mongodb.js` |
| 29–30 | Integrated API, forms and browser storage | Login, event and booking flows |
| 53 | HTTP module, request/response lifecycle, HTTP server | `http.createServer(app)` in `server-mongodb.js` |
| 54 | npm, package.json, Nodemon, environment variables | `package.json`, `.env.example`, `process.env` |
| 55 | Express application, routes, request and response | `server-mongodb.js` |
| 56 | Middleware, JSON body parsing, REST CRUD | `express.json`, event GET/POST/PUT/DELETE routes |
| 57 | Validation, error middleware, JWT, bcrypt, protected routes | `eventInput`, `authenticate`, `faculty`, auth routes |
| Sessions & cookies | Login session, logout, role preference cookie | `express-session`, `campus.sid`, `campusRole` |

JWT authentication is combined with MongoDB-backed sessions deliberately: login verifies a bcrypt hash, regenerates a session and stores a signed, expiring JWT in that MongoDB session record. The browser receives only an HttpOnly SameSite session-ID cookie. Every protected request verifies the JWT and resolves the user from MongoDB. Logout destroys the stored session. Passwords and JWTs are never stored in localStorage. The separate readable `campusRole` cookie remembers the role tab and never grants access.

## REST routes

- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/events`, `POST /api/events`, `PUT /api/events/:id`, `DELETE /api/events/:id`
- `GET /api/tickets`, `POST /api/tickets`, `DELETE /api/tickets/:id`
- `GET /api/wishlist`, `POST /api/wishlist/:id`, `DELETE /api/wishlist/:id`
- `GET /api/health`

Events require faculty ownership for editing/deletion. Events with active registrations cannot be deleted. Booking uses the authenticated student's email, prevents duplicate registration and checks capacity. Cancellation only affects the current user's ticket and restores a seat. Paid event checkout is a simulation and collects no card information.

## Demonstration and testing

With MongoDB running, use `npm test` to exercise authentication, role restrictions, event CRUD, validation, booking capacity, cancellation, ownership and logout. The test uses unique emails and removes its events afterwards. The test-created user documents remain in MongoDB and can be removed from the `users` collection when no longer needed.

For a manual demonstration: log in as faculty, create an event, log out, sign in as student, search for the event, book and view a ticket, refresh to demonstrate session continuity, cancel the ticket, then log in as faculty to edit/delete the event. Resize the window to inspect mobile layout, and enable reduced motion to disable CSS animations.

External Unsplash photos and Google fonts are decorative; colors and system fonts remain available without them. The application API is local and does not depend on external services.

Runtime dependencies passed `npm audit --omit=dev` with zero reported advisories. Nodemon remains optional and is used only for local development.

## Expanded campus booking application

See [FEATURE_GUIDE.md](FEATURE_GUIDE.md) for the implemented feature inventory, detailed syllabus mapping, assessment walkthrough and future backend roadmap.

New routes: `POST /api/quote`, `PUT /api/profile`, `GET /api/events/:id/attendees`, `POST /api/events/:id/check-in`, and `POST /api/events/:id/cancel`. Ticket creation accepts `quantity` (1–4), `coupon` and `expectedTotal`; the server calculates all amounts and checks capacity. The full integration suite now has 47 checks.
