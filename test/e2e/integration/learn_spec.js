/// <reference types="Cypress" />

describe("/learn behaviour", () => {
  "use strict";

  afterEach(() => {
    cy.visitPage("/logout");
  });

  it("Should redirect if the user has not logged in", () => {
    cy.visitPage("/learn?url=https://owasp.org");
    cy.url().should("include", "login");
  });

  it("Should redirect to an allowed URL when logged in", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=https://owasp.org", { failOnStatusCode: false });
    cy.url().should("include", "owasp.org");
  });

  it("Should return 400 when the redirect URL is not on the allowlist", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=https://evil.com", { failOnStatusCode: false });
    cy.contains("Redirect not allowed");
  });

  it("Should return 400 when no redirect URL is provided", () => {
    cy.userSignIn();
    cy.visitPage("/learn", { failOnStatusCode: false });
    cy.contains("Redirect not allowed");
  });
});
