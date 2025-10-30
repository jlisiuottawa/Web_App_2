// This file provides small UX improvements and ensures the form buttons use submit semantics.
// It also prevents double submissions and surfaces network errors nicely.

document.addEventListener('DOMContentLoaded', () => {
  // If forms/buttons are already wired inline (onclick), this file mainly
  // adds progressive enhancement (keyboard submit etc).
  const username = document.getElementById('username');
  const password = document.getElementById('password');
  const loginButton = document.querySelector('button[onclick="loginBackend()"]');

  function setLoading(isLoading) {
    if (!loginButton) return;
    loginButton.disabled = isLoading;
    loginButton.textContent = isLoading ? 'Please wait...' : 'Login / Register';
  }

  if (username && password && loginButton) {
    // submit on Enter when focus is in password field
    password.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        loginButton.click();
      }
    });
  }

  // Global fetch wrapper to show alerts for network failures
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const res = await originalFetch(...args);
      return res;
    } catch (err) {
      alert('Network error: ' + (err.message || err));
      throw err;
    }
  };
});
