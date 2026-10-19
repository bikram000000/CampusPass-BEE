function showEvents(initialPrice = 'all') {
  window.scrollTo(0, 0);
  app.innerHTML = `
    <p class="eyebrow">YOUR CAMPUS, ALL ACCESS</p><h1 class="section-title">Find your kind of plans.</h1><p class="section-subtitle">From the front row to your next big idea. There's a place for you.</p>
    <section class="filter-panel discovery-filters">
      <label>Search<input id="searchInput" placeholder="Event, venue or organizer"></label>
      <label>Category<select id="categoryFilter"><option>All</option>${['Technical','Cultural','Sports','Workshops','Hackathons','Seminars'].map(item => '<option>' + item + '</option>').join('')}</select></label>
      <label>When<select id="dateFilter"><option value="all">Any date</option><option value="7">Next 7 days</option><option value="30">Next 30 days</option></select></label>
      <label>Price<select id="priceFilter"><option value="all">All prices</option><option value="free">Free entry</option><option value="paid">Paid events</option><option value="100">Up to ₹100</option></select></label>
      <label>Venue<select id="venueFilter"><option value="all">All venues</option></select></label>
      <label>Sort by<select id="sortFilter"><option value="date">Soonest first</option><option value="price">Price: low to high</option><option value="title">Name A–Z</option><option value="seats">Most available</option></select></label>
      <label class="check-label"><input type="checkbox" id="availableOnly"> Only available events</label><button class="secondary-button" id="resetFilters">Reset filters</button>
    </section><p id="resultCount" class="results-count" role="status"></p><div class="event-grid" id="eventList"></div>`;
  const venues = [];
  getEvents().forEach(function (event) { if (!venues.includes(event.venue)) venues.push(event.venue); });
  venues.forEach(function (venue) { const option = document.createElement('option'); option.value = venue; option.textContent = venue; document.getElementById('venueFilter').appendChild(option); });
  document.getElementById('priceFilter').value = initialPrice;
  document.getElementById('categoryFilter').value = getSession('eventCategory', 'All');
  document.getElementById('sortFilter').value = getData('campusPassSort', 'date');
  function update() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const category = document.getElementById('categoryFilter').value;
    const date = document.getElementById('dateFilter').value;
    const price = document.getElementById('priceFilter').value;
    const venue = document.getElementById('venueFilter').value;
    const sort = document.getElementById('sortFilter').value;
    const onlyAvailable = document.getElementById('availableOnly').checked;
    saveSession('eventCategory', category); saveData('campusPassSort', sort);
    const result = getEvents().filter(function (event) {
      const days = (new Date(event.date + 'T' + event.time) - new Date()) / 86400000;
      return isBookable(event) && (event.title + ' ' + event.venue + ' ' + event.organizer).toLowerCase().includes(search) && (category === 'All' || event.category === category) && (date === 'all' || days <= Number(date)) && (venue === 'all' || venue === event.venue) && (price === 'all' || price === 'free' && event.price === 0 || price === 'paid' && event.price > 0 || price === '100' && event.price <= 100) && (!onlyAvailable || availableSeats(event) > 0);
    });
    result.sort(function (a, b) { if (sort === 'price') return a.price - b.price; if (sort === 'title') return a.title.localeCompare(b.title); if (sort === 'seats') return availableSeats(b) - availableSeats(a); return new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time); });
    document.getElementById('resultCount').textContent = result.length + (result.length === 1 ? ' experience found' : ' experiences found');
    displayEvents(result, document.getElementById('eventList'));
  }
  document.querySelectorAll('.discovery-filters input,.discovery-filters select').forEach(element => element.addEventListener('input', update));
  document.getElementById('resetFilters').addEventListener('click', function () { saveSession('eventCategory', 'All'); saveData('campusPassSort', 'date'); showEvents(); });
  update();
}
