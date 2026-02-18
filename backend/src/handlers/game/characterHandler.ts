import { Request, Response } from 'express';
import { ok } from '../../utils/response';
import { gameService } from '../../services/gameService';
import { getPagination, sendResult } from '../http';

export const gameCharacterHandler = {
  getCharacters: (req: Request, res: Response): void => {
    const { page, limit } = getPagination(req);
    const shouldPaginate = Boolean(req.query.page || req.query.limit);
    sendResult(res, gameService.getCharacters(req.userId!, shouldPaginate ? page : undefined, shouldPaginate ? limit : undefined));
  },

  getCharacter: (req: Request, res: Response): void => {
    sendResult(res, gameService.getCharacter(req.userId!, Number(req.params.id)));
  },

  levelUpCharacter: (req: Request, res: Response): void => {
    const expCrystals = Number(req.body?.exp_crystals || 1);
    sendResult(res, gameService.levelUpCharacter(req.userId!, Number(req.params.id), expCrystals));
  },

  awakenCharacter: (req: Request, res: Response): void => {
    sendResult(res, gameService.awakenCharacter(req.userId!, Number(req.params.id)));
  },

  skillUpCharacter: (req: Request, res: Response): void => {
    const skillSlot = Number(req.body?.skillSlot || 1);
    sendResult(res, gameService.skillUpCharacter(req.userId!, Number(req.params.id), skillSlot));
  },

  getParty: (req: Request, res: Response): void => {
    sendResult(res, gameService.getParty(req.userId!));
  },

  setParty: (req: Request, res: Response): void => {
    const ids = Array.isArray(req.body?.character_ids)
      ? req.body.character_ids.map((value: unknown) => Number(value)).filter((value: number) => Number.isFinite(value))
      : [];
    sendResult(res, gameService.setParty(req.userId!, ids));
  },

  summonNormal: (req: Request, res: Response): void => {
    const count = Number(req.body?.count || 1);
    sendResult(res, gameService.summon(req.userId!, 'normal', count));
  },

  summonPremium: (req: Request, res: Response): void => {
    const count = Number(req.body?.count || 1);
    sendResult(res, gameService.summon(req.userId!, 'premium', count));
  },

  getSummonRates: (_req: Request, res: Response): void => {
    ok(res, {
      normal: { grade1: 0.65, grade2: 0.25, grade3: 0.08, grade4: 0.02 },
      premium: { grade2: 0.40, grade3: 0.40, grade4: 0.18, grade5: 0.02 },
    });
  },
};
