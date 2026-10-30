/** Where the TV is after the end of a round; only the TV knows this, the server does not (design: RevealStage). */
export type RevealStage = 'time-up' | 'words' | 'hold' | 'result';
