// js - robust: cancels previous timer so repeated toasts behave
let _toastTimer = null;

function showToast(header, message, duration = 3000) {
  const overlay = document.getElementById('toastOverlay');
  const toast = document.getElementById('toast');
  if (!toast || !overlay) return;

  const h = toast.querySelector('#header');
  const m = toast.querySelector('#message');

  h.textContent = header;
  m.textContent = message;

  // show overlay and toast
  overlay.classList.add('active');
  toast.classList.add('active');
  toast.setAttribute('aria-hidden', 'false');

  // restart animation if already showing
  if (_toastTimer) {
    clearTimeout(_toastTimer);
    _toastTimer = null;
    // force reflow to reliably restart the transition (optional but helpful)
    void toast.offsetWidth;
  }

  toast.classList.add('show');

  // schedule fade-out
  _toastTimer = setTimeout(() => {
    toast.classList.remove('show');

    // after transition ends, hide overlay and mark aria-hidden true
    const onEnd = (e) => {
      if (e.propertyName === 'opacity') {
        toast.classList.remove('active');
        overlay.classList.remove('active');
        toast.setAttribute('aria-hidden', 'true');
        toast.removeEventListener('transitionend', onEnd);
      }
    };
    toast.addEventListener('transitionend', onEnd);

    _toastTimer = null;
  }, duration);
}

function hideToast() {
  const overlay = document.getElementById('toastOverlay');
  const toast = document.getElementById('toast');
  if (!toast || !overlay) return;

  if (_toastTimer) {
    clearTimeout(_toastTimer);
    _toastTimer = null;
  }

  toast.classList.remove('show');
  toast.classList.remove('active');
  overlay.classList.remove('active');
  toast.setAttribute('aria-hidden', 'true');
}