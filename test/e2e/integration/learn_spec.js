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
    cy.visitPage("/learn?url=/tutorial");
    cy.url().should("include", "tutorial");
  });

  it("Should reject paths not in the allowlist", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=/dashboard");
    cy.url().should("not.include", "dashboard");
  });

  it("Should reject absolute URL redirects (open redirect)", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=http://evil.com");
    cy.url().should("not.include", "evil.com");
  });

  it("Should reject protocol-relative URL redirects", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=//evil.com");
    cy.url().should("not.include", "evil.com");
  });
});
