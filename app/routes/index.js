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

    // Domains that are explicitly trusted destinations for the
    // "Learning Resources" link (e.g. https://www.khanacademy.org/...)
    const ALLOWED_REDIRECT_HOSTS = ["www.khanacademy.org"];

    // Validate that the requested redirect target is either a same-origin
    // relative path or an explicitly allowlisted external host. This
    // prevents open redirects (CWE-601) via arbitrary attacker supplied URLs.
    const isSafeRedirectUrl = (url) => {
        if (typeof url !== "string" || url.length === 0) {
            return false;
        }

        // Same-origin relative path: must start with a single "/" and must
        // not be a protocol-relative URL ("//host/..." or "/\host/...")
        // which browsers treat as an absolute URL to another host.
        if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) {
            return true;
        }

        try {
            const parsed = new URL(url);
            if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
                return false;
            }
            return ALLOWED_REDIRECT_HOSTS.includes(parsed.hostname);
        } catch (err) {
            return false;
        }
    };

    // Handle redirect for learning resources link
    app.get("/learn", isLoggedIn, (req, res) => {
        const target = req.query.url;
        if (isSafeRedirectUrl(target)) {
            return res.redirect(target);
        }
        // Unknown/untrusted destination: fall back to a safe default
        // instead of redirecting to an attacker-controlled URL.
        return res.redirect("/");
    });

    // Research Page
    app.get("/research", isLoggedIn, researchHandler.displayResearch);

    // Mount tutorial router
    app.use("/tutorial", tutorialRouter);

    // Error handling middleware
    app.use(ErrorHandler);
};

module.exports = index;
