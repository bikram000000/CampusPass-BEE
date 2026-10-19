// 4. LOGIN + SIGNUP - separate Student / Faculty roles
// ------------------------------------------------------------
function showLogin() {
  navbar.classList.add('hidden');
  mobileNav.classList.add('hidden');
  profileBox.classList.add('hidden');

  app.innerHTML = `
    <div class="auth-layout"><aside class="auth-story"><a class="brand" href="/"> <span>CP</span> CampusPass</a><p class="eyebrow">GOOD TIMES. GREAT CONNECTIONS.</p><h2>Your campus.<br>Your people.<br><em>Your next big thing.</em></h2><p>Discover something new. Meet your community. Make memories beyond the classroom.</p><div class="orbit-art"><span>EXPLORE</span><b>Meet.<br>Create.<br>Belong.</b><small>ONE PASS. EVERY POSSIBILITY.</small></div><p class="story-footer">WORKSHOPS &nbsp; / &nbsp; CULTURE &nbsp; / &nbsp; SPORT</p></aside><section class="login-card">
      <p class="eyebrow">YOUR CAMPUS CONNECTION</p>
      <h1>Welcome in.</h1>
      <p>Log in or create an account to continue.</p>

      <div class="auth-tabs">
        <button class="active" data-auth="login">Log in</button>
        <button data-auth="signup">Sign up</button>
      </div>

      <div class="role-buttons">
        <button class="active" data-role="student">Student</button>
        <button data-role="faculty">Faculty</button>
      </div>

      <form id="authForm"></form>
    </section></div>`;

  let mode = 'login';
  let role = document.cookie.includes('campusRole=faculty') ? 'faculty' : 'student';
  document.querySelectorAll('[data-role]').forEach(function (button) { button.classList.toggle('active', button.dataset.role === role); });

  function renderAuthForm() {
    const form = document.getElementById('authForm');

    if (mode === 'login') {
      form.innerHTML = `
        <label>University Email
          <input id="authEmail" type="email" placeholder="you@college.edu">
        </label>
        <label>Password
          <input id="authPassword" type="password" placeholder="Minimum 6 characters">
        </label>
        <p id="authError" class="error"></p>
        <button class="primary-button" type="submit">Log in as ${role === 'student' ? 'Student' : 'Faculty'}</button>
        <p class="auth-note">Demo: student@campus.edu or faculty@campus.edu<br>Password: 123456 · Choose the matching role</p>`;
    } else {
      form.innerHTML = `
        <label>Full Name
          <input id="authName" placeholder="Enter your full name">
        </label>
        <label>University Email
          <input id="authEmail" type="email" placeholder="you@college.edu">
        </label>
        <label>${role === 'student' ? 'Course' : 'Department'}
          <input id="authDepartment" placeholder="${role === 'student' ? 'Example: BCA' : 'Example: Computer Science'}">
        </label>
        <label>Password
          <input id="authPassword" type="password" placeholder="Minimum 6 characters">
        </label>
        <label>Confirm Password
          <input id="confirmPassword" type="password" placeholder="Type password again">
        </label>
        ${role === 'faculty' ? '<label>Faculty invitation code<input id="facultyCode" type="password" required></label>' : ''}
        <p id="authError" class="error" role="alert"></p>
        <button class="primary-button" type="submit">Create ${role === 'student' ? 'Student' : 'Faculty'} Account</button>`;
    }

    form.onsubmit = handleAuth;
  }

  async function handleAuth(event) {
    event.preventDefault();
    const error = document.getElementById('authError');
    const button = event.target.querySelector('button[type="submit"]');
    const body = { email: document.getElementById('authEmail').value.trim(), password: document.getElementById('authPassword').value, role: role };
    if (mode === 'signup') {
      body.name = document.getElementById('authName').value.trim();
      body.department = document.getElementById('authDepartment').value.trim();
      if (body.password !== document.getElementById('confirmPassword').value) { error.textContent = 'Passwords do not match.'; return; }
      if (role === 'faculty') body.facultyCode = document.getElementById('facultyCode').value;
    }
    button.disabled = true;
    error.textContent = '';
    try {
      const result = await api('/auth/' + mode, 'POST', body);
      currentUser = result.user;
      await refreshData();
      document.cookie = 'campusRole=' + role + '; Max-Age=2592000; Path=/; SameSite=Strict';
      showApp('home');
    } catch (failure) { error.textContent = failure.message; }
    button.disabled = false;
  }

  document.querySelectorAll('[data-auth]').forEach(function (button) {
    button.addEventListener('click', function () {
      mode = button.dataset.auth;
      document.querySelectorAll('[data-auth]').forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
      renderAuthForm();
    });
  });

  document.querySelectorAll('[data-role]').forEach(function (button) {
    button.addEventListener('click', function () {
      role = button.dataset.role;
      document.querySelectorAll('[data-role]').forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
      renderAuthForm();
    });
  });

  renderAuthForm();
}

function showApp(page) {
  navbar.classList.remove('hidden');
  mobileNav.classList.remove('hidden');

  const faculty = currentUser.role === 'faculty';

  document.getElementById('ticketLink').classList.toggle('hidden', faculty);
  document.getElementById('postLink').classList.toggle('hidden', !faculty);
  document.getElementById('myEventsLink').classList.toggle('hidden', !faculty);
  document.getElementById('mobileTicket').classList.toggle('hidden', faculty);
  document.getElementById('mobilePost').classList.toggle('hidden', !faculty);
  document.getElementById('mobileMyEvents').classList.toggle('hidden', !faculty);

  changePage(page || 'home');
}

function showProfile() {
  profileBox.innerHTML = `
    <h3>${currentUser.role === 'student' ? 'Student Profile' : 'Faculty Profile'}</h3>
    <p><b>Name:</b> ${escapeText(currentUser.name)}</p>
    <p><b>Email:</b> ${escapeText(currentUser.email)}</p>
    <p><b>${currentUser.role === 'student' ? 'Course' : 'Department'}:</b> ${escapeText(currentUser.department)}</p>
    <p><b>Role:</b> ${currentUser.role}</p>`;
  profileBox.classList.toggle('hidden');
}

// ------------------------------------------------------------
