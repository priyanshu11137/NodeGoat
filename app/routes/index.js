const { URL } = require("url");
const SessionHandler = require("./session");
const ProfileHandler = require("./profile");
const BenefitsHandler = require("./benefits");
const ContributionsHandler = require("./contributions");
const AllocationsHandler = require("./allocations");
const MemosHandler = require("./memos");
const ResearchHandler = require("./research");
const tutorialRouter = require("./tutorial");
const ErrorHandler = require("./error").errorHandler;

const index = (app, db) => {

    "use strict";

    const sessionHandler = new SessionHandler(db);
    const profileHandler = new ProfileHandler(db);
    const benefitsHandler = new BenefitsHandler(db);
    const contributionsHandler = new ContributionsHandler(db);
    const allocationsHandler = new AllocationsHandler(db);
    const memosHandler = new MemosHandler(db);
    const researchHandler = new ResearchHandler(db);

    // Allowlist of hosts that the /learn redirect is permitted to send users to
    const ALLOWED_REDIRECT_HOSTS = ["www.khanacademy.org", "khanacademy.org"];

    // Validates that the supplied redirect target is either a safe in-app
    // relative path, or a well-formed absolute URL pointing at one of the
    // allowlisted hosts, to prevent open redirect (CWE-601). Naive prefix
    // checks (e.g. startsWith) are avoided since they can be bypassed with
    // URLs like "https://evil.com/https://khanacademy.org". Protocol-relative
    // paths (e.g. "//evil.com") are rejected since browsers treat them as
    // absolute URLs.
    const isAllowedRedirectUrl = (candidateUrl) => {
        if (!candidateUrl || typeof candidateUrl !== "string") {
            return false;
        }

        // Safe in-app relative path (single leading slash, not protocol-relative)
        if (candidateUrl.startsWith("/") && !candidateUrl.startsWith("//")) {
            return true;
        }

        let parsed;
        try {
            parsed = new URL(candidateUrl);
        } catch (err) {
            return false;
        }
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
            return false;
        }
        return ALLOWED_REDIRECT_HOSTS.includes(parsed.hostname);
    };

    // Middleware to check if a user is logged in
    const isLoggedIn = sessionHandler.isLoggedInMiddleware;

    //Middleware to check if user has admin rights
    const isAdmin = sessionHandler.isAdminUserMiddleware;

    // The main page of the app
    app.get("/", sessionHandler.displayWelcomePage);

    // Login form
    app.get("/login", sessionHandler.displayLoginPage);
    app.post("/login", sessionHandler.handleLoginRequest);

    // Signup form
    app.get("/signup", sessionHandler.displaySignupPage);
    app.post("/signup", sessionHandler.handleSignup);

    // Logout page
    app.get("/logout", sessionHandler.displayLogoutPage);

    // The main page of the app
    app.get("/dashboard", isLoggedIn, sessionHandler.displayWelcomePage);

    // Profile page
    app.get("/profile", isLoggedIn, profileHandler.displayProfile);
    app.post("/profile", isLoggedIn, profileHandler.handleProfileUpdate);

    // Contributions Page
    app.get("/contributions", isLoggedIn, contributionsHandler.displayContributions);
    app.post("/contributions", isLoggedIn, contributionsHandler.handleContributionsUpdate);

    // Benefits Page
    app.get("/benefits", isLoggedIn, benefitsHandler.displayBenefits);
    app.post("/benefits", isLoggedIn, benefitsHandler.updateBenefits);
    /* Fix for A7 - checks user role to implement  Function Level Access Control
     app.get("/benefits", isLoggedIn, isAdmin, benefitsHandler.displayBenefits);
     app.post("/benefits", isLoggedIn, isAdmin, benefitsHandler.updateBenefits);
     */

    // Allocations Page
    app.get("/allocations/:userId", isLoggedIn, allocationsHandler.displayAllocations);

    // Memos Page
    app.get("/memos", isLoggedIn, memosHandler.displayMemos);
    app.post("/memos", isLoggedIn, memosHandler.addMemos);

    // Handle redirect for learning resources link
    app.get("/learn", isLoggedIn, (req, res) => {
        // Secure redirect handling: only allow redirecting to an allowlisted
        // host (Khan Academy) to prevent open redirect (CWE-601).
        const requestedUrl = req.query.url;
        if (!isAllowedRedirectUrl(requestedUrl)) {
            return res.status(400).send("Invalid or disallowed redirect URL");
        }
        return res.redirect(requestedUrl);
    });

    // Research Page
    app.get("/research", isLoggedIn, researchHandler.displayResearch);

    // Mount tutorial router
    app.use("/tutorial", tutorialRouter);

    // Error handling middleware
    app.use(ErrorHandler);
};

module.exports = index;
