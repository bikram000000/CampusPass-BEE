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
