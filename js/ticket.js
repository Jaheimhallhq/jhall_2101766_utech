function showTicket() {
  var registration = loadRegistration();

  if (registration === null) {
    window.location.replace("index.html");
    return;
  }

  document.getElementById("congrats-name").textContent = registration.fullName;
  document.getElementById("congrats-email").textContent = registration.email;
  document.getElementById("ticket-name").textContent = registration.fullName;
  document.getElementById("ticket-serial").textContent = registration.serial;
  document.getElementById("ticket-github-handle").textContent = registration.github;

  document.getElementById("ticket-github").href = "https://github.com/" + registration.github.slice(1);

  var avatar = document.getElementById("ticket-avatar");
  avatar.src = registration.avatar;
  avatar.alt = "Profile photo of " + registration.fullName;

  document.getElementById("ticket-content").hidden = false;
}

function printTicket() {
  window.print();
}

showTicket();
document.getElementById("print-button").addEventListener("click", printTicket);
