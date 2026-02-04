import express from "express";
import { 
    createComplaint, 
    deleteComplaint, 
    getAllComplaints, 
    resolveComplaint 
} from "../controllers/complaint.controller.js";
import isLoggedIn from  "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllComplaints);
router.post("/", createComplaint);

router.put("/:id/resolve", isLoggedIn, resolveComplaint);
router.delete("/:id", isLoggedIn, deleteComplaint);

export default router;
