// middlewares/requireRole.js
export default function requireRole(...allowedRoles) {
  const set = new Set(allowedRoles);
  return (req, res, next) => {
    const role = req.session?.user?.userType;
    if (!role) return res.status(401).json({ message: "Unauthorized" });
    if (!set.has(role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
