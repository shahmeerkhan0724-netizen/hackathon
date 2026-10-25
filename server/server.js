import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import connectDb from "./config/db.js"
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import companyRoutes from "./routes/company.js";
import departmentRoutes from "./routes/department.js";
import designationRoutes from "./routes/designation.js";
import employeeRoutes from "./routes/employee.js";
import attendanceRoutes from "./routes/attendance.js";
import leaveRoutes from "./routes/leave.js";
import leaveBalanceRoutes from "./routes/leaveBalance.js";
import holidayRoutes from "./routes/holiday.js";
import payrollRoutes from "./routes/payroll.js";
import announcementRoutes from "./routes/announcement.js";
import notificationRoutes from "./routes/notification.js";
import auditLogRoutes from "./routes/auditLog.js";

const app = express()

app.use(cors())
app.use(express.json()) 

connectDb()
const PORT = process.env.PORT || 3000

app.get("/", (req, res) => {
  res.send({message: "welcome to the server!"})
})

app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/leave-balances", leaveBalanceRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditLogRoutes);



app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})