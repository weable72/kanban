'use strict';

// ---- App state ----

let state = createInitialState();
let currentUser = null;
let authMode = 'login';

// ---- DOM refs (auth screen) ----

const authScreenEl = document.getElementById('auth-screen');
const boardScreenEl = document.getElementById('board-screen');
const authFormEl = document.getElementById('auth-form');
const authEmailEl = document.getElementById('auth-email');
const authPasswordEl = document.getElementById('auth-password');
const authErrorEl = document.getElementById('auth-error');
const authSubmitEl = authFormEl.querySelector('.auth-submit');
const authTabEls = document.querySelectorAll('.auth-tab');
const userEmailEl = document.getElementById('user-email');
const logoutBtnEl = document.getElementById('logout-btn');

// ---- Screen transitions ----

function setAuthMode(mode) {
  authMode = mode;
  authTabEls.forEach((tab) => tab.classList.toggle('active', tab.dataset.mode === mode));
  authSubmitEl.textContent = mode === 'login' ? '로그인' : '회원가입';
  authErrorEl.textContent = '';
}

function showAuthScreen() {
  authFormEl.reset();
  authErrorEl.textContent = '';
  authScreenEl.classList.remove('hidden');
  boardScreenEl.classList.add('hidden');
}

function showBoardScreen(user) {
  userEmailEl.textContent = user.email;
  authScreenEl.classList.add('hidden');
  boardScreenEl.classList.remove('hidden');
}

// ---- Rendering ----

function createCardElement(column, card) {
  const li = document.createElement('li');
  li.className = 'card';
  li.draggable = true;
  li.dataset.id = card.id;

  const title = document.createElement('span');
  title.className = 'card-title';
  title.textContent = card.title;

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'btn btn-edit';
  editBtn.textContent = '수정';
  editBtn.setAttribute('aria-label', '카드 수정');

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-delete';
  deleteBtn.textContent = '삭제';
  deleteBtn.setAttribute('aria-label', '카드 삭제');

  actions.append(editBtn, deleteBtn);
  li.append(title, actions);
  return li;
}

function render(state) {
  COLUMNS.forEach((column) => {
    const listEl = document.querySelector(`.card-list[data-column="${column}"]`);
    listEl.innerHTML = '';
    state[column].forEach((card) => {
      listEl.appendChild(createCardElement(column, card));
    });

    const countEl = document.querySelector(`.card-count[data-count="${column}"]`);
    countEl.textContent = String(state[column].length);
  });
}

async function loadBoard() {
  try {
    state = await fetchBoardState(currentUser.id);
  } catch (err) {
    window.alert('카드를 불러오지 못했습니다: ' + err.message);
    state = createInitialState();
  }
  render(state);
}

// ---- Auth events ----

async function handleAuthSubmit(e) {
  e.preventDefault();
  authErrorEl.textContent = '';

  const email = authEmailEl.value.trim();
  const password = authPasswordEl.value;

  try {
    const { error } =
      authMode === 'login'
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);
    if (error) throw error;
  } catch (err) {
    authErrorEl.textContent = err.message;
  }
}

function handleOAuthClick(e) {
  const provider = e.currentTarget.dataset.provider;
  signInWithOAuth(provider);
}

async function handleLogout() {
  await signOut();
}

function handleAuthStateChange(session) {
  if (session) {
    currentUser = session.user;
    showBoardScreen(currentUser);
    loadBoard();
  } else {
    currentUser = null;
    state = createInitialState();
    showAuthScreen();
  }
}

// ---- Add card ----

async function handleAddCardSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const column = form.dataset.column;
  const input = form.querySelector('.add-card-input');
  const title = input.value.trim();
  if (title === '') return;

  try {
    const created = await addCardRemote(currentUser.id, column, title);
    state = addCard(state, column, created.title, created.id);
    render(state);
    input.value = '';
    input.focus();
  } catch (err) {
    window.alert('카드를 추가하지 못했습니다: ' + err.message);
  }
}

// ---- Edit / delete (event delegation per column) ----

async function handleCardListClick(e) {
  const cardEl = e.target.closest('.card');
  if (!cardEl) return;

  const listEl = e.currentTarget;
  const column = listEl.dataset.column;
  const cardId = cardEl.dataset.id;

  if (e.target.closest('.btn-edit')) {
    const currentTitle = cardEl.querySelector('.card-title').textContent;
    const newTitle = window.prompt('카드 제목 수정', currentTitle);
    if (newTitle === null) return;

    const trimmed = newTitle.trim();
    if (trimmed === '') return;

    try {
      await editCardRemote(cardId, trimmed);
      state = editCard(state, column, cardId, trimmed);
      render(state);
    } catch (err) {
      window.alert('카드를 수정하지 못했습니다: ' + err.message);
    }
    return;
  }

  if (e.target.closest('.btn-delete')) {
    const confirmed = window.confirm('이 카드를 삭제할까요?');
    if (!confirmed) return;

    try {
      await deleteCardRemote(cardId);
      state = deleteCard(state, column, cardId);
      render(state);
    } catch (err) {
      window.alert('카드를 삭제하지 못했습니다: ' + err.message);
    }
  }
}

// ---- Drag and drop ----

function handleDragStart(e) {
  const cardEl = e.target.closest('.card');
  if (!cardEl) return;

  const column = cardEl.closest('.card-list').dataset.column;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify({ id: cardEl.dataset.id, column }));
  cardEl.classList.add('dragging');
}

function handleDragEnd(e) {
  const cardEl = e.target.closest('.card');
  if (cardEl) cardEl.classList.remove('dragging');
}

// 드래그 중인 카드를 제외한 카드 중, 마우스 y좌표 바로 아래에 있는 카드를 찾는다.
// 반환값이 null이면 목록의 맨 끝에 삽입해야 한다는 뜻.
function getDragAfterElement(listEl, clientY) {
  const cards = [...listEl.querySelectorAll('.card:not(.dragging)')];

  return cards.reduce(
    (closest, cardEl) => {
      const box = cardEl.getBoundingClientRect();
      const offset = clientY - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: cardEl };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

async function handleDrop(e) {
  e.preventDefault();
  const listEl = e.currentTarget;
  listEl.classList.remove('drag-over');

  const data = e.dataTransfer.getData('text/plain');
  if (!data) return;

  const { id: cardId, column: fromColumn } = JSON.parse(data);
  const toColumn = listEl.dataset.column;

  const afterElement = getDragAfterElement(listEl, e.clientY);
  const siblingCards = [...listEl.querySelectorAll('.card:not(.dragging)')];
  const toIndex = afterElement ? siblingCards.indexOf(afterElement) : siblingCards.length;

  const nextState = moveCard(state, cardId, fromColumn, toColumn, toIndex);

  try {
    await moveCardRemote(nextState, fromColumn, toColumn);
    state = nextState;
    render(state);
  } catch (err) {
    window.alert('카드를 이동하지 못했습니다: ' + err.message);
    render(state);
  }
}

// ---- Wiring ----

function wireAuthEvents() {
  authTabEls.forEach((tab) => tab.addEventListener('click', () => setAuthMode(tab.dataset.mode)));
  authFormEl.addEventListener('submit', handleAuthSubmit);
  document.querySelectorAll('.btn-oauth').forEach((btn) => btn.addEventListener('click', handleOAuthClick));
  logoutBtnEl.addEventListener('click', handleLogout);
}

function wireColumnEvents() {
  document.querySelectorAll('.add-card-form').forEach((form) => {
    form.addEventListener('submit', handleAddCardSubmit);
  });

  document.querySelectorAll('.card-list').forEach((listEl) => {
    listEl.addEventListener('click', handleCardListClick);
    listEl.addEventListener('dragstart', handleDragStart);
    listEl.addEventListener('dragend', handleDragEnd);
    listEl.addEventListener('dragover', handleDragOver);
    listEl.addEventListener('dragleave', handleDragLeave);
    listEl.addEventListener('drop', handleDrop);
  });
}

// ---- Boot ----

wireAuthEvents();
wireColumnEvents();
onAuthStateChange(handleAuthStateChange);
