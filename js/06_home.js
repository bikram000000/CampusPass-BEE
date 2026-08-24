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
