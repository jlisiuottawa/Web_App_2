/* Start of file */
/* Mascot and UI enhancements for EcoBuddy - version 1.4
   Provides: default leaderboard focus on current user, mascot UI, accessories shop,
   daily login streak, tips panel, and dynamic earth + sun/moon background
*/
(function(){
  // CONFIG
  const ACCESSORIES = [
    {id:'hat', name:'Green Hat', price:50, className:'hat'},
    {id:'glasses', name:'Sunglasses', price:75, className:'glasses'},
    {id:'scarf', name:'Scarf', price:60, className:'scarf'}
  ];
  const TIPS = [
    'Turning off unused lights can reduce an energy bill by ~10%.',
    'Unplug chargers when not in use to avoid vampire energy draw.',
    'Wash clothes in cold water to save energy and extend fabric life.',
    'Use a reusable water bottle to reduce plastic waste.'
  ];

  // Utilities for localStorage
  const store = {
    get(key, fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch(e){return fallback}},
    set(key, value){localStorage.setItem(key, JSON.stringify(value))}
  };

  // STREAK: track lastLogin (YYYY-MM-DD) and streak count
  function updateDailyStreak(){
    const today = new Date();
    const todayKey = today.toISOString().slice(0,10);
    const meta = store.get('eco_meta', {lastLogin: null, streak:0, coins:200, accessories:[]});
    if(meta.lastLogin === todayKey){
      // already logged in today
    } else {
      // check if yesterday
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate()-1);
      const yKey = yesterday.toISOString().slice(0,10);
      if(meta.lastLogin === yKey){ meta.streak = (meta.streak || 0)+1; }
      else { meta.streak = 1; }
      meta.lastLogin = todayKey;
      store.set('eco_meta', meta);
    }
    return meta;
  }

  function renderStreak(elem){
    const meta = store.get('eco_meta', {lastLogin:null,streak:0});
    if(!elem) return;
    elem.innerHTML = '';
    const flame = document.createElement('span'); flame.textContent='🔥';
    const txt = document.createElement('span'); txt.textContent = ` ${meta.streak || 0}-Day streak`;
    elem.appendChild(flame);
    elem.appendChild(txt);
  }

  // Tips
  function renderTip(container){
    if(!container) return;
    const idx = new Date().getDate() % TIPS.length;
    container.textContent = TIPS[idx];
  }

  // Accessories shop
  function renderShop(container, mascotWrap){
    if(!container) return;
    container.innerHTML='';
    const meta = store.get('eco_meta', {accessories:[],coins:200});
    ACCESSORIES.forEach(acc =>{
      const btn = document.createElement('button');
      btn.textContent = `${acc.name} — ${acc.price}c`;
      btn.onclick = () =>{
        if(meta.coins >= acc.price){
          if(!meta.accessories.includes(acc.id)){
            meta.accessories.push(acc.id);
            meta.coins -= acc.price;
            store.set('eco_meta', meta);
            applyAccessories(mascotWrap, meta.accessories);
            renderShop(container, mascotWrap);
            renderCoins();
            alert('Purchased '+acc.name);
          } else {
            // toggle on/off
            const idx = meta.accessories.indexOf(acc.id);
            if(idx>=0){ meta.accessories.splice(idx,1); store.set('eco_meta', meta); applyAccessories(mascotWrap, meta.accessories); renderShop(container, mascotWrap); }
          }
        } else { alert('Not enough coins'); }
      };
      // mark owned
      if(meta.accessories && meta.accessories.includes(acc.id)){
        btn.style.opacity = '0.85'; btn.textContent = acc.name + ' — Owned';
      }
      container.appendChild(btn);
    });
  }

  function applyAccessories(mascotWrap, accessories){
    if(!mascotWrap) return;
    // remove existing accessory elements
    mascotWrap.querySelectorAll('.eco-accessory').forEach(n=>n.remove());
    accessories.forEach(id=>{
      const acc = ACCESSORIES.find(a=>a.id===id);
      if(!acc) return;
      const el = document.createElement('img');
      el.className = 'eco-accessory '+acc.className;
      // accessory image is represented as a small colored SVG data URL for portability
      el.src = accessoryDataUrl(acc.id);
      mascotWrap.appendChild(el);
    });
  }

  function accessoryDataUrl(id){
    // simple SVG placeholders; in future replace with real PNG assets
    if(id==='hat'){
      return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><rect rx="20" width="200" height="80" fill="#2e7d32"/></svg>');
    }
    if(id==='glasses'){
      return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><circle cx="50" cy="30" r="20" fill="#263238"/><circle cx="150" cy="30" r="20" fill="#263238"/><rect x="70" y="25" width="60" height="10" fill="#263238"/></svg>');
    }
    if(id==='scarf'){
      return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="260" height="80"><rect rx="12" x="10" y="20" width="240" height="40" fill="#e53935"/></svg>');
    }
    return '';
  }

  function renderCoins(){
    const meta = store.get('eco_meta',{coins:0});
    const el = document.querySelector('#eco-coins'); if(el) el.textContent = meta.coins||0;
  }

  // Leaderboard: move current user to top if present
  function promoteCurrentUserInLeaderboard(currentUser){
    if(!currentUser) return;
    // common patterns
    const selectors = ['#leaderboard','.leaderboard','#lb','.leaderboard-list','table.leaderboard'];
    for(const sel of selectors){
      const root = document.querySelector(sel);
      if(!root) continue;
      // if table, try to find row with username cell
      const rows = root.querySelectorAll('li, tr, div');
      for(const r of rows){
        if(r.textContent && r.textContent.trim().toLowerCase().includes(currentUser.toLowerCase())){
          // clone and put on top
          const clone = r.cloneNode(true);
          clone.classList.add('leaderboard-current');
          // insert at top
          if(root.firstChild) root.insertBefore(clone, root.firstChild);
          // optionally scroll into view
          clone.scrollIntoView({behavior:'smooth',block:'center'});
          return;
        }
      }
    }
  }

  // Background orbit: place sun or moon based on local time and animate orbit
  function initOrbit(){
    let sky = document.querySelector('.eco-sky');
    if(!sky){
      sky = document.createElement('div'); sky.className='eco-sky';
      const earth = document.createElement('div'); earth.className='eco-earth';
      const orbit = document.createElement('div'); orbit.className='orbit';
      const center = document.createElement('div'); center.className='orbit-center';
      const sun = document.createElement('div'); sun.className='orbit-body orbit-sun body';
      const moon = document.createElement('div'); moon.className='orbit-body orbit-moon body';
      // position with transform rotate
      orbit.appendChild(center);
      center.appendChild(sun);
      center.appendChild(moon);
      sky.appendChild(orbit);
      sky.appendChild(earth);
      document.body.appendChild(sky);
    }
    // update position by setting rotation based on time
    function tick(){
      const now = new Date();
      const hours = now.getHours() + now.getMinutes()/60;
      // sun angle around orbit: midday at top (angle -90), map 0-24 to 0-360
      const sunAngle = ((hours/24)*360) - 90;
      const moonAngle = sunAngle + 180; // opposite
      const center = document.querySelector('.orbit-center');
      if(center){
        const sunEl = center.querySelector('.orbit-sun');
        const moonEl = center.querySelector('.orbit-moon');
        if(sunEl) sunEl.style.transform = `rotate(${sunAngle}deg) translateY(-180px)`;
        if(moonEl) moonEl.style.transform = `rotate(${moonAngle}deg) translateY(-180px)`;
      }
      // switch visible based on time (sun visible day 6-18)
      const sunEl = document.querySelector('.orbit-sun');
      const moonEl = document.querySelector('.orbit-moon');
      if(hours>=6 && hours<18){ if(sunEl) sunEl.style.opacity=1; if(moonEl) moonEl.style.opacity=0.15; }
      else { if(sunEl) sunEl.style.opacity=0.15; if(moonEl) moonEl.style.opacity=1; }
    }
    tick();
    setInterval(tick, 30*1000);
  }

  // Integration: create mascot panel if not present
  function mountMascotUI(){
    // left or center area
    const container = document.createElement('div'); container.className='eco-mascot-wrap';
    const streakDiv = document.createElement('div'); streakDiv.className='eco-streak'; streakDiv.id='eco-streak';
    const mascotDiv = document.createElement('div'); mascotDiv.className='eco-mascot'; mascotDiv.id='eco-mascot';
    const img = document.createElement('img'); img.className='eco-img'; img.alt='EcoBuddy';
    img.src = '/assets/ecobuddy.png';
    mascotDiv.appendChild(img);
    mascotDiv.appendChild(streakDiv);
    const coins = document.createElement('div'); coins.textContent='Coins: '; const coinsVal = document.createElement('span'); coinsVal.id='eco-coins'; coinsVal.textContent='0'; coins.appendChild(coinsVal);
    container.appendChild(streakDiv);
    container.appendChild(mascotDiv);
    container.appendChild(coins);
    // shop
    const shopWrap = document.createElement('div'); shopWrap.className='eco-shop'; shopWrap.id='eco-shop';
    container.appendChild(shopWrap);
    // tip
    const tip = document.createElement('div'); tip.className='eco-tip'; tip.id='eco-tip';
    container.appendChild(tip);
    // place in a common home area
    const homeArea = document.querySelector('#home, .home, #main, main') || document.body;
    homeArea.insertBefore(container, homeArea.firstChild);

    // apply existing meta
    const meta = updateDailyStreak();
    renderStreak(document.getElementById('eco-streak'));
    renderTip(document.getElementById('eco-tip'));
    renderCoins();
    renderShop(document.getElementById('eco-shop'), mascotDiv);
    applyAccessories(mascotDiv, meta.accessories||[]);

    // promote current user in leaderboard (try to detect username from DOM)
    let currentUser = null;
    const userElem = document.querySelector('.user, #user, .profile-name, #username');
    if(userElem) currentUser = userElem.textContent.trim();
    if(!currentUser){
      // fallback to login email element
      const loginName = document.querySelector('[data-username]'); if(loginName) currentUser = loginName.getAttribute('data-username');
    }
    if(currentUser) promoteCurrentUserInLeaderboard(currentUser);

    // init orbit
    initOrbit();
  }

  // initialize when DOM ready
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', mountMascotUI);
  else mountMascotUI();

  // expose small API for testing
  window.ecoBuddy = {
    buyAccessory(id){ const meta = store.get('eco_meta',{}); if(!meta.accessories) meta.accessories=[]; if(!meta.accessories.includes(id)){ const acc=ACCESSORIES.find(a=>a.id===id); if(acc && (meta.coins||0)>=acc.price){ meta.coins-=acc.price; meta.accessories.push(id); store.set('eco_meta', meta); location.reload(); } } },
    getMeta:()=>store.get('eco_meta',{})
  };
})();
/* End of file */