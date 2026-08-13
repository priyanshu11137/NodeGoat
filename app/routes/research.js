const ResearchDAO = require("../data/research-dao").ResearchDAO;
const needle = require("needle");
const {
    environmentalScripts
} = require("../../config/config");

function ResearchHandler(db) {
    "use strict";

    const researchDAO = new ResearchDAO(db);

    const ALLOWED_URLS = ["https://finance.yahoo.com/", "http://finance.yahoo.com/"];

    this.displayResearch = (req, res) => {

        if (req.query.symbol) {
            const baseUrl = req.query.url;
            if (!baseUrl || !ALLOWED_URLS.some(allowed => baseUrl.startsWith(allowed))) {
                return res.status(400).send("Invalid URL");
            }
            const url = baseUrl + req.query.symbol;
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
