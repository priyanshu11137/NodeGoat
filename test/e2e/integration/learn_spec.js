/// <reference types="Cypress" />

describe("/learn behaviour", () => {
  "use strict";

  afterEach(() => {
    cy.visitPage("/logout");
  });

  it("Should redirect if the user has not logged in", () => {
    cy.visitPage("/learn?url=/dashboard");
    cy.url().should("include", "login");
  });

  it("Should be accesible for a logged user", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=/dashboard");
    cy.url().should("include", "dashboard");
  });

  it("Should still redirect to an allowed learning resource", () => {
    cy.userSignIn();
    const learnUrl = "https://www.khanacademy.org/" +
      "economics-finance-domain/core-finance/investment-vehicles-tutorial/ira-401ks/v/traditional-iras";
    cy.request({
      url: "/learn?url=" + learnUrl,
      followRedirect: false
    }).then(response => {
      expect(response.status).to.eq(302);
      expect(response.headers.location).to.eq(learnUrl);
    });
  });

  it("Should refuse a redirect to an external target", () => {
    cy.userSignIn();
    cy.request({
      url: "/learn?url=https://evil.example.com/phishing",
      followRedirect: false
    }).then(response => {
      expect(response.status).to.eq(302);
      expect(response.headers.location).to.eq("/dashboard");
    });
  });

  it("Should refuse a protocol relative redirect target", () => {
    cy.userSignIn();
    cy.request({
      url: "/learn?url=//evil.example.com",
      followRedirect: false
    }).then(response => {
      expect(response.status).to.eq(302);
      expect(response.headers.location).to.eq("/dashboard");
    });
  });
});
