/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('include', '/')
})

// Custom command to logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/auth/login')
})

// Custom command to register a new user
Cypress.Commands.add('register', (user: {
  name: string
  email: string
  password: string
}) => {
  cy.visit('/auth/register')
  cy.get('input[name="name"]').type(user.name)
  cy.get('input[name="email"]').type(user.email)
  cy.get('input[name="password"]').type(user.password)
  cy.get('button[type="submit"]').click()
})

// Custom command to wait for API
Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.intercept('GET', '**/api/**').as(alias)
  cy.wait(`@${alias}`)
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
      register(user: { name: string; email: string; password: string }): Chainable<void>
      waitForApi(alias: string): Chainable<void>
    }
  }
}

export {}