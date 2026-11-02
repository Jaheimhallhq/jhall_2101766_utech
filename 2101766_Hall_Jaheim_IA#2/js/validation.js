var STORAGE_KEY = "codingConf.registration";
var ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png"];
var MAX_AVATAR_BYTES = 500 * 1024;
var AVATAR_DATA_URL_PREFIXES = ["data:image/jpeg;base64,", "data:image/png;base64,"];
var EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
var GITHUB_PATTERN = /^@[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
var SERIAL_PATTERN = /^#\d{5}$/;

function startsWithAny(text, prefixes) {
  for (var i = 0; i < prefixes.length; i++) {
    if (text.startsWith(prefixes[i])) {
      return true;
    }
  }
  return false;
}

function isValidRegistration(record) {
  if (!record) {
    return false;
  }
  return (
    typeof record.fullName === "string" &&
    record.fullName.trim() !== "" &&
    EMAIL_PATTERN.test(record.email) &&
    GITHUB_PATTERN.test(record.github) &&
    typeof record.avatar === "string" &&
    startsWithAny(record.avatar, AVATAR_DATA_URL_PREFIXES) &&
    SERIAL_PATTERN.test(record.serial)
  );
}

function saveRegistration(record) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch (error) {
    return false;
  }
}

function loadRegistration() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    var record = JSON.parse(raw);
    if (isValidRegistration(record)) {
      return record;
    }
    return null;
  } catch (error) {
    return null;
  }
}

function generateSerial() {
  return "#" + String(Math.floor(Math.random() * 100000)).padStart(5, "0");
}

var form = document.getElementById("registration-form");
var submitButton = document.getElementById("submit-button");
var statusMessage = document.getElementById("form-status");
var avatarPreview = document.getElementById("avatar-preview");
var previewUrl = null;

function validateFullName(input) {
  var value = input.value.trim();
  if (value === "") {
    throw new Error("Enter your full name. It cannot be empty or only spaces.");
  }
  if (input.maxLength > 0 && value.length > input.maxLength) {
    throw new Error("Your name must be " + input.maxLength + " characters or fewer.");
  }
}

function validateEmail(input) {
  var value = input.value.trim();
  if (value === "") {
    throw new Error("Enter your email address.");
  }
  if (!EMAIL_PATTERN.test(value)) {
    throw new Error("Enter a valid email address in the format user@domain.com.");
  }
}

function validateGithub(input) {
  var value = input.value.trim();
  if (value === "") {
    throw new Error("Enter your GitHub username, starting with @.");
  }
  if (!value.startsWith("@")) {
    throw new Error("Your GitHub username must start with @, for example @octocat.");
  }
  if (!GITHUB_PATTERN.test(value)) {
    throw new Error("After the @ use 1 to 39 letters, numbers or single hyphens. A hyphen cannot start or end the name.");
  }
}

function validateAvatar(input) {
  var file = input.files[0];
  if (!file) {
    throw new Error("Upload a profile picture.");
  }
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    throw new Error("The picture must be a JPEG or PNG image.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("That file is " + Math.ceil(file.size / 1024) + " KB. The picture must be under " + MAX_AVATAR_BYTES / 1024 + " KB.");
  }
}

function createField(id, validate) {
  return {
    input: document.getElementById(id),
    error: document.getElementById(id + "-error"),
    validate: validate
  };
}

var fields = [
  createField("fullname", validateFullName),
  createField("email", validateEmail),
  createField("github", validateGithub),
  createField("avatar", validateAvatar)
];

function checkField(field) {
  var message = "";
  try {
    field.validate(field.input);
  } catch (error) {
    message = error.message;
  }
  field.error.textContent = message;
  field.input.setAttribute("aria-invalid", message === "" ? "false" : "true");
  return message === "";
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function updateAvatarPreview(input) {
  if (previewUrl !== null) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  var file = input.files[0];
  if (file && ALLOWED_AVATAR_TYPES.includes(file.type)) {
    previewUrl = URL.createObjectURL(file);
    avatarPreview.src = previewUrl;
    avatarPreview.hidden = false;
  } else {
    avatarPreview.removeAttribute("src");
    avatarPreview.hidden = true;
  }
}

function showSaveError() {
  setStatus("We could not save your registration. Make sure your browser allows site storage, then try again.");
  submitButton.disabled = false;
}

function submitRegistration() {
  submitButton.disabled = true;
  var reader = new FileReader();

  reader.onload = function () {
    try {
      var saved = saveRegistration({
        fullName: fields[0].input.value.trim().replace(/\s+/g, " "),
        email: fields[1].input.value.trim(),
        github: fields[2].input.value.trim(),
        avatar: reader.result,
        serial: generateSerial()
      });
      if (!saved) {
        throw new Error("Storage unavailable");
      }
      window.location.assign("ticket.html");
    } catch (error) {
      showSaveError();
    }
  };

  reader.onerror = showSaveError;
  reader.readAsDataURL(fields[3].input.files[0]);
}

function handleSubmit(event) {
  event.preventDefault();
  setStatus("");

  var invalidFields = fields.filter(function (field) {
    return !checkField(field);
  });

  if (invalidFields.length > 0) {
    setStatus("Please correct the highlighted fields and try again.");
    invalidFields[0].input.focus();
    return;
  }
  submitRegistration();
}

if (form !== null) {
  form.addEventListener("submit", handleSubmit);

  fields.forEach(function (field) {
    field.input.addEventListener("change", function () {
      checkField(field);
    });
    field.input.addEventListener("input", function () {
      if (field.input.getAttribute("aria-invalid") === "true") {
        checkField(field);
      }
    });
  });

  fields[3].input.addEventListener("change", function (event) {
    updateAvatarPreview(event.target);
  });
}
