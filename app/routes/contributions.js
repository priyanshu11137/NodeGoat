const ContributionsDAO = require("../data/contributions-dao").ContributionsDAO;
const {
    environmentalScripts
} = require("../../config/config");

/* Contribution percentages are whole numbers within this inclusive range */
const MIN_CONTRIBUTION_PERCENTAGE = 0;
const MAX_CONTRIBUTION_PERCENTAGE = 100;
const INTEGER_PATTERN = /^\d+$/;

/*
 * Safely converts an untrusted request value into a bounded integer.
 * Returns NaN for anything that is not a plain, in-range integer so that
 * the caller's existing validation/error-render path rejects it.
 */
function parseContributionPercentage(value) {
    "use strict";

    if (typeof value !== "string") return NaN;

    const candidate = value.trim();
    if (!INTEGER_PATTERN.test(candidate)) return NaN;

    const parsed = Number.parseInt(candidate, 10);
    if (!Number.isInteger(parsed)) return NaN;
    if (parsed < MIN_CONTRIBUTION_PERCENTAGE || parsed > MAX_CONTRIBUTION_PERCENTAGE) return NaN;

    return parsed;
}

/* The ContributionsHandler must be constructed with a connected db */
function ContributionsHandler(db) {
    "use strict";

    const contributionsDAO = new ContributionsDAO(db);

    this.displayContributions = (req, res, next) => {
        const {
            userId
        } = req.session;

        contributionsDAO.getByUserId(userId, (error, contrib) => {
            if (error) return next(error);

            contrib.userId = userId; //set for nav menu items
            return res.render("contributions", {
                ...contrib,
                environmentalScripts
            });
        });
    };

    this.handleContributionsUpdate = (req, res, next) => {

        // Submitted percentages are parsed and range-checked as integers, never evaluated as code
        const preTax = parseContributionPercentage(req.body.preTax);
        const afterTax = parseContributionPercentage(req.body.afterTax);
        const roth = parseContributionPercentage(req.body.roth);

        const {
            userId
        } = req.session;

        //validate contributions
        const validations = [isNaN(preTax), isNaN(afterTax), isNaN(roth), preTax < 0, afterTax < 0, roth < 0];
        const isInvalid = validations.some(validation => validation);
        if (isInvalid) {
            return res.render("contributions", {
                updateError: "Invalid contribution percentages",
                userId,
                environmentalScripts
            });
        }
        // Prevent more than 30% contributions
        if (preTax + afterTax + roth > 30) {
            return res.render("contributions", {
                updateError: "Contribution percentages cannot exceed 30 %",
                userId,
                environmentalScripts
            });
        }

        contributionsDAO.update(userId, preTax, afterTax, roth, (err, contributions) => {

            if (err) return next(err);

            contributions.updateSuccess = true;
            return res.render("contributions", {
                ...contributions,
                environmentalScripts
            });
        });

    };

}

module.exports = ContributionsHandler;
