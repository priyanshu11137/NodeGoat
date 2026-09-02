// Error handling middleware

const errorHandler = (err, req, res,next) => {

    "use strict";

    // Fix for A8 - CSRF
    // csurf rejects requests without a valid "_csrf" token: report those as a
    // 403 instead of masking them as an internal server error.
    if (err.code === "EBADCSRFTOKEN") {
        console.error("Rejected request with a missing or invalid CSRF token");
        res.status(403);
        return res.render("error-template", {
            error: "Invalid or missing CSRF token. Please reload the page and submit the form again."
        });
    }

    console.error(err.message);
    console.error(err.stack);
    res.status(500);
    res.render("error-template", {
        error: err
    });
};

module.exports = { errorHandler };
