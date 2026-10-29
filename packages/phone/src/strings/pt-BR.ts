import { MAX_PLAYERS, NICKNAME_MAX, NICKNAME_MIN } from '@bwords/core';

/**
 * Every text the phone shows, in pt-BR (UI-01 AC 5, AD-001). The protocol only
 * carries codes; `model/messages.ts` maps them to keys of this table. Texts with
 * values are functions of those values. Gender-neutral forms follow AD-013.
 */
export const STRINGS = {
  // App shell (UI-01 AC 6)
  brand: 'BWords',
  roomLabel: 'SALA',
  preferences: 'Preferências',

  // Entry (ENTRY-01)
  enterRoom: 'Entrar numa sala',
  enterRoomHint: 'Digite o código de 4 letras exibido na TV',
  codeLetter: (position: number) => `Letra ${position} do código`,
  continue: 'CONTINUAR',
  roomNotFound: 'Sala não encontrada',
  roomTag: (code: string) => `SALA ${code}`,

  // Nickname and color (JOIN-01)
  nicknameLabel: 'Seu Apelido',
  nicknameCounter: (length: number) => `${length}/${NICKNAME_MAX}`,
  chooseColor: 'Escolha sua cor no jogo',
  colorOption: (position: number) => `Cor ${position}`,
  youLabel: 'Você',
  customColor: 'Personalizada',
  tvPreview: 'Como você aparecerá na TV',
  matchRules: 'Regras Desta Partida',
  join: 'ENTRAR',
  // "Aguardando <anfitrião> iniciar a partida…", with the host's name highlighted between the two parts (phone-join.png).
  waitingBeforeHost: 'Aguardando',
  waitingAfterHost: 'iniciar a partida…',
  nicknameLength: `O apelido precisa ter de ${NICKNAME_MIN} a ${NICKNAME_MAX} caracteres`,
  nicknameTaken: 'Esse apelido já está em uso',
  colorTooSimilar: (nickname: string) => `Muito parecida com a cor de ${nickname}`,
  colorIllegible: 'Essa cor fica difícil de ver na TV',
  badColor: 'Essa cor não é válida',
  roomFull: `Essa sala está cheia (${MAX_PLAYERS} jogadores)`,
  badToken: 'Sua vaga nesta sala expirou. Entre de novo.',

  // Lobby (LOBBY-01, AD-013)
  playersTitle: 'Jogadores',
  winsLabel: (wins: number) => (wins === 1 ? '1 vitória' : `${wins} vitórias`),
  crown: 'Mais vitórias',
  youTag: 'VOCÊ',
  hostTag: 'ANFITRIÃO(Ã)',
  disconnectedTag: 'DESCONECTADO',
  spectatorTag: 'ESPECTADOR(A)',
  boardChip: (size: number) => `Tabuleiro ${size}x${size}`,
  timeChip: (clock: string) => `${clock} min`,
  roundsChip: (rounds: number) => (rounds === 1 ? '1 Rodada' : `${rounds} Rodadas`),
  minLengthChip: (minLength: number) => `Mín. ${minLength} letras`,
  playersInRoom: (count: number) => `${count} na sala`,
  waitingForHostToStart: (host: string) => `Aguardando ${host} iniciar a partida`,

  // Host lobby (HOST-01)
  youAreHost: 'VOCÊ É O(A) ANFITRIÃO(Ã)',
  hostMatchRules: 'Regras da Partida',
  boardLabel: 'TABULEIRO',
  boardSizeOption: (size: number) => `${size}×${size}`,
  decrease: (setting: string) => `Diminuir ${setting}`,
  increase: (setting: string) => `Aumentar ${setting}`,
  fastModeHint: 'Resultados rápidos, sem revelar palavra por palavra',
  muteTv: 'Silenciar a TV',
  roundTime: 'Tempo da Rodada',
  rounds: 'Rodadas',
  minLetters: 'MÍN. LETRAS',
  minLettersOption: (minLength: number) => `${minLength}`,
  filterProfanity: 'Filtrar palavrões',
  fastMode: 'Fast mode',
  tvVolume: 'Volume da TV',
  dictionary: 'Dicionário',
  dictionaryPtBr: 'Português (BR)',
  playerActions: (nickname: string) => `Ações de ${nickname}`,
  winsInSession: (wins: number) => (wins === 1 ? '1 vitória na sessão' : `${wins} vitórias na sessão`),
  makeHost: 'Tornar anfitrião',
  removeFromRoom: 'Remover da sala',
  cancel: 'Cancelar',
  confirmKick: (nickname: string) => `Remover ${nickname}? Ele perde os pontos.`,
  confirmKickAction: 'Remover',
  startMatch: 'INICIAR PARTIDA',
  closeRoom: 'Encerrar sala',
  confirmCloseRoom: 'Encerrar a sala? Todos os jogadores saem.',
  hostMenu: 'Menu do(a) anfitrião(ã)',
  notHost: 'Só o(a) anfitrião(ã) pode fazer isso',
  badSettings: 'Essa configuração não é válida',
  badTarget: 'Esse jogador não está mais na sala',

  // Countdown (COUNT-01)
  roundOfUpper: (round: number, total: number) => `RODADA ${round} DE ${total}`,
  getReady: 'Prepare o dedo!',
  lettersSoon: 'As letras aparecem em instantes…',

  // Board (PLAY-01)
  validWord: (points: number) => `VÁLIDA (+${points} PTS)`,
  alreadyFound: 'JÁ ENCONTRADA',
  invalidWord: 'INVÁLIDA',
  tooShort: 'MUITO CURTA',
  foundWords: 'PALAVRAS ENCONTRADAS',
  roundShort: (round: number, total: number) => `Rodada ${round}/${total}`,
  roundTally: (words: number, points: number) => `${words} pal · ${points} pts`,
  foundTotal: (count: number) => `${count} no total`,
  plusPoints: (points: number) => `+${points}`,
  board: 'Tabuleiro',
  timeUp: 'Tempo!',
  wrongPhase: 'Essa ação não vale nesta fase',

  // Host during the round (HOSTPLAY-01)
  backToLobby: 'Voltar ao lobby',
  confirmCancelRound: 'Cancelar a rodada? O placar será zerado.',

  // Spectator (SPEC-01)
  joinsNextRound: 'Você entra na próxima rodada.',
  watching: 'Assistindo',
  playersInRoomTitle: 'JOGADORES NA SALA',
  playerCount: (count: number) => (count === 1 ? '1 jogador' : `${count} jogadores`),

  // Round result (RES-01)
  // "Rodada N de M • RESULTADO", with "RESULTADO" highlighted after the round (phone-round-result.jpg).
  resultRound: (round: number, total: number) => `Rodada ${round} de ${total} •`,
  resultTag: 'RESULTADO',
  lookAtTv: 'OLHE PARA A TV',
  lookAtTvHint: 'Acompanhe no telão a revelação das palavras',
  roundPerformance: 'DESEMPENHO DA RODADA',
  addedThisRound: 'somados nesta rodada!',
  accumulatedScore: 'PLACAR ACUMULADO',
  points: (points: number) => (points === 1 ? '1 pt' : `${points} pts`),
  gainedPoints: (points: number) => (points === 1 ? '+1 pt' : `+${points} pts`),
  placeBadge: (position: number) => `${position}º lugar`,
  ordinal: (position: number) => `${position}º`,
  yourPlace: (position: number) => `Você está em ${position}º lugar`,
  myFoundWords: (count: number) => `MINHAS PALAVRAS ENCONTRADAS (${count})`,
  uniqueBonus: (points: number) => `ÚNICA ×2 (+${points} pts)`,
  basePoints: (points: number) => `base +${points}`,
  shared: 'em comum',
  quickScoreboard: 'PLACAR RÁPIDO DA MESA',
  spectatorShort: 'Esp.',
  nextRound: (round: number, total: number) => `PRÓXIMA RODADA (${round} DE ${total})`,
  seePodium: 'VER PÓDIO',
  backToLobbyTitle: 'Voltar ao Lobby',
  confirmCancelMatch: 'Cancelar a partida? O placar será zerado.',
  waitingForHostToAdvance: (host: string) => `Aguardando ${host} avançar…`,
  playsNextRound: 'Você joga na próxima rodada!',

  // Podium (POD-01)
  yourFinalPlace: (position: number) => `Você ficou em ${position}º Lugar!`,
  totalScore: 'PONTUAÇÃO TOTAL',
  inSession: 'NA SESSÃO',
  yourPerformance: 'SEU RENDIMENTO',
  wordsFound: 'Palavras encontradas',
  letterCount: (letters: number) => `${letters} letras`,
  gainedPointsUpper: (points: number) => `+${points} PTS`,
  pointsUnit: 'PTS',
  winner: 'Vencedor(a)',
  longestWord: 'MAIOR PALAVRA ENCONTRADA',
  tableRanking: 'CLASSIFICAÇÃO DA MESA',
  spectatorLong: 'Espectador(a)',
  playAgain: 'JOGAR DE NOVO',
  closeRoomUpper: 'ENCERRAR SALA',
  waitingForHostToDecide: (host: string) => `Aguardando ${host} decidir…`,
  playsNextMatch: 'Você joga na próxima partida',

  // Leaving the room (EXIT-01)
  kicked: 'Você foi removido da sala',
  enterAnotherRoom: 'ENTRAR EM OUTRA SALA',
  hostClosedRoom: (host: string) => `${host} encerrou a sala`,
  thanksForPlaying: 'Obrigado por jogar!',
  roomClosed: 'A sala foi encerrada',
  replaced: 'Você abriu o jogo em outra aba ou aparelho',
  badMessage: 'Algo deu errado. Tente de novo.',

  // Reconnection (RECON-01)
  reconnecting: 'Reconectando…',
  connected: 'Conectado',
  offline: 'Sem conexão',
  tryAgain: 'Tentar de novo',

  // Preferences (PREF-01)
  vibrate: 'Vibrar',
  hitSound: 'Som ao acertar',
  close: 'Fechar',
} as const;

/** A key of the pt-BR table. */
export type StringKey = keyof typeof STRINGS;
