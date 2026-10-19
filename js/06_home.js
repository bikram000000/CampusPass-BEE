function showHome() {
  const events = getEvents().filter(isBookable);
  const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Workshops', 'Hackathons', 'Seminars'];
  window.scrollTo(0, 0);
  app.innerHTML = `
    <div class="welcome-row"><p class="eyebrow">THE CAMPUS EDIT / ${escapeText(currentUser.department)}</p><span>Hello, ${escapeText(currentUser.name)} 👋</span></div>
    <section class="hero"><div><p class="eyebrow">LESS SCROLLING. MORE SHOWING UP.</p><h1>Your next<br>“I was there”<br>starts here.</h1><p>Live performances, big ideas and friendly rivalries. Find your people, book your pass, make it a story.</p><button class="primary-button" data-page="events">Find your next experience →</button></div><div class="hero-art"><small>ON YOUR CAMPUS</small><strong>${events.length}</strong><small>upcoming experiences</small></div></section>
    <div class="benefit-strip"><span>01 / Discover your scene</span><span>02 / Book in a few clicks</span><span>03 / Show up with your pass</span></div>
    <div class="heading-row"><div><p class="eyebrow">FOLLOW YOUR CURIOSITY</p><h2>What are you into?</h2></div></div><div class="category-row" id="categories"></div>
    <div class="heading-row"><div><p class="eyebrow">MAKE ROOM IN YOUR CALENDAR</p><h2>Coming up on campus</h2></div><a href="#" data-page="events">Explore all →</a></div><div class="event-grid" id="homeEvents"></div>
    <section class="offer-banner"><div><p class="eyebrow">A LITTLE EXTRA REASON TO GO</p><h2>Your campus plans. 10% lighter.</h2><p>Use <b>CAMPUS10</b> at demo checkout for 10% off paid event passes.</p><small>Simulated offer. No real payment is collected.</small></div><button class="secondary-button" id="explorePaid">Explore paid events →</button></section>
    <div class="heading-row"><div><p class="eyebrow">COME AS YOU ARE</p><h2>Zero fee. Plenty to discover.</h2></div></div><div class="event-grid" id="freeEvents"></div>
    <footer class="site-footer"><a class="brand" href="#" data-page="home"><span>CP</span> CampusPass</a><p>Your campus. Your community. Your kind of plans.</p><button class="secondary-button" data-page="help">Booking help & policies</button><small>CampusPass • University event booking demo</small></footer>`;
  document.getElementById('explorePaid').addEventListener('click', function () { saveSession('eventCategory', 'All'); showEvents('paid'); });
  categories.forEach(function (category) {
    const button = document.createElement('button'); button.className = 'category-chip'; button.textContent = category;
    button.addEventListener('click', function () { saveSession('eventCategory', category); showEvents(); });
    document.getElementById('categories').appendChild(button);
  });
  displayEvents(events.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3), document.getElementById('homeEvents'));
  displayEvents(events.filter(event => event.price === 0).slice(0, 3), document.getElementById('freeEvents'));
}
