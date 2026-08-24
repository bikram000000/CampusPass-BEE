// 4. LOGIN + SIGNUP - separate Student / Faculty roles
// ------------------------------------------------------------
function showLogin() {
  navbar.classList.add('hidden');
  mobileNav.classList.add('hidden');
  profileBox.classList.add('hidden');

  app.innerHTML = `
    <section class="login-card">
      <p class="eyebrow">Campus event platform</p>
      <h1>CampusPass</h1>
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
    </section>`;

  let mode = 'login';
  let role = 'student';

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
        <p class="auth-note">Demo faculty: faculty@campus.edu / 123456</p>`;
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
        <p id="authError" class="error"></p>
        <button class="primary-button" type="submit">Create ${role === 'student' ? 'Student' : 'Faculty'} Account</button>`;
    }

    form.addEventListener('submit', handleAuth);
  }

  function handleAuth(event) {
    event.preventDefault();

    const email = document.getElementById('authEmail').value.trim().toLowerCase();
    const password = document.getElementById('authPassword').value;
    const error = document.getElementById('authError');

    if (email === '' || password === '') {
      error.textContent = 'Please fill email and password.';
      return;
    }

    if (!validEmail(email)) {
      error.textContent = 'Enter a valid email address.';
      return;
    }

    if (password.length < 6) {
      error.textContent = 'Password must have at least 6 characters.';
      return;
    }

    const accounts = getAccounts();

    if (mode === 'login') {
      const account = accounts.find(function (item) {
        return item.email === email && item.role === role;
      });

      if (!account) {
        error.textContent = 'No account found for this role and email.';
        return;
      }

      if (account.password !== password) {
        error.textContent = 'Incorrect password.';
        return;
      }

      currentUser = {
        name: account.name,
        email: account.email,
        department: account.department,
        role: account.role
      };
      saveData('campusPassUser', currentUser);
      showApp('home');
      return;
    }

    const name = document.getElementById('authName').value.trim();
    const department = document.getElementById('authDepartment').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (name.length < 2) {
      error.textContent = 'Name must contain at least 2 characters.';
      return;
    }

    if (department === '') {
      error.textContent = 'Please enter your course or department.';
      return;
    }

    if (password !== confirmPassword) {
      error.textContent = 'Passwords do not match.';
      return;
    }

    const alreadyExists = accounts.some(function (item) {
      return item.email === email;
    });

    if (alreadyExists) {
      error.textContent = 'An account with this email already exists.';
      return;
    }

    const newAccount = {
      name: name,
      email: email,
      department: department,
      role: role,
      password: password
    };

    accounts.push(newAccount);
    saveAccounts(accounts);

    currentUser = {
      name: name,
      email: email,
      department: department,
      role: role
    };
    saveData('campusPassUser', currentUser);
    showToast('Account created successfully.');
    showApp('home');
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
  createDemoEvents();
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
