// 15. NAV BUTTONS + LOGOUT
// ------------------------------------------------------------
document.getElementById('profileButton').addEventListener('click', showProfile);

document.getElementById('logoutButton').addEventListener('click', function () {
  localStorage.removeItem('campusPassUser');
  sessionStorage.clear();
  currentUser = null;
  selectedEventId = null;
  bookingData = {};
  clearInterval(countdownTimer);
  showLogin();
});

// ------------------------------------------------------------
