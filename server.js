import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import taskRoutes from "./routes/task.routes.js";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
  });