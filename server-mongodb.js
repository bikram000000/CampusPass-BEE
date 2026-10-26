// CampusPass MongoDB server: the database stores all app records and sessions.
const http = require('http');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const seedEvents = require('./server-data');

const app = express();
const port = Number(process.env.PORT || 3000);
const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || 'campuspass';
const categories = ['Technical', 'Cultural', 'Sports', 'Workshops', 'Hackathons', 'Seminars'];
let database;

if (!process.env.JWT_SECRET || !process.env.SESSION_SECRET || !process.env.FACULTY_CODE || !uri) {
  throw new Error('Copy .env.example to .env and configure MongoDB plus the required secrets.');
}

// Mongoose models keep the data structure easy to read and reuse in class demonstrations.
const schemaOptions = { versionKey: false };
const User = mongoose.model('User', new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, name: String,
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  department: String, role: { type: String, enum: ['student', 'faculty'] }, passwordHash: String, createdAt: Date
}, schemaOptions));
const Event = mongoose.model('Event', new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, title: String, category: String, date: String, time: String,
  venue: String, seats: Number, price: Number, description: String, image: String, booked: Number,
  organizer: String, ownerEmail: String, status: String, cancelReason: String, createdAt: Date
}, schemaOptions));
const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true }, eventId: Number, eventTitle: String, date: String, time: String,
  venue: String, userName: String, email: String, phone: String, studentId: String, department: String, year: String,
  status: String, cancelReason: String, quantity: Number, unitPrice: Number, subtotal: Number, discount: Number,
  total: Number, coupon: String, createdAt: Date, checkedIn: Boolean, checkedInAt: Date
}, schemaOptions);
ticketSchema.index({ eventId: 1, email: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });
const Ticket = mongoose.model('Ticket', ticketSchema);
const wishlistSchema = new mongoose.Schema({ email: String, eventId: Number, createdAt: Date }, schemaOptions);
wishlistSchema.index({ email: 1, eventId: 1 }, { unique: true });
const Wishlist = mongoose.model('Wishlist', wishlistSchema);
const Counter = mongoose.model('Counter', new mongoose.Schema({ _id: String, value: { type: Number, default: 0 } }, schemaOptions));
const models = { users: User, events: Event, tickets: Ticket, wishlists: Wishlist, counters: Counter };

// Existing API routes retain their clear collection vocabulary, but each action is
// executed by a Mongoose model rather than by the native driver.
function mongooseDatabase() {
  return {
    command: () => mongoose.connection.db.admin().ping(),
    collection(name) {
      const Model = models[name];
      if (!Model) throw new Error('Unknown MongoDB collection: ' + name);
      return {
        createIndex: (keys, options) => Model.collection.createIndex(keys, options),
        insertOne: async document => { await Model.create(document); },
        findOne: filter => Model.findOne(filter),
        find: filter => ({
          toArray: async () => (await Model.find(filter)).map(document => document.toObject()),
          sort: order => ({ toArray: async () => (await Model.find(filter).sort(order)).map(document => document.toObject()) })
        }),
        updateOne: (filter, update, options) => Model.updateOne(filter, update, options),
        updateMany: (filter, update, options) => Model.updateMany(filter, update, options),
        deleteOne: filter => Model.deleteOne(filter),
        bulkWrite: operations => Model.bulkWrite(operations),
        findOneAndUpdate: (filter, update, options = {}) => Model.findOneAndUpdate(filter, update, { upsert: options.upsert, new: options.returnDocument === 'after', setDefaultsOnInsert: true })
      };
    }
  };
}
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(session({
  name: 'campus.sid', secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: uri, dbName: databaseName, collectionName: 'sessions', ttl: 7200 }),
  cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 7200000 }
}));
app.use('/api', function (req, res, next) {
  res.set('Cache-Control', 'no-store');
  if (['POST', 'PUT', 'DELETE'].includes(req.method) && (req.get('Content-Type') || '').split(';')[0] !== 'application/json') return res.status(415).json({ message: 'Send application/json.' });
  if (!req.body) req.body = {};
  next();
});

function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
function text(value, min = 1, max = 200) { return typeof value === 'string' && value.trim().length >= min && value.length <= max; }
function emailValid(value) { return text(value, 5) && value.includes('@') && value.includes('.'); }
function publicUser(user) { return { id: user.id, name: user.name, email: user.email, department: user.department, role: user.role }; }
function upcoming(event) { return new Date(event.date + 'T' + event.time) > new Date() && event.status !== 'cancelled'; }
function duplicate(error) { return error && error.code === 11000; }
function quote(event, quantity = 1, coupon = '') {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 4) fail(400, 'Choose between 1 and 4 passes.');
  if (typeof coupon !== 'string') fail(400, 'Invalid offer code.');
  const code = coupon.trim().toUpperCase();
  if (code && code !== 'CAMPUS10') fail(400, 'Offer code not found. Try CAMPUS10.');
  const subtotal = Math.round(event.price * quantity * 100) / 100;
  const discount = code === 'CAMPUS10' ? Math.round(subtotal * 10) / 100 : 0;
  return { quantity, unitPrice: event.price, subtotal, discount, total: Math.round((subtotal - discount) * 100) / 100, coupon: code };
}
async function nextId(name) {
  const counter = await database.collection('counters').findOneAndUpdate({ _id: name }, { $inc: { value: 1 } }, { upsert: true, returnDocument: 'after' });
  return counter.value;
}
async function ownedEvent(req) {
  const event = await database.collection('events').findOne({ id: Number(req.params.id) });
  if (!event) fail(404, 'Event not found.');
  if (event.ownerEmail !== req.user.email) fail(403, 'You can manage only your own events.');
  return event;
}
async function authenticate(req, res, next) {
  try {
    const payload = jwt.verify(req.session.token || '', process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const user = await database.collection('users').findOne({ id: payload.id });
    if (!user) return res.status(401).json({ message: 'Please log in again.' });
    req.user = user; next();
  } catch (error) { res.status(401).json({ message: 'Your session has ended. Please log in.' }); }
}
function faculty(req, res, next) { if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Faculty access required.' }); next(); }
function startSession(req, res, next, user) {
  req.session.regenerate(function (error) {
    if (error) return next(error);
    req.session.token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });
    req.session.save(saveError => saveError ? next(saveError) : res.json({ user: publicUser(user) }));
  });
}
function eventInput(body, booked = 0) {
  const { title, category, date, time, venue, seats, price, description } = body;
  const dateTime = new Date(date + 'T' + time);
  if (!text(title, 3, 100) || !categories.includes(category) || !text(date) || !text(time) || !text(venue, 2, 100) || !text(description, 10, 2000) || !Number.isInteger(seats) || seats < 1 || seats < booked || seats > 10000 || typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > 100000 || !Number.isFinite(dateTime.getTime()) || dateTime <= new Date()) fail(400, 'Check event details: use a future date, whole seats, a valid fee and a description of at least 10 characters.');
  return { title: title.trim(), category, date, time, venue: venue.trim(), seats, price, description: description.trim(), image: '' };
}

app.get('/api/health', async (req, res) => { await database.command({ ping: 1 }); res.json({ status: 'ok', storage: 'mongodb' }); });
app.post('/api/auth/signup', async function (req, res, next) {
  const { name, email, password, department, role, facultyCode } = req.body;
  if (!text(name, 2, 80) || !emailValid(email) || !text(password, 6, 72) || !text(department, 1, 80) || !['student', 'faculty'].includes(role)) fail(400, 'Enter valid details. Password must be 6–72 characters.');
  if (role === 'faculty' && facultyCode !== process.env.FACULTY_CODE) fail(403, 'Invalid faculty invitation code.');
  const user = { id: await nextId('users'), name: name.trim(), email: email.trim().toLowerCase(), department: department.trim(), role, passwordHash: await bcrypt.hash(password, 10), createdAt: new Date() };
  try { await database.collection('users').insertOne(user); } catch (error) { if (duplicate(error)) fail(409, 'This email is already registered.'); throw error; }
  startSession(req, res, next, user);
});
app.post('/api/auth/login', async function (req, res, next) {
  const { email, password, role } = req.body;
  if (!emailValid(email) || !text(password, 1, 72)) fail(400, 'Enter your email and password.');
  const user = await database.collection('users').findOne({ email: email.trim().toLowerCase(), role });
  if (!user || !await bcrypt.compare(password, user.passwordHash)) fail(401, 'Email, password or role is incorrect.');
  startSession(req, res, next, user);
});
app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));
app.put('/api/profile', authenticate, async function (req, res) {
  const { name, department } = req.body;
  if (!text(name, 2, 80) || !text(department, 1, 80)) fail(400, 'Enter your name and course or department.');
  await database.collection('users').updateOne({ id: req.user.id }, { $set: { name: name.trim(), department: department.trim() } });
  res.json({ user: { ...publicUser(req.user), name: name.trim(), department: department.trim() } });
});
app.post('/api/auth/logout', (req, res, next) => req.session.destroy(error => error ? next(error) : (res.clearCookie('campus.sid', { path: '/' }), res.json({ message: 'Logged out.' }))));

app.get('/api/events', authenticate, async (req, res) => res.json(await database.collection('events').find({}).sort({ date: 1, time: 1 }).toArray()));
app.post('/api/events', authenticate, faculty, async function (req, res) {
  const event = { ...eventInput(req.body), id: await nextId('events'), booked: 0, organizer: req.user.name, ownerEmail: req.user.email, status: 'active', createdAt: new Date() };
  await database.collection('events').insertOne(event); res.status(201).json(event);
});
app.put('/api/events/:id', authenticate, faculty, async function (req, res) {
  const event = await ownedEvent(req);
  if (event.status === 'cancelled') fail(409, 'Cancelled events cannot be edited.');
  const updated = { ...event, ...eventInput(req.body, event.booked) };
  await database.collection('events').updateOne({ id: event.id }, { $set: updated });
  await database.collection('tickets').updateMany({ eventId: event.id }, { $set: { eventTitle: updated.title, date: updated.date, time: updated.time, venue: updated.venue } });
  res.json(updated);
});
app.delete('/api/events/:id', authenticate, faculty, async function (req, res) {
  const event = await ownedEvent(req);
  if (event.booked > 0) fail(409, 'Cannot delete an event with active registrations.');
  await database.collection('events').deleteOne({ id: event.id }); res.json({ message: 'Event deleted.' });
});

app.get('/api/wishlist', authenticate, async (req, res) => res.json((await database.collection('wishlists').find({ email: req.user.email }).toArray()).map(item => item.eventId)));
app.post('/api/wishlist/:id', authenticate, async function (req, res) {
  const eventId = Number(req.params.id);
  if (!await database.collection('events').findOne({ id: eventId })) fail(404, 'Event not found.');
  await database.collection('wishlists').updateOne({ email: req.user.email, eventId }, { $setOnInsert: { email: req.user.email, eventId, createdAt: new Date() } }, { upsert: true });
  res.status(201).json({ eventId });
});
app.delete('/api/wishlist/:id', authenticate, async (req, res) => { await database.collection('wishlists').deleteOne({ email: req.user.email, eventId: Number(req.params.id) }); res.json({ message: 'Removed from wishlist.' }); });

app.get('/api/tickets', authenticate, async (req, res) => res.json(await database.collection('tickets').find({ email: req.user.email }).toArray()));
app.post('/api/quote', authenticate, async function (req, res) {
  const event = await database.collection('events').findOne({ id: Number(req.body.eventId) });
  if (!event) fail(404, 'Event not found.'); if (!upcoming(event)) fail(409, 'Registration has closed.');
  const result = quote(event, req.body.quantity, req.body.coupon);
  if (result.quantity > event.seats - event.booked) fail(409, 'Not enough passes remain.'); res.json(result);
});
app.post('/api/tickets', authenticate, async function (req, res) {
  if (req.user.role !== 'student') fail(403, 'Only students can register.');
  const { eventId, name, phone, studentId, department, year } = req.body;
  if (!text(name, 2, 80) || !text(phone, 10, 10) || !phone.split('').every(character => '0123456789'.includes(character)) || !text(studentId, 5, 40) || !text(department, 1, 80) || !['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(year)) fail(400, 'Complete your student details correctly.');
  const event = await database.collection('events').findOne({ id: Number(eventId) });
  if (!event) fail(404, 'Event not found.'); if (!upcoming(event)) fail(409, 'Registration has closed.');
  const pricing = quote(event, req.body.quantity, req.body.coupon);
  if (req.body.expectedTotal !== undefined && req.body.expectedTotal !== pricing.total) fail(409, 'The price has changed. Review your order again.');
  const capacity = await database.collection('events').findOneAndUpdate({ id: event.id, status: 'active', $expr: { $lte: [{ $add: ['$booked', pricing.quantity] }, '$seats'] } }, { $inc: { booked: pricing.quantity } }, { returnDocument: 'after' });
  if (!capacity) fail(409, 'Not enough passes remain.');
  const ticket = { ticketId: 'CP-' + await nextId('tickets'), eventId: event.id, eventTitle: event.title, date: event.date, time: event.time, venue: event.venue, userName: name, email: req.user.email, phone, studentId, department, year, status: 'active', ...pricing, createdAt: new Date(), checkedIn: false };
  try { await database.collection('tickets').insertOne(ticket); }
  catch (error) { await database.collection('events').updateOne({ id: event.id }, { $inc: { booked: -pricing.quantity } }); if (duplicate(error)) fail(409, 'You already have a ticket.'); throw error; }
  res.status(201).json(ticket);
});
app.delete('/api/tickets/:id', authenticate, async function (req, res) {
  const ticket = await database.collection('tickets').findOne({ ticketId: req.params.id, email: req.user.email });
  if (!ticket) fail(404, 'Ticket not found.'); if (ticket.status !== 'active') fail(409, 'Ticket is already cancelled.');
  const event = await database.collection('events').findOne({ id: ticket.eventId });
  if (ticket.checkedIn || (event && !upcoming(event))) fail(409, 'Cancellation closes when the event starts or the order is checked in.');
  const cancelled = await database.collection('tickets').updateOne({ _id: ticket._id, status: 'active' }, { $set: { status: 'cancelled', cancelReason: 'Cancelled by student' } });
  if (!cancelled.modifiedCount) fail(409, 'Ticket is already cancelled.');
  if (event) await database.collection('events').updateOne({ id: event.id }, { $inc: { booked: -ticket.quantity } });
  res.json({ message: 'Registration cancelled.' });
});
app.get('/api/events/:id/attendees', authenticate, faculty, async function (req, res) { const event = await ownedEvent(req); res.json(await database.collection('tickets').find({ eventId: event.id }).sort({ createdAt: -1 }).toArray()); });
app.post('/api/events/:id/cancel', authenticate, faculty, async function (req, res) {
  const event = await ownedEvent(req); if (!upcoming(event)) fail(409, 'Only upcoming events can be cancelled.');
  if (!text(req.body.reason, 5, 300)) fail(400, 'Provide a cancellation reason (5–300 characters).');
  const reason = req.body.reason.trim();
  await database.collection('events').updateOne({ id: event.id }, { $set: { status: 'cancelled', cancelReason: reason, booked: 0 } });
  await database.collection('tickets').updateMany({ eventId: event.id, status: 'active' }, { $set: { status: 'cancelled', cancelReason: 'Organizer: ' + reason } });
  res.json({ message: 'Event cancelled; all active orders have been cancelled.' });
});
app.post('/api/events/:id/check-in', authenticate, faculty, async function (req, res) {
  const event = await ownedEvent(req); if (event.status === 'cancelled') fail(404, 'Active order not found for this event.');
  const result = await database.collection('tickets').findOneAndUpdate({ eventId: event.id, ticketId: req.body.ticketId, status: 'active', checkedIn: false }, { $set: { checkedIn: true, checkedInAt: new Date() } }, { returnDocument: 'after' });
  if (!result) fail(409, 'This order has already checked in or is not active.');
  res.json({ message: 'All ' + result.quantity + ' passes in this order are checked in.' });
});

app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found.' }));
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/style.css', (req, res) => res.sendFile(__dirname + '/style.css'));
app.use('/js', express.static(__dirname + '/js'));
app.use((error, req, res, next) => {
  // Keep database details out of the browser, but make local diagnosis clear in the terminal.
  if (!error.status) console.error('CampusPass API error:', error.message);
  res.status(error.status || 500).json({ message: error.status ? error.message : 'Something went wrong. Please try again.' });
});

async function setupDatabase() {
  await mongoose.connect(uri, { dbName: databaseName, serverSelectionTimeoutMS: 8000 });
  database = mongooseDatabase();
  await Promise.all([
    User.init(), Event.init(), Ticket.init(), Wishlist.init(), Counter.init()
  ]);
  const facultyHash = await bcrypt.hash('123456', 10); const studentHash = await bcrypt.hash('123456', 10);
  await database.collection('users').updateOne({ email: 'faculty@campus.edu' }, { $setOnInsert: { id: await nextId('users'), name: 'Demo Faculty', email: 'faculty@campus.edu', department: 'Computer Science', role: 'faculty', passwordHash: facultyHash, createdAt: new Date() } }, { upsert: true });
  await database.collection('users').updateOne({ email: 'student@campus.edu' }, { $setOnInsert: { id: await nextId('users'), name: 'Demo Student', email: 'student@campus.edu', department: 'BCA', role: 'student', passwordHash: studentHash, createdAt: new Date() } }, { upsert: true });
  await database.collection('events').bulkWrite(seedEvents.map(event => ({ updateOne: { filter: { id: event.id }, update: { $setOnInsert: { ...event, status: 'active', createdAt: new Date() } }, upsert: true } })));
  // Seed event IDs occupy 1–8, so organizer-created events start after them.
  await database.collection('counters').updateOne({ _id: 'events' }, { $max: { value: Math.max(...seedEvents.map(event => event.id)) } }, { upsert: true });
}
async function start() { await setupDatabase(); http.createServer(app).listen(port, '127.0.0.1', () => console.log('CampusPass: http://localhost:' + port + ' using MongoDB database ' + databaseName)); }
start().catch(error => {
  const detail = error && error.message ? error.message : 'Unknown connection error.';
  const dnsHint = /querySrv|ENOTFOUND|ECONNREFUSED.*_mongodb\._tcp/i.test(detail)
    ? ' Atlas SRV DNS lookup failed. Re-copy the exact Atlas driver URI, or use Atlas’s standard mongodb:// connection string if your network blocks SRV DNS.'
    : '';
  console.error('CampusPass could not connect to MongoDB:' + dnsHint + ' ' + detail);
  process.exit(1);
});
