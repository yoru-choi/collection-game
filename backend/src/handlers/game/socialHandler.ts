import { Request, Response } from 'express';
import { ok } from '../../utils/response';
import { gameService } from '../../services/gameService';
import { getPagination, sendResult } from '../http';

export const gameSocialHandler = {
  getArena: (req: Request, res: Response): void => {
    sendResult(res, gameService.getArena(req.userId!));
  },

  updateArenaDefense: (_req: Request, res: Response): void => {
    ok(res, { updated: true });
  },

  getArenaRanking: (req: Request, res: Response): void => {
    const { page, limit } = getPagination(req);
    sendResult(res, gameService.getArenaRanking(page, limit));
  },

  attackArena: (req: Request, res: Response): void => {
    const targetUserId = String(req.body?.targetUserId || '0');
    sendResult(res, gameService.attackArena(req.userId!, targetUserId));
  },

  getArenaHistory: (req: Request, res: Response): void => {
    const { page, limit } = getPagination(req);
    sendResult(res, gameService.getArenaHistory(page, limit));
  },

  getGuilds: (req: Request, res: Response): void => {
    const { page, limit } = getPagination(req);
    sendResult(res, gameService.getGuilds(page, limit));
  },

  createGuild: (req: Request, res: Response): void => {
    const { name, description } = req.body as { name?: string; description?: string };
    sendResult(res, gameService.createGuild(req.userId!, name, description));
  },

  getMyGuild: (req: Request, res: Response): void => {
    sendResult(res, gameService.getMyGuild(req.userId!));
  },

  getGuild: (req: Request, res: Response): void => {
    sendResult(res, gameService.getGuildById(Number(req.params.id)));
  },

  updateGuild: (req: Request, res: Response): void => {
    sendResult(res, gameService.updateGuild(Number(req.params.id), req.body as Record<string, unknown>));
  },

  joinGuild: (req: Request, res: Response): void => {
    sendResult(res, gameService.joinGuild(req.userId!, Number(req.params.id)));
  },

  leaveGuild: (req: Request, res: Response): void => {
    sendResult(res, gameService.leaveGuild(req.userId!, Number(req.params.id)));
  },

  getGuildMembers: (req: Request, res: Response): void => {
    sendResult(res, gameService.getGuildMembers(Number(req.params.id)));
  },

  getShopItems: (_req: Request, res: Response): void => {
    sendResult(res, gameService.getShopItems());
  },

  purchaseShopItem: (req: Request, res: Response): void => {
    const shopItemId = Number(req.body?.shop_item_id);
    const quantity = Number(req.body?.quantity || 1);
    sendResult(res, gameService.purchaseShopItem(req.userId!, shopItemId, quantity));
  },

  getShopHistory: (req: Request, res: Response): void => {
    const { page, limit } = getPagination(req);
    sendResult(res, gameService.getShopHistory(req.userId!, page, limit));
  },

  getDailyQuests: (req: Request, res: Response): void => {
    sendResult(res, gameService.getDailyQuests(req.userId!));
  },

  getWeeklyQuests: (_req: Request, res: Response): void => {
    ok(res, []);
  },

  getAchievements: (_req: Request, res: Response): void => {
    ok(res, []);
  },

  completeQuest: (req: Request, res: Response): void => {
    sendResult(res, gameService.completeQuest(Number(req.params.id)));
  },

  claimQuest: (req: Request, res: Response): void => {
    sendResult(res, gameService.claimQuest(req.userId!, Number(req.params.id)));
  },

  getDailyLogin: (req: Request, res: Response): void => {
    sendResult(res, gameService.claimDailyLogin(req.userId!));
  },
};
