export function showLoginView() {
  const loginModal = document.getElementById('login-modal');
  const signupModal = document.getElementById('signup-modal');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const cancelLoginBtn = document.getElementById('cancel-login');
  const cancelSignupBtn = document.getElementById('cancel-signup');
  const loginMenuItem = document.getElementById('login-menu-item');

  // Load saved form data if available
  const savedLoginData = localStorage.getItem('loginFormData');
  const savedSignupData = localStorage.getItem('signupFormData');

  if (savedLoginData) {
    const data = JSON.parse(savedLoginData);
    document.getElementById('username').value = data.username || '';
    document.getElementById('password').value = data.password || '';
  }

  if (savedSignupData) {
    const data = JSON.parse(savedSignupData);
    document.getElementById('signup-username').value = data.username || '';
    document.getElementById('signup-email').value = data.email || '';
  }

  // Save form data on input
  loginForm.addEventListener('input', () => {
    const formData = {
      username: document.getElementById('username').value,
      password: document.getElementById('password').value
    };
    localStorage.setItem('loginFormData', JSON.stringify(formData));
  });

  signupForm.addEventListener('input', () => {
    const formData = {
      username: document.getElementById('signup-username').value,
      email: document.getElementById('signup-email').value
    };
    localStorage.setItem('signupFormData', JSON.stringify(formData));
  });

  // Handle login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const result = await window.podcastAPI.auth.login({ username, password });
      if (result.success) {
        updateLoginMenuItem(result.user);
        loginModal.classList.remove('show');
        loginForm.reset();
        localStorage.removeItem('loginFormData');
        import('./uploadView.js').then(({ showUploadView }) => showUploadView());
      } else {
        alert(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login. Please try again.');
    }
  });

  // Handle signup form submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const result = await window.podcastAPI.auth.signup({ username, email, password });
      if (result.success) {
        // After signup, show login modal instead of auto-login
        signupModal.classList.remove('show');
        signupForm.reset();
        localStorage.removeItem('signupFormData');
        loginModal.classList.add('show');
      } else {
        alert(result.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('An error occurred during signup. Please try again.');
    }
  });

  // Handle cancel buttons
  cancelLoginBtn.addEventListener('click', () => {
    loginModal.classList.remove('show');
  });

  cancelSignupBtn.addEventListener('click', () => {
    signupModal.classList.remove('show');
  });

  // Handle login menu item click
  loginMenuItem.addEventListener('click', () => {
    if (loginMenuItem.classList.contains('logged-in')) {
      return;
    }
    signupModal.classList.add('show');
  });

  // Add "Already have an account?" link to signup form (prevent duplicates)
  const signupActions = signupForm.querySelector('.form-actions');
  if (!signupActions.querySelector('.login-link')) {
    const loginLink = document.createElement('a');
    loginLink.href = '#';
    loginLink.textContent = 'Already have an account?';
    loginLink.className = 'login-link';
    loginLink.style.color = '#007bff';
    loginLink.style.marginRight = 'auto';
    loginLink.style.cursor = 'pointer';
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      signupModal.classList.remove('show');
      loginModal.classList.add('show');
    });
    signupActions.insertBefore(loginLink, signupActions.firstChild);
  }

  // Add "Need an account?" link to login form (prevent duplicates)
  const loginActions = loginForm.querySelector('.form-actions');
  if (!loginActions.querySelector('.signup-link')) {
    const signupLink = document.createElement('a');
    signupLink.href = '#';
    signupLink.textContent = 'Need an account?';
    signupLink.className = 'signup-link';
    signupLink.style.color = '#007bff';
    signupLink.style.marginRight = 'auto';
    signupLink.style.cursor = 'pointer';
    signupLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginModal.classList.remove('show');
      signupModal.classList.add('show');
    });
    loginActions.insertBefore(signupLink, loginActions.firstChild);
  }
}

function updateLoginMenuItem(user) {
  const loginMenuItem = document.getElementById('login-menu-item');
  
  if (user) {
    loginMenuItem.classList.add('logged-in');
    loginMenuItem.innerHTML = `
      <div class="user-info">
        <span class="username">${user.username}</span>
        <span class="email">${user.email}</span>
        <span class="logout">Logout</span>
      </div>
    `;

    // Add logout handler
    const logoutBtn = loginMenuItem.querySelector('.logout');
    logoutBtn.addEventListener('click', async () => {
      try {
        await window.podcastAPI.auth.logout();
        loginMenuItem.classList.remove('logged-in');
        loginMenuItem.textContent = 'Sign Up';
        localStorage.removeItem('loginFormData');
        localStorage.removeItem('signupFormData');
        import('./loginView.js').then(({ showLoginView }) => showLoginView());
      } catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred during logout');
      }
    });
  } else {
    loginMenuItem.classList.remove('logged-in');
    loginMenuItem.textContent = 'Sign Up';
  }
}

// Check initial login state
window.podcastAPI.auth.getCurrentUser().then(user => {
  updateLoginMenuItem(user);
}); 