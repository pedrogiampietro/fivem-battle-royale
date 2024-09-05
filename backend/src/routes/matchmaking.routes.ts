import express from "express";
import {
  addPlayerToMatchmaking,
  cancelMatchmaking,
  startGame,
  leaveMatchmaking,
} from "../controllers/matchmaking.controller";

const router = express.Router();

router.post("/addPlayerToMatchmaking", addPlayerToMatchmaking);
router.post("/cancelMatchmaking", cancelMatchmaking);
router.post("/startGame", startGame);
router.post("/leaveMatchmaking", leaveMatchmaking);

export default router;
