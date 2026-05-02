const CURRENT_USER_STORAGE_KEY = "readtrackCurrentUser";
const AUTH_TOKEN_STORAGE_KEY = "readtrackAuthToken";
const RESET_STORAGE_KEY = "readtrackResetRequest";
const USER_STORAGE_KEY = "readtrackUser";
const API_BASE_URL = window.location.port === "5000"
  ? `${window.location.origin}/api`
  : "http://localhost:5000/api";

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const forgotForm = document.getElementById("forgotForm");
const resetForm = document.getElementById("resetForm");
const authMessage = document.getElementById("authMessage");
const authTitle = document.getElementById("authTitle");
const authCopy = document.getElementById("authCopy");
const viewButtons = document.querySelectorAll("[data-view-target]");
const notificationContainer = document.getElementById("notificationContainer");
const resendCodeButton = document.getElementById("resendCodeButton");

let resendCountdown = 15;
let resendTimerId = null;

document.body.classList.add("dark-mode");
redirectIfLoggedIn();

function loadResetRequest() {
  const savedRequest = localStorage.getItem(RESET_STORAGE_KEY);
  return savedRequest ? JSON.parse(savedRequest) : null;
}

function saveResetRequest(resetRequest) {
  localStorage.setItem(RESET_STORAGE_KEY, JSON.stringify(resetRequest));
}

function clearResetRequest() {
  localStorage.removeItem(RESET_STORAGE_KEY);
}

function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
}

function redirectIfLoggedIn() {
  if (getStoredToken()) {
    window.location.replace("index.html");
  }
}

function setMessage(message, type = "error") {
  authMessage.textContent = message;
  authMessage.classList.toggle("success", type === "success");
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notificationContainer.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("fade-out");
  }, 2200);

  setTimeout(() => {
    notification.remove();
  }, 2500);
}

function updateResendButton() {
  if (resendCountdown > 0) {
    resendCodeButton.disabled = true;
    resendCodeButton.textContent = `Resend code in ${resendCountdown}s`;
  } else {
    resendCodeButton.disabled = false;
    resendCodeButton.textContent = "Resend code";
  }
}

function startResendCountdown() {
  clearInterval(resendTimerId);
  resendCountdown = 15;
  updateResendButton();

  resendTimerId = setInterval(() => {
    resendCountdown -= 1;
    updateResendButton();

    if (resendCountdown <= 0) {
      clearInterval(resendTimerId);
    }
  }, 1000);
}

function switchView(viewName) {
  const viewMap = {
    login: {
      title: "Welcome back",
      copy: "Login to access your reading dashboard, saved entries, and progress tracking."
    },
    signup: {
      title: "Create your account",
      copy: "Set up your ReadTrack account to start saving entries, tracking progress, and managing your reading."
    },
    forgot: {
      title: "Forgot password",
      copy: "Enter your account email and we will generate a verification code for password reset."
    },
    reset: {
      title: "Reset your password",
      copy: "Enter the verification code and set a new password to regain access to your account."
    }
  };

  document.querySelectorAll(".auth-view").forEach((view) => {
    view.classList.toggle("active-view", view.id === `${viewName}View`);
  });

  authTitle.textContent = viewMap[viewName].title;
  authCopy.textContent = viewMap[viewName].copy;
  setMessage("");

  if (viewName !== "reset") {
    clearInterval(resendTimerId);
    resendCountdown = 15;
    updateResendButton();
  }
}

function loadUser() {
  const savedUser = localStorage.getItem(USER_STORAGE_KEY);
  return savedUser ? JSON.parse(savedUser) : null;
}

function saveUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function createToken() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function getPublicUser(user) {
  const createdAt = user.createdAt || user.joinedAt || new Date().toISOString();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    createdAt
  };
}

function saveAuthSession(authPayload) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authPayload.token);
  localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(authPayload.user));
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    saveAuthSession(data);
    setMessage("Login successful. Redirecting...", "success");

    setTimeout(() => {
      window.location.replace("index.html");
    }, 500);
  } catch (error) {
    setMessage(error.message);
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim().toLowerCase();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("signupConfirmPassword").value;

  if (password.length < 6) {
    setMessage("Password must be at least 6 characters.");
    return;
  }

  if (password !== confirmPassword) {
    setMessage("Passwords do not match.");
    return;
  }

  try {
    const data = await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, confirmPassword })
    });

    saveAuthSession(data);
    setMessage("Account created successfully. Redirecting...", "success");

    setTimeout(() => {
      window.location.replace("index.html");
    }, 500);
  } catch (error) {
    setMessage(error.message);
  }
});

forgotForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("forgotEmail").value.trim().toLowerCase();

  try {
    const data = await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });

    saveResetRequest({ email });
    startResendCountdown();
    resetForm.reset();
    switchView("reset");
    setMessage(`Verification code: ${data.resetCode}`, "success");
    showNotification(`Verification code: ${data.resetCode}`, "success");
  } catch (error) {
    setMessage(error.message);
    showNotification(error.message, "error");
  }
});

resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const resetRequest = loadResetRequest();
  const code = document.getElementById("resetCode").value.trim();
  const newPassword = document.getElementById("resetPassword").value;
  const confirmPassword = document.getElementById("resetConfirmPassword").value;

  if (!resetRequest || !resetRequest.email) {
    setMessage("No reset request found. Please request a new code.");
    return;
  }

  if (newPassword.length < 6) {
    setMessage("Password must be at least 6 characters.");
    return;
  }

  if (newPassword !== confirmPassword) {
    setMessage("New passwords do not match.");
    return;
  }

  try {
    await apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        email: resetRequest.email,
        code,
        newPassword,
        confirmPassword
      })
    });

    clearResetRequest();
    forgotForm.reset();
    resetForm.reset();
    switchView("login");
    setMessage("Password updated successfully. Please log in.", "success");
  } catch (error) {
    setMessage(error.message);
  }
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchView(button.dataset.viewTarget);
  });
});

resendCodeButton.addEventListener("click", async () => {
  const resetRequest = loadResetRequest();

  if (!resetRequest || resendCountdown > 0) {
    return;
  }

  try {
    const data = await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: resetRequest.email })
    });

    startResendCountdown();
    setMessage(`Verification code: ${data.resetCode}`, "success");
    showNotification(`Verification code: ${data.resetCode}`, "success");
  } catch (error) {
    setMessage(error.message);
    showNotification(error.message, "error");
  }
});

updateResendButton();
