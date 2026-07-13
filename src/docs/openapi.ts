// OpenAPI 3.0 specification for the whole API.
// Served at /api/docs/openapi.json and rendered by Swagger UI at /api/docs

const bearer = [{ bearerAuth: [] }];

const envelope = (dataExample: unknown, message = 'Success') => ({
  'application/json': {
    example: { success: true, message, data: dataExample },
  },
});

const errorExample = (message: string, errorDetails: unknown = message) => ({
  'application/json': {
    example: { success: false, message, errorDetails },
  },
});

const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'RentNest API',
    version: '1.0.0',
    description:
      '**Find & List Rental Properties with Ease.**\n\n' +
      'Backend API for a rental property marketplace with three roles (TENANT, LANDLORD, ADMIN), Stripe payments and reviews.\n\n' +
      '### Authentication\n' +
      'Login via `POST /api/auth/login`, copy the `accessToken`, click the **Authorize** button above and paste it.\n\n' +
      '### Demo credentials\n' +
      '| Role | Email | Password |\n|---|---|---|\n| Admin | admin@rentnest.com | admin123 |\n\n' +
      'Register your own tenant/landlord via `POST /api/auth/register`.\n\n' +
      '### Payments (Stripe test mode)\n' +
      'Create a checkout session for an APPROVED rental request, open the returned `checkoutUrl` in a browser and pay with card `4242 4242 4242 4242` (any future expiry, any CVC).\n\n' +
      '### Error format (consistent everywhere)\n' +
      '```json\n{ "success": false, "message": "...", "errorDetails": ... }\n```',
  },
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Categories' },
    { name: 'Properties (Public)' },
    { name: 'Landlord - Properties' },
    { name: 'Rentals (Tenant)' },
    { name: 'Landlord - Requests' },
    { name: 'Payments (Stripe)' },
    { name: 'Reviews' },
    { name: 'Admin' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the accessToken from the login response',
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['Health'],
        summary: 'API welcome message',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { '200': { description: 'API is running' } },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user (TENANT or LANDLORD)',
        description: 'ADMIN role cannot be registered via the API - admins are created by the seed script.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                name: 'Demo Tenant',
                email: 'demo.tenant@example.com',
                password: 'pass123',
                phone: '01700000001',
                role: 'TENANT',
              },
            },
          },
        },
        responses: {
          '201': { description: 'User registered', content: envelope({ id: 'uuid', name: 'Demo Tenant', email: 'demo.tenant@example.com', role: 'TENANT', status: 'ACTIVE' }, 'User registered successfully') },
          '400': { description: 'Validation error', content: errorExample('Validation error', [{ field: 'body.email', message: 'A valid email address is required' }]) },
          '409': { description: 'Email already exists', content: errorExample('A user with this email already exists') },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive a JWT access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { email: 'admin@rentnest.com', password: 'admin123' },
            },
          },
        },
        responses: {
          '200': { description: 'Logged in', content: envelope({ accessToken: 'eyJhbGciOi...', user: { id: 'uuid', name: 'RentNest Admin', email: 'admin@rentnest.com', role: 'ADMIN' } }, 'Logged in successfully') },
          '401': { description: 'Wrong credentials', content: errorExample('Invalid email or password') },
          '403': { description: 'Banned account', content: errorExample('Your account has been banned. Contact support') },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the currently authenticated user',
        security: bearer,
        responses: {
          '200': { description: 'Profile' },
          '401': { description: 'Missing/invalid token', content: errorExample('You are not logged in. Please provide a token') },
        },
      },
    },
    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'Get all categories with property counts (public)',
        responses: { '200': { description: 'Category list' } },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create a category (admin only)',
        security: bearer,
        requestBody: {
          required: true,
          content: { 'application/json': { example: { name: 'Penthouse' } } },
        },
        responses: {
          '201': { description: 'Created' },
          '403': { description: 'Not an admin', content: errorExample('Access denied. This route requires role: ADMIN') },
          '409': { description: 'Duplicate name' },
        },
      },
    },
    '/api/categories/{id}': {
      patch: {
        tags: ['Categories'],
        summary: 'Rename a category (admin only)',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { example: { name: 'Luxury Apartment' } } },
        },
        responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' } },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete a category (admin only, blocked while in use)',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted' },
          '400': { description: 'Category in use', content: errorExample('Cannot delete: 3 property listing(s) use this category') },
        },
      },
    },
    '/api/properties': {
      get: {
        tags: ['Properties (Public)'],
        summary: 'Browse properties with search, filters, sorting and pagination',
        parameters: [
          { name: 'searchTerm', in: 'query', schema: { type: 'string' }, description: 'Matches title, description or location (case-insensitive)' },
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'categoryId', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'integer' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'integer' } },
          { name: 'bedrooms', in: 'query', schema: { type: 'integer' } },
          { name: 'amenities', in: 'query', schema: { type: 'string' }, description: 'Comma separated, property must have ALL, e.g. wifi,parking' },
          { name: 'availability', in: 'query', schema: { type: 'string', enum: ['AVAILABLE', 'RENTED', 'UNAVAILABLE'] } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['rentAmount', 'createdAt', 'title'] } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 50 } },
        ],
        responses: { '200': { description: 'Paginated list with meta { page, limit, total, totalPages }' } },
      },
    },
    '/api/properties/{id}': {
      get: {
        tags: ['Properties (Public)'],
        summary: 'Property details with landlord contact, reviews and average rating',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Details' }, '404': { description: 'Not found (or soft-deleted)' } },
      },
    },
    '/api/landlord/properties': {
      get: {
        tags: ['Landlord - Properties'],
        summary: 'List own properties (landlord only)',
        security: bearer,
        responses: { '200': { description: 'Own listings with request/review counts' } },
      },
      post: {
        tags: ['Landlord - Properties'],
        summary: 'Create a property listing (landlord only)',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                title: 'Modern 3BR Apartment in Gulshan',
                description: 'Bright three bedroom apartment with balcony, close to shops and schools.',
                location: 'Gulshan, Dhaka',
                rentAmount: 45000,
                bedrooms: 3,
                bathrooms: 2,
                amenities: ['wifi', 'lift', 'parking'],
                images: ['https://example.com/apartment.jpg'],
                categoryId: 'uuid-from-GET-/api/categories',
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '400': { description: 'Validation error' },
          '404': { description: 'Category not found' },
        },
      },
    },
    '/api/landlord/properties/{id}': {
      put: {
        tags: ['Landlord - Properties'],
        summary: 'Update own property / set availability (owner only)',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { example: { rentAmount: 47000, availability: 'RENTED' } } },
        },
        responses: {
          '200': { description: 'Updated' },
          '403': { description: 'Not the owner', content: errorExample('You can only manage your own properties') },
        },
      },
      delete: {
        tags: ['Landlord - Properties'],
        summary: 'Soft-delete own property (owner only)',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Removed from public view' } },
      },
    },
    '/api/rentals': {
      post: {
        tags: ['Rentals (Tenant)'],
        summary: 'Submit a rental request (tenant only)',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                propertyId: 'uuid',
                moveInDate: '2026-10-01',
                durationMonths: 12,
                message: 'Hello, I am very interested in this property.',
              },
            },
          },
        },
        responses: {
          '201': { description: 'Request created as PENDING' },
          '400': { description: 'Property not available / past moveInDate' },
          '409': { description: 'Duplicate live request', content: errorExample('You already have a PENDING request for this property') },
        },
      },
      get: {
        tags: ['Rentals (Tenant)'],
        summary: 'Own rental request history with payment status (tenant only)',
        security: bearer,
        responses: { '200': { description: 'Request list' } },
      },
    },
    '/api/rentals/{id}': {
      get: {
        tags: ['Rentals (Tenant)'],
        summary: 'Rental request details (tenant owner, property landlord or admin)',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Details' },
          '403': { description: 'Not involved in this rental' },
        },
      },
    },
    '/api/landlord/requests': {
      get: {
        tags: ['Landlord - Requests'],
        summary: 'Incoming requests for own properties (landlord only)',
        security: bearer,
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED'] } },
        ],
        responses: { '200': { description: 'Requests with tenant contact info' } },
      },
    },
    '/api/landlord/requests/{id}': {
      patch: {
        tags: ['Landlord - Requests'],
        summary: 'Approve / reject a PENDING request, or complete an ACTIVE rental',
        description: 'State machine: PENDING -> APPROVED | REJECTED, ACTIVE -> COMPLETED. Completing frees the property back to AVAILABLE.',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { status: 'APPROVED', landlordNote: 'Welcome! Please complete the payment.' },
            },
          },
        },
        responses: {
          '200': { description: 'Status updated' },
          '400': { description: 'Illegal transition', content: errorExample('Cannot approve a request that is already APPROVED') },
          '403': { description: 'Not your property' },
        },
      },
    },
    '/api/payments/create': {
      post: {
        tags: ['Payments (Stripe)'],
        summary: 'Create a Stripe checkout session for an APPROVED rental (tenant only)',
        description: 'Open the returned checkoutUrl in a browser and pay with test card 4242 4242 4242 4242.',
        security: bearer,
        requestBody: {
          required: true,
          content: { 'application/json': { example: { rentalRequestId: 'uuid' } } },
        },
        responses: {
          '201': { description: 'Session created', content: envelope({ paymentId: 'uuid', checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_...' }, 'Stripe checkout session created successfully') },
          '400': { description: 'Not APPROVED / already paid' },
          '403': { description: 'Not your rental request' },
        },
      },
    },
    '/api/payments/success': {
      get: {
        tags: ['Payments (Stripe)'],
        summary: 'Stripe redirects here after payment - verifies with Stripe and activates the rental',
        parameters: [{ name: 'session_id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Payment COMPLETED, rental ACTIVE, property RENTED (atomic transaction)' },
          '400': { description: 'Stripe says not paid' },
        },
      },
    },
    '/api/payments/cancel': {
      get: {
        tags: ['Payments (Stripe)'],
        summary: 'Stripe redirects here when the tenant cancels checkout',
        responses: { '200': { description: 'Cancel notice' } },
      },
    },
    '/api/payments/webhook': {
      post: {
        tags: ['Payments (Stripe)'],
        summary: 'Stripe server-to-server webhook (signature verified, raw body)',
        responses: { '200': { description: 'Event processed' }, '400': { description: 'Invalid signature' } },
      },
    },
    '/api/payments': {
      get: {
        tags: ['Payments (Stripe)'],
        summary: 'Own payment history (tenant only)',
        security: bearer,
        responses: { '200': { description: 'Payments with rental/property info' } },
      },
    },
    '/api/payments/{id}': {
      get: {
        tags: ['Payments (Stripe)'],
        summary: 'Payment details (paying tenant, property landlord or admin)',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Details' }, '403': { description: 'Not involved' } },
      },
    },
    '/api/reviews': {
      post: {
        tags: ['Reviews'],
        summary: 'Review a property after a COMPLETED rental (tenant only, one per property)',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { propertyId: 'uuid', rating: 5, comment: 'Wonderful apartment and a very helpful landlord!' },
            },
          },
        },
        responses: {
          '201': { description: 'Review created' },
          '403': { description: 'No completed rental on this property', content: errorExample('You can only review properties where you have completed a rental') },
          '409': { description: 'Already reviewed' },
        },
      },
      get: {
        tags: ['Reviews'],
        summary: 'Own reviews (tenant only)',
        security: bearer,
        responses: { '200': { description: 'Review list' } },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'All users with counts (admin only)',
        security: bearer,
        parameters: [
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['TENANT', 'LANDLORD', 'ADMIN'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'BANNED'] } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Paginated user list' } },
      },
    },
    '/api/admin/users/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Ban or unban a user (admin only, admins are protected)',
        description: 'Bans take effect immediately - even already-issued tokens stop working.',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { example: { status: 'BANNED' } } },
        },
        responses: {
          '200': { description: 'Status updated' },
          '403': { description: 'Target is an admin', content: errorExample('Admin accounts cannot be banned or modified') },
        },
      },
    },
    '/api/admin/properties': {
      get: {
        tags: ['Admin'],
        summary: 'All properties including soft-deleted (admin only)',
        security: bearer,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Paginated list with landlord info' } },
      },
    },
    '/api/admin/rentals': {
      get: {
        tags: ['Admin'],
        summary: 'All rental requests with payment info (admin only)',
        security: bearer,
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED'] } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Paginated list' } },
      },
    },
  },
};

export default openapiSpec;
