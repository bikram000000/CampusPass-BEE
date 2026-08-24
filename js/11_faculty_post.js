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
