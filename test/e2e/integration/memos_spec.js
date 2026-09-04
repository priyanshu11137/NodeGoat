/// <reference types="Cypress" />

describe("/memos behaviour", () => {
  "use strict";

  before(() => {
    cy.dbReset();
  });

  afterEach(() => {
    cy.visitPage("/logout");
  });

  it("Should redirect if the user has not logged in", () => {
    cy.visitPage("/memos");
    cy.url().should("include", "login");
  });

  it("Should be accesible for a logged user", () => {
    cy.userSignIn();
    cy.visitPage("/memos");
    cy.url().should("include", "memos");
  });

  it("Should exists a textarea", () => {
    cy.userSignIn();
    cy.visitPage("/memos");
    cy.get("textarea[name='memo']");
  });

  it("Should memo be generated", () => {
    const text = "Hello World!";

    cy.userSignIn();
    cy.visitPage("/memos");
    cy.get("textarea[name='memo']")
      .clear()
      .type(text);

    cy.get("button[type='submit']")
      .click();

    cy.url().should("include", "memos");

    cy.get(".panel-body > p")
      .should("be.visible")
      .contains(text);
  });

  it("Should reject a memo posted without a CSRF token", () => {
    cy.userSignIn();
    cy.visitPage("/memos");

    // Same session, no "_csrf" field: the server side check must reject it.
    cy.request({
      method: "POST",
      url: "/memos",
      form: true,
      body: {
        memo: "Forged memo"
      },
      failOnStatusCode: false
    })
      .its("status")
      .should("eq", 403);
  });
});
