// 14. PAGE NAVIGATION + EVENT DELEGATION
// ------------------------------------------------------------
async function changePage(page) {
  if (!currentUser) return;
  try { await refreshData(); } catch (error) { showToast(error.message, true); return; }
  document.querySelectorAll('[data-page]').forEach(function (link) { link.classList.toggle('active', link.dataset.page === page); });
  clearInterval(countdownTimer);
  window.scrollTo(0, 0);
  profileBox.classList.add('hidden');

  if (page === 'home') showHome();
  if (page === 'events') showEvents();
  if (page === 'saved') showSaved();
  if (page === 'help') showHelp();
  if (page === 'account') showAccount();
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
