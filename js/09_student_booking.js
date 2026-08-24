// 9. STUDENT APPLICATION - form validation
// ------------------------------------------------------------
function showBookingStepOne(id) {
  const event = findEvent(id);
  if (!event || currentUser.role !== 'student') return;

  bookingData = getSession('bookingData', {});
  bookingData.eventId = event.id;

  app.innerHTML = `
    <section class="form-card">
      <div class="steps">
        <span class="active">1. Your Details</span>
        <span>2. Ticket</span>
      </div>

      <p class="eyebrow">Applying for ${escapeText(event.title)}</p>
      <h1 class="section-title">Student Details</h1>
      <form id="bookingOne">
        <div class="form-grid">
          <label>Full Name
            <input id="bookName" value="${escapeText(bookingData.name || currentUser.name)}">
          </label>
          <label>College Email
            <input id="bookEmail" type="email" value="${escapeText(bookingData.email || currentUser.email)}">
          </label>
          <label>Phone Number
            <input id="bookPhone" placeholder="10 digit mobile number" value="${escapeText(bookingData.phone || '')}">
          </label>
          <label>Student ID
            <input id="bookStudentId" placeholder="Example: 2026BCA001" value="${escapeText(bookingData.studentId || '')}">
          </label>
          <label>Department
            <input id="bookDepartment" value="${escapeText(bookingData.department || currentUser.department)}">
          </label>
          <label>Year
            <select id="bookYear">
              <option value="">Select year</option>
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>4th Year</option>
            </select>
          </label>
        </div>
        <p id="bookingError" class="error"></p>
        <button class="primary-button" type="submit">Apply for Event</button>
      </form>
    </section>`;

  document.getElementById('bookYear').value = bookingData.year || '';

  document.getElementById('bookingOne').addEventListener('submit', function (formEvent) {
    formEvent.preventDefault();

    const name = document.getElementById('bookName').value.trim();
    const email = document.getElementById('bookEmail').value.trim();
    const phone = document.getElementById('bookPhone').value.trim();
    const studentId = document.getElementById('bookStudentId').value.trim();
    const department = document.getElementById('bookDepartment').value.trim();
    const year = document.getElementById('bookYear').value;
    const error = document.getElementById('bookingError');

    if (name === '' || email === '' || phone === '' || studentId === '' || department === '' || year === '') {
      error.textContent = 'Please complete every field.';
      return;
    }

    if (!validEmail(email)) {
      error.textContent = 'Please enter a valid email address.';
      return;
    }

    if (!validPhone(phone)) {
      error.textContent = 'Phone number must contain exactly 10 digits.';
      return;
    }

    if (studentId.length < 5) {
      error.textContent = 'Please enter a valid Student ID.';
      return;
    }

    bookingData = {
      eventId: event.id,
      name: name,
      email: email,
      phone: phone,
      studentId: studentId,
      department: department,
      year: year
    };

    saveSession('bookingData', bookingData);

    if (event.price === 0) {
      registerForEvent(event);
    } else {
      showPayment(event);
    }
  });
}

function showPayment(event) {
  app.innerHTML = `
    <section class="form-card">
      <div class="steps">
        <span>1. Your Details</span>
        <span class="active">2. Ticket</span>
      </div>
      <p class="eyebrow">Demo Payment</p>
      <h1 class="section-title">Complete Application</h1>
      <p class="section-subtitle">No real payment is made. This is only a front-end demonstration.</p>
      <p><b>Event:</b> ${escapeText(event.title)}</p>
      <p><b>Amount:</b> ₹${event.price}</p>
      <form id="paymentForm">
        <label>Card Number
          <input id="cardNumber" placeholder="16 digit card number">
        </label>
        <label>Card Holder Name
          <input id="cardName" placeholder="Your name">
        </label>
        <p id="paymentError" class="error"></p>
        <div class="button-row">
          <button type="button" class="secondary-button" data-book-back="${event.id}">Back</button>
          <button class="primary-button" type="submit">Pay ₹${event.price}</button>
        </div>
      </form>
    </section>`;

  document.getElementById('paymentForm').addEventListener('submit', function (formEvent) {
    formEvent.preventDefault();

    const cardNumber = document.getElementById('cardNumber').value.replaceAll(' ', '');
    const cardName = document.getElementById('cardName').value.trim();
    const error = document.getElementById('paymentError');

    if (cardName === '') {
      error.textContent = 'Enter card holder name.';
      return;
    }

    if (!/^\d{16}$/.test(cardNumber)) {
      error.textContent = 'Card number must contain 16 digits.';
      return;
    }

    registerForEvent(event);
  });
}

function registerForEvent(event) {
  const tickets = getTickets();

  if (availableSeats(event) <= 0) {
    showToast('Sorry, this event is now full.', true);
    showDetails(event.id);
    return;
  }

  const existingTicket = tickets.find(function (ticket) {
    return ticket.eventId === event.id && ticket.email === bookingData.email && ticket.status === 'active';
  });

  if (existingTicket) {
    showToast('You are already registered for this event.', true);
    showTickets();
    return;
  }

  const ticket = {
    ticketId: 'CP-' + Date.now().toString().slice(-7),
    eventId: event.id,
    eventTitle: event.title,
    date: event.date,
    time: event.time,
    venue: event.venue,
    userName: bookingData.name,
    email: bookingData.email,
    phone: bookingData.phone,
    studentId: bookingData.studentId,
    department: bookingData.department,
    year: bookingData.year,
    status: 'active',
    registeredAt: new Date().toLocaleString('en-IN')
  };

  tickets.push(ticket);
  saveTickets(tickets);

  const events = getEvents();
  const index = events.findIndex(function (item) {
    return item.id === event.id;
  });

  events[index].booked++;
  saveEvents(events);

  removeSession('bookingData');
  bookingData = {};

  showToast('Application successful. Ticket created.');
  showTicket(ticket, true);
}

// ------------------------------------------------------------
