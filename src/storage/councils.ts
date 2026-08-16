import { councilsApi } from '@/api/client'
import {
  normalizeRunState,
  normalizeSocialStructure,
  normalizeSynthesiser,
} from '@/types/council'
import type {
  Council,
  CouncilDeliberation,
  Judge,
  Mediator,
  Seat,
  SeatConfig,
  SocialStructure,
  TokenTotals,
  Turn,
  TurnEvent,
  TurnRunState,
} from '@/types/council'

export interface CouncilSummary {
  id: string
  title: string | null
  createdAt: number
  socialStructure: SocialStructure
  modelIds: string[]
  tokenTotal: TokenTotals
  isDemo?: boolean
}

export interface CreateCouncilInput {
  id: string
  socialStructure: SocialStructure
  seats: Seat[]
  judge?: Judge
  mediator?: Mediator
  deliberation?: CouncilDeliberation
  isDemo?: boolean
}

export interface UpdateSeatInput {
  modelId?: string
  config?: SeatConfig
}

function turnRowToTurn(t: any): Turn {
  const runState = normalizeRunState(t.runState)
  return {
    id: t.id,
    idx: t.idx,
    userMsg: t.userMsg,
    events: t.events,
    tokenTotal: t.tokenTotal,
    ...(t.votingLabels ? { votingLabels: t.votingLabels } : {}),
    ...(t.userImages ? { userImages: t.userImages } : {}),
    ...(runState ? { runState } : {}),
  }
}

function sanitizeDeliberation(d: CouncilDeliberation | undefined): CouncilDeliberation | undefined {
  if (!d) return undefined
  const clean: CouncilDeliberation = {}
  if (d.votingDimensions && d.votingDimensions.length > 0) clean.votingDimensions = d.votingDimensions
  if (d.minCommentLength !== undefined) clean.minCommentLength = d.minCommentLength
  if (d.mediatorMaxRounds !== undefined) clean.mediatorMaxRounds = d.mediatorMaxRounds
  if (d.passDivergence !== undefined) clean.passDivergence = d.passDivergence
  if (d.passPeerAnswers !== undefined) clean.passPeerAnswers = d.passPeerAnswers
  const DELIBERATION_STRING_KEYS = ['participant','votingSystem','votingTemplate','reanswerSystem','reanswerTemplate','judgeTemplate','mediatorTemplate'] as const
  for (const key of DELIBERATION_STRING_KEYS) {
    const v = (d as any)[key]
    if (typeof v === 'string' && v.trim().length > 0) (clean as any)[key] = v
  }
  return Object.keys(clean).length > 0 ? clean : undefined
}

export async function listCouncils(): Promise<CouncilSummary[]> {
  const councils = await councilsApi.list()
  return councils.map(c => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
    socialStructure: normalizeSocialStructure(c.socialStructure as any),
    modelIds: c.seats.map((s: any) => s.modelId),
    tokenTotal: c.tokenTotal,
    ...(c.isDemo ? { isDemo: true } : {}),
  }))
}

export async function getCouncil(id: string): Promise<Council | null> {
  try {
    const c = await councilsApi.get(id)
    return {
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      socialStructure: normalizeSocialStructure(c.socialStructure as any),
      seats: c.seats,
      turns: c.turns.map(turnRowToTurn),
      tokenTotal: c.tokenTotal,
      ...(c.judge ? { judge: normalizeSynthesiser(c.judge) } : {}),
      ...(c.mediator ? { mediator: normalizeSynthesiser(c.mediator) } : {}),
      ...(c.deliberation ? { deliberation: c.deliberation } : {}),
      ...(c.isDemo ? { isDemo: true } : {}),
    }
  } catch {
    return null
  }
}

export async function createCouncil(input: CreateCouncilInput): Promise<Council> {
  try {
    const existing = await getCouncil(input.id)
    if (existing) return existing
  } catch {}
  
  await councilsApi.create({
    ...input,
    deliberation: sanitizeDeliberation(input.deliberation)
  })
  const created = await getCouncil(input.id)
  return created!
}

export async function appendTurn(councilId: string, turn: Turn): Promise<void> {
  const c = await getCouncil(councilId)
  if (!c) throw new Error('council not found')
  const existingTurn = c.turns.find(t => t.id === turn.id)
  if (existingTurn) {
    await councilsApi.updateTurn(councilId, turn.id, turn)
  } else {
    await councilsApi.appendTurn(councilId, turn)
  }
}

export async function patchRunState(councilId: string, turnId: string, patch: Partial<TurnRunState>): Promise<void> {
  const c = await getCouncil(councilId)
  if (!c) return
  const turn = c.turns.find(t => t.id === turnId)
  if (!turn || !turn.runState) return
  await councilsApi.updateTurn(councilId, turnId, {
    ...turn,
    runState: { ...turn.runState, ...patch }
  })
}

export async function clearRunState(councilId: string, turnId: string): Promise<void> {
  const c = await getCouncil(councilId)
  if (!c) return
  const turn = c.turns.find(t => t.id === turnId)
  if (!turn) return
  const updatedTurn = { ...turn }
  delete updatedTurn.runState
  await councilsApi.updateTurn(councilId, turnId, updatedTurn)
}

export async function deleteTurn(councilId: string, turnId: string): Promise<void> {
  await councilsApi.deleteTurn(councilId, turnId)
}

export async function getTurn(councilId: string, turnId: string): Promise<Turn | null> {
  const c = await getCouncil(councilId)
  if (!c) return null
  return c.turns.find(t => t.id === turnId) || null
}

export async function getUnfinishedTurns(turnIds: readonly string[]): Promise<Array<{ councilId: string; turn: Turn }>> {
  if (turnIds.length === 0) return []
  const all = await councilsApi.list()
  const out: Array<{ councilId: string; turn: Turn }> = []
  for (const c of all) {
    const full = await getCouncil(c.id)
    if (full) {
      for (const t of full.turns) {
        if (turnIds.includes(t.id) && t.runState) {
          out.push({ councilId: c.id, turn: t })
        }
      }
    }
  }
  return out
}

export async function replaceEvent(councilId: string, turnId: string, event: TurnEvent): Promise<void> {
  const c = await getCouncil(councilId)
  if (!c) throw new Error('council not found')
  const turn = c.turns.find(t => t.id === turnId)
  if (!turn) throw new Error('turn not found')
  const nextEvents = turn.events.map(e => e.id === event.id ? event : e)
  await councilsApi.updateTurn(councilId, turnId, { ...turn, events: nextEvents })
}

export async function updateSeat(councilId: string, seatId: string, input: UpdateSeatInput): Promise<void> {
  await councilsApi.updateSeat(councilId, seatId, input)
}

export async function addSeat(councilId: string, seat: Seat): Promise<void> {
  await councilsApi.addSeat(councilId, seat)
}

export async function removeSeat(councilId: string, seatId: string): Promise<void> {
  await councilsApi.deleteSeat(councilId, seatId)
}

export async function setJudge(councilId: string, judge: Judge): Promise<void> {
  await councilsApi.update(councilId, { judge })
}

export async function setMediator(councilId: string, mediator: Mediator): Promise<void> {
  await councilsApi.update(councilId, { mediator })
}

export async function setDeliberation(councilId: string, deliberation: CouncilDeliberation): Promise<void> {
  const clean = sanitizeDeliberation(deliberation)
  await councilsApi.update(councilId, { deliberation: clean || null } as any)
}

export async function patchCouncilTitle(councilId: string, title: string): Promise<void> {
  const clamped = title.trim().slice(0, 60)
  await councilsApi.update(councilId, { title: clamped })
}

export async function deleteCouncil(id: string): Promise<void> {
  await councilsApi.delete(id)
}
