import express from "express";
import { 
    createComplaint, 
    deleteComplaint, 
    getAllComplaints, 
    getComplaintById,
    updateComplaintStatus 
} from "../controllers/complaint.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllComplaints);
router.get("/:id", getComplaintById);
router.post("/", createComplaint);

router.put("/:id", isLoggedIn, updateComplaintStatus);
router.delete("/:id", isLoggedIn, deleteComplaint);

export default router;
