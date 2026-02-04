const isLoggedIn = (req, res, next) => {
    console.log("Auth checked");
    next();
};

export default isLoggedIn;