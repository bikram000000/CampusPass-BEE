document.getElementById('profileButton').addEventListener('click', function () { changePage('account'); });
document.getElementById('logoutButton').addEventListener('click', async function () {
  try {
    await api('/auth/logout', 'POST');
    sessionStorage.clear();
    currentUser = null; eventCache = []; ticketCache = []; bookingData = {};
    clearInterval(countdownTimer);
    showLogin();
  } catch (error) { showToast(error.message, true); }
});
