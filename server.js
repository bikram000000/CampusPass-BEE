// Compatibility entry point. The active MongoDB implementation is server-mongodb.js.
if (require.main === module) {
  require('./server-mongodb');
} else {
// Legacy in-memory implementation retained only for earlier CA2 reference; it is not started.
const http = require('http');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const seedEvents = require('./server-data');
const app = express();
const port = Number(process.env.PORT || 3000);
if (!process.env.JWT_SECRET || !process.env.SESSION_SECRET || !process.env.FACULTY_CODE) {
  throw new Error('Copy .env.example to .env and configure the three secrets first.');
}
const users = [];
let events = seedEvents;
const tickets = [];
let nextUser = 1;
let nextEvent = 10;
let nextTicket = 1;
const categories = ['Technical', 'Cultural', 'Sports', 'Workshops', 'Hackathons', 'Seminars'];
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(session({
  name: 'campus.sid', secret: process.env.SESSION_SECRET,
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 2 * 60 * 60 * 1000 }
}));
// Same-origin JSON requests prevent cross-site mutation of the session.
app.use('/api', function (req, res, next) {
  res.set('Cache-Control', 'no-store');
  if (['POST', 'PUT', 'DELETE'].includes(req.method) && (req.get('Content-Type') || '').split(';')[0] !== 'application/json') {
    return res.status(415).json({ message: 'Send application/json.' });
  }
  if (!req.body) req.body = {};
  next();
});
function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
function text(value, min = 1, max = 200) { return typeof value === 'string' && value.trim().length >= min && value.length <= max; }
function emailValid(value) { return text(value, 5) && value.includes('@') && value.includes('.'); }
function publicUser(user) { return { id: user.id, name: user.name, email: user.email, department: user.department, role: user.role }; }
function upcoming(event) { return new Date(event.date + 'T' + event.time) > new Date() && event.status !== 'cancelled'; }
function quote(event, quantity = 1, coupon = '') {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 4) fail(400, 'Choose between 1 and 4 passes.');
  if (typeof coupon !== 'string') fail(400, 'Invalid offer code.');
  const code = coupon.trim().toUpperCase();
  if (code && code !== 'CAMPUS10') fail(400, 'Offer code not found. Try CAMPUS10.');
  const subtotal = Math.round(event.price * quantity * 100) / 100;
  const discount = code === 'CAMPUS10' ? Math.round(subtotal * 10) / 100 : 0;
  return { quantity, unitPrice: event.price, subtotal, discount, total: Math.round((subtotal - discount) * 100) / 100, coupon: code };
}
function authenticate(req, res, next) {
  try {
    const payload = jwt.verify(req.session.token || '', process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = users.find(user => user.id === payload.id);
    if (!req.user) return res.status(401).json({ message: 'Please log in again.' });
    next();
  } catch (error) { res.status(401).json({ message: 'Your session has ended. Please log in.' }); }
}
function faculty(req, res, next) {
  if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Faculty access required.' });
  next();
}
function startSession(req, res, next, user) {
  req.session.regenerate(function (error) {
    if (error) return next(error);
    // JWT stays in the server session; the browser receives only an HttpOnly session ID.
    req.session.token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });
    req.session.save(function (error) {
      if (error) return next(error);
      res.json({ user: publicUser(user) });
    });
  });
}
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.post('/api/auth/signup', async function (req, res, next) {
  const { name, email, password, department, role, facultyCode } = req.body;
  if (!text(name, 2, 80) || !emailValid(email) || !text(password, 6, 72) || !text(department, 1, 80) || !['student', 'faculty'].includes(role)) fail(400, 'Enter valid details. Password must be 6–72 characters.');
  if (role === 'faculty' && facultyCode !== process.env.FACULTY_CODE) fail(403, 'Invalid faculty invitation code.');
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  if (users.some(user => user.email === normalizedEmail)) fail(409, 'This email is already registered.');
  const user = { id: nextUser++, name: name.trim(), email: normalizedEmail, department: department.trim(), role, passwordHash };
  users.push(user);
  startSession(req, res, next, user);
});
app.post('/api/auth/login', async function (req, res, next) {
  const { email, password, role } = req.body;
  if (!emailValid(email) || !text(password, 1, 72)) fail(400, 'Enter your email and password.');
  const user = users.find(user => user.email === email.trim().toLowerCase() && user.role === role);
  if (!user || !await bcrypt.compare(password, user.passwordHash)) fail(401, 'Email, password or role is incorrect.');
  startSession(req, res, next, user);
});
app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));
app.put('/api/profile', authenticate, function (req, res) {
  const { name, department } = req.body;
  if (!text(name, 2, 80) || !text(department, 1, 80)) fail(400, 'Enter your name and course or department.');
  req.user.name = name.trim(); req.user.department = department.trim();
  res.json({ user: publicUser(req.user) });
});
app.post('/api/auth/logout', function (req, res, next) {
  req.session.destroy(function (error) {
    if (error) return next(error);
    res.clearCookie('campus.sid', { path: '/' });
    res.json({ message: 'Logged out.' });
  });
});
app.get('/api/events', authenticate, (req, res) => res.json(events));
function eventInput(body, booked = 0) {
  const { title, category, date, time, venue, seats, price, description } = body;
  const dateTime = new Date(date + 'T' + time);
  if (!text(title, 3, 100) || !categories.includes(category) || !text(date) || !text(time) || !text(venue, 2, 100) || !text(description, 10, 2000) || !Number.isInteger(seats) || seats < 1 || seats < booked || seats > 10000 || typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > 100000 || !Number.isFinite(dateTime.getTime()) || dateTime <= new Date()) fail(400, 'Check event details: use a future date, whole seats, a valid fee and a description of at least 10 characters.');
  return { title: title.trim(), category, date, time, venue: venue.trim(), seats, price, description: description.trim(), image: '' };
}
function ownedEvent(req) {
  const event = events.find(item => item.id === Number(req.params.id));
  if (!event) fail(404, 'Event not found.');
  if (event.ownerEmail !== req.user.email) fail(403, 'You can manage only your own events.');
  return event;
}
app.post('/api/events', authenticate, faculty, function (req, res) {
  const event = { ...eventInput(req.body), id: nextEvent++, booked: 0, organizer: req.user.name, ownerEmail: req.user.email };
  events.push(event);
  res.status(201).json(event);
});
app.put('/api/events/:id', authenticate, faculty, function (req, res) {
  const event = ownedEvent(req);
  if (event.status === 'cancelled') fail(409, 'Cancelled events cannot be edited.');
  const updated = { ...event, ...eventInput(req.body, event.booked) };
  events = events.map(item => item.id === event.id ? updated : item);
  tickets.forEach(function (ticket) {
    if (ticket.eventId === event.id) { ticket.eventTitle = updated.title; ticket.date = updated.date; ticket.time = updated.time; ticket.venue = updated.venue; }
  });
  res.json(updated);
});
app.delete('/api/events/:id', authenticate, faculty, function (req, res) {
  const event = ownedEvent(req);
  if (event.booked > 0) fail(409, 'Cannot delete an event with active registrations.');
  events = events.filter(item => item.id !== event.id);
  res.json({ message: 'Event deleted.' });
});
app.get('/api/tickets', authenticate, (req, res) => res.json(tickets.filter(ticket => ticket.email === req.user.email)));
app.post('/api/quote', authenticate, function (req, res) {
  const event = events.find(item => item.id === Number(req.body.eventId));
  if (!event) fail(404, 'Event not found.');
  if (!upcoming(event)) fail(409, 'Registration has closed.');
  const result = quote(event, req.body.quantity, req.body.coupon);
  if (result.quantity > event.seats - event.booked) fail(409, 'Not enough passes remain.');
  res.json(result);
});
app.post('/api/tickets', authenticate, function (req, res) {
  if (req.user.role !== 'student') fail(403, 'Only students can register.');
  const { eventId, name, phone, studentId, department, year } = req.body;
  if (!text(name, 2, 80) || !text(phone, 10, 10) || !phone.split('').every(character => '0123456789'.includes(character)) || !text(studentId, 5, 40) || !text(department, 1, 80) || !['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(year)) fail(400, 'Complete your student details correctly.');
  const event = events.find(item => item.id === Number(eventId));
  if (!event) fail(404, 'Event not found.');
  if (!upcoming(event)) fail(409, 'Registration has closed.');
  if (tickets.some(ticket => ticket.eventId === event.id && ticket.email === req.user.email && ticket.status === 'active')) fail(409, 'You already have a ticket.');
  const pricing = quote(event, req.body.quantity, req.body.coupon);
  if (event.booked + pricing.quantity > event.seats) fail(409, 'Not enough passes remain.');
  if (req.body.expectedTotal !== undefined && req.body.expectedTotal !== pricing.total) fail(409, 'The price has changed. Review your order again.');
  const ticket = { ticketId: 'CP-' + nextTicket++, eventId: event.id, eventTitle: event.title, date: event.date, time: event.time, venue: event.venue, userName: name, email: req.user.email, phone, studentId, department, year, status: 'active', ...pricing, createdAt: new Date().toISOString(), checkedIn: false };
  tickets.push(ticket);
  event.booked += pricing.quantity;
  res.status(201).json(ticket);
});
app.delete('/api/tickets/:id', authenticate, function (req, res) {
  const ticket = tickets.find(item => item.ticketId === req.params.id && item.email === req.user.email);
  if (!ticket) fail(404, 'Ticket not found.');
  if (ticket.status !== 'active') fail(409, 'Ticket is already cancelled.');
  const event = events.find(item => item.id === ticket.eventId);
  if (ticket.checkedIn || (event && !upcoming(event))) fail(409, 'Cancellation closes when the event starts or the order is checked in.');
  ticket.status = 'cancelled';
  ticket.cancelReason = 'Cancelled by student';
  if (event) event.booked -= ticket.quantity;
  res.json({ message: 'Registration cancelled.' });
});
app.get('/api/events/:id/attendees', authenticate, faculty, function (req, res) {
  const event = ownedEvent(req);
  res.json(tickets.filter(ticket => ticket.eventId === event.id));
});
app.post('/api/events/:id/cancel', authenticate, faculty, function (req, res) {
  const event = ownedEvent(req);
  if (!upcoming(event)) fail(409, 'Only upcoming events can be cancelled.');
  if (!text(req.body.reason, 5, 300)) fail(400, 'Provide a cancellation reason (5–300 characters).');
  event.status = 'cancelled'; event.cancelReason = req.body.reason.trim(); event.booked = 0;
  tickets.forEach(function (ticket) {
    if (ticket.eventId === event.id && ticket.status === 'active') { ticket.status = 'cancelled'; ticket.cancelReason = 'Organizer: ' + event.cancelReason; }
  });
  res.json({ message: 'Event cancelled; all active orders have been cancelled.' });
});
app.post('/api/events/:id/check-in', authenticate, faculty, function (req, res) {
  const event = ownedEvent(req);
  const ticket = tickets.find(item => item.eventId === event.id && item.ticketId === req.body.ticketId);
  if (!ticket || ticket.status !== 'active' || event.status === 'cancelled') fail(404, 'Active order not found for this event.');
  if (ticket.checkedIn) fail(409, 'This order has already checked in.');
  ticket.checkedIn = true;
  res.json({ message: 'All ' + ticket.quantity + ' passes in this order are checked in.' });
});
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found.' }));
// Expose only browser assets, never .env or server source.
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/style.css', (req, res) => res.sendFile(__dirname + '/style.css'));
app.use('/js', express.static(__dirname + '/js'));
app.use(function (error, req, res, next) {
  const status = error.status || 500;
  res.status(status).json({ message: status === 500 ? 'Something went wrong. Please try again.' : error.message });
});
async function start() {
  users.push({ id: nextUser++, name: 'Demo Faculty', email: 'faculty@campus.edu', department: 'Computer Science', role: 'faculty', passwordHash: await bcrypt.hash('123456', 10) });
  users.push({ id: nextUser++, name: 'Demo Student', email: 'student@campus.edu', department: 'BCA', role: 'student', passwordHash: await bcrypt.hash('123456', 10) });
  // Lecture 53: Express is the request handler passed to the HTTP server.
  http.createServer(app).listen(port, '127.0.0.1', function () { console.log('CampusPass: http://localhost:' + port); });
}
start();
}
