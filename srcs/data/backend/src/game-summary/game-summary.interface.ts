export interface GameSummaryInterface {
  gameID: number,
  winnerUsername: string,
  loserUsername: string,
  winnerScore: number,
  loserScore: number,
  mode: "Normal" | "Shrink",
}
