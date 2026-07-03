'use strict';

// ---- Constants ----
const COLUMNS = ['todo', 'inProgress', 'done'];
const STORAGE_KEY = 'kanban_state_v1';

// ---- Pure game logic ----

function createInitialState() {
  return { todo: [], inProgress: [], done: [] };
}

function generateId() {
  return `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// state, column 안에서 cardId가 가리키는 카드와 그 index를 찾는다 (없으면 index -1)
function findCardIndex(state, column, cardId) {
  return state[column].findIndex((card) => card.id === cardId);
}

function addCard(state, column, title, id = generateId()) {
  const trimmed = title.trim();
  if (trimmed === '') return state;

  return {
    ...state,
    [column]: [...state[column], { id, title: trimmed }],
  };
}

function editCard(state, column, cardId, newTitle) {
  const trimmed = newTitle.trim();
  if (trimmed === '') return state;

  const index = findCardIndex(state, column, cardId);
  if (index === -1) return state;

  const updatedColumn = state[column].map((card, i) =>
    i === index ? { ...card, title: trimmed } : card
  );

  return { ...state, [column]: updatedColumn };
}

function deleteCard(state, column, cardId) {
  const index = findCardIndex(state, column, cardId);
  if (index === -1) return state;

  return {
    ...state,
    [column]: state[column].filter((card) => card.id !== cardId),
  };
}

function moveCard(state, cardId, fromColumn, toColumn, toIndex) {
  const fromIndex = findCardIndex(state, fromColumn, cardId);
  if (fromIndex === -1) return state;

  const card = state[fromColumn][fromIndex];
  const fromColumnAfterRemoval = state[fromColumn].filter((c) => c.id !== cardId);

  // 같은 컬럼으로 이동하는 경우, 카드가 제거된 이후의 배열을 기준으로 삽입한다.
  const destinationBase =
    fromColumn === toColumn ? fromColumnAfterRemoval : state[toColumn];
  const clampedIndex = Math.max(0, Math.min(toIndex, destinationBase.length));
  const destinationAfterInsert = [
    ...destinationBase.slice(0, clampedIndex),
    card,
    ...destinationBase.slice(clampedIndex),
  ];

  if (fromColumn === toColumn) {
    return { ...state, [toColumn]: destinationAfterInsert };
  }

  return {
    ...state,
    [fromColumn]: fromColumnAfterRemoval,
    [toColumn]: destinationAfterInsert,
  };
}

function serializeState(state) {
  return JSON.stringify(state);
}

function deserializeState(json) {
  try {
    const parsed = JSON.parse(json);
    const isValid =
      parsed &&
      typeof parsed === 'object' &&
      COLUMNS.every((column) => Array.isArray(parsed[column]));
    return isValid ? parsed : createInitialState();
  } catch {
    return createInitialState();
  }
}

// CommonJS export guard: Node.js/Jest uses this; browsers ignore it
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COLUMNS, STORAGE_KEY,
    createInitialState, generateId,
    addCard, editCard, deleteCard, moveCard,
    serializeState, deserializeState,
  };
}
