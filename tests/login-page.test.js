const fs = require('fs');
const path = require('path');
const assert = require('assert');

const loginPath = path.join(__dirname, '..', 'Frontend', 'login.html');
const html = fs.readFileSync(loginPath, 'utf8');

assert.ok(html.includes('id="login-form"'), 'Login page should include a sign-in form');
assert.ok(html.includes('id="register-form"'), 'Login page should include a register form');
assert.ok(!html.includes("window.location.href = 'dashboard.html';"), 'Login page should not auto-redirect on load');
assert.ok(html.includes('localStorage.setItem(\'crm_current_user\''), 'Login page should store the current user after sign-in');

console.log('Login page regression checks passed');
