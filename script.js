function bootstrapDOM(){
  const style=document.createElement("style");
  style.textContent=`.approval-grid{display:grid;gap:12px;margin-top:16px}.approval-person{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px;border:1px solid var(--line);border-radius:14px}.approval-person strong{font-size:1.05rem}#trip-stop{margin-top:16px;background:#fff0f0;color:#8b1e1e}[hidden]{display:none!important}@media(max-width:620px){.approval-person{align-items:flex-start;flex-direction:column}}`;
  document.head.appendChild(style);

  const first=document.querySelector('.tree-node[data-step="1"]');
  first.innerHTML=`<span class="step-number">1</span><div><h3>Do Ken, Tania, and Michael all approve?</h3><p>The trip only continues with three yes votes. Any no vote means no trip.</p><div class="approval-grid"><div class="approval-person"><strong>Ken</strong><div class="choice-row"><button class="choice core-choice" data-person="ken" data-answer="yes">Yes</button><button class="choice core-choice" data-person="ken" data-answer="no">No</button></div></div><div class="approval-person"><strong>Tania</strong><div class="choice-row"><button class="choice core-choice" data-person="tania" data-answer="yes">Yes</button><button class="choice core-choice" data-person="tania" data-answer="no">No</button></div></div><div class="approval-person"><strong>Michael</strong><div class="choice-row"><button class="choice core-choice" data-person="michael" data-answer="yes">Yes</button><button class="choice core-choice" data-person="michael" data-answer="no">No</button></div></div></div><div id="trip-stop" class="conditional-box" hidden>Trip is off unless Ken, Tania, and Michael all approve.</div></div>`;

  const step2=document.querySelector('.tree-node[data-step="2"]');
  step2.querySelector('p').textContent="If Stephanie goes, she travels as Tania’s caregiver. If she cannot go, Ken provides care and one flight, Disney ticket, and Universal/HHN ticket are removed.";

  const stat=document.querySelector('.trip-stats div:last-child strong'); stat.id="hero-total";
  const cards=[...document.querySelectorAll('.cost-card')];
  cards[0].querySelector('strong').id="flight-cost"; cards[0].querySelector('small').id="flight-note";
  cards[2].querySelector('strong').id="park-cost"; cards[2].querySelector('small').id="park-note";
  document.querySelector('.budget-total strong').id="budget-total-value";
  document.querySelector('.budget-section .section-heading p:last-child').textContent="Cost automatically adjusts based on whether Stephanie can attend.";
  document.getElementById('summary-content').innerHTML='<p>Start with separate approvals from Ken, Tania, and Michael.</p>';
}
bootstrapDOM();

const state = JSON.parse(localStorage.getItem("orlandoTripState") || "{}");
state.core = state.core || {};
const summary = document.getElementById("summary-content");
const familyChecks = [...document.querySelectorAll(".family-check")];
const money = n => n.toLocaleString("en-US", {style:"currency", currency:"USD"});

function save(){ localStorage.setItem("orlandoTripState", JSON.stringify(state)); }
function node(step){ return document.querySelector(`.tree-node[data-step="${step}"]`); }
function unlock(step){ node(step)?.classList.remove("locked"); }
function lock(step){ node(step)?.classList.add("locked"); }
function complete(step,on=true){ node(step)?.classList.toggle("complete",on); }

function coreStatus(){
  const vals=[state.core.ken,state.core.tania,state.core.michael];
  if(vals.includes("no")) return "no";
  if(vals.every(v=>v==="yes")) return "yes";
  return "pending";
}

function updateBudget(){
  const stephGoing = state.stephanie !== "no";
  const travelers = stephGoing ? 4 : 3;
  const flight = stephGoing ? 457 : 0;
  const disney = 141 * travelers;
  const universal = 175.2 * travelers;
  const park = disney + universal;
  const total = flight + 900 + park + 400;
  document.getElementById("flight-cost").textContent = money(flight);
  document.getElementById("flight-note").textContent = stephGoing
    ? "KTM covered with 105K miles; Stephanie paid in cash"
    : "KTM covered with 105K miles; no cash ticket needed";
  document.getElementById("park-cost").textContent = money(park);
  document.getElementById("park-note").textContent = `Disney $141 × ${travelers} + Universal/HHN $175.20 × ${travelers}`;
  document.getElementById("budget-total-value").textContent = money(total);
  document.getElementById("hero-total").textContent = money(total);
}

function updateSeatCount(){
  const steph = state.stephanie === "yes" ? 1 : 0;
  const extraFamily = state.stephanie === "yes" ? (state.family||[]).filter(n=>n!=="No family members").length : 0;
  const used=Math.min(6,3+steph+extraFamily), open=Math.max(0,6-used);
  document.getElementById("used-seats").textContent=used;
  document.getElementById("open-seats").textContent=open;
  document.getElementById("seat-bar").style.width=`${used/6*100}%`;
  document.getElementById("friend-recruiting").textContent=open
    ? `Michael can recruit ${open} friend${open===1?"":"s"} for the remaining spot${open===1?"":"s"}.`
    : "All six Halloween Horror Nights spots are assigned.";
}

function applyFlow(){
  const status=coreStatus();
  const stop=document.getElementById("trip-stop");
  stop.hidden=status!=="no";
  complete(1,status!=="pending");
  if(status==="yes") unlock(2); else { lock(2); lock(3); lock(4); lock(5); }
  if(status==="no") { state.stephanie=undefined; state.family=[]; }
  if(status==="yes" && state.stephanie){
    complete(2,true);
    if(state.stephanie==="yes") unlock(3); else { lock(3); unlock(4); unlock(5); }
  }
  if(state.family?.length && state.stephanie==="yes") { complete(3,true); unlock(4); unlock(5); }
  updateBudget(); updateSeatCount(); renderSummary(); save();
}

function renderSummary(){
  const lines=[];
  const status=coreStatus();
  for(const name of ["ken","tania","michael"]){
    const v=state.core[name];
    lines.push(`${name[0].toUpperCase()+name.slice(1)}: ${v==="yes"?"✓ Yes":v==="no"?"✕ No":"Waiting"}`);
  }
  if(status==="no") lines.push("Trip is off because unanimous KTM approval is required.");
  if(status==="yes"){
    lines.push("✓ Ken, Tania, and Michael all approve.");
    if(!state.stephanie) lines.push("Next: confirm Stephanie’s availability.");
    else if(state.stephanie==="yes") lines.push("Stephanie is attending as caregiver; baseline budget is $3,021.80.");
    else lines.push("Stephanie cannot attend; Ken will caregive and baseline budget is $2,248.60.");
  }
  if(state.family?.length && state.stephanie==="yes"){
    lines.push(`Stephanie's family: ${state.family.includes("No family members")?"none":state.family.join(", ")}.`);
  }
  if(state.dogNotes) lines.push("✓ Dog-sitter notes saved.");
  summary.innerHTML=lines.map(x=>`<p>${x}</p>`).join("");
}

document.querySelectorAll(".core-choice").forEach(btn=>btn.addEventListener("click",()=>{
  const person=btn.dataset.person;
  document.querySelectorAll(`.core-choice[data-person="${person}"]`).forEach(b=>b.classList.remove("selected"));
  btn.classList.add("selected"); state.core[person]=btn.dataset.answer; applyFlow();
}));

document.querySelectorAll('.choice[data-step="2"]').forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll('.choice[data-step="2"]').forEach(b=>b.classList.remove("selected"));
  btn.classList.add("selected"); state.stephanie=btn.dataset.answer;
  if(state.stephanie==="no") state.family=[];
  applyFlow();
}));

familyChecks.forEach(box=>box.addEventListener("change",()=>{
  if(box.classList.contains("exclusive")&&box.checked) familyChecks.filter(b=>b!==box).forEach(b=>b.checked=false);
  else if(box.checked) document.querySelector(".family-check.exclusive").checked=false;
}));

document.getElementById("confirm-family").addEventListener("click",()=>{
  state.family=familyChecks.filter(b=>b.checked).map(b=>b.value);
  if(!state.family.length) state.family=["No family members"];
  applyFlow();
});

document.getElementById("save-notes").addEventListener("click",()=>{
  state.dogNotes=document.getElementById("dog-sitter-notes").value.trim(); complete(5,true); applyFlow();
});

document.getElementById("reset-tree").addEventListener("click",()=>{localStorage.removeItem("orlandoTripState");location.reload();});

for(const [person,val] of Object.entries(state.core)) document.querySelector(`.core-choice[data-person="${person}"][data-answer="${val}"]`)?.classList.add("selected");
if(state.stephanie) document.querySelector(`.choice[data-step="2"][data-answer="${state.stephanie}"]`)?.classList.add("selected");
(state.family||[]).forEach(name=>{const b=familyChecks.find(x=>x.value===name);if(b)b.checked=true;});
if(state.dogNotes) document.getElementById("dog-sitter-notes").value=state.dogNotes;
applyFlow();
