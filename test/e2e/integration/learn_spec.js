/// <reference types="Cypress" />

describe("/learn behaviour", () => {
  "use strict";

  afterEach(() => {
    cy.visitPage("/logout");
  });

  it("Should redirect if the user has not logged in", () => {
    cy.visitPage("/learn?target=owasp");
    cy.url().should("include", "login");
  });

  it("Should redirect to an allowed URL when logged in", () => {
    cy.userSignIn();
    cy.visitPage("/learn?target=owasp", { failOnStatusCode: false });
    cy.url().should("include", "owasp.org");
  });

  it("Should return 400 when the redirect target is not on the allowlist", () => {
    cy.userSignIn();
    cy.visitPage("/learn?target=evil", { failOnStatusCode: false });
    cy.contains("Redirect not allowed");
  });

  it("Should return 400 when no redirect target is provided", () => {
    cy.userSignIn();
    cy.visitPage("/learn", { failOnStatusCode: false });
    cy.contains("Redirect not allowed");
  });
});
