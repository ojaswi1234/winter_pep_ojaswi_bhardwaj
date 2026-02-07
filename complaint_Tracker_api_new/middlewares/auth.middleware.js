const isLoggedIn = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (authHeader !== "secret-admin-key") {
        return res.status(401).json({ message: "Unauthorized: Admin access only" });
    }
    console.log("Auth checked");
    next();
};

export default isLoggedIn;