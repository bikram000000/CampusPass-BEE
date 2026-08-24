// 16. START APP
// ------------------------------------------------------------
createDemoEvents();
createDemoFacultyAccounts();

currentUser = getData('campusPassUser', null);
selectedEventId = getSession('selectedEventId', null);
bookingData = getSession('bookingData', {});

if (currentUser) {
  showApp('home');
} else {
  showLogin();
}
