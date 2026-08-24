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
