# FocusFlow ✅ — Personal Task Manager

FocusFlow is a full-stack personal task manager built as part of a Frontend Developer Internship task.
It includes authentication (signup/signin), a modern animated UI dashboard, and task CRUD operations
connected to a real backend and MongoDB Atlas.

---

## ✨ Features

- User Authentication (Signup / Signin)
- JWT-based session handling
- Protected Dashboard route
- Task Manager (Create / Update / Delete / Complete tasks)
- Priority-based task tagging (Low / Medium / High)
- Smooth animations (Framer Motion)
- Toast notifications + skeleton loading UI
- MongoDB Atlas integration

---

## 🧰 Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- 21st.dev UI component integration
- Framer Motion
- lucide-react icons

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB Atlas + Mongoose
- JWT Authentication
- bcrypt password hashing

---

## 📁 Project Structure

---

## ⭐ Bonus Implemented: API Rate Limiting

To improve security and prevent abuse (brute-force login/signup attempts), the backend includes **rate limiting** using `express-rate-limit`.

### Applied Limits
- `/api` → General API limiter: **200 requests / 15 minutes**
- `/api/auth` → Auth limiter: **20 requests / 10 minutes** (stricter to prevent brute-force)

### How to test
1. Run backend + frontend
2. Send repeated requests to `/api/auth/signin` or `/api/auth/signup`
3. After crossing the limit, the API responds with:

```json
{
  "message": "Too many attempts. Try again later."
}

