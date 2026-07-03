'use strict';

// 로그인한 사용자의 카드 CRUD를 Supabase `cards` 테이블에 위임하는 계층.
// 실제 네트워크(Supabase) 호출이라 Jest 유닛테스트 범위 밖 (TRD.md 6절) — 수동 통합 테스트로 검증한다.

// { todo: [{id,title}], inProgress: [...], done: [...] } 형태로 변환 (column_key 그룹핑, position 오름차순)
function rowsToState(rows) {
  const state = createInitialState();
  COLUMNS.forEach((column) => {
    state[column] = rows
      .filter((row) => row.column_key === column)
      .sort((a, b) => a.position - b.position)
      .map((row) => ({ id: row.id, title: row.title }));
  });
  return state;
}

async function fetchBoardState(userId) {
  const { data, error } = await supabaseClient
    .from('cards')
    .select('id, column_key, title, position')
    .eq('user_id', userId);
  if (error) throw error;
  return rowsToState(data);
}

async function nextPosition(userId, column) {
  const { data, error } = await supabaseClient
    .from('cards')
    .select('position')
    .eq('user_id', userId)
    .eq('column_key', column)
    .order('position', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data.length > 0 ? data[0].position + 1 : 0;
}

async function addCardRemote(userId, column, title) {
  const position = await nextPosition(userId, column);
  const { data, error } = await supabaseClient
    .from('cards')
    .insert({ user_id: userId, column_key: column, title, position })
    .select('id, title')
    .single();
  if (error) throw error;
  return data;
}

async function editCardRemote(cardId, title) {
  const { error } = await supabaseClient
    .from('cards')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', cardId);
  if (error) throw error;
}

async function deleteCardRemote(cardId) {
  const { error } = await supabaseClient.from('cards').delete().eq('id', cardId);
  if (error) throw error;
}

// 컬럼 하나의 카드 배열을 받아, 배열 순서(index)를 position 값으로 그대로 반영한다.
async function reorderColumnRemote(column, cards) {
  await Promise.all(
    cards.map(async (card, index) => {
      const { error } = await supabaseClient
        .from('cards')
        .update({ column_key: column, position: index })
        .eq('id', card.id);
      if (error) throw error;
    })
  );
}

// nextState는 board.js의 moveCard가 이미 계산한 이동 후 상태 — 영향받는 컬럼(들)의 position만 재기록한다.
async function moveCardRemote(nextState, fromColumn, toColumn) {
  const affectedColumns = fromColumn === toColumn ? [toColumn] : [fromColumn, toColumn];
  await Promise.all(
    affectedColumns.map((column) => reorderColumnRemote(column, nextState[column]))
  );
}
