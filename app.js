const CURRENT_USER_STORAGE_KEY = "readtrackCurrentUser";
const AUTH_TOKEN_STORAGE_KEY = "readtrackAuthToken";
const USER_STORAGE_KEY = "readtrackUser";
const ENTRIES_STORAGE_KEY = "readtrackEntries";
const SESSIONS_STORAGE_KEY = "readtrackReadingSessions";
const GOAL_STORAGE_KEY = "readtrackReadingGoal";
const PREFERENCES_STORAGE_KEY = "readtrackPreferences";
const API_BASE_URL = "https://readtrack-backend-9emm.onrender.com/api";

let currentUser = getStoredCurrentUser();
const authToken = getAccessToken();

if (!authToken && !currentUser) {
  window.location.replace("auth.html");
}

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const entryForm = document.getElementById("entryForm");
const goalForm = document.getElementById("goalForm");
const sessionForm = document.getElementById("sessionForm");

const entryIdInput = document.getElementById("entryId");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const tagsInput = document.getElementById("tags");
const tagPreview = document.getElementById("tagPreview");
const coverImageUrlInput = document.getElementById("coverImageUrl");
const coverPreview = document.getElementById("coverPreview");
const coverPreviewImage = document.getElementById("coverPreviewImage");
const coverPreviewPlaceholder = document.getElementById("coverPreviewPlaceholder");
const statusInput = document.getElementById("status");
const ratingInput = document.getElementById("rating");
const ratingPicker = document.getElementById("ratingPicker");
const ratingStars = document.querySelectorAll(".rating-star");
const totalPagesInput = document.getElementById("totalPages");
const pagesReadInput = document.getElementById("pagesRead");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const summaryInput = document.getElementById("summary");
const highlightInput = document.getElementById("highlight");
const quoteInput = document.getElementById("quote");
const isFavoriteInput = document.getElementById("isFavorite");
const isNextUpInput = document.getElementById("isNextUp");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const entryProgressText = document.getElementById("entryProgressText");
const entryProgressFill = document.getElementById("entryProgressFill");
const entryPagesLeftText = document.getElementById("entryPagesLeftText");
const entryProgressWarning = document.getElementById("entryProgressWarning");

const searchInput = document.getElementById("searchInput");
const filterTypeInput = document.getElementById("filterType");
const filterStatusInput = document.getElementById("filterStatus");
const favoriteFilterInput = document.getElementById("favoriteFilter");
const entriesContainer = document.getElementById("entriesContainer");
const resultsCount = document.getElementById("resultsCount");
const tagFilterContainer = document.getElementById("tagFilterContainer");
const clearTagFilterButton = document.getElementById("clearTagFilter");

const goalTitleInput = document.getElementById("goalTitle");
const goalTargetInput = document.getElementById("goalTarget");
const deleteGoalButton = document.getElementById("deleteGoalButton");

const sessionEntryInput = document.getElementById("sessionEntryId");
const sessionDateInput = document.getElementById("sessionDate");
const sessionPagesInput = document.getElementById("sessionPages");

const logoutButton = document.getElementById("logoutButton");
const switchAccountButton = document.getElementById("switchAccountButton");
const addAccountButton = document.getElementById("addAccountButton");
const deleteAccountButton = document.getElementById("deleteAccountButton");
const passwordToggleButton = document.getElementById("passwordToggleButton");
const changePasswordButton = document.getElementById("changePasswordButton");
const darkModeToggle = document.getElementById("darkModeToggle");
const themeSelect = document.getElementById("themeSelect");
const themePreference = document.getElementById("themePreference");
const notificationToggle = document.getElementById("notificationToggle");
const reminderToggle = document.getElementById("reminderToggle");
const reminderSettings = document.getElementById("reminderSettings");
const reminderHourInput = document.getElementById("reminderHourInput");
const reminderMinuteInput = document.getElementById("reminderMinuteInput");
const reminderPeriodSelect = document.getElementById("reminderPeriodSelect");
const reminderDaysToggle = document.getElementById("reminderDaysToggle");
const reminderDaysSummary = document.getElementById("reminderDaysSummary");
const reminderDaysSelector = document.getElementById("reminderDaysSelector");
const toastContainer = document.getElementById("toastContainer");

let entries = [];
let readingSessions = [];
let readingGoal = { title: "", target: 0 };
let userPreferences = {
  theme: "dark",
  notificationsEnabled: false,
  reminder: {
    enabled: false,
    hour: "07",
    minute: "00",
    period: "PM",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"]
  }
};
let selectedTag = "All";
let selectedRange = "week";
let selectedStatsRange = "week";
let charts = {};
let isPasswordVisible = false;
let selectedReminderDays = [];
let areReminderDaysExpanded = false;

window.scrollTo(0, 0);
sessionDateInput.value = getTodayDate();

function getStoredCurrentUser() {
  const savedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  const savedAccount = localStorage.getItem(USER_STORAGE_KEY);
  return savedUser ? JSON.parse(savedUser) : savedAccount ? JSON.parse(savedAccount) : null;
}

function saveCurrentUser(user) {
  currentUser = user;
  localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
}

function getAccessToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
}

async function apiRequest(path, options = {}) {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearAuthSession();
    window.location.replace("auth.html");
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function clearAuthSession() {
  localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

function getStorageKey(baseKey) {
  const userKey = currentUser && (currentUser.id || currentUser.email);
  return userKey ? `${baseKey}:${userKey}` : baseKey;
}

function loadStoredData(baseKey, fallback) {
  const savedData = localStorage.getItem(getStorageKey(baseKey));
  return savedData ? JSON.parse(savedData) : fallback;
}

function saveStoredData(baseKey, value) {
  localStorage.setItem(getStorageKey(baseKey), JSON.stringify(value));
}

function createLocalId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function updatePasswordDisplay() {
  const passwordText = document.getElementById("accountPasswordMasked");
  const savedAccount = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "null");
  const user = currentUser || savedAccount;
  const password = user && user.password ? user.password : savedAccount && savedAccount.password;
  passwordText.textContent = currentUser ? (isPasswordVisible && password ? password : "********") : "Not available";
  passwordToggleButton.classList.toggle("is-visible", isPasswordVisible);
  passwordToggleButton.setAttribute("aria-label", isPasswordVisible ? "Hide password" : "Show password");
}

function formatAccountDate(dateValue) {
  if (!dateValue) {
    return "Unknown";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  document.body.classList.toggle("dark-mode", nextTheme === "dark");
  document.body.classList.toggle("light-mode", nextTheme === "light");
}

function normalizeSession(session) {
  return {
    id: session.id || session._id || "",
    entryId: typeof session.entryId === "object" && session.entryId !== null ? session.entryId.id || session.entryId._id : session.entryId,
    entryTitle: session.entryTitle || (session.entryId && session.entryId.title) || "",
    date: session.date || "",
    pages: Number(session.pages) || 0,
    createdAt: session.createdAt || ""
  };
}

function syncPreferenceState(preferences) {
  userPreferences = {
    theme: preferences && preferences.theme === "light" ? "light" : "dark",
    notificationsEnabled: Boolean(preferences && preferences.notificationsEnabled),
    reminder: {
      enabled: Boolean(preferences && preferences.reminder && preferences.reminder.enabled),
      hour: String((preferences && preferences.reminder && preferences.reminder.hour) || "07").padStart(2, "0"),
      minute: String((preferences && preferences.reminder && preferences.reminder.minute) || "00").padStart(2, "0"),
      period: preferences && preferences.reminder && preferences.reminder.period === "AM" ? "AM" : "PM",
      days: Array.isArray(preferences && preferences.reminder && preferences.reminder.days)
        ? preferences.reminder.days
        : ["Mon", "Tue", "Wed", "Thu", "Fri"]
    }
  };
  selectedReminderDays = [...userPreferences.reminder.days];
  applyTheme(userPreferences.theme);
}

async function savePreferences(overrides = {}) {
  const nextPreferences = {
    theme: overrides.theme !== undefined ? overrides.theme : userPreferences.theme,
    notificationsEnabled: overrides.notificationsEnabled !== undefined
      ? overrides.notificationsEnabled
      : userPreferences.notificationsEnabled,
    reminder: {
      enabled: overrides.reminder && overrides.reminder.enabled !== undefined
        ? overrides.reminder.enabled
        : userPreferences.reminder.enabled,
      hour: overrides.reminder && overrides.reminder.hour !== undefined
        ? overrides.reminder.hour
        : userPreferences.reminder.hour,
      minute: overrides.reminder && overrides.reminder.minute !== undefined
        ? overrides.reminder.minute
        : userPreferences.reminder.minute,
      period: overrides.reminder && overrides.reminder.period !== undefined
        ? overrides.reminder.period
        : userPreferences.reminder.period,
      days: overrides.reminder && overrides.reminder.days !== undefined
        ? overrides.reminder.days
        : userPreferences.reminder.days
    }
  };

  try {
    const data = await apiRequest("/preferences", {
      method: "PUT",
      body: JSON.stringify(nextPreferences)
    });
    syncPreferenceState(data.preferences || nextPreferences);
    updatePreferenceControls();
    updateThemeControls();
    updateCharts();
  } catch (error) {
    showToast(error.message);
  }
}

async function initializeApp() {
  try {
    const [entryData, sessionData, goalData, preferenceData, accountData] = await Promise.all([
      apiRequest("/entries"),
      apiRequest("/sessions"),
      apiRequest("/goals"),
      apiRequest("/preferences"),
      apiRequest("/me")
    ]);

    entries = (entryData.entries || []).map(normalizeEntry);
    readingSessions = (sessionData.sessions || []).map(normalizeSession);
    readingGoal = goalData.goal || { title: "", target: 0 };
    syncPreferenceState(preferenceData.preferences || userPreferences);
    saveCurrentUser(accountData.user);
  } catch (error) {
    showToast(error.message);
  }

  updateRatingStars();
  updateTagPreview();
  updateCoverPreview();
  updateEntryProgressPreview();
  renderApp();
}

function updateThemeControls() {
  const isDark = document.body.classList.contains("dark-mode");

  if (darkModeToggle) {
    darkModeToggle.checked = isDark;
  }

  if (themeSelect) {
    themeSelect.value = isDark ? "dark" : "light";
  }

  if (themePreference) {
    themePreference.textContent = isDark ? "Dark theme enabled" : "Light theme enabled";
  }
}

function updatePreferenceControls() {
  if (notificationToggle) {
    notificationToggle.checked = userPreferences.notificationsEnabled;
  }

  if (reminderToggle) {
    reminderToggle.checked = userPreferences.reminder.enabled;
  }

  if (reminderHourInput) {
    reminderHourInput.value = userPreferences.reminder.hour;
  }

  if (reminderMinuteInput) {
    reminderMinuteInput.value = userPreferences.reminder.minute;
  }

  if (reminderPeriodSelect) {
    reminderPeriodSelect.value = userPreferences.reminder.period;
  }

  renderReminderDays();

  updateReminderSettingsState();
}

function renderReminderDays() {
  const dayOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const sortedDays = dayOrder.filter((day) => selectedReminderDays.includes(day));

  document.querySelectorAll("[data-reminder-day]").forEach((button) => {
    const isSelected = selectedReminderDays.includes(button.dataset.reminderDay);
    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  if (reminderDaysSummary) {
    const isEveryDay = sortedDays.length === dayOrder.length;
    const isWeekdays = sortedDays.length === weekdays.length && weekdays.every((day) => sortedDays.includes(day));
    reminderDaysSummary.textContent = isEveryDay ? "Every day" : isWeekdays ? "Weekdays" : sortedDays.join(", ") || "No days selected";
  }
}

function updateReminderDaysExpandedState() {
  if (reminderDaysSelector) {
    reminderDaysSelector.classList.toggle("is-collapsed", !areReminderDaysExpanded);
  }

  if (reminderDaysToggle) {
    reminderDaysToggle.classList.toggle("is-expanded", areReminderDaysExpanded);
    reminderDaysToggle.setAttribute("aria-expanded", String(areReminderDaysExpanded));
  }
}

function updateStatsRangeControls() {
  document.querySelectorAll(".stats-range-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.statsRange === selectedStatsRange);
  });
}

function updateReminderSettingsState() {
  const isEnabled = reminderToggle && reminderToggle.checked;

  if (reminderSettings) {
    reminderSettings.classList.toggle("is-hidden", !isEnabled);
  }

  if (reminderHourInput) {
    reminderHourInput.disabled = !isEnabled;
  }

  if (reminderMinuteInput) {
    reminderMinuteInput.disabled = !isEnabled;
  }

  if (reminderPeriodSelect) {
    reminderPeriodSelect.disabled = !isEnabled;
  }

  if (reminderDaysToggle) {
    reminderDaysToggle.disabled = !isEnabled;
  }

  document.querySelectorAll("[data-reminder-day]").forEach((button) => {
    button.disabled = !isEnabled;
  });

  if (!isEnabled) {
    areReminderDaysExpanded = false;
  }

  updateReminderDaysExpandedState();
}

function formatTwoDigits(value) {
  return String(value).padStart(2, "0");
}

function getSafeTimeNumber(value, fallback, min, max) {
  const digitsOnly = String(value).replace(/\D/g, "");
  const numberValue = digitsOnly === "" ? fallback : Number(digitsOnly);
  return Math.min(max, Math.max(min, numberValue));
}

function saveReminderTime() {
  const hour = getSafeTimeNumber(reminderHourInput.value, 7, 1, 12);
  const minute = getSafeTimeNumber(reminderMinuteInput.value, 0, 0, 59);
  const period = reminderPeriodSelect.value === "AM" ? "AM" : "PM";

  reminderHourInput.value = formatTwoDigits(hour);
  reminderMinuteInput.value = formatTwoDigits(minute);
  reminderPeriodSelect.value = period;
}

function normalizeEntry(entry) {
  return {
    id: entry.id || entry._id || String(Date.now()),
    title: entry.title || "",
    author: entry.author || "",
    type: entry.type || "",
    category: entry.category || "",
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    coverImageUrl: entry.coverImageUrl || "",
    status: entry.status || "To Read",
    rating: entry.rating === null || entry.rating === undefined || entry.rating === "" ? null : Number(entry.rating),
    totalPages: Number(entry.totalPages) || 0,
    pagesRead: Number(entry.pagesRead) || 0,
    startDate: entry.startDate || "",
    endDate: entry.endDate || "",
    summary: entry.summary || "",
    highlight: entry.highlight || "",
    quote: entry.quote || "",
    isFavorite: Boolean(entry.isFavorite),
    isNextUp: Boolean(entry.isNextUp)
  };
}

function logoutUser() {
  clearAuthSession();
  window.location.replace("auth.html");
}

function switchAccount() {
  clearAuthSession();
  window.location.replace("auth.html");
}

function addNewAccount() {
  clearAuthSession();
  window.location.replace("auth.html");
}

async function deleteAccount() {
  if (!currentUser) {
    return;
  }

  const confirmed = window.confirm("Delete this account and all saved ReadTrack data?");

  if (!confirmed) {
    return;
  }

  try {
    await apiRequest("/me", { method: "DELETE" });
    localStorage.removeItem(USER_STORAGE_KEY);
    clearAuthSession();
    window.location.replace("auth.html");
  } catch (error) {
    showToast(error.message);
  }
}

async function changePassword() {
  const currentPassword = window.prompt("Enter your current password:");

  if (currentPassword === null) {
    return;
  }

  const newPassword = window.prompt("Enter your new password:");

  if (newPassword === null) {
    return;
  }

  if (newPassword.length < 6) {
    showToast("Password must be at least 6 characters");
    return;
  }

  const confirmPassword = window.prompt("Confirm your new password:");

  if (confirmPassword === null) {
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast("New passwords do not match");
    return;
  }

  try {
    await apiRequest("/me/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });
    isPasswordVisible = false;
    updatePasswordDisplay();
    showToast("Password changed successfully");
  } catch (error) {
    showToast(error.message);
  }
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatTags(tagText) {
  if (!tagText.trim()) {
    return [];
  }

  return tagText
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");
}

function getProgressPercent(entry) {
  if (!entry.totalPages || entry.totalPages <= 0) {
    return entry.status === "Completed" ? 100 : 0;
  }

  return Math.min(100, Math.round((entry.pagesRead / entry.totalPages) * 100));
}

function getFormData() {
  return normalizeEntry({
    id: entryIdInput.value || createLocalId(),
    title: titleInput.value.trim(),
    author: authorInput.value.trim(),
    type: typeInput.value,
    category: categoryInput.value.trim(),
    tags: formatTags(tagsInput.value),
    coverImageUrl: coverImageUrlInput.value.trim(),
    status: statusInput.value,
    rating: ratingInput.value ? Number(ratingInput.value) : null,
    totalPages: totalPagesInput.value,
    pagesRead: pagesReadInput.value,
    startDate: startDateInput.value,
    endDate: endDateInput.value,
    summary: summaryInput.value.trim(),
    highlight: highlightInput.value.trim(),
    quote: quoteInput.value.trim(),
    isFavorite: isFavoriteInput.checked,
    isNextUp: isNextUpInput.checked
  });
}

function validateEntryData(entryData) {
  if (!entryData.title) {
    return "Title is required";
  }

  if (!entryData.author) {
    return "Author is required";
  }

  if (!entryData.type) {
    return "Type is required";
  }

  if (!entryData.status) {
    return "Status is required";
  }

  if (entryData.totalPages < 0 || entryData.pagesRead < 0) {
    return "Page values cannot be negative";
  }

  if (entryData.totalPages > 0 && entryData.pagesRead > entryData.totalPages) {
    return "Pages read cannot be greater than total pages";
  }

  return "";
}

function resetForm(shouldScroll = false) {
  entryForm.reset();
  entryIdInput.value = "";
  ratingInput.value = "";
  isFavoriteInput.checked = false;
  isNextUpInput.checked = false;
  submitButton.textContent = "Save Entry";
  cancelEditButton.textContent = "Reset Form";
  cancelEditButton.style.display = "inline-flex";
  updateRatingStars();
  updateTagPreview();
  updateCoverPreview();
  updateEntryProgressPreview();

  if (shouldScroll) {
    document.getElementById("add-entry").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function updateRatingStars(previewRating = null) {
  const selectedRating = Number(ratingInput.value) || 0;
  const visibleRating = previewRating === null ? selectedRating : previewRating;

  ratingStars.forEach((star) => {
    const starValue = Number(star.dataset.rating);
    star.classList.toggle("is-active", previewRating === null && starValue <= selectedRating);
    star.classList.toggle("is-preview", starValue <= visibleRating);
    star.setAttribute("aria-checked", String(starValue === selectedRating));
  });
}

function setRating(value) {
  ratingInput.value = String(value);
  updateRatingStars();
}

function updateEntryProgressPreview() {
  const totalPages = Number(totalPagesInput.value) || 0;
  const pagesRead = Number(pagesReadInput.value) || 0;
  const progressPercent = totalPages > 0 ? Math.min(100, Math.round((pagesRead / totalPages) * 100)) : 0;
  const pagesLeft = totalPages > 0 ? Math.max(0, totalPages - pagesRead) : 0;

  entryProgressText.textContent = `${progressPercent}% completed`;
  entryProgressFill.style.width = `${progressPercent}%`;
  entryPagesLeftText.textContent = `${pagesLeft} page${pagesLeft === 1 ? "" : "s"} left`;
  entryProgressWarning.textContent = totalPages > 0 && pagesRead > totalPages ? "Pages read is higher than total pages" : "";
}

function updateTagPreview() {
  const tags = formatTags(tagsInput.value);

  tagPreview.innerHTML = "";

  if (tags.length === 0) {
    const emptyMessage = document.createElement("span");
    emptyMessage.className = "tag-preview-empty";
    emptyMessage.textContent = "Tag chips will appear here.";
    tagPreview.appendChild(emptyMessage);
    return;
  }

  tags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "tag-preview-chip";
    chip.textContent = tag;
    tagPreview.appendChild(chip);
  });
}

function updateCoverPreview() {
  const imageUrl = coverImageUrlInput.value.trim();

  coverPreview.classList.remove("has-image");
  coverPreviewImage.removeAttribute("src");
  coverPreviewPlaceholder.textContent = imageUrl ? "Loading preview..." : "No cover image added";

  if (!imageUrl) {
    return;
  }

  coverPreviewImage.src = imageUrl;
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2800);
}

async function handleFormSubmit(event) {
  event.preventDefault();
  event.stopPropagation();

  const entryData = getFormData();
  const validationMessage = validateEntryData(entryData);

  if (validationMessage) {
    showToast(validationMessage);
    return;
  }

  const isEditing = Boolean(entryIdInput.value);

  try {
    const data = await apiRequest(isEditing ? `/entries/${entryData.id}` : "/entries", {
      method: isEditing ? "PATCH" : "POST",
      body: JSON.stringify(entryData)
    });
    const savedEntry = normalizeEntry(data.entry);

    if (entryData.isNextUp) {
      entries = entries.map((entry) => (
        entry.id === savedEntry.id ? entry : { ...entry, isNextUp: false }
      ));
    }

    const existingEntryIndex = entries.findIndex((entry) => entry.id === savedEntry.id);
    if (existingEntryIndex >= 0) {
      entries[existingEntryIndex] = savedEntry;
    } else {
      entries.unshift(savedEntry);
    }

    resetForm();
    searchInput.value = "";
    filterTypeInput.value = "All";
    filterStatusInput.value = "All";
    favoriteFilterInput.value = "All";
    selectedTag = "All";
    renderApp();
    showToast(isEditing ? "Entry updated successfully" : "Entry saved successfully");
    activateTab("reading-log");
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteEntry(entryId) {
  try {
    await apiRequest(`/entries/${entryId}`, { method: "DELETE" });
    entries = entries.filter((entry) => entry.id !== entryId);
    readingSessions = readingSessions.filter((session) => session.entryId !== entryId);
    renderApp();
    showToast("Entry deleted");
  } catch (error) {
    showToast(error.message);
  }
}

function editEntry(entryId) {
  const selectedEntry = entries.find((entry) => entry.id === entryId);

  if (!selectedEntry) {
    return;
  }

  entryIdInput.value = selectedEntry.id;
  titleInput.value = selectedEntry.title;
  authorInput.value = selectedEntry.author;
  typeInput.value = selectedEntry.type;
  categoryInput.value = selectedEntry.category;
  tagsInput.value = selectedEntry.tags.join(", ");
  coverImageUrlInput.value = selectedEntry.coverImageUrl || "";
  statusInput.value = selectedEntry.status;
  ratingInput.value = selectedEntry.rating || "";
  totalPagesInput.value = selectedEntry.totalPages || "";
  pagesReadInput.value = selectedEntry.pagesRead || "";
  startDateInput.value = selectedEntry.startDate;
  endDateInput.value = selectedEntry.endDate;
  summaryInput.value = selectedEntry.summary;
  highlightInput.value = selectedEntry.highlight;
  quoteInput.value = selectedEntry.quote;
  isFavoriteInput.checked = selectedEntry.isFavorite;
  isNextUpInput.checked = selectedEntry.isNextUp;

  submitButton.textContent = "Update Entry";
  cancelEditButton.textContent = "Cancel Edit";
  cancelEditButton.style.display = "inline-flex";
  updateRatingStars();
  updateTagPreview();
  updateCoverPreview();
  updateEntryProgressPreview();
  activateTab("add-entry");
}

async function toggleFavorite(entryId) {
  try {
    const data = await apiRequest(`/entries/${entryId}/favorite`, { method: "PATCH" });
    const updatedEntry = normalizeEntry(data.entry);
    entries = entries.map((entry) => (
      entry.id === entryId ? updatedEntry : entry
    ));
    renderApp();
  } catch (error) {
    showToast(error.message);
  }
}

async function handleGoalSubmit(event) {
  event.preventDefault();

  const nextGoal = {
    title: goalTitleInput.value.trim(),
    target: Number(goalTargetInput.value) || 0
  };

  try {
    const data = await apiRequest("/goals", {
      method: "PUT",
      body: JSON.stringify(nextGoal)
    });
    readingGoal = data.goal || nextGoal;
    updateGoalUI();
    updateDashboard();
    showToast("Goal saved");
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteGoal() {
  try {
    await apiRequest("/goals", { method: "DELETE" });
    readingGoal = { title: "", target: 0 };
    goalForm.reset();
    updateGoalUI();
    updateDashboard();
    showToast("Goal removed");
  } catch (error) {
    showToast(error.message);
  }
}

async function handleSessionSubmit(event) {
  event.preventDefault();

  const entryId = sessionEntryInput.value;
  const date = sessionDateInput.value || getTodayDate();
  const pages = Number(sessionPagesInput.value) || 0;

  if (!entryId || pages <= 0) {
    return;
  }

  const entry = entries.find((item) => item.id === entryId);

  if (!entry) {
    showToast("Reading entry not found");
    return;
  }

  try {
    const data = await apiRequest("/sessions", {
      method: "POST",
      body: JSON.stringify({ entryId, date, pages })
    });
    const entryData = await apiRequest("/entries");
    readingSessions.unshift(normalizeSession(data.session));
    entries = (entryData.entries || []).map(normalizeEntry);
    sessionForm.reset();
    sessionDateInput.value = getTodayDate();
    renderApp();
    showToast("Reading session added");
  } catch (error) {
    showToast(error.message);
  }
}

function getFilteredEntries() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedType = filterTypeInput.value;
  const selectedStatus = filterStatusInput.value;
  const favoriteMode = favoriteFilterInput.value;

  return entries.filter((entry) => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm);
    const matchesType = selectedType === "All" || entry.type === selectedType;
    const matchesStatus = selectedStatus === "All" || entry.status === selectedStatus;
    const matchesFavorite = favoriteMode === "All" || entry.isFavorite;
    const matchesTag = selectedTag === "All" || entry.tags.includes(selectedTag);

    return matchesSearch && matchesType && matchesStatus && matchesFavorite && matchesTag;
  });
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) {
    return "No dates";
  }

  if (startDate && endDate) {
    return `${startDate} to ${endDate}`;
  }

  return startDate || endDate;
}

function renderStars(rating) {
  const stars = [1, 2, 3, 4, 5]
    .map((value) => `<span class="${value <= rating ? "filled" : ""}">&#9733;</span>`)
    .join("");

  return `<div class="star-rating">${stars}</div>`;
}

function renderEntries() {
  const filteredEntries = getFilteredEntries();

  resultsCount.textContent = `${filteredEntries.length} entr${filteredEntries.length === 1 ? "y" : "ies"}`;

  if (filteredEntries.length === 0) {
    entriesContainer.innerHTML = `
      <div class="empty-state">
        <h4>No matching entries</h4>
        <p>Try changing your filters, tag selection, or search text.</p>
      </div>
    `;
    return;
  }

  entriesContainer.innerHTML = filteredEntries
    .map((entry) => {
      const progressPercent = getProgressPercent(entry);
      const tagChips = entry.tags.length
        ? entry.tags.map((tag) => `<button type="button" class="tag-chip ${selectedTag === tag ? "active" : ""}" data-action="tag" data-tag="${tag}">${tag}</button>`).join("")
        : `<span class="chip">No tags</span>`;

      return `
        <article class="entry-card">
          <button class="favorite-button ${entry.isFavorite ? "is-favorite" : ""}" data-action="favorite" data-id="${entry.id}" type="button">&#9733;</button>

          <div class="entry-card-main">
            <div class="cover-placeholder" aria-hidden="true"></div>

            <div class="entry-body">
              <div class="entry-card-header">
                <div>
                  <h4>${entry.title}</h4>
                  <p class="meta-label">by ${entry.author}</p>
                </div>
                <span class="status-chip ${entry.status.toLowerCase().replace(/\s+/g, "-")}">${entry.status}</span>
              </div>

              <div class="entry-meta">
                <span class="chip">${entry.type || "Unknown"}</span>
                <span class="chip">${entry.category || "Uncategorized"}</span>
                ${entry.isNextUp ? `<span class="chip">Next Up</span>` : ""}
              </div>
            </div>
          </div>

          <div class="entry-section">
            <div class="entry-section-title">Reading Progress</div>
            <div class="entry-progress">
              <div class="entry-progress-head">
                <span>${entry.pagesRead} / ${entry.totalPages || 0} pages</span>
                <strong>${progressPercent}% completed</strong>
              </div>
              <div class="progress-rail">
                <div class="progress-fill" style="width: ${progressPercent}%;"></div>
              </div>
            </div>
          </div>

          <div class="entry-section">
            <div class="entry-section-title">Entry Details</div>
            <div class="entry-info-grid">
              <div class="detail-box">
                <span class="meta-label">Rating</span>
                ${entry.rating ? renderStars(entry.rating) : `<strong>N/A</strong>`}
              </div>
              <div class="detail-box">
                <span class="meta-label">Dates</span>
                <strong>${formatDateRange(entry.startDate, entry.endDate)}</strong>
              </div>
              <div class="detail-box">
                <span class="meta-label">Status</span>
                <strong>${entry.status}</strong>
              </div>
            </div>
          </div>

          <div class="entry-section">
            <div class="entry-section-title">Tags</div>
            <div class="entry-tags">${tagChips}</div>
          </div>

          <div class="entry-section">
            <div class="entry-section-title">Summary & Notes</div>
            <p class="entry-summary">${entry.summary || "No summary added yet."}</p>
            ${entry.highlight ? `<div class="entry-note-block"><strong>Highlight</strong><p>${entry.highlight}</p></div>` : ""}
            ${entry.quote ? `<div class="entry-note-block"><strong>Quote</strong><p>${entry.quote}</p></div>` : ""}
          </div>

          <div class="entry-actions">
            <button class="btn btn-edit" data-action="edit" data-id="${entry.id}" type="button">Edit</button>
            <button class="btn btn-danger" data-action="delete" data-id="${entry.id}" type="button">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function calculateAverageRating(items) {
  const ratedItems = items.filter((entry) => entry.rating !== null);

  if (ratedItems.length === 0) {
    return 0;
  }

  const totalRating = ratedItems.reduce((sum, entry) => sum + entry.rating, 0);
  return totalRating / ratedItems.length;
}

function getMostCommonValue(items, key, emptyValue) {
  const counts = {};

  items.forEach((item) => {
    const value = item[key] || emptyValue;
    counts[value] = (counts[value] || 0) + 1;
  });

  const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return topEntry ? topEntry[0] : emptyValue;
}

function getHighestRatedItem() {
  const ratedEntries = entries.filter((entry) => entry.rating !== null);

  if (ratedEntries.length === 0) {
    return "No ratings yet";
  }

  const highestRatedEntry = [...ratedEntries].sort((a, b) => b.rating - a.rating)[0];
  return `${highestRatedEntry.title} (${highestRatedEntry.rating}/5)`;
}

function getHighestRatedType() {
  const ratedEntries = entries.filter((entry) => entry.rating !== null && entry.type);

  if (ratedEntries.length === 0) {
    return "No ratings yet";
  }

  const ratingsByType = {};

  ratedEntries.forEach((entry) => {
    if (!ratingsByType[entry.type]) {
      ratingsByType[entry.type] = { total: 0, count: 0 };
    }

    ratingsByType[entry.type].total += entry.rating;
    ratingsByType[entry.type].count += 1;
  });

  const topType = Object.entries(ratingsByType)
    .map(([type, ratingData]) => ({
      type,
      average: ratingData.total / ratingData.count
    }))
    .sort((a, b) => b.average - a.average)[0];

  return topType ? `${topType.type} (${topType.average.toFixed(1)}/5)` : "No ratings yet";
}

function setStatsText(id, value, shouldAnimate = false) {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  const textValue = String(value);
  const numberMatch = textValue.match(/^(\d+(?:\.\d+)?)(%)?$/);

  if (!shouldAnimate || !numberMatch) {
    element.textContent = textValue;
    return;
  }

  const targetValue = Number(numberMatch[1]);
  const suffix = numberMatch[2] || "";
  const startValue = Number(element.dataset.currentValue || 0);
  const hasDecimal = textValue.includes(".");
  const startTime = performance.now();
  const duration = 650;

  element.dataset.currentValue = String(targetValue);

  function updateFrame(currentTime) {
    const progress = Math.min(1, (currentTime - startTime) / duration);
    const currentValue = startValue + (targetValue - startValue) * progress;
    element.textContent = `${hasDecimal ? currentValue.toFixed(1) : Math.round(currentValue)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(updateFrame);
    }
  }

  requestAnimationFrame(updateFrame);
}

function updateDashboard() {
  const totalEntries = entries.length;
  const completedEntries = entries.filter((entry) => entry.status === "Completed").length;
  const readingEntries = entries.filter((entry) => entry.status === "Reading").length;
  const toReadEntries = entries.filter((entry) => entry.status === "To Read").length;
  const averageRating = calculateAverageRating(entries).toFixed(1);
  const pendingEntries = entries.filter((entry) => entry.status !== "Completed").length;
  const favoriteEntries = entries.filter((entry) => entry.isFavorite).length;
  const progressPercent = totalEntries === 0 ? 0 : Math.round((completedEntries / totalEntries) * 100);
  const favoriteCategory = getMostCommonValue(entries, "category", "None yet");
  const currentEntry = entries.find((entry) => entry.status === "Reading") || entries.find((entry) => entry.isNextUp) || entries[0];
  const currentProgress = currentEntry ? getProgressPercent(currentEntry) : 0;
  const pagesLeft = currentEntry && currentEntry.totalPages > 0 ? Math.max(0, currentEntry.totalPages - currentEntry.pagesRead) : 0;
  const weekStart = new Date(getTodayDate());
  weekStart.setDate(weekStart.getDate() - 6);
  const weeklySessions = readingSessions.filter((session) => new Date(session.date) >= weekStart);
  const weeklyPages = weeklySessions.reduce((sum, session) => sum + session.pages, 0);
  const goalTarget = Number(readingGoal.target) || 0;
  const goalMiniText = goalTarget > 0 ? `${completedEntries}/${goalTarget} completed` : "No goal set";

  document.getElementById("totalEntries").textContent = totalEntries;
  document.getElementById("completedEntries").textContent = completedEntries;
  document.getElementById("readingEntries").textContent = readingEntries;
  document.getElementById("toReadEntries").textContent = toReadEntries;
  document.getElementById("averageRating").textContent = averageRating;
  document.getElementById("dashboardFavoriteCategory").textContent = favoriteCategory;
  document.getElementById("progressPercent").textContent = `${progressPercent}%`;
  document.getElementById("progressFill").style.width = `${progressPercent}%`;
  document.getElementById("progressCompleted").textContent = completedEntries;
  document.getElementById("progressPending").textContent = pendingEntries;
  document.getElementById("favoriteCount").textContent = favoriteEntries;
  document.getElementById("favoriteCategory").textContent = favoriteCategory;
  document.getElementById("highestRatedItem").textContent = getHighestRatedItem();
  document.getElementById("mostCommonType").textContent = getMostCommonValue(entries, "type", "No entries yet");
  document.getElementById("nextUpItem").textContent = getNextUpItem();
  document.getElementById("dashboardHeroLine").textContent = totalEntries > 0
    ? `You have ${pendingEntries} pending item${pendingEntries === 1 ? "" : "s"} and ${completedEntries} completed read${completedEntries === 1 ? "" : "s"}.`
    : "Start by adding your first book, paper, or article.";
  document.getElementById("dashboardTodaySummary").textContent = `${readingEntries} active read${readingEntries === 1 ? "" : "s"}`;
  document.getElementById("dashboardFocusHint").textContent = currentEntry
    ? `Focus today: ${currentEntry.title}`
    : "Add an entry or log a session to build momentum.";
  document.getElementById("dashboardFocusTitle").textContent = currentEntry ? currentEntry.title : "No active reading yet";
  document.getElementById("dashboardFocusStatus").textContent = currentEntry ? currentEntry.status : "Idle";
  document.getElementById("dashboardFocusMeta").textContent = currentEntry
    ? `${currentEntry.author || "Unknown author"} - ${currentEntry.type || "Reading item"}`
    : "Choose a reading item to make this your command center.";
  document.getElementById("dashboardFocusFill").style.width = `${currentProgress}%`;
  document.getElementById("dashboardFocusPages").textContent = currentEntry
    ? `${currentEntry.pagesRead} / ${currentEntry.totalPages || 0} pages${currentEntry.totalPages > 0 ? ` - ${pagesLeft} left` : ""}`
    : "0 pages tracked";
  document.getElementById("dashboardNextFocus").textContent = getNextUpItem();
  document.getElementById("dashboardPendingFocus").textContent = `${pendingEntries} item${pendingEntries === 1 ? "" : "s"}`;
  document.getElementById("dashboardGoalMiniSummary").textContent = goalMiniText;
  document.getElementById("dashboardMomentumPages").textContent = weeklyPages;
  document.getElementById("dashboardMomentumSessions").textContent = weeklySessions.length;
  updateStreak();
  updateRecentActivity();
  updateGoalUI();
  updateAccountUI();
}

function updateStatistics() {
  const totalEntries = entries.length;
  const books = entries.filter((entry) => entry.type === "Book").length;
  const papers = entries.filter((entry) => entry.type === "Research Paper").length;
  const articles = entries.filter((entry) => entry.type === "Article").length;
  const completed = entries.filter((entry) => entry.status === "Completed").length;
  const pending = entries.filter((entry) => entry.status !== "Completed").length;
  const toRead = entries.filter((entry) => entry.status === "To Read").length;
  const averageRating = calculateAverageRating(entries).toFixed(1);
  const favorites = entries.filter((entry) => entry.isFavorite).length;
  const completionRate = totalEntries === 0 ? 0 : Math.round((completed / totalEntries) * 100);
  const totalPagesRead = entries.reduce((sum, entry) => sum + entry.pagesRead, 0);
  const averagePagesRead = totalEntries === 0 ? 0 : Math.round(totalPagesRead / totalEntries);
  const favoriteType = getMostCommonValue(entries, "type", "None yet");
  const favoriteCategory = getMostCommonValue(entries, "category", "None yet");
  const streak = calculateReadingStreak();

  setStatsText("statsTotalEntries", totalEntries, true);
  setStatsText("statsCompletionRate", `${completionRate}%`, true);
  setStatsText("statsFavoriteType", favoriteType);
  setStatsText("statsBooks", books, true);
  setStatsText("statsPapers", papers, true);
  setStatsText("statsArticles", articles, true);
  setStatsText("statsCompletion", `${completed} / ${pending}`);
  setStatsText("statsAverageRating", averageRating, true);
  setStatsText("statsFavorites", favorites, true);
  setStatsText("statsFavoriteCategory", favoriteCategory);
  setStatsText("statsAveragePages", averagePagesRead, true);
  setStatsText("statsReadingStreak", `${streak} day${streak === 1 ? "" : "s"}`);
  setStatsText("statsHighestRatedType", getHighestRatedType());
  setStatsText("statsToReadRatio", `${toRead} / ${completed}`);
  setStatsText("statsMostReadType", favoriteType);

  document.getElementById("statsFavoriteCategoryHint").textContent = favoriteCategory === "None yet"
    ? "Add categories to discover your strongest theme."
    : `You come back to ${favoriteCategory} most often.`;
  document.getElementById("statsAveragePagesHint").textContent = averagePagesRead > 0
    ? `You average ${averagePagesRead} pages read per saved item.`
    : "Log pages read to reveal your average progress.";
  document.getElementById("statsReadingStreakHint").textContent = streak > 0
    ? `You have reading activity for ${streak} day${streak === 1 ? "" : "s"} in a row.`
    : "Your streak is low this week. Log a session to restart.";
  document.getElementById("statsHighestRatedTypeHint").textContent = getHighestRatedType() === "No ratings yet"
    ? "Rate entries to reveal your strongest format."
    : "This format has your best average rating.";
  document.getElementById("statsToReadRatioHint").textContent = completed > toRead
    ? "Completed items are ahead of planned reads."
    : "Your reading queue still has room to finish.";
  document.getElementById("statsMostReadTypeHint").textContent = favoriteType === "None yet"
    ? "Add entries to find your dominant content type."
    : `You mostly read ${favoriteType}.`;
}

function updateRecentActivity() {
  const activityList = document.getElementById("recentActivityList");

  if (entries.length === 0 && readingSessions.length === 0) {
    activityList.innerHTML = `<div class="activity-empty">Your recent reading activity will appear here.</div>`;
    return;
  }

  const latestEntry = entries[0];
  const latestCompleted = entries.find((entry) => entry.status === "Completed");
  const latestSession = readingSessions[0];
  const latestSessionEntry = latestSession ? entries.find((entry) => entry.id === latestSession.entryId) : null;

  const items = [
    { label: "Recently Added", value: latestEntry ? latestEntry.title : "No entry yet" },
    { label: "Recently Completed", value: latestCompleted ? latestCompleted.title : "Nothing completed yet" },
    { label: "Latest Session", value: latestSessionEntry ? `${latestSessionEntry.title} - ${latestSession.pages} pages` : "No session logged yet" }
  ];

  activityList.innerHTML = items
    .map((item) => `
      <div class="activity-item">
        <span class="activity-dot"></span>
        <div>
          <span class="activity-label">${item.label}</span>
          <strong>${item.value}</strong>
        </div>
      </div>
    `)
    .join("");
}

function updateGoalUI() {
  goalTitleInput.value = readingGoal.title || "";
  goalTargetInput.value = readingGoal.target || "";

  const completedEntries = entries.filter((entry) => entry.status === "Completed").length;
  const target = Number(readingGoal.target) || 0;
  const progressPercent = target > 0 ? Math.min(100, Math.round((completedEntries / target) * 100)) : 0;

  document.getElementById("goalSummary").textContent = readingGoal.title || "No goal set yet";
  document.getElementById("goalProgressText").textContent = `${completedEntries} / ${target}`;
  document.getElementById("goalProgressFill").style.width = `${progressPercent}%`;
}

function updateAccountUI() {
  const savedAccount = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "null");
  const currentName = currentUser && currentUser.name && currentUser.name !== "User" ? currentUser.name : "";
  const currentEmail = currentUser && currentUser.email && currentUser.email !== "No email" ? currentUser.email : "";
  const currentCreatedAt = currentUser && currentUser.createdAt ? currentUser.createdAt : "";
  const user = {
    ...(currentUser || {}),
    name: currentName || (savedAccount && savedAccount.name) || "",
    email: currentEmail || (savedAccount && savedAccount.email) || "",
    createdAt: currentCreatedAt || (savedAccount && savedAccount.createdAt) || ""
  };
  const safeName = user.name || "User";
  const safeEmail = user.email || "No email";
  const safeCreatedAt = formatAccountDate(user.createdAt);

  if (savedAccount && (!currentUser || !currentUser.name || !currentUser.email || !currentUser.createdAt)) {
    saveCurrentUser(user);
  }

  document.getElementById("accountAvatar").textContent = safeName.charAt(0).toUpperCase() || "U";
  document.getElementById("accountName").textContent = safeName;
  document.getElementById("accountEmail").textContent = safeEmail;
  updatePasswordDisplay();
  document.getElementById("accountJoinedAt").textContent = safeCreatedAt;
}

function updateStreak() {
  const streak = calculateReadingStreak();
  document.getElementById("streakCount").textContent = `${streak} day${streak === 1 ? "" : "s"}`;
  document.getElementById("streakMessage").textContent = streak > 0
    ? `You read ${streak} day${streak === 1 ? "" : "s"} in a row.`
    : "Log reading sessions to build your streak.";
}

function calculateReadingStreak() {
  if (readingSessions.length === 0) {
    return 0;
  }

  const uniqueDates = [...new Set(readingSessions.map((session) => session.date))].sort().reverse();
  let streak = 0;
  let currentDate = new Date(getTodayDate());

  for (const dateString of uniqueDates) {
    const date = new Date(dateString);
    const diffInDays = Math.round((currentDate - date) / 86400000);

    if (diffInDays === 0) {
      streak += 1;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (diffInDays === 1 && streak === 0) {
      streak += 1;
      currentDate = date;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function getNextUpItem() {
  const nextEntry = entries.find((entry) => entry.isNextUp);
  return nextEntry ? nextEntry.title : "Nothing queued";
}

function populateSessionEntryOptions() {
  if (entries.length === 0) {
    sessionEntryInput.innerHTML = `<option value="">Add an entry first</option>`;
    return;
  }

  sessionEntryInput.innerHTML = `
    <option value="">Select entry</option>
    ${entries.map((entry) => `<option value="${entry.id}">${entry.title}</option>`).join("")}
  `;
}

function renderTagFilters() {
  const allTags = [...new Set(entries.flatMap((entry) => entry.tags))];

  if (allTags.length === 0) {
    tagFilterContainer.innerHTML = `<span class="chip">No tags yet</span>`;
    return;
  }

  tagFilterContainer.innerHTML = allTags
    .map((tag) => `<button type="button" class="tag-chip ${selectedTag === tag ? "active" : ""}" data-filter-tag="${tag}">${tag}</button>`)
    .join("");
}

function groupSessionsByRange(range) {
  const labels = [];
  const values = [];
  const today = new Date(getTodayDate());

  if (range === "all") {
    const sessionDates = [...new Set(readingSessions.map((session) => session.date))].sort();

    if (sessionDates.length === 0) {
      return { labels: ["No sessions"], values: [0] };
    }

    sessionDates.forEach((date) => {
      const totalPages = readingSessions
        .filter((session) => session.date === date)
        .reduce((sum, session) => sum + session.pages, 0);

      labels.push(date.slice(5));
      values.push(totalPages);
    });

    return { labels, values };
  }

  const dayCount = range === "week" ? 7 : 30;

  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const label = date.toISOString().split("T")[0];
    const totalPages = readingSessions
      .filter((session) => session.date === label)
      .reduce((sum, session) => sum + session.pages, 0);

    labels.push(label.slice(5));
    values.push(totalPages);
  }

  return { labels, values };
}

function createOrUpdateChart(key, config) {
  const chartElement = document.getElementById(key);

  if (!chartElement) {
    return;
  }

  if (charts[key]) {
    charts[key].destroy();
  }

  charts[key] = new Chart(chartElement, config);
}

function createChartGradient(chartId, startColor, endColor) {
  const chartElement = document.getElementById(chartId);

  if (!chartElement) {
    return startColor;
  }

  const context = chartElement.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, chartElement.width || 320, chartElement.height || 260);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  return gradient;
}

function updateCharts() {
  const isDark = document.body.classList.contains("dark-mode");
  const chartTextColor = isDark ? "#fffaf0" : "#0b0906";
  const chartGridColor = isDark ? "rgba(214, 168, 79, 0.14)" : "rgba(214, 168, 79, 0.22)";
  const trendBarColor = isDark ? "#d6a84f" : "#a9792f";
  const typeColors = isDark
    ? [
      createChartGradient("typeChart", "#f0c66a", "#a9792f"),
      createChartGradient("typeChart", "#fff1b8", "#b9ad96"),
      createChartGradient("typeChart", "#c47f2b", "#7a4d1d")
    ]
    : ["#d6a84f", "#a9792f", "#b9ad96"];
  const completionColors = isDark
    ? [
      createChartGradient("completionChart", "#f0c66a", "#a9792f"),
      createChartGradient("completionChart", "#665434", "#2b2418")
    ]
    : ["#d6a84f", "#7a6a4a"];
  const statsTrendFill = isDark
    ? createChartGradient("statsTrendChart", "rgba(214, 168, 79, 0.28)", "rgba(214, 168, 79, 0.02)")
    : createChartGradient("statsTrendChart", "rgba(169, 121, 47, 0.18)", "rgba(169, 121, 47, 0.02)");
  const weeklyData = groupSessionsByRange(selectedRange);
  const statsTrendData = groupSessionsByRange(selectedStatsRange);
  const statsTooltip = {
    backgroundColor: isDark ? "#0f0d0a" : "#fffaf0",
    titleColor: chartTextColor,
    bodyColor: chartTextColor,
    borderColor: chartGridColor,
    borderWidth: 1,
    padding: 12
  };
  const books = entries.filter((entry) => entry.type === "Book").length;
  const articles = entries.filter((entry) => entry.type === "Article").length;
  const papers = entries.filter((entry) => entry.type === "Research Paper").length;
  const completed = entries.filter((entry) => entry.status === "Completed").length;
  const pending = entries.filter((entry) => entry.status !== "Completed").length;

  createOrUpdateChart("readingTrendChart", {
    type: "bar",
    data: {
      labels: weeklyData.labels,
      datasets: [{
        label: "Pages Read",
        data: weeklyData.values,
        backgroundColor: [trendBarColor],
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: chartTextColor },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { color: chartTextColor },
          grid: { color: chartGridColor }
        }
      }
    }
  });

  createOrUpdateChart("statsTrendChart", {
    type: "line",
    data: {
      labels: statsTrendData.labels,
      datasets: [{
        label: "Pages Read",
        data: statsTrendData.values,
        borderColor: trendBarColor,
        backgroundColor: statsTrendFill,
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 900,
        easing: "easeOutQuart"
      },
      plugins: {
        legend: { display: false },
        tooltip: { ...statsTooltip, displayColors: false }
      },
      scales: {
        x: {
          ticks: { color: chartTextColor },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { color: chartTextColor },
          grid: { color: chartGridColor }
        }
      }
    }
  });

  createOrUpdateChart("typeChart", {
    type: "doughnut",
    data: {
      labels: ["Books", "Articles", "Papers"],
      datasets: [{
        data: [books, articles, papers],
        backgroundColor: typeColors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 850,
        easing: "easeOutQuart"
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: chartTextColor,
            padding: 18,
            usePointStyle: true,
            pointStyle: "circle"
          }
        },
        tooltip: statsTooltip
      }
    }
  });

  createOrUpdateChart("completionChart", {
    type: "pie",
    data: {
      labels: ["Completed", "Pending"],
      datasets: [{
        data: [completed, pending],
        backgroundColor: completionColors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 850,
        easing: "easeOutQuart"
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: chartTextColor,
            padding: 18,
            usePointStyle: true,
            pointStyle: "circle"
          }
        },
        tooltip: statsTooltip
      }
    }
  });
}

function activateTab(tabId) {
  document.querySelectorAll(".app-section").forEach((section) => {
    section.classList.toggle("active-section", section.id === tabId);
  });

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });

  requestAnimationFrame(() => {
    updateCharts();
  });
}

function renderApp() {
  renderEntries();
  renderTagFilters();
  populateSessionEntryOptions();
  updateThemeControls();
  updatePreferenceControls();
  updateStatsRangeControls();
  updateDashboard();
  updateStatistics();
  updateCharts();
}

entryForm.setAttribute("novalidate", "novalidate");
entryForm.addEventListener("submit", handleFormSubmit);
goalForm.addEventListener("submit", handleGoalSubmit);
sessionForm.addEventListener("submit", handleSessionSubmit);
totalPagesInput.addEventListener("input", updateEntryProgressPreview);
pagesReadInput.addEventListener("input", updateEntryProgressPreview);
tagsInput.addEventListener("input", updateTagPreview);
coverImageUrlInput.addEventListener("input", updateCoverPreview);

coverPreviewImage.addEventListener("load", () => {
  coverPreview.classList.add("has-image");
});

coverPreviewImage.addEventListener("error", () => {
  coverPreview.classList.remove("has-image");
  coverPreviewPlaceholder.textContent = "Preview unavailable";
});

cancelEditButton.addEventListener("click", () => resetForm(true));

ratingPicker.addEventListener("click", (event) => {
  const selectedStar = event.target.closest(".rating-star");

  if (!selectedStar) {
    return;
  }

  setRating(Number(selectedStar.dataset.rating));
});

ratingPicker.addEventListener("mouseover", (event) => {
  const previewStar = event.target.closest(".rating-star");

  if (!previewStar) {
    return;
  }

  updateRatingStars(Number(previewStar.dataset.rating));
});

ratingPicker.addEventListener("mouseleave", () => {
  updateRatingStars();
});

deleteGoalButton.addEventListener("click", deleteGoal);
logoutButton.addEventListener("click", logoutUser);
switchAccountButton.addEventListener("click", switchAccount);
addAccountButton.addEventListener("click", addNewAccount);
deleteAccountButton.addEventListener("click", deleteAccount);
changePasswordButton.addEventListener("click", changePassword);

passwordToggleButton.addEventListener("click", () => {
  isPasswordVisible = !isPasswordVisible;
  updatePasswordDisplay();
});

darkModeToggle.addEventListener("change", async () => {
  try {
    savePreferences({
      theme: darkModeToggle.checked ? "dark" : "light"
    });
  } catch (error) {
    showToast(error.message);
    darkModeToggle.checked = document.body.classList.contains("dark-mode");
  }
});

themeSelect.addEventListener("change", async () => {
  try {
    savePreferences({
      theme: themeSelect.value
    });
  } catch (error) {
    showToast(error.message);
  }
});

notificationToggle.addEventListener("change", async () => {
  try {
    savePreferences({
      notificationsEnabled: notificationToggle.checked
    });
    showToast(notificationToggle.checked ? "Notifications preference enabled" : "Notifications preference disabled");
  } catch (error) {
    showToast(error.message);
  }
});

reminderToggle.addEventListener("change", async () => {
  try {
    savePreferences({
      reminder: {
        ...userPreferences.reminder,
        enabled: reminderToggle.checked
      }
    });
    updateReminderSettingsState();
    showToast(reminderToggle.checked ? "Reading reminder enabled" : "Reading reminder disabled");
  } catch (error) {
    showToast(error.message);
  }
});

reminderHourInput.addEventListener("change", async () => {
  saveReminderTime();
  try {
    savePreferences({
      reminder: {
        ...userPreferences.reminder,
        hour: reminderHourInput.value,
        minute: reminderMinuteInput.value,
        period: reminderPeriodSelect.value
      }
    });
    showToast("Reminder time saved");
  } catch (error) {
    showToast(error.message);
  }
});

reminderMinuteInput.addEventListener("change", async () => {
  saveReminderTime();
  try {
    savePreferences({
      reminder: {
        ...userPreferences.reminder,
        hour: reminderHourInput.value,
        minute: reminderMinuteInput.value,
        period: reminderPeriodSelect.value
      }
    });
    showToast("Reminder time saved");
  } catch (error) {
    showToast(error.message);
  }
});

reminderPeriodSelect.addEventListener("change", async () => {
  saveReminderTime();
  try {
    savePreferences({
      reminder: {
        ...userPreferences.reminder,
        hour: reminderHourInput.value,
        minute: reminderMinuteInput.value,
        period: reminderPeriodSelect.value
      }
    });
    showToast("Reminder time saved");
  } catch (error) {
    showToast(error.message);
  }
});

reminderDaysToggle.addEventListener("click", () => {
  if (reminderDaysToggle.disabled) {
    return;
  }

  areReminderDaysExpanded = !areReminderDaysExpanded;
  updateReminderDaysExpandedState();
});

reminderDaysSelector.addEventListener("click", async (event) => {
  const dayButton = event.target.closest("[data-reminder-day]");

  if (!dayButton || dayButton.disabled) {
    return;
  }

  const selectedDay = dayButton.dataset.reminderDay;

  if (selectedReminderDays.includes(selectedDay)) {
    selectedReminderDays = selectedReminderDays.filter((day) => day !== selectedDay);
  } else {
    selectedReminderDays.push(selectedDay);
  }
  
  renderReminderDays();

  try {
    savePreferences({
      reminder: {
        ...userPreferences.reminder,
        days: selectedReminderDays
      }
    });
    showToast("Reminder days saved");
  } catch (error) {
    showToast(error.message);
  }
});

searchInput.addEventListener("input", renderEntries);
filterTypeInput.addEventListener("change", renderEntries);
filterStatusInput.addEventListener("change", renderEntries);
favoriteFilterInput.addEventListener("change", renderEntries);
clearTagFilterButton.addEventListener("click", () => {
  selectedTag = "All";
  renderApp();
});

document.querySelectorAll(".nav-link").forEach((button) => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.tab);
  });
});

document.querySelectorAll(".range-button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedRange = button.dataset.range;
    document.querySelectorAll(".range-button").forEach((item) => {
      item.classList.toggle("active", item.dataset.range === selectedRange);
    });
    updateCharts();
  });
});

document.querySelectorAll(".stats-range-button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedStatsRange = button.dataset.statsRange;
    updateStatsRangeControls();
    updateCharts();
  });
});

document.querySelectorAll("[data-dashboard-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.dashboardTab);
  });
});

document.querySelectorAll("[data-dashboard-focus]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.dashboardFocus);

    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
});

tagFilterContainer.addEventListener("click", (event) => {
  const tagButton = event.target.closest("[data-filter-tag]");

  if (!tagButton) {
    return;
  }

  selectedTag = tagButton.dataset.filterTag;
  renderApp();
});

entriesContainer.addEventListener("click", (event) => {
  const actionButton = event.target.closest("button");

  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  const id = actionButton.dataset.id;
  const tag = actionButton.dataset.tag;

  if (action === "edit") {
    editEntry(id);
  } else if (action === "delete") {
    deleteEntry(id);
  } else if (action === "favorite") {
    toggleFavorite(id);
  } else if (action === "tag" && tag) {
    selectedTag = tag;
    activateTab("reading-log");
    renderApp();
  }
});

updateRatingStars();
updateTagPreview();
updateCoverPreview();
updateEntryProgressPreview();
initializeApp();
