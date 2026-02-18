import { Request, Response } from 'express';
import { gameService } from '../../services/gameService';
import { sendResult } from '../http';

export const gameUserHandler = {
  getProfile: (req: Request, res: Response): void => {
    sendResult(res, gameService.getProfile(req.userId!));
  },

  updateProfile: (req: Request, res: Response): void => {
    const { username, email } = req.body as { username?: string; email?: string };
    sendResult(res, gameService.updateProfile(req.userId!, username, email));
  },

  getInventory: (req: Request, res: Response): void => {
    sendResult(res, gameService.getInventory(req.userId!));
  },
};
