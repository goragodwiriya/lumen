/**
 * Simple modal dialog with action buttons.
 */
import { $ } from '../lib/dom.js';

export function showModal(title, body, actions = []) {
  const backdrop = $('#modalBackdrop');
  const content = $('#modalContent');
  content.innerHTML = `<h3>${title}</h3><p>${body}</p>`;
  const btnRow = document.createElement('div');
  btnRow.className = 'btn-row';
  btnRow.style.marginTop = '14px';
  actions.forEach(a => {
    const b = document.createElement('button');
    b.className = `btn ${a.style || ''}`;
    b.textContent = a.label;
    b.onclick = () => { if (a.onClick) a.onClick(); if (!a.keepOpen) closeModal(); };
    btnRow.appendChild(b);
  });
  content.appendChild(btnRow);
  backdrop.classList.add('active');
}

export function closeModal() {
  $('#modalBackdrop').classList.remove('active');
}

export function initModal() {
  $('#modalBackdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}
