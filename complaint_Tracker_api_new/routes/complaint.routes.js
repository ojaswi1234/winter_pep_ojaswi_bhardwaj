import express from "express";
import { 
    createComplaint, 
    deleteComplaint, 
    getAllComplaints, 
    getComplaintById,
    getComplaintsByEmail,
    getSimilarComplaints,
    addMeToo,
    updateComplaintStatus 
} from "../controllers/complaint.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllComplaints);
router.get("/user/:email", getComplaintsByEmail);
router.get("/similar/:wing", getSimilarComplaints);
router.get("/:id", getComplaintById);
router.post("/", createComplaint);
router.post("/metoo", addMeToo);

router.put("/:id", isLoggedIn, updateComplaintStatus);
router.delete("/:id", isLoggedIn, deleteComplaint);

export default router;
