// middlewares/authRequired.js
export default function authRequired(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
