const state = JSON.parse(localStorage.getItem("orlandoTripState") || "{}");

const summary = document.getElementById("summary-content");
const familyChecks = [...document.querySelectorAll(".family-check")];

function save() {
  localStorage.setItem("orlandoTripState", JSON.stringify(state));
}

function unlock(step) {
  const node = document.querySelector(`[data-step="${step}"].tree-node`);
  if (node) node.classList.remove("locked");
}

function complete(step) {
  const node = document.querySelector(`[data-step="${step}"].tree-node`);
  if (node) node.classList.add("complete");
}

function updateSeatCount() {
  const baseTravelers = 4;
  const extraFamily = (state.family || []).filter(name => name !== "No family members").length;
  const used = Math.min(6, baseTravelers + extraFamily);
  const open = Math.max(0, 6 - used);

  document.getElementById("used-seats").textContent = used;
  document.getElementById("open-seats").textContent = open;
  document.getElementById("seat-bar").style.width = `${(used / 6) * 100}%`;

  const recruiting = document.getElementById("friend-recruiting");
  recruiting.textContent = open > 0
    ? `Michael can recruit ${open} friend${open === 1 ? "" : "s"} for the remaining spot${open === 1 ? "" : "s"}.`
    : "All six Halloween Horror Nights spots are assigned.";
}

function renderSummary() {
  const lines = [];

  if (!state.ktm) {
    lines.push("Start by confirming whether the trip works for KTM.");
  } else if (state.ktm === "no") {
    lines.push("The plan needs revision before asking Stephanie.");
  } else {
    lines.push("✓ KTM approves the plan.");
    if (!state.stephanie) {
      lines.push("Next: ask Stephanie whether she can make it.");
    } else if (state.stephanie === "no") {
      lines.push("Stephanie cannot attend. Caregiver coverage and the traveler list need to be reconsidered.");
    } else {
      lines.push("✓ Stephanie can attend.");
      if (state.family?.length) {
        const names = state.family.includes("No family members")
          ? "No additional family members"
          : state.family.join(", ");
        lines.push(`Stephanie's group: ${names}.`);
      } else {
        lines.push("Next: confirm whether Kyle, Emily, or Madison will attend.");
      }
    }
  }

  if (state.dogNotes) {
    lines.push("✓ Dog-sitter notes have been saved.");
  }

  summary.innerHTML = lines.map(line => `<p>${line}</p>`).join("");
}

document.querySelectorAll(".choice").forEach(button => {
  button.addEventListener("click", () => {
    const step = Number(button.dataset.step);
    const answer = button.dataset.answer;

    document.querySelectorAll(`.choice[data-step="${step}"]`).forEach(b => b.classList.remove("selected"));
    button.classList.add("selected");

    if (step === 1) {
      state.ktm = answer;
      complete(1);
      if (answer === "yes") unlock(2);
    }

    if (step === 2) {
      state.stephanie = answer;
      complete(2);
      if (answer === "yes") unlock(3);
    }

    save();
    renderSummary();
  });
});

familyChecks.forEach(box => {
  box.addEventListener("change", () => {
    if (box.classList.contains("exclusive") && box.checked) {
      familyChecks.filter(b => b !== box).forEach(b => b.checked = false);
    } else if (box.checked) {
      document.querySelector(".family-check.exclusive").checked = false;
    }
  });
});

document.getElementById("confirm-family").addEventListener("click", () => {
  state.family = familyChecks.filter(box => box.checked).map(box => box.value);
  if (!state.family.length) state.family = ["No family members"];
  complete(3);
  unlock(4);
  unlock(5);
  updateSeatCount();
  save();
  renderSummary();
});

document.getElementById("save-notes").addEventListener("click", () => {
  state.dogNotes = document.getElementById("dog-sitter-notes").value.trim();
  complete(5);
  save();
  renderSummary();
});

document.getElementById("reset-tree").addEventListener("click", () => {
  localStorage.removeItem("orlandoTripState");
  location.reload();
});

function restore() {
  if (state.ktm) {
    document.querySelector(`.choice[data-step="1"][data-answer="${state.ktm}"]`)?.classList.add("selected");
    complete(1);
    if (state.ktm === "yes") unlock(2);
  }

  if (state.stephanie) {
    document.querySelector(`.choice[data-step="2"][data-answer="${state.stephanie}"]`)?.classList.add("selected");
    complete(2);
    if (state.stephanie === "yes") unlock(3);
  }

  if (state.family?.length) {
    state.family.forEach(name => {
      const box = familyChecks.find(b => b.value === name);
      if (box) box.checked = true;
    });
    complete(3);
    unlock(4);
    unlock(5);
  }

  if (state.dogNotes) {
    document.getElementById("dog-sitter-notes").value = state.dogNotes;
    complete(5);
  }

  updateSeatCount();
  renderSummary();
}

restore();
