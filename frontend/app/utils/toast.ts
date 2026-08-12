type ToastType = 'success' | 'error' | 'warning' | 'info';

const ICONS: Record<ToastType, string> = {
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', bar: '#22c55e' },
  error:   { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', bar: '#ef4444' },
  warning: { bg: '#fffbeb', border: '#fde68a', icon: '#d97706', bar: '#f59e0b' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', bar: '#3b82f6' },
};

function getContainer(): HTMLElement {
  const id = '__toast_container__';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    Object.assign(el.style, {
      position:      'fixed',
      top:           '20px',
      right:         '20px',
      zIndex:        '999999',
      display:       'flex',
      flexDirection: 'column',
      gap:           '10px',
      pointerEvents: 'none',
    });
    document.body.appendChild(el);
  }
  return el;
}

export function toast(message: string, type: ToastType = 'info', duration = 3500) {
  const c = COLORS[type];
  const container = getContainer();

  const el = document.createElement('div');
  Object.assign(el.style, {
    pointerEvents:  'auto',
    display:        'flex',
    alignItems:     'flex-start',
    gap:            '10px',
    minWidth:       '280px',
    maxWidth:       '360px',
    padding:        '13px 16px 16px',
    borderRadius:   '12px',
    border:         `1.5px solid ${c.border}`,
    background:     c.bg,
    boxShadow:      '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
    transform:      'translateX(calc(100% + 28px))',
    opacity:        '0',
    transition:     'transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease',
    position:       'relative',
    overflow:       'hidden',
    cursor:         'pointer',
  });

  el.innerHTML = `
    <div style="color:${c.icon};flex-shrink:0;margin-top:1px">${ICONS[type]}</div>
    <span style="font-size:13.5px;font-weight:500;color:#1e293b;line-height:1.5;flex:1">${message}</span>
    <div style="color:#94a3b8;flex-shrink:0;cursor:pointer;margin-top:1px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </div>
    <div style="position:absolute;bottom:0;left:0;height:3px;background:${c.bar};border-radius:0 0 0 12px;animation:toast-bar ${duration}ms linear forwards">
    </div>
  `;

  // inject keyframes once
  if (!document.getElementById('__toast_style__')) {
    const s = document.createElement('style');
    s.id = '__toast_style__';
    s.textContent = `@keyframes toast-bar { from { width: 100%; } to { width: 0%; } }`;
    document.head.appendChild(s);
  }

  const dismiss = () => {
    el.style.transform = 'translateX(calc(100% + 28px))';
    el.style.opacity = '0';
    el.style.transition = 'transform 0.25s ease, opacity 0.2s ease';
    setTimeout(() => el.remove(), 260);
  };

  el.addEventListener('click', dismiss);
  container.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transform = 'translateX(0)';
      el.style.opacity = '1';
    });
  });

  setTimeout(dismiss, duration);
}

export const toastSuccess = (msg: string, ms?: number) => toast(msg, 'success', ms);
export const toastError   = (msg: string, ms?: number) => toast(msg, 'error',   ms);
export const toastWarning = (msg: string, ms?: number) => toast(msg, 'warning', ms);
export const toastInfo    = (msg: string, ms?: number) => toast(msg, 'info',    ms);
