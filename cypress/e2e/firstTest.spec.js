describe('Test With Backend', () => {


  //This is a hook to log into the system before each test
  beforeEach('login to app', () =>{
      cy.intercept({method: 'Get', path: 'tags'}, {fixture: 'tags.json'})
      cy.headlessLogin()
  })

  it('requestResponseVerification', () => {
      /*
      This is a command to intercept a certain API call. The information needs to be defined in order for this to execute properly
      First parameter of the command is the method.
      Second parameter is the URL.
      Third parameter is a response.
      This command is really flexible and for more documentation reference is the Cypress doc
      */
      cy.intercept('POST', 'https://conduit-api.bondaracademy.com/api/articles/').as('postArticles')

      cy.contains('New Article').click()
      cy.get('[placeholder="Article Title"]').type("Test Article")
      cy.get('[placeholder="What\'s this article about?"]').type("Test Description")
      cy.get('[placeholder="Write your article (in markdown)"]').type("Test Body of the Article")
      cy.get('[placeholder="Enter tags"]').type("Tag 1")
      cy.contains('Publish Article').click()

      cy.wait('@postArticles').then(xhr => {
        console.log(xhr)
        expect(xhr.response.statusCode).to.equal(201)
        expect(xhr.request.body.article.body).to.equal("Test Body of the Article")
        expect(xhr.response.body.article.description).to.equal("Test Description")
      })
      cy.get('.article-actions').contains('Delete Article').click()
  })

  //This test case is used to check if the fixture in beforeEach method inside "intercept" works properly.
  it('editPopularTags', () => {
    cy.get('.tag-list')
    .should('contain', 'Cypress')
    .and('contain', 'Automation')
    .and('contain', 'Testing')
  })

  //This is a more complex test case to verify that the functionality of the favourite articles works properly.
  it('verifyFavourites', () => {
    //This intercept describes the API call for Global Feed Tab of the site.
    cy.intercept('GET', 'https://conduit-api.bondaracademy.com/api/articles*', {fixture: 'articles.json'})

    //This chain of commands serves to verify that the information from the fixture is properly setup.
    cy.contains('Global Feed').click()
    cy.get('app-article-list button').then(buttonList => {
      expect(buttonList[0]).to.contain('1')
    })

    //This command (cy.fixture) serves to read the fixture file and modify it as needed. For reference go to example.json.
    cy.fixture('articles.json').then(file => {
      const articleLink = file.articles[0].slug
      file.articles[0].favoritesCount = 2
      //This intercept is listening to the favouriting action.
      cy.intercept('POST', 'https://conduit-api.bondaracademy.com/api/articles/'+articleLink+'/favorite', file)

      //This chain of commands serves as a verification for the result of the "favourite" action.
      cy.get('app-article-list button').eq(0).click()
      .should('match','.btn-primary')
    })
  })

  it('Intercept + Modify Request + Response', () => {
      // cy.intercept('POST', '**/articles', (req) =>{
      //   req.body.article.description = "Modified Description"
      // }).as('postArticles')

      /*
      This intercept serves as means to modify the API response and request before anything.
      The result will be the following: the modified data from the intercept command will be posted
      instead of anything in the commands that go after it.
      */
      cy.intercept('POST', '**/articles', (req) =>{
        req.reply( res => {
          expect(res.body.article.description).to.equal("Test Description")
          res.body.article.description = "Modified Description"
        })
      }).as('postArticles')

      cy.contains('New Article').click()
      cy.get('[placeholder="Article Title"]').type("Test Article")
      cy.get('[placeholder="What\'s this article about?"]').type("Test Description")
      cy.get('[placeholder="Write your article (in markdown)"]').type("Test Body of the Article")
      cy.get('[placeholder="Enter tags"]').type("Tag 1")
      cy.contains('Publish Article').click()

      cy.wait('@postArticles').then(xhr => {
        console.log(xhr)
        expect(xhr.response.statusCode).to.equal(201)
        expect(xhr.request.body.article.body).to.equal("Test Body of the Article")
        expect(xhr.response.body.article.description).to.equal("Modified Description")
      })
      cy.get('.article-actions').contains('Delete Article').click()
  })

  //Test Case to delete the created article.
  it('deleting what was created', () => {

    //This is a var to contain my test login creds
    // const creds = {
    //   "user": {
    //     "email": "crossarch@test.com",
    //     "password": "Test1Test2Test3"
    //   }
    // }

    //This is an API request to post my login credentials to retrieve auth token from the response body.
    //cy.loginToApp()
    cy.get('@token').then(token => {
      const requestBody = {
        "article":{"title":"API Testing","description":"API Testing is Easy","body":"Angular is cool","tagList":["Test"]}
      }

      //This is an API call to post a new article through the API call.
      cy.request({
        url: 'https://conduit-api.bondaracademy.com/api/articles',
        headers: { 'Authorization': 'Token '+token },
        method: 'POST',
        body:requestBody
      }).then( response => {
        //This is a verification via API status that the article was actually posted.
        expect(response.status).to.equal(201)
      })

      //This is a chain of commands to proceed to the article view.
      cy.contains('Global Feed').click()
      //Yes, this thing is damn slow in rendering a new page.
      cy.wait(5000)
      cy.get('.article-preview').first().click()
      cy.get('.article-actions').contains('Delete Article').click()

      //This is an API request to retreive the information about the article listing.
      cy.wait(5000)
      cy.request({
        url: 'https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0',
        headers: { 'Authorization': 'Token '+token },
        method: 'GET'
      }).its('body').then( body => {
        //This is a verification for the article listing that it doesn't contain the test article and it was deleted.
        expect(body.articles[0].title).not.to.equal("API Testing")
      })
    })
  })

})