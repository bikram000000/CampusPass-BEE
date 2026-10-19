# CampusPass feature guide — current syllabus stage

CampusPass is a campus event discovery and booking application inspired by familiar ticket-booking workflows. It uses lectures 1–30 and 53–57, plus sessions and cookies. It is a working local assessment application, not a production ticketing platform.

## Student experience

- Eight seeded campus events spanning workshops, cultural events, sport, hackathons, seminars and technical showcases.
- Home page with upcoming events, free experiences, categories and the current demo offer.
- Search by event, venue or organizer; combine category, date, venue, price and availability filters.
- Sort by date, price, title or available passes; reset filters; clear empty states.
- Account-specific browser wishlist with saved-state controls.
- Event descriptions, availability, countdown, venue, date, time and entry/cancellation policies.
- General admission group booking for 1–4 people, with one active booking per student per event.
- Student details and a tab-local booking draft that survives leaving and reopening the event's booking screen.
- Two-step checkout, server-calculated pricing and the CAMPUS10 demonstration offer (10% off).
- Explicit demo confirmation; no card details or actual payment processing.
- Booking history filters: all, upcoming, checked in, past and cancelled.
- Group passes with booking references, itemized demo receipts, and browser print / Save as PDF.
- Whole-booking cancellation before the event begins and before check-in, releasing every pass.
- Editable name and department, account session restoration, logout and help/FAQ.

## Faculty experience

- Faculty invitation code on registration, plus the existing demo faculty login.
- Create, read, update and delete owned events.
- Dashboard counts for events, upcoming events and booked passes.
- Attendee directory for owned events only; search by reference, name or student ID.
- Active-pass, checked-in-pass and simulated-sales totals per event.
- Manual whole-group check-in; duplicate check-in is rejected.
- Cancel an upcoming event with a reason; active bookings immediately become cancelled.
- Date, venue, time and title edits are reflected on existing tickets after refresh. Historic price totals remain the amount agreed at checkout.
- Events with active bookings cannot be deleted. Cancelled booking records remain in students' history even if the event is later deleted.

## What is real and what is simulated?

Authentication, role/ownership checks, validation, server-calculated totals, booking capacity, cancellation and check-in operate through the local Express backend. A price sent from the browser cannot override the server price. A quoted total must still match at confirmation, and availability is checked again. Two requests for the last pass cannot both succeed within this single server process.

Payments, discounts and sales figures represent a demo only. Tickets are general admission; the booking reference is a lookup value, not a scannable QR code. All guests must enter together. Check-in is intentionally available to the organizer for classroom demonstrations without requiring the event date to arrive.

Accounts, events, bookings and sessions use arrays/objects and the default session memory store. They reset when the server restarts. Browser wishlist IDs and preferences remain local; a deleted event disappears from the wishlist when next loaded. No data migration from the older CA1 browser accounts is performed.

## Why the features fit the syllabus

| Feature | Concepts used |
| --- | --- |
| Discovery, filtering, dashboard totals | Arrays, objects, filter, sort, reduce; lectures 9–16 |
| Cards, forms, booking history, FAQ | HTML/CSS, DOM, events, validation; lectures 17–22 |
| Wishlist, sorting, booking drafts | localStorage/sessionStorage and JSON; lecture 23 |
| Screens and payloads | Template literals, spread, destructuring; lecture 24 |
| API calls and error states | Fetch, Promises, async/await; lectures 25–30 |
| Server and local asset routing | HTTP, Express, request/response; lectures 53 and 55 |
| Startup and development workflow | npm, environment variables, Nodemon; lecture 54 |
| Events, bookings, profiles, attendees | Middleware, JSON parsing, REST CRUD; lecture 56 |
| Login and access restrictions | Validation, error middleware, JWT, bcrypt; lecture 57 |
| Login continuity and role preference | Server sessions, HttpOnly session cookie, readable role cookie |
| Motion and responsive layout | CSS only |

No additional application dependency was introduced for the expanded features. The application has no React, database, ORM, file uploads, WebSockets, payment SDK or QR library.

## Later backend stages

These are intentionally not implemented yet:

1. Persistent database models, migrations, relationships and transactions.
2. Real payment gateway checkout, verified webhooks, refunds and reconciliation.
3. Reserved-seat maps with expiring seat holds and concurrency across multiple servers.
4. Verified email/OTP, password recovery, email/SMS tickets and notifications.
5. Uploaded event posters, cloud storage and image processing.
6. Signed QR tickets and scanner/camera check-in.
7. Production session storage, rate limiting, audit trails, monitoring and deployment hardening.
8. Moderated reviews, organizer approval workflows, multi-campus administration and richer analytics.

Some simplified versions of later features could be drawn with HTML/CSS; they are deferred here so the booking experience does not imply infrastructure that is not present.

## Assessment demonstration

1. Start with `npm start` and open http://127.0.0.1:3000.
2. Sign in as `student@campus.edu`, password `123456`.
3. Search or filter events, save the Annual Cultural Fest, and open it from Wishlist.
4. Select three passes, enter demo student details, apply CAMPUS10 and confirm the ₹270 demo total.
5. View My Bookings, open the pass and use browser print if needed.
6. Log out and sign in as `faculty@campus.edu`, password `123456`.
7. Open My Events → Annual Cultural Fest → Attendees & check-in; find the booking and check in the group.
8. Try a second check-in or student cancellation after check-in to demonstrate validation.
9. Use a separate event to demonstrate organizer cancellation and the cancellation reason in student history.
10. Restart the server to explain the intentional in-memory data limitation.

## Verification

`npm test` runs 47 API checks, including invalid credentials, session cookies, role/ownership restrictions, CRUD, malformed inputs, group limits, discount calculations, price tampering, capacity conflicts, attendee privacy, duplicate check-in, cancellation propagation, profile validation and concurrent last-pass requests. Tests create unique demo accounts and clean up their events; accounts and test booking history reset on server restart.
