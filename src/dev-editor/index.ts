import './editor.css';

const API = 'http://127.0.0.1:3001';
const STORAGE_KEY = '__dev_editor_mode';

type EditableEl = HTMLElement & {dataset: {mdStart: string; mdEnd: string}};

let editMode = false;
let toggleBtn: HTMLButtonElement | null = null;
let activeOverlay: HTMLElement | null = null;
let articleListenerAttached = false;

if (typeof window !== 'undefined') {
  editMode = window.localStorage.getItem(STORAGE_KEY) === '1';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}

function boot() {
  ensureToggle();
  applyMode();
  // Single delegated capture listener on document — survives route changes.
  if (!articleListenerAttached) {
    document.addEventListener('click', onDocumentClick, true);
    articleListenerAttached = true;
  }
}

function ensureToggle() {
  if (toggleBtn) return;
  toggleBtn = document.createElement('button');
  toggleBtn.id = '__dev_editor_toggle';
  toggleBtn.type = 'button';
  toggleBtn.addEventListener('click', () => setMode(!editMode));
  document.body.appendChild(toggleBtn);
  renderToggle();
}

function renderToggle() {
  if (!toggleBtn) return;
  toggleBtn.textContent = editMode ? '✏ Edit: ON' : '✏ Edit: OFF';
  toggleBtn.dataset.on = editMode ? '1' : '0';
}

function setMode(on: boolean) {
  editMode = on;
  window.localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  renderToggle();
  applyMode();
}

function applyMode() {
  document.body.classList.toggle('__dev_editor_active', editMode);
  if (!editMode) closeOverlay();
}

function onDocumentClick(e: MouseEvent) {
  if (!editMode) return;
  const target = e.target as HTMLElement | null;
  if (!target) return;

  // Don't hijack clicks on buttons or links inside the article (copy buttons, anchor links, etc.).
  if (target.closest('button, a, [role="button"]')) return;

  // Must be inside the doc article.
  const article = target.closest('article');
  if (!article) return;

  // Find the innermost block with source-line info.
  const block = target.closest<HTMLElement>('[data-md-start]');
  if (!block) return;

  // Don't open a new overlay if we're already inside one.
  if (target.closest('.__dev_editor_inline')) return;

  e.preventDefault();
  e.stopPropagation();
  openInlineEditor(block as EditableEl);
}

function getCurrentSource(): string | null {
  const src = window.__devEditor?.currentSource;
  if (!src) return null;
  return src.replace(/^@site[\\/]/, '');
}

async function openInlineEditor(el: EditableEl) {
  closeOverlay();
  const sourcePath = getCurrentSource();
  if (!sourcePath) {
    flashError('Could not determine source file for this page.');
    return;
  }
  const startLine = parseInt(el.dataset.mdStart, 10);
  const endLine = parseInt(el.dataset.mdEnd, 10);

  let raw = '';
  try {
    const res = await fetch(`${API}/api/source?path=${encodeURIComponent(sourcePath)}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    raw = data.content as string;
  } catch (err) {
    flashError(`Failed to load source: ${(err as Error).message}`);
    return;
  }
  const lines = raw.split('\n');
  const blockSource = lines.slice(startLine - 1, endLine).join('\n');

  const rect = el.getBoundingClientRect();
  const overlay = document.createElement('div');
  overlay.className = '__dev_editor_inline';
  overlay.style.top = `${window.scrollY + rect.top - 4}px`;
  overlay.style.left = `${rect.left - 4}px`;
  overlay.style.width = `${Math.max(rect.width + 8, 320)}px`;

  const ta = document.createElement('textarea');
  ta.value = blockSource;
  ta.rows = Math.max(3, blockSource.split('\n').length + 1);
  overlay.appendChild(ta);

  const bar = document.createElement('div');
  bar.className = '__dev_editor_bar';
  const info = document.createElement('span');
  info.className = '__dev_editor_info';
  info.textContent = `${sourcePath}:${startLine}-${endLine}`;
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = '__dev_editor_save';
  saveBtn.textContent = 'Save (Ctrl+Enter)';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = '__dev_editor_cancel';
  cancelBtn.textContent = 'Cancel (Esc)';
  bar.append(info, saveBtn, cancelBtn);
  overlay.appendChild(bar);

  document.body.appendChild(overlay);
  activeOverlay = overlay;
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);

  const save = async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    try {
      const res = await fetch(`${API}/api/source/range`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          path: sourcePath,
          startLine,
          endLine,
          replacement: ta.value,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      // HMR will refresh; close overlay.
      closeOverlay();
    } catch (err) {
      flashError(`Save failed: ${(err as Error).message}`);
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save (Ctrl+Enter)';
    }
  };

  saveBtn.addEventListener('click', save);
  cancelBtn.addEventListener('click', closeOverlay);
  ta.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      closeOverlay();
    } else if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
      ev.preventDefault();
      save();
    }
  });
}

function closeOverlay() {
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
  }
}

function flashError(msg: string) {
  const el = document.createElement('div');
  el.className = '__dev_editor_toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
