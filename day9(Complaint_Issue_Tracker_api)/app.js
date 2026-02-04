import express from "express";
import complaintRouter from "./routes/complaint.routes.js";
import logger from "./middlewares/logger.middleware.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(logger);

app.use("/complaints", complaintRouter);

export default app;