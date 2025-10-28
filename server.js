// server.js - Complete Express server for Week 2 assignment

// -------------------------------------------------------------------
// 1. Configuration and Imports (Task 1)
// -------------------------------------------------------------------
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Load environment variables from .env file
require('dotenv').config();

// Initialize Express app
const app = express();

// Load sensitive configuration from environment variables
// Using process.env.PORT as per the starter code
const PORT = process.env.PORT || 3000; 

// API Key loaded from .env (API_KEY)
const API_KEY = process.env.API_KEY || 'default-secret-key-fallback'; 

// -------------------------------------------------------------------
// 2. Custom Error Classes (Task 4)
// -------------------------------------------------------------------
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

class ValidationError extends Error {
    constructor(message, details = []) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.details = details;
    }
}

class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = 401;
    }
}

// -------------------------------------------------------------------
// 3. Data Store (Starter code data)
// -------------------------------------------------------------------
let products = [
    {
        id: '1',
        name: 'Laptop',
        description: 'High-performance laptop with 16GB RAM',
        price: 1200,
        category: 'electronics',
        inStock: true
    },
    {
        id: '2',
        name: 'Smartphone',
        description: 'Latest model with 128GB storage',
        price: 800,
        category: 'electronics',
        inStock: true
    },
    {
        id: '3',
        name: 'Coffee Maker',
        description: 'Programmable coffee maker with timer',
        price: 50,
        category: 'kitchen',
        inStock: false
    }
];

// -------------------------------------------------------------------
// 4. Middlewares (Task 3)
// -------------------------------------------------------------------

// 4.1. Request Logging Middleware (Task 3)
const loggerMiddleware = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
};

// 4.2. Authentication Middleware (Task 3)
const authenticateMiddleware = (req, res, next) => {
    const apiKey = req.header('x-api-key');

    // Uses the API_KEY loaded from process.env
    if (!apiKey || apiKey !== API_KEY) {
        return next(new AuthenticationError('Authentication failed. Invalid or missing API key.'));
    }

    next();
};

// 4.3. Validation Middleware (Task 3)
const validateProduct = (req, res, next) => {
    const { name, price, category, inStock } = req.body;
    let errors = [];

    if (!name || typeof name !== 'string' || name.length < 3) {
        errors.push("Name: required, string, min 3 characters.");
    }
    if (price === undefined || typeof price !== 'number' || price <= 0) {
        errors.push("Price: required, positive number.");
    }
    if (!category || typeof category !== 'string') {
        errors.push("Category: required, string.");
    }
    if (inStock !== undefined && typeof inStock !== 'boolean') {
        errors.push("inStock: must be a boolean (true/false) if provided.");
    }

    if (errors.length > 0) {
        return next(new ValidationError('Product data validation failed.', errors));
    }

    next();
};

// Global Middleware setup (Task 1 & 3)
app.use(loggerMiddleware); // Custom logger
app.use(bodyParser.json()); // JSON body parser 

// -------------------------------------------------------------------
// 5. Routes (Task 2 & 5)
// -------------------------------------------------------------------
const API_PREFIX = '/api/products';

// Root route (Task 1)
app.get('/', (req, res) => {
    res.send('Welcome to the Product API! Go to /api/products to see all products.');
});

// GET /api/products: List all, with Filtering & Pagination (Task 2 & 5)
app.get(API_PREFIX, (req, res) => {
    let filteredProducts = [...products];
    const { category, page = 1, limit = 10 } = req.query;

    // Filtering by Category
    if (category) {
        filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;

    const results = {};
    results.totalItems = filteredProducts.length;
    results.totalPages = Math.ceil(filteredProducts.length / limitNum);
    results.currentPage = pageNum;
    
    results.products = filteredProducts.slice(startIndex, endIndex);

    res.json(results);
});

// GET /api/products/search: Search endpoint (Task 5)
app.get(`${API_PREFIX}/search`, (req, res, next) => {
    const { q } = req.query; 

    if (!q) {
        return next(new ValidationError('Search query (q) parameter is required.'));
    }

    const searchQuery = q.toLowerCase();
    
    const searchResults = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery) ||
        p.description.toLowerCase().includes(searchQuery)
    );

    res.json(searchResults);
});

// GET /api/products/stats: Statistics endpoint (Task 5)
app.get(`${API_PREFIX}/stats`, (req, res) => {
    const countByCategory = products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
    }, {});
    
    res.json({
        totalProducts: products.length,
        inStockCount: products.filter(p => p.inStock).length,
        countByCategory
    });
});

// GET /api/products/:id: Get a specific product (Task 2)
app.get(`${API_PREFIX}/:id`, (req, res, next) => {
    const { id } = req.params;
    const product = products.find(p => p.id === id);

    if (!product) {
        return next(new NotFoundError(`Product with id ${id} not found.`));
    }

    res.json(product);
});

// POST /api/products: Create a new product (Task 2, 3, 4)
app.post(API_PREFIX, authenticateMiddleware, validateProduct, (req, res, next) => {
    try {
        const newProduct = {
            id: uuidv4(),
            ...req.body,
            inStock: req.body.inStock !== undefined ? req.body.inStock : true
        };
        products.push(newProduct);
        res.status(201).json(newProduct); // 201 Created
    } catch (error) {
        next(error);
    }
});

// PUT /api/products/:id: Update an existing product (Task 2, 3, 4)
app.put(`${API_PREFIX}/:id`, authenticateMiddleware, validateProduct, (req, res, next) => {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return next(new NotFoundError(`Product with id ${id} not found for update.`));
    }

    products[productIndex] = {
        ...products[productIndex],
        ...req.body,
        id: id // Ensure ID remains unchanged
    };

    res.json(products[productIndex]);
});

// DELETE /api/products/:id: Delete a product (Task 2, 4)
app.delete(`${API_PREFIX}/:id`, (req, res, next) => {
    const { id } = req.params;
    const initialLength = products.length;

    products = products.filter(p => p.id !== id);

    if (products.length === initialLength) {
        return next(new NotFoundError(`Product with id ${id} not found for deletion.`));
    }

    res.status(204).send(); // 204 No Content
});

// -------------------------------------------------------------------
// 6. Error Handling (Task 4)
// -------------------------------------------------------------------

// 404 Not Found Middleware (Catch-all for non-existent routes)
app.use((req, res, next) => {
    res.status(404).json({ 
        status: 'error',
        message: `Route ${req.originalUrl} not found.`
    });
});

// Global Error Handling Middleware (Task 4) - MUST be the LAST app.use()
app.use((err, req, res, next) => {
    console.error(`GLOBAL ERROR CATCH: [${err.name}] - ${err.message}`);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    const responseBody = {
        status: 'error',
        message: message
    };
    
    // Include validation details if available
    if (err instanceof ValidationError && err.details.length > 0) {
        responseBody.details = err.details;
    }

    res.status(statusCode).json(responseBody);
});


// -------------------------------------------------------------------
// 7. Server Initialization (Task 1)
// -------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // Log the key being used (optional, for development purposes)
    console.log(`Test API Key in use: ${API_KEY}`); 
});

// Export the app for testing purposes
module.exports = app;