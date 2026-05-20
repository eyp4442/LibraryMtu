# LibraryMtu
Library website for mtu class project
LibraryMtu is a web-based library management system developed as a course project.  
The project includes book management, member management, loan/return operations, reservation features, user registration approval, role-based authorization, and a React frontend connected to an ASP.NET Core Web API backend.

## Technologies Used

### Backend
- ASP.NET Core Web API (.NET 9)
- Entity Framework Core
- MySQL
- ASP.NET Identity
- JWT Authentication
- Docker
- Swagger / OpenAPI

### Frontend
- React
- JavaScript
- npm
- Axios

### Version Control
- Git
- GitHub

## Project Structure

LibraryMtu
├── backend
│   └── Library.Api
├── frontend
├── docker-compose.yml
└── README.md
Main Features
Public book listing and book detail pages
Category management
Book copy and barcode management
Member management
Loan checkout and return operations
Return approval workflow
Overdue loan listing
Book reservation system
User registration request system
Admin/Librarian approval for registration requests
User profile management
Email change request and approval workflow
JWT-based login system
Role-based authorization:
Admin
Librarian
User
Demo Accounts

The following accounts are created automatically for local development and demo purposes.

Admin
Username: admin
Password: admin123

Librarian
Username: librarian1
Password: 123456

User
Username: user1
Password: 123456

These accounts are only for local/demo usage. They should not be used in a production environment.

Running the Project
1. Start the Database with Docker

Run this command in the project root folder:

docker compose up -d

You can check whether the database container is running with:

docker ps
2. Run the Backend

Open a terminal in the project root folder and run:

cd backend\Library.Api
dotnet restore
dotnet build
dotnet run

Swagger UI should be available at:

http://localhost:5086/swagger

The port may be different depending on your local environment. Check the terminal output after running the backend.

3. Run the Frontend

Open another terminal in the project root folder and run:

cd frontend
npm install
npm run dev

The frontend usually runs at:

http://localhost:5173
Local Database Configuration

The project uses MySQL with Docker for local development.

Default local database settings:

Database: librarydb
User: appuser
Password: apppass
Port: 3306

These values are intended only for local development and demo usage.

API Authentication

The backend uses JWT authentication.

After a successful login, the API returns:

Access token
Refresh token
User role
Token expiration information

Protected endpoints require the access token to be sent with the following header:

Authorization: Bearer <accessToken>
Useful Endpoints
Authentication
POST /api/Auth/login
POST /api/Auth/register-request
POST /api/Auth/refresh
POST /api/Auth/logout
Books
GET    /api/Books
GET    /api/Books/{id}
POST   /api/Books
PUT    /api/Books/{id}
DELETE /api/Books/{id}
Categories
GET    /api/Categories
GET    /api/Categories/{id}
POST   /api/Categories
PUT    /api/Categories/{id}
DELETE /api/Categories/{id}
Members
GET    /api/Members
GET    /api/Members/{id}
POST   /api/Members
PUT    /api/Members/{id}
DELETE /api/Members/{id}
Loans
POST /api/Loans/checkout
POST /api/Loans/return
GET  /api/Loans/overdue
GET  /api/Loans/pending-return
POST /api/Loans/{id}/approve-return
POST /api/Loans/{id}/reject-return
POST /api/Loans/{id}/renew
Current User
GET  /api/Me/profile
PUT  /api/Me/profile
GET  /api/Me/loans
GET  /api/Me/reservations
POST /api/Me/email-change-request
POST /api/Me/loans/{id}/renew
POST /api/Me/loans/{id}/request-return
Notes
This project was developed for educational purposes.
The database credentials, JWT key, and demo user accounts are intended only for local development.
Production environments should use secure secret management and stronger credentials.
The repository is public for project review, but direct write access is restricted.
