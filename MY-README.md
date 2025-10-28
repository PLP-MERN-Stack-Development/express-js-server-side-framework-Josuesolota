# Express.js RESTful API - Product Management

This project implements a fully functional RESTful API using **Express.js** to manage product resources. It fulfills all requirements, including standard CRUD operations, custom middleware (logging, authentication, validation), robust error handling, and advanced features like filtering, pagination, and search.

## 🛠️ Setup

### Prerequisites

* Node.js (v18 or higher recommended)
* npm (comes with Node.js)

### Installation

1.  **Initialize and Install Dependencies:**
    Install the necessary packages, including `dotenv` to handle environment variables:
    ```bash
    npm install express body-parser uuid dotenv
    ```

2.  **Configuration:**
    Create a file named **`.env`** in the root directory and populate it with your environment variables (see the `.env.example` section below).

3.  **Start the Server:**
    Run the main server file:
    ```bash
    node server.js
    ```
    The server will be running at the port defined in your `.env` file (e.g., `http://localhost:3000`).

## 🔒 Environment Variables

This project requires environment variables to run securely and correctly. These variables are defined in a **`.env`** file which is loaded using the `dotenv` package.

### `.env.example`

You must create a **`.env`** file based on this example, filling in the actual values.

.env.example
The port the server should listen on
PORT=3000

API_KEY: Secret key required by the authentication middleware (x-api-key header).
This key is used for authentication on POST and PUT routes.
API_KEY=super-secret-key-123


---

## 💡 API Endpoint Documentation

All endpoints are prefixed with `/api/`. Routes marked with **(🔑)** require the `x-api-key` header to be present with the value defined by the `API_KEY` variable.

| Method | Endpoint | Description | Requires Auth (🔑) | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Welcome/Health check route. | No | 200 |
| `GET` | `/api/products` | Lists all products. Supports `?category=x`, `?page=1`, `?limit=5` for filtering and pagination. | No | 200 |
| `GET` | `/api/products/:id` | Retrieves a single product by its unique ID. | No | 200, **404** (Not Found) |
| `GET` | `/api/products/search?q=query` | Searches products by name or description. | No | 200, **400** (Validation) |
| `GET` | `/api/products/stats` | Returns aggregated statistics (e.g., count by category). | No | 200 |
| `POST` | `/api/products` | Creates a new product. Requires valid JSON body. | Yes (🔑) | **201** (Created), **400**, **401** |
| `PUT` | `/api/products/:id` | Updates an existing product by ID. Requires valid JSON body. | Yes (🔑) | 200, **400**, **401**, **404** |
| `DELETE` | `/api/products/:id` | Deletes a product by ID. | No | **204** (No Content), **404** |

---

## ⚙️ Key Project Features

### Middleware Implementation

| Middleware | Purpose |
| :--- | :--- |
| **Logger** (`loggerMiddleware`) | Logs the request method, URL, and timestamp. |
| **Authentication** (`authenticateMiddleware`) | Checks for the `x-api-key` header on protected routes. |
| **Validation** (`validateProduct`) | Validates required fields and data types on `POST` and `PUT` requests, returning a detailed `400 Bad Request` if validation fails. |

### Error Handling

* **Custom Error Classes:** Implemented `NotFoundError`, `ValidationError`, and `AuthenticationError` for specific error types.
* **Global Handler:** Catches all synchronous and asynchronous errors and returns a