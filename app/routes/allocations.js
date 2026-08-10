const AllocationsDAO = require("../data/allocations-dao").AllocationsDAO;
const {
    environmentalScripts
} = require("../../config/config");

function AllocationsHandler(db) {
    "use strict";

    const allocationsDAO = new AllocationsDAO(db);

    this.displayAllocations = (req, res, next) => {
        /*
        // Fix for A4 Insecure DOR -  take user id from session instead of from URL param
        const { userId } = req.session;
        */
        const {
            userId
        } = req.params;
        const {
            threshold
        } = req.query;

        allocationsDAO.getByUserIdAndThreshold(userId, threshold, (err, allocations) => {
            if (err) return next(err);
            // Set HSTS header to enforce HTTPS and prevent protocol downgrade attacks (CWE-346)
            res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            return res.render("allocations", {
                userId,
                allocations,
                environmentalScripts
            });
        });
    };
}

module.exports = AllocationsHandler;
