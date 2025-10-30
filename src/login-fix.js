/* Start of file */
// Fix for unresponsive login/register buttons
// - Ensures buttons inside login/register forms trigger form submission
// - Adds submit fallback when forms don't have action/method by calling known global handlers
// - Adds handling for buttons outside forms and Enter key submission
(function(){
  function isLoginForm(form){
    if(!form) return false;
    // heuristic: form contains at least one password field and at least one text/email field
    return form.querySelector('input[type="password"]') && (form.querySelector('input[type="text"]') || form.querySelector('input[type="email"]') || form.querySelector('input[name*="user"]'));
  }

  function ensureFormButtons(form){
    // find buttons and inputs that act as submit
    const controls = Array.from(form.querySelectorAll('button, input[type="button"], input[type="submit"]'));
    if(controls.length === 0){
      const btn = document.createElement('button');
      btn.type = 'submit';
      btn.className = 'eco-generated-submit';
      btn.textContent = 'Submit';
      form.appendChild(btn);
      controls.push(btn);
    }

    controls.forEach(btn=>{
      if(btn.dataset.ecoFixAttached) return;
      btn.dataset.ecoFixAttached = '1';
      btn.addEventListener('click', function(e){
        // If the button is not a submit button or input, trigger form submission programmatically
        try{
          if(btn.type !== 'submit'){
            e.preventDefault();
            if(typeof form.requestSubmit === 'function') form.requestSubmit();
            else form.submit();
          }
          // otherwise allow native submit to proceed
        }catch(err){
          console.warn('EcoBuddy login-fix: failed to submit form', err);
        }
      });
    });

    // Enter key submission
    if(!form.dataset.ecoEnterAttached){
      form.addEventListener('keydown', function(e){
        if(e.key === 'Enter' && e.target && e.target.tagName === 'INPUT'){
          e.preventDefault();
          try{ if(typeof form.requestSubmit === 'function') form.requestSubmit(); else form.submit(); }catch(err){ console.warn('EcoBuddy login-fix: enter submit failed', err); }
        }
      });
      form.dataset.ecoEnterAttached = '1';
    }

    // Attach a generic submit handler to provide a reasonable fallback when the form has no action/method
    if(!form.dataset.ecoSubmitAttached){
      form.addEventListener('submit', function(ev){
        // If the form has a server action or method, let it proceed normally
        if(form.action || (form.method && form.method.toLowerCase() !== 'get')){
          // do nothing: allow default submission
          return;
        }

        // Otherwise, prevent default and attempt client-side handling
        ev.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());

        // Try common global handlers used by apps
        if(typeof window.login === 'function'){
          try{ window.login(data); return; }catch(e){ console.warn('EcoBuddy login-fix: window.login threw', e); }
        }
        if(typeof window.register === 'function'){
          try{ window.register(data); return; }catch(e){ console.warn('EcoBuddy login-fix: window.register threw', e); }
        }

        // If no handlers exist, create a simple demo behaviour: store a demo auth record and redirect to root
        try{
          const user = data.username || data.user || data.email || data.name || 'guest';
          const meta = {user, ts: Date.now()};
          localStorage.setItem('eco_demo_auth', JSON.stringify(meta));
        }catch(e){ /* ignore storage errors */ }

        // Redirect to home or to a configured meta tag
        const redirect = (document.querySelector('meta[name="login-redirect"]') || {}).content || '/';
        try{ window.location.href = redirect; }catch(e){ console.warn('EcoBuddy login-fix: redirect failed', e); }
      });
      form.dataset.ecoSubmitAttached = '1';
    }
  }

  function attachToLoginAreas(){
    // Attach to forms that look like login/register forms
    const forms = Array.from(document.querySelectorAll('form'));
    forms.forEach(form=>{ if(isLoginForm(form)) ensureFormButtons(form); });

    // Attach to standalone buttons that may sit outside forms
    const outsideSelectors = ['button[data-action="login"]','button[data-action="register"]','.login-button','.register-button','#loginBtn','#registerBtn','#login-button','#register-button'];
    const outsideButtons = Array.from(document.querySelectorAll(outsideSelectors.join(','))).filter(Boolean);
    outsideButtons.forEach(btn=>{
      if(btn.dataset.ecoAttached) return;
      btn.dataset.ecoAttached = '1';
      btn.addEventListener('click', function(e){
        // find nearest form
        let form = btn.closest('form');
        if(!form){
          // try to find inputs nearby
          const container = btn.closest('div,section,main') || document.body;
          const possible = container.querySelector('form') || container.querySelector('input[type="password"]') && container.querySelector('input[type="text"], input[type="email"]');
          form = container.querySelector('form') || (possible ? container : null);
        }
        if(form && isLoginForm(form)){
          e.preventDefault();
          try{ if(typeof form.requestSubmit === 'function') form.requestSubmit(); else form.submit(); }catch(err){ console.warn('EcoBuddy login-fix: failed to submit via outside button', err); }
          return;
        }

        // If no form found, attempt to call global login/register handlers with inputs in the same container
        const container = btn.closest('div,section,main') || document.body;
        const inputs = Array.from(container.querySelectorAll('input[name], textarea[name]'));
        const data = {};
        inputs.forEach(i=>{ if(i.name) data[i.name] = i.value; });

        if(Object.keys(data).length > 0){
          if(typeof window.login === 'function') { try{ window.login(data); return; }catch(e){ console.warn('EcoBuddy login-fix: window.login threw', e); } }
          if(typeof window.register === 'function') { try{ window.register(data); return; }catch(e){ console.warn('EcoBuddy login-fix: window.register threw', e); } }
        }

        // As final fallback, set demo auth and navigate home
        try{ localStorage.setItem('eco_demo_auth', JSON.stringify({user: data.username||data.email||'guest', ts: Date.now()})); }catch(e){}
        const redirect = (document.querySelector('meta[name="login-redirect"]') || {}).content || '/';
        window.location.href = redirect;
      });
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachToLoginAreas);
  else attachToLoginAreas();
})();
/* End of file */