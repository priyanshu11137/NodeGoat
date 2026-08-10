const ResearchDAO = require("../data/research-dao").ResearchDAO;
const needle = require("needle");
const {
    environmentalScripts
} = require("../../config/config");

// Allowlist of trusted hostnames for stock data lookups (SSRF prevention)
const allowedHostnames = [
    "finance.yahoo.com",
    "query1.finance.yahoo.com",
    "query2.finance.yahoo.com"
];

// Only alphanumeric characters and dots, 1–10 chars (standard ticker format)
const symbolPattern = /^[A-Z0-9.]{1,10}$/i;

function ResearchHandler(db) {
    "use strict";

    const researchDAO = new ResearchDAO(db);

    this.displayResearch = (req, res) => {

        if (req.query.symbol) {
            // Validate symbol: must match ticker format to prevent injection
            if (!symbolPattern.test(req.query.symbol)) {
                return res.status(400).send("Invalid symbol: only alphanumeric stock ticker symbols are permitted.");
            }

            // Validate URL: only allow requests to approved financial data sources
            let parsedUrl;
            try {
                parsedUrl = new URL(req.query.url + req.query.symbol);
            } catch (e) {
                return res.status(400).send("Invalid URL: only approved financial data sources are permitted.");
            }

            if (allowedHostnames.indexOf(parsedUrl.hostname) === -1) {
                return res.status(400).send("Invalid URL: only approved financial data sources are permitted.");
            }

            const url = parsedUrl.href;
            return needle.get(url, (error, newResponse, body) => {
                if (!error && newResponse.statusCode === 200) {
                    res.writeHead(200, {
                        "Content-Type": "text/html"
                    });
                }
                res.write("<h1>The following is the stock information you requested.</h1>\n\n");
                res.write("\n\n");
                if (body) {
                    res.write(body);
                }
                return res.end();
            });
        }

        return res.render("research", {
            environmentalScripts
        });
    };

}

module.exports = ResearchHandler;
