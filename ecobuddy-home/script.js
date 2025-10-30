// Persisted keys
const KEY_CHALLENGES_PREFIX = 'eco_challenges_'; // add date suffix YYYY-MM-DD
const KEY_STREAK = 'eco_streak';
const KEY_LAST_COMPLETE = 'eco_last_complete';
const KEY_MOOD = 'eco_mood';

document.addEventListener('DOMContentLoaded', () => {
  initChallenges();
  initStreak();
  initMood();
  initAccessories();
  initNav();
});

function todayKey(){
  const d = new Date();
  return d.toISOString().slice(0,10); // YYYY-MM-DD
}

/* ---------- Challenges & Streak logic ---------- */
function initChallenges(){
  const k = KEY_CHALLENGES_PREFIX + todayKey();
  const saved = JSON.parse(localStorage.getItem(k) || '{}');
  const ch1 = document.getElementById('challenge-1');
  const ch2 = document.getElementById('challenge-2');

  ch1.checked = !!saved['c1'];
  ch2.checked = !!saved['c2'];

  ch1.addEventListener('change', onChallengeChanged);
  ch2.addEventListener('change', onChallengeChanged);

  // If the saved day is not today, ensure previous days are not read (we use date-keyed)
  updateStreakDisplay();
}

function saveChallenges(){
  const k = KEY_CHALLENGES_PREFIX + todayKey();
  const data = {
    c1: document.getElementById('challenge-1').checked,
    c2: document.getElementById('challenge-2').checked
  };
  localStorage.setItem(k, JSON.stringify(data));
}

function onChallengeChanged(){
  saveChallenges();
  maybeUpdateStreakIfCompleted();
}

function allChallengesCompletedToday(){
  const ch1 = document.getElementById('challenge-1').checked;
  const ch2 = document.getElementById('challenge-2').checked;
  return ch1 && ch2;
}

/* Streak rules:
   - When all challenges for today are completed for the first time, update streak:
     - If yesterday was complete -> streak +=1
     - Else -> streak = 1
   - Streak value persisted in KEY_STREAK, last completed day in KEY_LAST_COMPLETE
*/
function maybeUpdateStreakIfCompleted(){
  if(!allChallengesCompletedToday()) return;
  const last = localStorage.getItem(KEY_LAST_COMPLETE); // YYYY-MM-DD or null
  const streak = parseInt(localStorage.getItem(KEY_STREAK)||'0',10);

  const today = todayKey();
  if(last === today) {
    // already applied for today
    updateStreakDisplay();
    return;
  }

  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate()-1);
    return d.toISOString().slice(0,10);
  })();

  let newStreak = 1;
  if(last === yesterday){
    newStreak = streak + 1;
  } else {
    newStreak = 1;
  }
  localStorage.setItem(KEY_STREAK, String(newStreak));
  localStorage.setItem(KEY_LAST_COMPLETE, today);
  updateStreakDisplay();
}

function updateStreakDisplay(){
  const streak = parseInt(localStorage.getItem(KEY_STREAK)||'0',10);
  const el = document.getElementById('streakText');
  el.textContent = `${streak}-day streak`;

  // Add small visual cue for 4+ day streak
  const fire = document.querySelector('.streak .fire');
  if(streak >= 4){
    fire.style.transform = 'scale(1.2)';
    fire.style.filter = 'drop-shadow(0 4px 6px rgba(255,120,0,0.35))';
  } else {
    fire.style.transform = '';
    fire.style.filter = '';
  }
}

/* ---------- Mood ---------- */
function initMood(){
  const saved = localStorage.getItem(KEY_MOOD) || 'neutral';
  setMoodUI(saved);
  document.querySelectorAll('.mood-btn').forEach(b=>{
    b.addEventListener('click', (e)=>{
      const mood = e.currentTarget.dataset.mood;
      localStorage.setItem(KEY_MOOD, mood);
      setMoodUI(mood);
    });
  });
}

function setMoodUI(mood){
  // Position arrow to point at chosen mood
  const arrow = document.getElementById('moodArrow');
  const map = { 'happy': -28, 'neutral': 0, 'sad': 28 };
  const angleOrX = map[mood] || 0;
  arrow.style.transform = `translateX(${angleOrX}px)`;
  // highlight selected
  document.querySelectorAll('.mood-btn').forEach(b=>{
    b.classList.toggle('selected', b.dataset.mood === mood);
    b.style.boxShadow = b.dataset.mood === mood ? '0 4px 10px rgba(47,138,47,0.18)' : 'none';
  });
}

/* ---------- Accessories Modal ---------- */
function initAccessories(){
  const btn = document.getElementById('accessoriesBtn');
  const modal = document.getElementById('accessoriesModal');
  const close = document.getElementById('closeAccessories');

  btn.addEventListener('click', ()=> modal.classList.remove('hidden'));
  close.addEventListener('click', ()=> modal.classList.add('hidden'));
  modal.addEventListener('click', (e)=>{
    if(e.target === modal) modal.classList.add('hidden');
  });
}

/* ---------- Navigation handlers (placeholders) ---------- */
function initNav(){
  document.getElementById('navHome').addEventListener('click', ()=> alert('Already on Home'));
  document.getElementById('navAdd').addEventListener('click', ()=> alert('Open Add Task (TODO)'));
  document.getElementById('navFriends').addEventListener('click', ()=> alert('Open My Friends (TODO)'));
  document.getElementById('navStats').addEventListener('click', ()=> alert('Open Stats (TODO)'));
  document.getElementById('navSettings').addEventListener('click', ()=> alert('Open Settings (TODO)'));
}
