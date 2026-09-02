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

  it("Should not redirect to an absolute untrusted url", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=https://evil.example.com/phishing");
    cy.url().should("not.include", "evil.example.com");
    cy.url().should("include", "dashboard");
  });

  it("Should not redirect to a protocol relative untrusted url", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=//evil.example.com");
    cy.url().should("not.include", "evil.example.com");
    cy.url().should("include", "dashboard");
  });
});
