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
