import { describe, expect, test } from 'vitest';
import { resultHeader } from './result-header.ts';
import type { StandingRow } from './standings.ts';

function row(nickname: string, place: number): StandingRow {
  return { id: nickname, nickname, color: '#FF7A00', score: 10, place, disconnected: false, crowned: place === 1 };
}

const ROUNDS = 3;

describe('resultHeader', () => {
  test('shows the round between rounds', () => {
    const header = resultHeader({ index: 0, last: false }, { top: [row('Ana', 1)] }, 'Ana', ROUNDS);

    expect(header).toEqual({ prefix: 'Resultado', title: 'Rodada 1 de 3', footer: 'Aguardando Ana avançar…', confetti: false });
  });

  test('shows the winner after the last round', () => {
    const header = resultHeader({ index: 2, last: true }, { top: [row('Beto', 1), row('Ana', 2)] }, 'Ana', ROUNDS);

    expect(header).toEqual({
      prefix: null,
      title: 'Beto venceu!',
      footer: 'Aguardando Ana: jogar de novo ou voltar ao lobby',
      confetti: true,
    });
  });

  test('shows a tie after the last round', () => {
    const header = resultHeader({ index: 2, last: true }, { top: [row('Ana', 1), row('Beto', 1), row('Caio', 3)] }, 'Ana', ROUNDS);

    expect(header.title).toBe('Empate!');
    expect(header.confetti).toBe(true);
  });

  test('has no footer when the room has no host', () => {
    expect(resultHeader({ index: 0, last: false }, { top: [] }, null, ROUNDS).footer).toBeNull();
    expect(resultHeader({ index: 2, last: true }, { top: [] }, null, ROUNDS).footer).toBeNull();
  });
});
