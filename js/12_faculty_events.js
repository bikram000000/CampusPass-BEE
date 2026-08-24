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
