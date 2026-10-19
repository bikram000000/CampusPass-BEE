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
  return phone.length === 10 && phone.split('').every(character => '0123456789'.includes(character));
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
