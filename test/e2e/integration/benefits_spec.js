/// <reference types="Cypress" />

describe("/login behaviour", () => {
  "use strict";

  before(() => {
    cy.dbReset();
  });

  afterEach(() => {
    cy.visitPage("/logout");
  });

  it("Should redirect if the user has not logged in", () => {
    cy.visitPage("/benefits");
    cy.url().should("include", "login");
  });

  it("Should be accesible by default if the user is an admin", () => {
    cy.adminSignIn();
    cy.visitPage("/benefits");
    cy.url().should("include", "benefits");
  });

  it("Should be accesible if the user is not an admin", () => {
    cy.userSignIn();
    cy.visitPage("/benefits");
    cy.url().should("include", "benefits");
  });

  it("Should be a table with rows", () => {
    cy.adminSignIn();
    cy.visitPage("/benefits");
    cy.get("table tr");
  });

  it("Should data in the table be modified", () => {
    cy.adminSignIn();
    cy.visitPage("/benefits");
    cy.get("input[name='benefitStartDate'")
      .first()
      .type("2099-01-10");

    cy.get("button[type='submit']")
      .first()
      .click();

    cy.url().should("include", "benefits");
    cy.get("input[name='benefitStartDate'")
      .first()
      .invoke("val")
      .should("eq", "2099-01-10");
  });

  it("Should reject a benefits update posted without a CSRF token", () => {
    cy.adminSignIn();
    cy.visitPage("/benefits");

    // Same session, no "_csrf" field: the server side check must reject it.
    cy.request({
      method: "POST",
      url: "/benefits",
      form: true,
      body: {
        benefitStartDate: "2099-12-31"
      },
      failOnStatusCode: false
    })
      .its("status")
      .should("eq", 403);
  });
});
