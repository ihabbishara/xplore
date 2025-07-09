describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('User Registration', () => {
    it('should successfully register a new user', () => {
      // Navigate to registration page
      cy.get('[data-testid="auth-menu"]').click()
      cy.get('[data-testid="register-link"]').click()
      cy.url().should('include', '/auth/register')

      // Fill registration form
      cy.get('input[name="firstName"]').type('John')
      cy.get('input[name="lastName"]').type('Doe')
      cy.get('input[name="email"]').type('john.doe@example.com')
      cy.get('input[name="password"]').type('SecurePassword123!')
      cy.get('input[name="confirmPassword"]').type('SecurePassword123!')

      // Submit form
      cy.get('button[type="submit"]').click()

      // Should redirect to onboarding
      cy.url().should('include', '/onboarding')
      cy.contains('Welcome, John!').should('be.visible')
    })

    it('should show validation errors for invalid inputs', () => {
      cy.visit('/auth/register')

      // Submit empty form
      cy.get('button[type="submit"]').click()

      // Check validation messages
      cy.contains('First name is required').should('be.visible')
      cy.contains('Email is required').should('be.visible')
      cy.contains('Password is required').should('be.visible')

      // Test email validation
      cy.get('input[name="email"]').type('invalid-email')
      cy.get('input[name="email"]').blur()
      cy.contains('Invalid email address').should('be.visible')

      // Test password validation
      cy.get('input[name="password"]').type('weak')
      cy.get('input[name="password"]').blur()
      cy.contains('Password must be at least 8 characters').should('be.visible')
    })

    it('should handle duplicate email registration', () => {
      cy.visit('/auth/register')

      // Fill form with existing email
      cy.get('input[name="firstName"]').type('Jane')
      cy.get('input[name="lastName"]').type('Doe')
      cy.get('input[name="email"]').type('existing@example.com')
      cy.get('input[name="password"]').type('SecurePassword123!')
      cy.get('input[name="confirmPassword"]').type('SecurePassword123!')

      // Mock API response for duplicate email
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 409,
        body: { error: 'User with this email already exists' },
      }).as('registerDuplicate')

      cy.get('button[type="submit"]').click()
      cy.wait('@registerDuplicate')

      // Check error message
      cy.contains('User with this email already exists').should('be.visible')
    })
  })

  describe('User Login', () => {
    it('should successfully login with valid credentials', () => {
      cy.visit('/auth/login')

      // Fill login form
      cy.get('input[name="email"]').type('user@example.com')
      cy.get('input[name="password"]').type('SecurePassword123!')

      // Mock successful login
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
            emailVerified: true,
            profile: {
              firstName: 'Test',
              lastName: 'User',
            },
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          },
        },
      }).as('login')

      cy.get('button[type="submit"]').click()
      cy.wait('@login')

      // Should redirect to home
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      cy.get('[data-testid="user-menu"]').should('contain', 'Test User')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/auth/login')

      cy.get('input[name="email"]').type('wrong@example.com')
      cy.get('input[name="password"]').type('WrongPassword')

      // Mock failed login
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { error: 'Invalid email or password' },
      }).as('loginFailed')

      cy.get('button[type="submit"]').click()
      cy.wait('@loginFailed')

      cy.contains('Invalid email or password').should('be.visible')
    })

    it('should remember user with "Remember me" checked', () => {
      cy.visit('/auth/login')

      cy.get('input[name="email"]').type('user@example.com')
      cy.get('input[name="password"]').type('SecurePassword123!')
      cy.get('input[name="rememberMe"]').check()

      // Mock successful login
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
            emailVerified: true,
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          },
        },
      }).as('login')

      cy.get('button[type="submit"]').click()
      cy.wait('@login')

      // Check that refresh token is stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('refreshToken')).to.exist
      })
    })
  })

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Login first
      cy.login('user@example.com', 'SecurePassword123!')
    })

    it('should successfully logout', () => {
      // Click user menu
      cy.get('[data-testid="user-menu"]').click()
      
      // Mock logout API
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
        body: { message: 'Logged out successfully' },
      }).as('logout')

      // Click logout
      cy.get('[data-testid="logout-button"]').click()
      cy.wait('@logout')

      // Should redirect to login
      cy.url().should('include', '/auth/login')
      
      // User menu should not be visible
      cy.get('[data-testid="user-menu"]').should('not.exist')
      
      // Tokens should be cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.be.null
        expect(win.localStorage.getItem('refreshToken')).to.be.null
      })
    })
  })

  describe('Email Verification', () => {
    it('should verify email with valid token', () => {
      const verificationToken = 'valid-token-123'
      
      // Mock verification API
      cy.intercept('POST', '/api/auth/verify-email', {
        statusCode: 200,
        body: { message: 'Email verified successfully' },
      }).as('verifyEmail')

      cy.visit(`/auth/verify-email?token=${verificationToken}`)
      cy.wait('@verifyEmail')

      // Should show success message
      cy.contains('Email verified successfully').should('be.visible')
      
      // Should show login link
      cy.contains('Login to your account').click()
      cy.url().should('include', '/auth/login')
    })

    it('should show error for invalid token', () => {
      const invalidToken = 'invalid-token'
      
      // Mock verification API error
      cy.intercept('POST', '/api/auth/verify-email', {
        statusCode: 400,
        body: { error: 'Invalid verification token' },
      }).as('verifyEmailFailed')

      cy.visit(`/auth/verify-email?token=${invalidToken}`)
      cy.wait('@verifyEmailFailed')

      // Should show error message
      cy.contains('Invalid verification token').should('be.visible')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/trips')
      cy.url().should('include', '/auth/login')
      cy.contains('Please login to continue').should('be.visible')
    })

    it('should allow access to protected routes when authenticated', () => {
      // Login first
      cy.login('user@example.com', 'SecurePassword123!')
      
      // Visit protected route
      cy.visit('/trips')
      cy.url().should('include', '/trips')
      cy.contains('My Trips').should('be.visible')
    })
  })

  describe('Session Management', () => {
    it('should refresh token automatically when access token expires', () => {
      // Login
      cy.login('user@example.com', 'SecurePassword123!')
      
      // Mock API call that returns 401 (token expired)
      cy.intercept('GET', '/api/locations', (req) => {
        if (req.headers.authorization === 'Bearer expired-token') {
          req.reply({
            statusCode: 401,
            body: { error: 'Token expired' },
          })
        } else {
          req.reply({
            statusCode: 200,
            body: { locations: [] },
          })
        }
      }).as('getLocations')

      // Mock refresh token endpoint
      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 200,
        body: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      }).as('refresh')

      // Trigger API call
      cy.visit('/locations')
      
      // Should attempt refresh
      cy.wait('@refresh')
      
      // Should retry original request with new token
      cy.wait('@getLocations')
      
      // Page should load successfully
      cy.contains('Explore Locations').should('be.visible')
    })

    it('should logout when refresh token is invalid', () => {
      // Set invalid refresh token
      cy.window().then((win) => {
        win.localStorage.setItem('refreshToken', 'invalid-refresh-token')
      })

      // Mock refresh failure
      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 401,
        body: { error: 'Invalid refresh token' },
      }).as('refreshFailed')

      // Visit protected route
      cy.visit('/trips')
      
      // Should attempt refresh and fail
      cy.wait('@refreshFailed')
      
      // Should redirect to login
      cy.url().should('include', '/auth/login')
      cy.contains('Session expired. Please login again').should('be.visible')
    })
  })
})