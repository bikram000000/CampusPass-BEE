// CampusPass - Simple JavaScript for Continuous Assessment
// Main syllabus topics used here:
// Variables, conditions, functions, arrays, objects, array methods,
// DOM, events, forms, validation, localStorage, sessionStorage,
// ES6 features, JSON, Fetch API, Promises and async/await.

const app = document.getElementById('app');
const navbar = document.getElementById('navbar');
const mobileNav = document.getElementById('mobileNav');
const profileBox = document.getElementById('profileBox');
const toast = document.getElementById('toast');

let currentUser = null;
let selectedEventId = null;
let bookingData = {};
let countdownTimer = null;

// ------------------------------------------------------------

// 1. STORAGE - localStorage, sessionStorage and JSON
// ------------------------------------------------------------
function getData(key, defaultValue) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSession(key, defaultValue) {
  const data = sessionStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

function saveSession(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function removeSession(key) {
  sessionStorage.removeItem(key);
}

function getAccounts() { return getData('campusPassAccounts', []); }
function getEvents() { return getData('campusPassEvents', []); }
function getTickets() { return getData('campusPassTickets', []); }
function saveAccounts(accounts) { saveData('campusPassAccounts', accounts); }
function saveEvents(events) { saveData('campusPassEvents', events); }
function saveTickets(tickets) { saveData('campusPassTickets', tickets); }

// ------------------------------------------------------------

// 2. DEMO DATA - arrays + objects
// ------------------------------------------------------------
function createDemoEvents() {
  const events = getEvents();
  if (events.length > 0) return;

  const demoEvents = [
    {
      id: 1,
      title: 'Web Development Workshop',
      category: 'Workshops',
      date: '2026-09-10',
      time: '10:00',
      venue: 'Computer Lab 2',
      seats: 40,
      booked: 0,
      price: 0,
      description: 'Learn the basics of HTML, CSS and JavaScript by creating a simple web page.',
      organizer: 'Dr. Aditi Sharma',
      ownerEmail: 'faculty@campus.edu',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 2,
      title: 'Annual Cultural Fest',
      category: 'Cultural',
      date: '2026-09-18',
      time: '17:00',
      venue: 'Main Auditorium',
      seats: 150,
      booked: 0,
      price: 100,
      description: 'Enjoy music, dance, art and student performances at the annual cultural festival.',
      organizer: 'Prof. Nisha Mehta',
      ownerEmail: 'faculty2@campus.edu',
      image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 3,
      title: 'Campus Hackathon',
      category: 'Hackathons',
      date: '2026-09-25',
      time: '09:00',
      venue: 'Innovation Centre',
      seats: 80,
      booked: 0,
      price: 0,
      description: 'Create a useful prototype with your team in one exciting day.',
      organizer: 'Innovation Club',
      ownerEmail: 'faculty3@campus.edu',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 4,
      title: 'Inter-College Basketball',
      category: 'Sports',
      date: '2026-10-03',
      time: '08:30',
      venue: 'University Sports Arena',
      seats: 120,
      booked: 0,
      price: 30,
      description: 'Cheer for campus teams as colleges compete for the championship trophy.',
      organizer: 'Sports Committee',
      ownerEmail: 'faculty4@campus.edu',
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80',
    }
  ];

  saveEvents(demoEvents);
}

function createDemoFacultyAccounts() {
  const accounts = getAccounts();
  if (accounts.length > 0) return;

  const facultyAccounts = [
    {
      name: 'Demo Faculty',
      email: 'faculty@campus.edu',
      department: 'Computer Science',
      role: 'faculty',
      password: '123456'
    },
    {
      name: 'Demo Professor',
      email: 'faculty2@campus.edu',
      department: 'Management',
      role: 'faculty',
      password: '123456'
    }
  ];

  saveAccounts(facultyAccounts);
}

// ------------------------------------------------------------

// 3. SMALL HELPER FUNCTIONS
// ------------------------------------------------------------
function formatDate(date) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function findEvent(id) {
  return getEvents().find(function (event) {
    return event.id === Number(id);
  });
}

function availableSeats(event) {
  return event.seats - event.booked;
}

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = isError ? 'toast show error-toast' : 'toast show';
  setTimeout(function () {
    toast.className = 'toast';
  }, 2500);
}

function validEmail(email) {
  return email.includes('@') && email.includes('.');
}

function validPhone(phone) {
  return /^\d{10}$/.test(phone);
}

function escapeText(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ------------------------------------------------------------

// 4. LOGIN + SIGNUP - separate Student / Faculty roles
// ------------------------------------------------------------
function showLogin() {
  navbar.classList.add('hidden');
  mobileNav.classList.add('hidden');
  profileBox.classList.add('hidden');

  app.innerHTML = `
    <section class="login-card">
      <p class="eyebrow">Campus event platform</p>
      <h1>CampusPass</h1>
      <p>Log in or create an account to continue.</p>

      <div class="auth-tabs">
        <button class="active" data-auth="login">Log in</button>
        <button data-auth="signup">Sign up</button>
      </div>

      <div class="role-buttons">
        <button class="active" data-role="student">Student</button>
        <button data-role="faculty">Faculty</button>
      </div>

      <form id="authForm"></form>
    </section>`;

  let mode = 'login';
  let role = 'student';

  function renderAuthForm() {
    const form = document.getElementById('authForm');

    if (mode === 'login') {
      form.innerHTML = `
        <label>University Email
          <input id="authEmail" type="email" placeholder="you@college.edu">
        </label>
        <label>Password
          <input id="authPassword" type="password" placeholder="Minimum 6 characters">
        </label>
        <p id="authError" class="error"></p>
        <button class="primary-button" type="submit">Log in as ${role === 'student' ? 'Student' : 'Faculty'}</button>
        <p class="auth-note">Demo faculty: faculty@campus.edu / 123456</p>`;
    } else {
      form.innerHTML = `
        <label>Full Name
          <input id="authName" placeholder="Enter your full name">
        </label>
        <label>University Email
          <input id="authEmail" type="email" placeholder="you@college.edu">
        </label>
        <label>${role === 'student' ? 'Course' : 'Department'}
          <input id="authDepartment" placeholder="${role === 'student' ? 'Example: BCA' : 'Example: Computer Science'}">
        </label>
        <label>Password
          <input id="authPassword" type="password" placeholder="Minimum 6 characters">
        </label>
        <label>Confirm Password
          <input id="confirmPassword" type="password" placeholder="Type password again">
        </label>
        <p id="authError" class="error"></p>
        <button class="primary-button" type="submit">Create ${role === 'student' ? 'Student' : 'Faculty'} Account</button>`;
    }

    form.addEventListener('submit', handleAuth);
  }

  function handleAuth(event) {
    event.preventDefault();

    const email = document.getElementById('authEmail').value.trim().toLowerCase();
    const password = document.getElementById('authPassword').value;
    const error = document.getElementById('authError');

    if (email === '' || password === '') {
      error.textContent = 'Please fill email and password.';
      return;
    }

    if (!validEmail(email)) {
      error.textContent = 'Enter a valid email address.';
      return;
    }

    if (password.length < 6) {
      error.textContent = 'Password must have at least 6 characters.';
      return;
    }

    const accounts = getAccounts();

    if (mode === 'login') {
      const account = accounts.find(function (item) {
        return item.email === email && item.role === role;
      });

      if (!account) {
        error.textContent = 'No account found for this role and email.';
        return;
      }

      if (account.password !== password) {
        error.textContent = 'Incorrect password.';
        return;
      }

      currentUser = {
        name: account.name,
        email: account.email,
        department: account.department,
        role: account.role
      };
      saveData('campusPassUser', currentUser);
      showApp('home');
      return;
    }

    const name = document.getElementById('authName').value.trim();
    const department = document.getElementById('authDepartment').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (name.length < 2) {
      error.textContent = 'Name must contain at least 2 characters.';
      return;
    }

    if (department === '') {
      error.textContent = 'Please enter your course or department.';
      return;
    }

    if (password !== confirmPassword) {
      error.textContent = 'Passwords do not match.';
      return;
    }

    const alreadyExists = accounts.some(function (item) {
      return item.email === email;
    });

    if (alreadyExists) {
      error.textContent = 'An account with this email already exists.';
      return;
    }

    const newAccount = {
      name: name,
      email: email,
      department: department,
      role: role,
      password: password
    };

    accounts.push(newAccount);
    saveAccounts(accounts);

    currentUser = {
      name: name,
      email: email,
      department: department,
      role: role
    };
    saveData('campusPassUser', currentUser);
    showToast('Account created successfully.');
    showApp('home');
  }

  document.querySelectorAll('[data-auth]').forEach(function (button) {
    button.addEventListener('click', function () {
      mode = button.dataset.auth;
      document.querySelectorAll('[data-auth]').forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
      renderAuthForm();
    });
  });

  document.querySelectorAll('[data-role]').forEach(function (button) {
    button.addEventListener('click', function () {
      role = button.dataset.role;
      document.querySelectorAll('[data-role]').forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
      renderAuthForm();
    });
  });

  renderAuthForm();
}

function showApp(page) {
  createDemoEvents();
  navbar.classList.remove('hidden');
  mobileNav.classList.remove('hidden');

  const faculty = currentUser.role === 'faculty';

  document.getElementById('ticketLink').classList.toggle('hidden', faculty);
  document.getElementById('postLink').classList.toggle('hidden', !faculty);
  document.getElementById('myEventsLink').classList.toggle('hidden', !faculty);
  document.getElementById('mobileTicket').classList.toggle('hidden', faculty);
  document.getElementById('mobilePost').classList.toggle('hidden', !faculty);
  document.getElementById('mobileMyEvents').classList.toggle('hidden', !faculty);

  changePage(page || 'home');
}

function showProfile() {
  profileBox.innerHTML = `
    <h3>${currentUser.role === 'student' ? 'Student Profile' : 'Faculty Profile'}</h3>
    <p><b>Name:</b> ${escapeText(currentUser.name)}</p>
    <p><b>Email:</b> ${escapeText(currentUser.email)}</p>
    <p><b>${currentUser.role === 'student' ? 'Course' : 'Department'}:</b> ${escapeText(currentUser.department)}</p>
    <p><b>Role:</b> ${currentUser.role}</p>`;
  profileBox.classList.toggle('hidden');
}

// ------------------------------------------------------------

// 5. EVENT CARDS + DOM MANIPULATION
// ------------------------------------------------------------
function createEventCard(event) {
  const card = document.createElement('article');
  card.className = 'event-card';
  card.innerHTML = `
    <div class="event-cover" style="background-image:url('${event.image}')">
      <span>${escapeText(event.category)}</span>
      <h3>${escapeText(event.title)}</h3>
    </div>
    <div class="event-body">
      <p><b>${formatDate(event.date)}</b> · ${event.time}</p>
      <p>${escapeText(event.venue)}</p>
      <p>${escapeText(event.organizer)}</p>
      <p class="seats">${availableSeats(event)} of ${event.seats} seats available</p>
      <p><b>${event.price === 0 ? 'Free entry' : '₹' + event.price}</b></p>
      <button class="primary-button" data-details="${event.id}">View Details</button>
    </div>`;
  return card;
}

function displayEvents(events, container) {
  container.innerHTML = '';

  if (events.length === 0) {
    container.innerHTML = '<div class="empty-card"><h3>No events found</h3><p>Try another search or category.</p></div>';
    return;
  }

  events.forEach(function (event) {
    container.appendChild(createEventCard(event));
  });
}

// ------------------------------------------------------------

// 6. HOME + CATEGORY FILTER
// ------------------------------------------------------------
function showHome() {
  const events = getEvents();
  const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Workshops', 'Hackathons', 'Seminars'];

  app.innerHTML = `
    <section class="hero">
      <div>
        <p class="eyebrow">Campus events</p>
        <h1>Make every campus moment count.</h1>
        <p>Students can find and apply for events. Faculty can create and manage events.</p>
        <button class="primary-button" data-page="events">Browse Events</button>
      </div>
      <div class="hero-art">
        <small>TOTAL EVENTS</small>
        <strong>${events.length}</strong>
        <small>stored in localStorage</small>
      </div>
    </section>

    <div class="heading-row">
      <div><p class="eyebrow">Explore</p><h2>Event categories</h2></div>
    </div>
    <div class="category-row" id="categories"></div>

    <div class="heading-row">
      <div><p class="eyebrow">Upcoming</p><h2>Popular events</h2></div>
      <a href="#" data-page="events">View all events →</a>
    </div>
    <div class="event-grid" id="homeEvents"></div>

    <div class="heading-row">
      <div><p class="eyebrow">Fetch API</p><h2>Organizer profiles</h2></div>
    </div>
    <div class="event-grid" id="organizerList">
      <div class="empty-card">Loading organizer profiles...</div>
    </div>`;

  const categoryBox = document.getElementById('categories');

  categories.forEach(function (category) {
    const button = document.createElement('button');
    button.className = 'category-chip';
    button.textContent = category;
    button.addEventListener('click', function () {
      saveSession('eventCategory', category);
      showEvents();
    });
    categoryBox.appendChild(button);
  });

  displayEvents(events.slice(0, 3), document.getElementById('homeEvents'));
  loadOrganizerProfiles();
}

// ------------------------------------------------------------

// 7. SEARCH, FILTER, SORT - higher order functions
// ------------------------------------------------------------
function showEvents() {
  app.innerHTML = `
    <section>
      <p class="eyebrow">Discover</p>
      <h1 class="section-title">Browse Events</h1>
      <p class="section-subtitle">Search, filter and sort campus events.</p>

      <div class="filter-panel">
        <label>Search Event
          <input id="searchInput" placeholder="Search by event name">
        </label>
        <label>Category
          <select id="categoryFilter">
            <option>All</option>
            <option>Technical</option>
            <option>Cultural</option>
            <option>Sports</option>
            <option>Workshops</option>
            <option>Hackathons</option>
            <option>Seminars</option>
          </select>
        </label>
        <label>Sort By
          <select id="sortFilter">
            <option value="date">Date</option>
            <option value="title">Title</option>
            <option value="seats">Available Seats</option>
          </select>
        </label>
      </div>

      <div class="event-grid" id="eventList"></div>
    </section>`;

  const search = document.getElementById('searchInput');
  const category = document.getElementById('categoryFilter');
  const sort = document.getElementById('sortFilter');
  const list = document.getElementById('eventList');

  category.value = getSession('eventCategory', 'All');

  function updateEventList() {
    const text = search.value.toLowerCase().trim();
    const selectedCategory = category.value;

    let result = getEvents().filter(function (event) {
      const correctCategory = selectedCategory === 'All' || event.category === selectedCategory;
      const correctTitle = event.title.toLowerCase().includes(text);
      return correctCategory && correctTitle;
    });

    result.sort(function (a, b) {
      if (sort.value === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sort.value === 'seats') {
        return availableSeats(b) - availableSeats(a);
      }
      return new Date(a.date) - new Date(b.date);
    });

    displayEvents(result, list);
  }

  search.addEventListener('input', updateEventList);
  category.addEventListener('change', function () {
    saveSession('eventCategory', category.value);
    updateEventList();
  });
  sort.addEventListener('change', updateEventList);

  updateEventList();
}

// ------------------------------------------------------------

// 8. EVENT DETAILS + COUNTDOWN
// ------------------------------------------------------------
function showDetails(id) {
  const event = findEvent(id);
  if (!event) return;

  selectedEventId = Number(id);
  saveSession('selectedEventId', selectedEventId);

  const bookButton = currentUser.role === 'student' && availableSeats(event) > 0
    ? `<button class="primary-button" data-book="${event.id}">Apply / Book Event</button>`
    : '';

  app.innerHTML = `
    <button class="secondary-button" data-page="events">← Back to events</button>
    <section class="details-card">
      <div class="details-cover" style="background-image:linear-gradient(90deg,rgba(15,22,54,.84),rgba(15,22,54,.25)),url('${event.image}')">
        <div>
          <p class="eyebrow">${escapeText(event.category)}</p>
          <h1>${escapeText(event.title)}</h1>
        </div>
      </div>

      <div class="details-content">
        <p>${escapeText(event.description)}</p>
        <div class="countdown" id="countdown">Loading countdown...</div>

        <div class="detail-list">
          <div><b>Date</b><br>${formatDate(event.date)}</div>
          <div><b>Time</b><br>${event.time}</div>
          <div><b>Venue</b><br>${escapeText(event.venue)}</div>
          <div><b>Organizer</b><br>${escapeText(event.organizer)}</div>
          <div><b>Total Seats</b><br>${event.seats}</div>
          <div><b>Available</b><br>${availableSeats(event)}</div>
          <div><b>Entry Fee</b><br>${event.price === 0 ? 'Free' : '₹' + event.price}</div>
          <div><b>Status</b><br>${availableSeats(event) > 0 ? 'Registration Open' : 'Fully Booked'}</div>
        </div>

        ${currentUser.role === 'student'
          ? (availableSeats(event) > 0 ? bookButton : '<p class="error">This event is fully booked.</p>')
          : '<p class="section-subtitle">Faculty accounts can create and manage events.</p>'}
      </div>
    </section>`;

  startCountdown(event);
}

function startCountdown(event) {
  clearInterval(countdownTimer);

  function updateCountdown() {
    const box = document.getElementById('countdown');
    if (!box) return;

    const eventTime = new Date(event.date + 'T' + event.time).getTime();
    const now = new Date().getTime();
    const difference = eventTime - now;

    if (difference <= 0) {
      box.textContent = 'This event has started or finished.';
      return;
    }

    const days = Math.floor(difference / 86400000);
    const hours = Math.floor((difference / 3600000) % 24);
    const minutes = Math.floor((difference / 60000) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    box.textContent = `Starts in: ${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;
  }

  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
}

// ------------------------------------------------------------

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

// 10. STUDENT TICKETS + CANCELLATION
// ------------------------------------------------------------
function showTicket(ticket, isNew) {
  app.innerHTML = `
    <section class="ticket">
      <div class="ticket-head">
        <h2>${isNew ? "You're Registered!" : 'Digital Ticket'}</h2>
        <p>Keep this ticket for event entry.</p>
      </div>
      <div class="ticket-body">
        <div>
          <h3>${escapeText(ticket.eventTitle)}</h3>
          <p><b>${escapeText(ticket.userName)}</b></p>
          <p>${formatDate(ticket.date)} · ${ticket.time}</p>
          <p>${escapeText(ticket.venue)}</p>
          <p class="ticket-id">Ticket ID: ${ticket.ticketId}</p>
          <span class="status">ACTIVE</span>
        </div>
        <div class="ticket-symbol">🎟️</div>
      </div>
    </section>
    <div class="button-row" style="justify-content:center">
      <button class="secondary-button" id="printTicket">Print Ticket</button>
      <button class="primary-button" data-page="tickets">My Tickets</button>
    </div>`;

  document.getElementById('printTicket').addEventListener('click', function () {
    window.print();
  });
}

function showTickets() {
  const myTickets = getTickets().filter(function (ticket) {
    return ticket.email === currentUser.email;
  });

  app.innerHTML = `
    <p class="eyebrow">Student Dashboard</p>
    <h1 class="section-title">My Tickets</h1>
    <p class="section-subtitle">Your registrations are stored in this browser.</p>
    <div id="ticketList"></div>`;

  const list = document.getElementById('ticketList');

  if (myTickets.length === 0) {
    list.innerHTML = `
      <div class="empty-card">
        <h3>No tickets yet</h3>
        <p>Apply for an event and your digital ticket will appear here.</p>
        <button class="primary-button" data-page="events">Browse Events</button>
      </div>`;
    return;
  }

  myTickets.forEach(function (ticket) {
    const eventDate = new Date(ticket.date + 'T00:00:00');
    const past = eventDate < new Date();
    const cancelled = ticket.status === 'cancelled';
    const statusText = cancelled ? 'CANCELLED' : (past ? 'PAST EVENT' : 'ACTIVE');

    const ticketCard = document.createElement('section');
    ticketCard.className = 'ticket';
    ticketCard.innerHTML = `
      <div class="ticket-head">
        <h2>${escapeText(ticket.eventTitle)}</h2>
        <p>${statusText}</p>
      </div>
      <div class="ticket-body">
        <div>
          <p><b>${escapeText(ticket.userName)}</b></p>
          <p>${formatDate(ticket.date)} · ${ticket.time}</p>
          <p>${escapeText(ticket.venue)}</p>
          <p class="ticket-id">Ticket ID: ${ticket.ticketId}</p>
          <span class="status ${cancelled ? 'cancelled' : ''}">${statusText}</span>
        </div>
        <div class="ticket-symbol">🎟️</div>
      </div>`;

    const buttons = document.createElement('div');
    buttons.className = 'button-row';
    buttons.style.padding = '0 24px 23px';

    const viewButton = document.createElement('button');
    viewButton.className = 'secondary-button';
    viewButton.textContent = 'View Ticket';
    viewButton.addEventListener('click', function () {
      showTicket(ticket, false);
    });
    buttons.appendChild(viewButton);

    if (!cancelled && !past) {
      const cancelButton = document.createElement('button');
      cancelButton.className = 'danger-button';
      cancelButton.textContent = 'Cancel Registration';
      cancelButton.addEventListener('click', function () {
        cancelTicket(ticket.ticketId);
      });
      buttons.appendChild(cancelButton);
    }

    ticketCard.appendChild(buttons);
    list.appendChild(ticketCard);
  });
}

function cancelTicket(ticketId) {
  const tickets = getTickets();
  const ticket = tickets.find(function (item) {
    return item.ticketId === ticketId;
  });

  if (!ticket || ticket.status !== 'active') return;

  ticket.status = 'cancelled';
  saveTickets(tickets);

  const events = getEvents();
  const event = events.find(function (item) {
    return item.id === ticket.eventId;
  });

  if (event && event.booked > 0) {
    event.booked--;
  }

  saveEvents(events);
  showToast('Registration cancelled and seat restored.');
  showTickets();
}

// ------------------------------------------------------------

// 11. FACULTY - POST EVENT
// ------------------------------------------------------------
function fileToImage(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();

    reader.onload = function () {
      resolve(reader.result);
    };

    reader.onerror = function () {
      reject(new Error('Image could not be read.'));
    };

    reader.readAsDataURL(file);
  });
}

function eventFormHtml(event) {
  const item = event || {};

  return `
    <div class="form-grid">
      <label>Event Title
        <input id="eventTitle" value="${escapeText(item.title || '')}" placeholder="Example: Science Exhibition">
      </label>
      <label>Category
        <select id="eventCategory">
          <option>Technical</option>
          <option>Cultural</option>
          <option>Sports</option>
          <option>Workshops</option>
          <option>Hackathons</option>
          <option>Seminars</option>
        </select>
      </label>
      <label>Date
        <input id="eventDate" type="date" value="${item.date || ''}">
      </label>
      <label>Time
        <input id="eventTime" type="time" value="${item.time || ''}">
      </label>
      <label>Venue
        <input id="eventVenue" value="${escapeText(item.venue || '')}" placeholder="Example: Seminar Hall">
      </label>
      <label>Total Seats
        <input id="eventSeats" type="number" min="1" value="${item.seats || ''}" placeholder="50">
      </label>
      <label>Entry Fee
        <input id="eventPrice" type="number" min="0" value="${item.price ?? ''}" placeholder="0">
      </label>
      <label>Cover Image
        <input id="eventImage" type="file" accept="image/png, image/jpeg, image/webp">
      </label>
    </div>

    <label>Event Description
      <textarea id="eventDescription" rows="4" placeholder="Tell students about this event">${escapeText(item.description || '')}</textarea>
    </label>

    <p class="upload-note">Image is optional and should be smaller than 2 MB.</p>
    <p id="postError" class="error"></p>`;
}

function readEventForm() {
  return {
    title: document.getElementById('eventTitle').value.trim(),
    category: document.getElementById('eventCategory').value,
    date: document.getElementById('eventDate').value,
    time: document.getElementById('eventTime').value,
    venue: document.getElementById('eventVenue').value.trim(),
    seats: Number(document.getElementById('eventSeats').value),
    price: Number(document.getElementById('eventPrice').value),
    description: document.getElementById('eventDescription').value.trim(),
    imageFile: document.getElementById('eventImage').files[0]
  };
}

function validateEventForm(data, currentBooked) {
  if (!data.title || !data.date || !data.time || !data.venue || !data.seats || !data.description) {
    return 'Please complete all required event fields.';
  }

  if (data.seats < 1) {
    return 'Seats must be at least 1.';
  }

  if (data.seats < currentBooked) {
    return `Seats cannot be less than current registrations (${currentBooked}).`;
  }

  if (data.price < 0) {
    return 'Entry fee cannot be negative.';
  }

  if (data.imageFile && data.imageFile.size > 2 * 1024 * 1024) {
    return 'Please choose an image smaller than 2 MB.';
  }

  return '';
}

function showPostEvent() {
  if (currentUser.role !== 'faculty') return;

  app.innerHTML = `
    <section class="form-card">
      <p class="eyebrow">Faculty Dashboard</p>
      <h1 class="section-title">Post an Event</h1>
      <p class="section-subtitle">Create an event for students to discover and apply for.</p>
      <form id="postEventForm">
        ${eventFormHtml()}
        <button class="primary-button" type="submit">Post Event</button>
      </form>
    </section>`;

  document.getElementById('postEventForm').addEventListener('submit', async function (formEvent) {
    formEvent.preventDefault();

    const data = readEventForm();
    const error = document.getElementById('postError');
    const message = validateEventForm(data, 0);

    if (message) {
      error.textContent = message;
      return;
    }

    let image = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1000&q=80';

    if (data.imageFile) {
      try {
        image = await fileToImage(data.imageFile);
      } catch (fileError) {
        error.textContent = 'Image could not be uploaded.';
        return;
      }
    }

    const events = getEvents();

    const newEvent = {
      id: Date.now(),
      title: data.title,
      category: data.category,
      date: data.date,
      time: data.time,
      venue: data.venue,
      seats: data.seats,
      booked: 0,
      price: data.price,
      description: data.description,
      organizer: currentUser.name,
      ownerEmail: currentUser.email,
      image: image,
      questions: ['Are you a Hostel student or Day Scholar?', 'Do you have any special requirements?']
    };

    events.push(newEvent);
    saveEvents(events);
    showToast('Event posted successfully.');
    showMyEvents();
  });
}

// ------------------------------------------------------------

// 12. FACULTY - MY EVENTS + EDIT
// ------------------------------------------------------------
function showMyEvents() {
  if (currentUser.role !== 'faculty') return;

  const myEvents = getEvents().filter(function (event) {
    return event.ownerEmail === currentUser.email;
  });

  app.innerHTML = `
    <p class="eyebrow">Faculty Dashboard</p>
    <h1 class="section-title">My Events</h1>
    <p class="section-subtitle">Manage events created by your faculty account.</p>
    <div class="event-grid" id="myEventList"></div>`;

  const list = document.getElementById('myEventList');

  if (myEvents.length === 0) {
    list.innerHTML = `
      <div class="empty-card">
        <h3>No events posted yet</h3>
        <p>Create your first event for students.</p>
        <button class="primary-button" data-page="post">Post Event</button>
      </div>`;
    return;
  }

  myEvents.forEach(function (event) {
    const card = createEventCard(event);

    const editButton = document.createElement('button');
    editButton.className = 'secondary-button';
    editButton.style.width = '100%';
    editButton.style.marginTop = '10px';
    editButton.textContent = 'Edit Event';
    editButton.addEventListener('click', function () {
      showEditEvent(event.id);
    });

    card.querySelector('.event-body').appendChild(editButton);
    list.appendChild(card);
  });
}

function showEditEvent(id) {
  const event = findEvent(id);

  if (!event || event.ownerEmail !== currentUser.email) {
    showToast('You can edit only your own events.', true);
    showMyEvents();
    return;
  }

  app.innerHTML = `
    <section class="form-card">
      <button class="secondary-button" data-page="my-events">← My Events</button>
      <p class="eyebrow" style="margin-top:22px">Faculty Dashboard</p>
      <h1 class="section-title">Edit Event</h1>
      <form id="editEventForm">
        ${eventFormHtml(event)}
        <button class="primary-button" type="submit">Save Changes</button>
      </form>
    </section>`;

  document.getElementById('eventCategory').value = event.category;

  document.getElementById('editEventForm').addEventListener('submit', async function (formEvent) {
    formEvent.preventDefault();

    const data = readEventForm();
    const error = document.getElementById('postError');
    const message = validateEventForm(data, event.booked);

    if (message) {
      error.textContent = message;
      return;
    }

    let image = event.image;

    if (data.imageFile) {
      try {
        image = await fileToImage(data.imageFile);
      } catch (fileError) {
        error.textContent = 'Image could not be uploaded.';
        return;
      }
    }

    const events = getEvents();
    const index = events.findIndex(function (item) {
      return item.id === event.id;
    });

    events[index] = {
      ...event,
      title: data.title,
      category: data.category,
      date: data.date,
      time: data.time,
      venue: data.venue,
      seats: data.seats,
      price: data.price,
      description: data.description,
      image: image
    };

    saveEvents(events);
    showToast('Event updated successfully.');
    showMyEvents();
  });
}

// ------------------------------------------------------------

// 13. FETCH API - Promise + async/await + JSON
// ------------------------------------------------------------
async function loadOrganizerProfiles() {
  const list = document.getElementById('organizerList');
  if (!list) return;

  try {
    const response = await fetch('https://randomuser.me/api/?results=3&nat=us');

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    list.innerHTML = '';

    data.results.forEach(function (person) {
      const card = document.createElement('article');
      card.className = 'event-card';
      card.innerHTML = `
        <div class="event-body" style="text-align:center">
          <img src="${person.picture.medium}" alt="Organizer profile" style="width:70px;height:70px;border-radius:50%;border:4px solid #e6e9ff">
          <h3>${person.name.first} ${person.name.last}</h3>
          <p>Campus event organizer</p>
          <p class="seats">Ready to organize campus events</p>
        </div>`;
      list.appendChild(card);
    });
  } catch (error) {
    list.innerHTML = `
      <div class="empty-card">
        <h3>Organizer profiles unavailable</h3>
        <p>The rest of the CampusPass features are still working.</p>
      </div>`;
  }
}

// ------------------------------------------------------------

// 14. PAGE NAVIGATION + EVENT DELEGATION
// ------------------------------------------------------------
function changePage(page) {
  clearInterval(countdownTimer);
  profileBox.classList.add('hidden');

  if (page === 'home') showHome();
  if (page === 'events') showEvents();
  if (page === 'tickets' && currentUser.role === 'student') showTickets();
  if (page === 'post' && currentUser.role === 'faculty') showPostEvent();
  if (page === 'my-events' && currentUser.role === 'faculty') showMyEvents();
}

document.addEventListener('click', function (event) {
  const page = event.target.closest('[data-page]');
  const details = event.target.closest('[data-details]');
  const book = event.target.closest('[data-book]');
  const bookBack = event.target.closest('[data-book-back]');

  if (page) {
    event.preventDefault();
    changePage(page.dataset.page);
  }

  if (details) {
    event.preventDefault();
    showDetails(details.dataset.details);
  }

  if (book) {
    event.preventDefault();
    showBookingStepOne(book.dataset.book);
  }

  if (bookBack) {
    event.preventDefault();
    showBookingStepOne(bookBack.dataset.book);
  }
});

// ------------------------------------------------------------

// 15. NAV BUTTONS + LOGOUT
// ------------------------------------------------------------
document.getElementById('profileButton').addEventListener('click', showProfile);

document.getElementById('logoutButton').addEventListener('click', function () {
  localStorage.removeItem('campusPassUser');
  sessionStorage.clear();
  currentUser = null;
  selectedEventId = null;
  bookingData = {};
  clearInterval(countdownTimer);
  showLogin();
});

// ------------------------------------------------------------

// 16. START APP
// ------------------------------------------------------------
createDemoEvents();
createDemoFacultyAccounts();

currentUser = getData('campusPassUser', null);
selectedEventId = getSession('selectedEventId', null);
bookingData = getSession('bookingData', {});

if (currentUser) {
  showApp('home');
} else {
  showLogin();
}
