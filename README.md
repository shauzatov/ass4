# Online Store — WT2 Final Project (Full-Stack App)

A production-ready **full-stack Online Store** application built with **Node.js/Express + MongoDB (Atlas)** and a **vanilla HTML/CSS/JS frontend** served by the backend.  
The project implements **JWT authentication**, **Role-Based Access Control (RBAC)**, full CRUD for business entities, relational integrity between MongoDB documents, and is deployed live on the web.

---

## Live Demo

- **Production URL:** https://ass4-7g65.onrender.com  
- **API Base URL:** https://ass4-7g65.onrender.com

> If you redeploy and Render changes your URL, update this section.

---

## Project Goals (Final Requirements Mapping)

This final project transforms the modular authenticated API from previous assignments into a complete full-stack application:

- ✅ **Advanced Backend Completion:** all required business endpoints implemented (Products, Reviews, Orders, Auth)
- ✅ **Relational Integrity:** entities are linked correctly in MongoDB (e.g., Review → Product, Order → User & Product)
- ✅ **Advanced Middleware:** JWT auth + RBAC (admin-only operations)
- ✅ **Frontend Integration:** UI connected to API with token storage and authorized requests
- ✅ **State Management:** UI dynamically updates via JS fetch calls
- ✅ **Responsive Design:** usable on desktop and mobile
- ✅ **Deployment:** live public URL via Render + MongoDB Atlas + environment variables

---

## Features

### Authentication & Security
- User **registration** and **login**
- **JWT token** issued on login and used for protected routes
- Passwords stored securely (hashing on server side)
- Protected endpoints require `Authorization: Bearer <token>`

### RBAC (Role-Based Access Control)
- **Admin**
  - Create / Update / Delete products
  - View all orders
- **User**
  - View products and reviews
  - Create reviews (requires login)
  - Create orders (requires login)
  - View only **own** orders

### Business Logic
- **Products**
  - Public list & details
  - Admin CRUD with validation
- **Reviews**
  - Public list and product-specific list
  - Logged-in users can create reviews
- **Orders**
  - Logged-in users can create orders
  - Users can view own orders
  - Admin can view all orders

### Validation & Error Handling
- Server-side validation for key fields
- Consistent error responses:
  ```json
  { "error": "Validation failed", "details": ["..."] }
Tech Stack
Backend: Node.js, Express

Database: MongoDB Atlas, Mongoose

Auth: JSON Web Token (JWT)

Frontend: HTML, CSS, Vanilla JavaScript

Deployment: Render (backend + static frontend served by Express)

Repository Structure
Typical structure used in this project:

.
├─ server.js
├─ package.json
├─ .env.example
├─ controllers/
│  ├─ authController.js
│  ├─ productController.js
│  ├─ reviewController.js
│  └─ orderController.js
├─ routes/
│  ├─ authRoutes.js
│  ├─ productRoutes.js
│  ├─ reviewRoutes.js
│  └─ orderRoutes.js
├─ models/
│  ├─ User.js
│  ├─ Product.js
│  ├─ Review.js
│  └─ Order.js
├─ middleware/
│  ├─ auth.js
│  ├─ roles.js
│  ├─ validation.js
│  └─ error.js
└─ public/
   ├─ index.html
   ├─ styles.css
   └─ script.js
Environment Variables
Create a .env file in the project root (do not commit it). Example:

MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<dbName>?retryWrites=true&w=majority
JWT_SECRET=veryLongSecret
JWT_EXPIRES_IN=7d
PORT=3000
Notes
In production on Render, do not hardcode PORT. Render provides it automatically through process.env.PORT.

Use MongoDB Atlas connection string (Compass is only a client).

How to Run Locally
1) Install dependencies
npm install
2) Configure environment
Create .env (see above) and set:

MONGODB_URI

JWT_SECRET

JWT_EXPIRES_IN

3) Start the server
npm start
4) Open the app
Frontend (served by backend):
http://localhost:3000
(or your configured PORT)

How to Use the App (UI)
Open the website (local or live)

Go to Auth

Register a new account

Login → the app stores JWT and uses it for protected requests

If you register/login as admin, you will see Admin actions for product management

Use Products / Reviews / Orders sections to interact with the system

API Documentation
Base URL
Local: http://localhost:3000

Production: https://ass4-7g65.onrender.com

Authentication Header
For protected endpoints:

Authorization: Bearer <JWT_TOKEN>
Endpoints Overview
Auth
Method	Endpoint	Auth	Description
POST	/auth/register	No	Register a new user (role can be user or admin)
POST	/auth/login	No	Login and receive JWT token
Register Body

email (string, required)

password (string, required)

role (string, optional: user / admin)

Login Body

email (string, required)

password (string, required)

Login Response

token (string)

user (object: id/email/role)

Products
Method	Endpoint	Auth	Role	Description
GET	/products	No	—	List all products
GET	/products/:id	No	—	Get product by id
POST	/products	Yes	admin	Create product
PUT	/products/:id	Yes	admin	Update product
DELETE	/products/:id	Yes	admin	Delete product
Create/Update Fields

name (string, min 2)

category (string, required)

description (string, min 10)

price (number, >= 0)

stock (number, >= 0, optional if supported)

imageUrl (string, optional)

featured (boolean, optional)

Reviews
Method	Endpoint	Auth	Description
GET	/reviews	No	List all reviews
GET	/reviews/product/:productId	No	List reviews for a product
POST	/reviews	Yes	Create review (logged-in user)
Create Review Fields

productId (string, required)

rating (integer 1..5, required)

comment (string, min length, required)

The server links the review to the user (from JWT) and to the product.

Orders
Method	Endpoint	Auth	Role	Description
POST	/orders	Yes	user/admin	Create order
GET	/orders/my	Yes	user/admin	Get current user’s orders
GET	/orders	Yes	admin	Get all orders
Create Order Fields

productId (string, required)

quantity (integer, >= 1, required)

The server links the order to the user (from JWT) and product(s) in MongoDB.

RBAC Summary
Action	Guest	User	Admin
View products	✅	✅	✅
View reviews	✅	✅	✅
Create review	❌	✅	✅
Create order	❌	✅	✅
View my orders	❌	✅	✅
View all orders	❌	❌	✅
Create product	❌	❌	✅
Update product	❌	❌	✅
Delete product	❌	❌	✅
Deployment (Render + MongoDB Atlas)
Render Service Settings
Type: Web Service

Build Command: npm install (or npm ci)

Start Command: npm start

Render Environment Variables
Set these in Render → Service → Environment:

MONGODB_URI

JWT_SECRET

JWT_EXPIRES_IN

NODE_ENV=production

Do not set PORT manually on Render.

MongoDB Atlas Checklist
Database user created (username/password)

Network access allows Render to connect (0.0.0.0/0 for academic project)

Correct mongodb+srv://... URI used in Render env variables

Postman Collection
A Postman/Thunder Client collection is required for final submission.
Include your exported collection file in the repository root, for example:

postman_collection.json (recommended name)

Required tests
Auth: register + login

Products: GET list, GET by id, POST (admin), PUT (admin), DELETE (admin)

Reviews: GET all, GET by product, POST (auth)

Orders: POST (auth), GET my orders (auth), GET all orders (admin)

Common Troubleshooting
401 Unauthorized
Missing/incorrect Authorization: Bearer <token>

Token expired

Not logged in

403 Forbidden
You are logged in as user but trying to do admin operation

400 Bad Request
Validation failed (missing fields, wrong types, short description, etc.)

Check response body for "details" array

MongoDB connection errors on Render
Wrong username/password in URI

Password contains special characters and is not URL-encoded

Atlas Network Access does not allow your service IP

Wrong env var name in Render (must match process.env.MONGODB_URI)

Author
WT2 Final Project — Online Store
Student: Shauzat Sayakhat   

License
This project is created for educational purposes.

