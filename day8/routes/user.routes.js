import express from 'express';
const router = express.Router();
import {getUsers, addUser} from "../controllers/user.controller.js";


router.get("/", getUsers);
router.post("/", addUser);



export default router;