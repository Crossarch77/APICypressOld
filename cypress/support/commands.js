// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })


//This is a custom command to log into the application.
Cypress.Commands.add('loginToApp', () => {
    cy.visit('/login')
    cy.get('[placeholder="Email"]').type("crossarch@test.com")
    cy.get('[placeholder="Password"]').type("Test1Test2Test3")
    cy.get('form').submit()
})

//Headless auth

Cypress.Commands.add('headlessLogin', () => {
    const creds = {
      "user": {
        "email": "crossarch@test.com",
        "password": "Test1Test2Test3"
        }
    }   

    cy.request('POST','https://conduit-api.bondaracademy.com/api/users/login', creds)
    .its('body').then( body => {
        const token = body.user.token
        cy.wrap(token).as('token')
        cy.visit('/'), {
            //Request from the Window object before load.
            onBeforeLoad (win){
                //This is setting the Local Storage which's found 
                //in Application tab with a new pair of key/value for headless auth.
                win.localStorage.setItem('jwtToken', token)
            }
        }
    })
})