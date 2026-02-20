import { Request, Response } from 'express';
import { gameService } from '../../services/gameService';
import { sendResult } from '../http';

export const gameDungeonBattleHandler = {
  getDungeons: (req: Request, res: Response): void => {
    const chapter = req.query.chapter ? Number(req.query.chapter) : undefined;
    sendResult(res, gameService.getDungeons(chapter));
  },

  getDungeonProgress: (req: Request, res: Response): void => {
    sendResult(res, gameService.getDungeonProgress(req.userId!));
  },

  getDungeon: (req: Request, res: Response): void => {
    sendResult(res, gameService.getDungeonById(Number(req.params.id)));
  },

  enterDungeon: (req: Request, res: Response): void => {
    sendResult(res, gameService.enterDungeon(req.userId!, Number(req.params.id)));
  },

  completeDungeon: (req: Request, res: Response): void => {
    sendResult(res, gameService.completeDungeon(req.userId!, Number(req.params.id)));
  },

  getBattleState: (req: Request, res: Response): void => {
    sendResult(res, gameService.getBattleState(Number(req.params.id)));
  },

  battleAction: (req: Request, res: Response): void => {
    const { unit_id, skill_index, target_ids } = req.body || {};
    sendResult(res, gameService.battleAction(
      Number(req.params.id),
      unit_id,
      typeof skill_index === 'number' ? skill_index : undefined,
      Array.isArray(target_ids) ? target_ids : undefined,
    ));
  },

  processBattleTick: (req: Request, res: Response): void => {
    sendResult(res, gameService.processBattleTick(Number(req.params.id)));
  },

  setBattleAuto: (req: Request, res: Response): void => {
    sendResult(res, gameService.setBattleAuto(Number(req.params.id), Boolean(req.body?.auto)));
  },

  setBattleSpeed: (req: Request, res: Response): void => {
    const speed = Number(req.body?.speed || 1);
    sendResult(res, gameService.setBattleSpeed(Number(req.params.id), speed));
  },

  surrenderBattle: (req: Request, res: Response): void => {
    sendResult(res, gameService.surrenderBattle(Number(req.params.id)));
  },

  getBattleResult: (req: Request, res: Response): void => {
    sendResult(res, gameService.getBattleResult(Number(req.params.id)));
  },
};
