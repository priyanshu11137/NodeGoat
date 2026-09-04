// Error handling middleware

const errorHandler = (err, req, res,next) => {

    "use strict";

    // Fix for A8 - CSRF
    // A missing/invalid CSRF token is a rejected client request, not a server
    // fault: fail closed with 403 rather than reporting it as a 500.
    if (err.code === "EBADCSRFTOKEN") {
        console.error("Rejected request with an invalid or missing CSRF token");
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
