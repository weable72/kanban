'use strict';

// ── State ────────────────────────────────────────────────────────────────────
let draggingCard = null;   // 현재 드래그 중인 카드 요소
let targetColumn = null;   // 드롭 대상 컬럼
let addTargetColumn = null; // 카드 추가 대상 컬럼

// ── DOM refs ─────────────────────────────────────────────────────────────────
const modal        = document.getElementById('modal');
const cardInput    = document.getElementById('card-input');
const modalAdd     = document.getElementById('modal-add');
const modalCancel  = document.getElementById('modal-cancel');

// ── Helpers ──────────────────────────────────────────────────────────────────
function updateCount(columnEl) {
  const list  = columnEl.querySelector('.card-list');
  const count = list.querySelectorAll('.card').length;
  columnEl.querySelector('.card-count').textContent = count;
}

function updateAllCounts() {
  document.querySelectorAll('.column').forEach(updateCount);
}

function createCard(text) {
  const card = document.createElement('div');
  card.className = 'card';
  card.draggable = true;
  card.innerHTML = `<p>${escapeHtml(text)}</p>`;
  attachCardEvents(card);
  return card;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Drag & Drop ──────────────────────────────────────────────────────────────
function attachCardEvents(card) {
  card.addEventListener('dragstart', onDragStart);
  card.addEventListener('dragend',   onDragEnd);
}

function onDragStart(e) {
  draggingCard = e.currentTarget;
  // 약간의 지연 후 스타일 적용 (렌더링 안정성)
  requestAnimationFrame(() => draggingCard.classList.add('dragging'));
  e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd() {
  if (draggingCard) draggingCard.classList.remove('dragging');
  draggingCard = null;
  removeAllHighlights();
  removeDropIndicator();
}

function removeAllHighlights() {
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function removeDropIndicator() {
  document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
}

// 카드 목록에 드래그 이벤트
document.querySelectorAll('.card-list').forEach(list => {
  list.addEventListener('dragover', onListDragOver);
  list.addEventListener('dragleave', onListDragLeave);
  list.addEventListener('drop', onListDrop);
});

function onListDragOver(e) {
  if (!draggingCard) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const list = e.currentTarget;
  list.classList.add('drag-over');
  list.closest('.column').classList.add('drag-over');

  // 드롭 위치 표시
  const afterCard = getCardAfterPoint(list, e.clientY);
  removeDropIndicator();
  const indicator = document.createElement('div');
  indicator.className = 'drop-indicator';
  if (afterCard) {
    list.insertBefore(indicator, afterCard);
  } else {
    list.appendChild(indicator);
  }
}

function onListDragLeave(e) {
  const list = e.currentTarget;
  // 자식 요소로의 이동은 무시
  if (list.contains(e.relatedTarget)) return;
  list.classList.remove('drag-over');
  list.closest('.column').classList.remove('drag-over');
  removeDropIndicator();
}

function onListDrop(e) {
  if (!draggingCard) return;
  e.preventDefault();

  const list = e.currentTarget;
  const afterCard = getCardAfterPoint(list, e.clientY);

  removeDropIndicator();
  if (afterCard) {
    list.insertBefore(draggingCard, afterCard);
  } else {
    list.appendChild(draggingCard);
  }

  removeAllHighlights();
  updateAllCounts();
}

// 마우스 Y 좌표 기준으로 삽입 위치 계산
function getCardAfterPoint(list, y) {
  const cards = [...list.querySelectorAll('.card:not(.dragging)')];
  return cards.find(card => {
    const rect = card.getBoundingClientRect();
    return y < rect.top + rect.height / 2;
  }) || null;
}

// ── Add Card (Modal) ─────────────────────────────────────────────────────────
document.querySelectorAll('.add-card-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    addTargetColumn = btn.getAttribute('data-column');
    openModal();
  });
});

function openModal() {
  cardInput.value = '';
  modal.classList.add('open');
  cardInput.focus();
}

function closeModal() {
  modal.classList.remove('open');
  addTargetColumn = null;
}

modalCancel.addEventListener('click', closeModal);

modal.addEventListener('click', e => {
  if (e.target === modal) closeModal();
});

cardInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitCard();
});

modalAdd.addEventListener('click', submitCard);

function submitCard() {
  const text = cardInput.value.trim();
  if (!text) return;

  const list = document.querySelector(`.card-list[data-column="${addTargetColumn}"]`);
  const card = createCard(text);
  list.appendChild(card);
  updateAllCounts();
  closeModal();
}

// ── Init ─────────────────────────────────────────────────────────────────────
function initBoard() {
  document.querySelectorAll('.card').forEach(attachCardEvents);
  updateAllCounts();
}
