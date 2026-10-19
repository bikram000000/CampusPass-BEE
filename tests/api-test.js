// Integration checks use the same Fetch API, objects and async/await as the app.
const base = 'http://127.0.0.1:3000/api';
let passed = 0;
function check(condition, message) { if (!condition) throw new Error(message); passed++; }
async function request(path, method = 'GET', body, cookie = '') {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, body: await response.json(), cookie: (response.headers.get('set-cookie') || '').split(';')[0], headers: response.headers };
}
async function run() {
  check((await request('/events')).status === 401, 'Anonymous events access');
  check((await request('/auth/login', 'POST', { email: 'faculty@campus.edu', password: 'wrong', role: 'faculty' })).status === 401, 'Bad password');
  const faculty = await request('/auth/login', 'POST', { email: 'faculty@campus.edu', password: '123456', role: 'faculty' });
  check(faculty.status === 200 && !faculty.body.user.passwordHash, 'Faculty login and safe user response');
  check(faculty.headers.get('set-cookie').includes('HttpOnly') && faculty.headers.get('set-cookie').includes('SameSite=Strict'), 'Session cookie flags');
  check((await request('/auth/me', 'GET', undefined, faculty.cookie)).status === 200, 'Session restoration');
  const suffix = Date.now();
  const studentBody = { name: 'Test Student', department: 'BCA', email: 'test' + suffix + '@campus.edu', password: 'test12345', role: 'student' };
  const student = await request('/auth/signup', 'POST', studentBody);
  check(student.status === 200, 'Student signup');
  check((await request('/auth/signup', 'POST', studentBody)).status === 409, 'Duplicate signup');
  check((await request('/auth/signup', 'POST', { ...studentBody, email: 'f' + suffix + '@campus.edu', role: 'faculty', facultyCode: 'incorrect' })).status === 403, 'Faculty invitation protection');
  const eventBody = { title: 'Integration Test Event', category: 'Workshops', date: '2099-12-15', time: '12:00', venue: 'Test Lab', seats: 1, price: 0, description: 'A test event for the campus platform.' };
  check((await request('/events', 'POST', eventBody, student.cookie)).status === 403, 'Student cannot create events');
  check((await request('/events', 'POST', { ...eventBody, seats: 1.5 }, faculty.cookie)).status === 400, 'Seat validation');
  const created = await request('/events', 'POST', eventBody, faculty.cookie);
  check(created.status === 201, 'Event creation');
  const id = created.body.id;
  check((await request('/events/' + id, 'PUT', { ...eventBody, title: 'Updated test event' }, faculty.cookie)).status === 200, 'Event update');
  const booking = { eventId: id, name: 'Test Student', phone: '9876543210', studentId: 'TEST123', department: 'BCA', year: '1st Year', email: 'spoofed@campus.edu' };
  check((await request('/tickets', 'POST', { ...booking, phone: 'bad' }, student.cookie)).status === 400, 'Booking validation');
  const booked = await request('/tickets', 'POST', booking, student.cookie);
  check(booked.status === 201 && booked.body.email === studentBody.email, 'Booking uses authenticated identity');
  check((await request('/tickets', 'POST', booking, student.cookie)).status === 409, 'Duplicate booking');
  check((await request('/events/' + id, 'DELETE', undefined, faculty.cookie)).status === 409, 'Cannot delete occupied event');
  const other = await request('/auth/signup', 'POST', { ...studentBody, email: 'other' + suffix + '@campus.edu' });
  check((await request('/tickets', 'POST', booking, other.cookie)).status === 409, 'Capacity enforcement');
  check((await request('/tickets', 'GET', undefined, other.cookie)).body.length === 0, 'Private tickets');
  check((await request('/tickets/' + booked.body.ticketId, 'DELETE', undefined, other.cookie)).status === 404, 'Ticket ownership');
  check((await request('/tickets/' + booked.body.ticketId, 'DELETE', undefined, student.cookie)).status === 200, 'Cancellation');
  check((await request('/tickets/' + booked.body.ticketId, 'DELETE', undefined, student.cookie)).status === 409, 'Repeated cancellation');
  const rebooked = await request('/tickets', 'POST', booking, other.cookie);
  check(rebooked.status === 201, 'Cancellation restores capacity');
  await request('/tickets/' + rebooked.body.ticketId, 'DELETE', undefined, other.cookie);
  check((await request('/events/' + id, 'DELETE', undefined, faculty.cookie)).status === 200, 'Event deletion');
  const groupEvent = await request('/events', 'POST', { ...eventBody, seats: 5, price: 100 }, faculty.cookie);
  const groupId = groupEvent.body.id;
  const groupBooking = { ...booking, eventId: groupId, quantity: 3, coupon: 'campus10' };
  const quote = await request('/quote', 'POST', groupBooking, student.cookie);
  check(quote.status === 200 && quote.body.total === 270 && quote.body.discount === 30, 'Server-side group offer calculation');
  check((await request('/quote', 'POST', { ...groupBooking, quantity: 5 }, student.cookie)).status === 400, 'Maximum group size');
  check((await request('/quote', 'POST', { ...groupBooking, coupon: 'FAKE' }, student.cookie)).status === 400, 'Invalid coupon rejection');
  check((await request('/tickets', 'POST', { ...groupBooking, expectedTotal: 1 }, student.cookie)).status === 409, 'Reject stale or tampered checkout total');
  const group = await request('/tickets', 'POST', { ...groupBooking, expectedTotal: 270, total: 1 }, student.cookie);
  check(group.status === 201 && group.body.total === 270 && group.body.quantity === 3, 'Server owns final price and group count');
  check((await request('/tickets', 'POST', { ...groupBooking, quantity: 3 }, other.cookie)).status === 409, 'Group capacity protection');
  check((await request('/events/' + groupId + '/attendees', 'GET', undefined, student.cookie)).status === 403, 'Student cannot read attendee directory');
  const anotherFaculty = await request('/auth/signup', 'POST', { ...studentBody, email: 'organizer' + suffix + '@campus.edu', role: 'faculty', facultyCode: process.env.FACULTY_CODE });
  check(anotherFaculty.status === 200, 'Invited faculty registration');
  check((await request('/events/' + groupId + '/attendees', 'GET', undefined, anotherFaculty.cookie)).status === 403, 'Attendees restricted to event owner');
  check((await request('/events/' + groupId, 'PUT', eventBody, anotherFaculty.cookie)).status === 403, 'Editing restricted to event owner');
  check((await request('/events/' + groupId + '/cancel', 'POST', { reason: 'Not my event' }, anotherFaculty.cookie)).status === 403, 'Cancellation restricted to event owner');
  const roster = await request('/events/' + groupId + '/attendees', 'GET', undefined, faculty.cookie);
  check(roster.status === 200 && roster.body[0].quantity === 3, 'Owner can inspect group bookings');
  check((await request('/events/' + groupId + '/check-in', 'POST', { ticketId: group.body.ticketId }, faculty.cookie)).status === 200, 'Manual group check-in');
  check((await request('/events/' + groupId + '/check-in', 'POST', { ticketId: group.body.ticketId }, faculty.cookie)).status === 409, 'Duplicate check-in rejection');
  check((await request('/tickets/' + group.body.ticketId, 'DELETE', undefined, student.cookie)).status === 409, 'Checked-in booking cannot cancel');
  check((await request('/events/' + groupId + '/cancel', 'POST', { reason: 'Venue temporarily unavailable' }, faculty.cookie)).status === 200, 'Organizer cancellation');
  const history = await request('/tickets', 'GET', undefined, student.cookie);
  check(history.body.find(ticket => ticket.ticketId === group.body.ticketId).status === 'cancelled', 'Organizer cancellation reaches booking history');
  check((await request('/quote', 'POST', groupBooking, student.cookie)).status === 409, 'Cancelled event cannot quote');
  check((await request('/tickets', 'POST', groupBooking, other.cookie)).status === 409, 'Cancelled event cannot book');
  await request('/events/' + groupId, 'DELETE', undefined, faculty.cookie);
  const profile = await request('/profile', 'PUT', { name: 'Updated Student', department: 'Computer Science', role: 'faculty' }, student.cookie);
  check(profile.status === 200 && profile.body.user.role === 'student' && profile.body.user.name === 'Updated Student', 'Profile update cannot escalate role');
  check((await request('/profile', 'PUT', { name: '', department: '' }, student.cookie)).status === 400, 'Profile validation');
  const raceEvent = await request('/events', 'POST', eventBody, faculty.cookie);
  const raceResults = await Promise.all([
    request('/tickets', 'POST', { ...booking, eventId: raceEvent.body.id }, student.cookie),
    request('/tickets', 'POST', { ...booking, eventId: raceEvent.body.id }, other.cookie)
  ]);
  check(raceResults.filter(result => result.status === 201).length === 1 && raceResults.filter(result => result.status === 409).length === 1, 'Concurrent last-pass requests cannot oversell');
  await request('/events/' + raceEvent.body.id + '/cancel', 'POST', { reason: 'Integration test finished' }, faculty.cookie);
  await request('/events/' + raceEvent.body.id, 'DELETE', undefined, faculty.cookie);
  await request('/auth/logout', 'POST', undefined, student.cookie);
  check((await request('/auth/me', 'GET', undefined, student.cookie)).status === 401, 'Logout invalidates session');
  check((await request('/missing')).status === 404, 'Unknown API route');
  console.log(passed + ' integration checks passed.');
}
run().catch(function (error) { console.error(error); process.exitCode = 1; });
