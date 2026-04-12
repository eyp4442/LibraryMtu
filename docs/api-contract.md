# Library System API Contract (v0.4)

## Conventions
- Base path: `/api`
- JSON naming: `camelCase`
- Auth: `Authorization: Bearer <accessToken>`
- API date format: ISO-8601 (örnek: `2026-04-11T12:34:56Z`)
- UI display date format: `dd.MM.yyyy HH:mm`

## Roles
- `Admin`: full system access, user and role management
- `Librarian`: library operations such as books, copies, members, loans and return approval
- `User`: book search, reservations and own loan tracking

## Standard Error Format
All errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": [
      {
        "field": "title",
        "message": "Required"
      }
    ]
  }
}
```

---

## Auth

### POST /api/auth/login

Request:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response (200):

```json
{
  "accessToken": "<jwt>",
  "expiresIn": 3600,
  "role": "Admin"
}
```

Possible role values:
- `Admin`
- `Librarian`
- `User`

Notes:
- Hatalı kullanıcı adı veya şifre durumunda `401 Unauthorized` döner.
- Hata kodu: `AUTH_INVALID_CREDENTIALS`

### POST /api/auth/logout

Notes:
- JWT kullanıldığında istemci token'ı siler.
- Bu endpoint opsiyoneldir.

---

## Categories

### GET /api/categories

Response (200):

```json
{
  "items": [
    {
      "id": 1,
      "name": "Software"
    },
    {
      "id": 2,
      "name": "Science Fiction"
    }
  ]
}
```

### GET /api/categories/{id}

Response (200):

```json
{
  "id": 1,
  "name": "Software"
}
```

### POST /api/categories

Authorization:
- Admin or Librarian

Request:

```json
{
  "name": "Software"
}
```

Response (201):

```json
{
  "id": 1,
  "name": "Software"
}
```

### PUT /api/categories/{id}

Authorization:
- Admin or Librarian

Request:

```json
{
  "name": "Software Engineering"
}
```

Response (200):

```json
{
  "id": 1,
  "name": "Software Engineering"
}
```

### DELETE /api/categories/{id}

Authorization:
- Admin or Librarian

Response (204)

Notes:
- Category can be deleted only if there are no books connected to it.

---

## Books

### GET /api/books

Query params:
- `query` (optional, title or general text search)
- `title` (optional)
- `author` (optional)
- `publisher` (optional)
- `publishedYear` (optional)
- `isbn` (optional)
- `categoryId` (optional)
- `language` (optional)
- `availableOnly` (optional)
- `page` (default: 1)
- `pageSize` (default: 20)
- `sortBy` (optional, example: `title`, `publishedYear`, `author`)
- `sortDirection` (optional, `asc` or `desc`)

Response (200):

```json
{
  "items": [
    {
      "id": 1,
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "isbn": "9780132350884",
      "publishedYear": 2008,
      "publisher": "Prentice Hall",
      "language": "English",
      "pageCount": 464,
      "description": "A book about writing clean code.",
      "coverImageUrl": "/images/books/clean-code.jpg",
      "categoryId": 1,
      "categoryName": "Software",
      "availableCopyCount": 2,
      "totalCopyCount": 3
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

### GET /api/books/{id}

Response (200):

```json
{
  "id": 1,
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "isbn": "9780132350884",
  "publishedYear": 2008,
  "publisher": "Prentice Hall",
  "language": "English",
  "pageCount": 464,
  "description": "A book about writing clean code.",
  "coverImageUrl": "/images/books/clean-code.jpg",
  "categoryId": 1,
  "categoryName": "Software",
  "availableCopyCount": 2,
  "totalCopyCount": 3
}
```

### POST /api/books

Authorization:
- Admin or Librarian

Request:

```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "isbn": "9780132350884",
  "publishedYear": 2008,
  "publisher": "Prentice Hall",
  "language": "English",
  "pageCount": 464,
  "description": "A book about writing clean code.",
  "coverImageUrl": "/images/books/clean-code.jpg",
  "categoryId": 1
}
```

Response (201):

```json
{
  "id": 1,
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "isbn": "9780132350884",
  "publishedYear": 2008,
  "publisher": "Prentice Hall",
  "language": "English",
  "pageCount": 464,
  "description": "A book about writing clean code.",
  "coverImageUrl": "/images/books/clean-code.jpg",
  "categoryId": 1,
  "categoryName": "Software"
}
```

### PUT /api/books/{id}

Authorization:
- Admin or Librarian

Request:

```json
{
  "title": "Clean Code - Updated",
  "author": "Robert C. Martin",
  "isbn": "9780132350884",
  "publishedYear": 2008,
  "publisher": "Prentice Hall",
  "language": "English",
  "pageCount": 464,
  "description": "Updated description.",
  "coverImageUrl": "/images/books/clean-code.jpg",
  "categoryId": 1
}
```

Response (200):

```json
{
  "id": 1,
  "title": "Clean Code - Updated",
  "author": "Robert C. Martin",
  "isbn": "9780132350884",
  "publishedYear": 2008,
  "publisher": "Prentice Hall",
  "language": "English",
  "pageCount": 464,
  "description": "Updated description.",
  "coverImageUrl": "/images/books/clean-code.jpg",
  "categoryId": 1,
  "categoryName": "Software"
}
```

### DELETE /api/books/{id}

Authorization:
- Admin or Librarian

Response (204)

### POST /api/books/import

Authorization:
- Admin or Librarian

Request:

```json
{
  "source": "external-api",
  "externalBookId": "OL12345W"
}
```

Response (201):

```json
{
  "id": 25,
  "title": "Imported Book",
  "author": "Example Author",
  "isbn": "9780000000000",
  "publishedYear": 2020,
  "publisher": "Example Publisher",
  "language": "English",
  "pageCount": 300,
  "description": "Imported from external source.",
  "coverImageUrl": "/images/books/imported-book.jpg",
  "categoryId": 2,
  "categoryName": "Science Fiction"
}
```

Notes:
- This endpoint is optional and can be used if book metadata is fetched from an external source.

---

## Book Copies

### GET /api/books/{bookId}/copies

Authorization:
- Admin or Librarian

Response (200):

```json
{
  "items": [
    {
      "id": 10,
      "bookId": 1,
      "barcode": "BC-00010",
      "status": "Available"
    },
    {
      "id": 11,
      "bookId": 1,
      "barcode": "BC-00011",
      "status": "PendingReturnApproval"
    }
  ]
}
```

### POST /api/books/{bookId}/copies

Authorization:
- Admin or Librarian

Request:

```json
{
  "barcode": "BC-00010"
}
```

Response (201):

```json
{
  "id": 10,
  "bookId": 1,
  "barcode": "BC-00010",
  "status": "Available"
}
```

### DELETE /api/copies/{copyId}

Authorization:
- Admin or Librarian

Response (204)

Book copy status values:
- `Available`
- `Reserved`
- `Loaned`
- `PendingReturnApproval`
- `Lost`
- `Damaged`
- `Maintenance`

---

## Members

### GET /api/members

Authorization:
- Admin or Librarian

Response (200):

```json
{
  "items": [
    {
      "id": 1,
      "fullName": "Ali Veli",
      "email": "ali@example.com",
      "phone": "05550000000",
      "address": "Malatya"
    }
  ]
}
```

### GET /api/members/{id}

Authorization:
- Admin or Librarian

Response (200):

```json
{
  "id": 1,
  "fullName": "Ali Veli",
  "email": "ali@example.com",
  "phone": "05550000000",
  "address": "Malatya"
}
```

### POST /api/members

Authorization:
- Admin or Librarian

Request:

```json
{
  "fullName": "Ali Veli",
  "email": "ali@example.com",
  "phone": "05550000000",
  "address": "Malatya"
}
```

Response (201):

```json
{
  "id": 1,
  "fullName": "Ali Veli",
  "email": "ali@example.com",
  "phone": "05550000000",
  "address": "Malatya"
}
```

### PUT /api/members/{id}

Authorization:
- Admin or Librarian

Request:

```json
{
  "fullName": "Ali Veli Updated",
  "email": "ali@example.com",
  "phone": "05550000000",
  "address": "Malatya"
}
```

Response (200):

```json
{
  "id": 1,
  "fullName": "Ali Veli Updated",
  "email": "ali@example.com",
  "phone": "05550000000",
  "address": "Malatya"
}
```

### DELETE /api/members/{id}

Authorization:
- Admin or Librarian

Response (204)

---

## Loans

Loan status values:
- `Active`
- `ReturnPendingApproval`
- `Returned`
- `Overdue`

### POST /api/loans/checkout

Authorization:
- Admin or Librarian

Request:

```json
{
  "memberId": 1,
  "copyId": 10,
  "dueDate": "2026-05-01T00:00:00Z"
}
```

Response (201):

```json
{
  "id": 100,
  "memberId": 1,
  "copyId": 10,
  "loanDate": "2026-04-11T12:00:00Z",
  "dueDate": "2026-05-01T00:00:00Z",
  "returnDate": null,
  "status": "Active",
  "renewCount": 0,
  "returnRequestedAt": null
}
```

Rules:
- Copy status must be `Available`
- Member must exist

### POST /api/me/loans/{id}/request-return

Authorization:
- User

Request:

```json
{
  "note": "Book was left at the front desk."
}
```

Response (200):

```json
{
  "id": 100,
  "memberId": 1,
  "copyId": 10,
  "loanDate": "2026-04-11T12:00:00Z",
  "dueDate": "2026-05-01T00:00:00Z",
  "returnDate": null,
  "status": "ReturnPendingApproval",
  "renewCount": 0,
  "returnRequestedAt": "2026-04-20T09:30:00Z"
}
```

Rules:
- Loan must belong to current user
- Loan status must be `Active`
- System does not mark book as fully returned yet

### POST /api/loans/{id}/approve-return

Authorization:
- Admin or Librarian

Response (200):

```json
{
  "id": 100,
  "memberId": 1,
  "copyId": 10,
  "loanDate": "2026-04-11T12:00:00Z",
  "dueDate": "2026-05-01T00:00:00Z",
  "returnDate": "2026-04-20T10:00:00Z",
  "status": "Returned",
  "renewCount": 0,
  "returnRequestedAt": "2026-04-20T09:30:00Z"
}
```

Rules:
- Loan status must be `ReturnPendingApproval`
- Physical copy is confirmed by admin or librarian
- Related copy status becomes `Available`

### POST /api/loans/{id}/reject-return

Authorization:
- Admin or Librarian

Request:

```json
{
  "reason": "Physical copy was not found."
}
```

Response (200):

```json
{
  "id": 100,
  "memberId": 1,
  "copyId": 10,
  "loanDate": "2026-04-11T12:00:00Z",
  "dueDate": "2026-05-01T00:00:00Z",
  "returnDate": null,
  "status": "Active",
  "renewCount": 0,
  "returnRequestedAt": null
}
```

Rules:
- Loan status must be `ReturnPendingApproval`
- Loan returns to `Active`

### POST /api/me/loans/{id}/renew

Authorization:
- User

Response (200):

```json
{
  "id": 100,
  "memberId": 1,
  "copyId": 10,
  "loanDate": "2026-04-11T12:00:00Z",
  "dueDate": "2026-05-15T00:00:00Z",
  "returnDate": null,
  "status": "Active",
  "renewCount": 1,
  "returnRequestedAt": null
}
```

Rules:
- Loan must belong to current user
- Loan status must be `Active`
- Overdue loans cannot be renewed
- Renew is not allowed if there is an active reservation for the same book
- Maximum renew count can be limited (example: 2)

### POST /api/loans/return

Authorization:
- Admin or Librarian

Request:

```json
{
  "loanId": 100
}
```

Response (200):

```json
{
  "id": 100,
  "memberId": 1,
  "copyId": 10,
  "loanDate": "2026-04-11T12:00:00Z",
  "dueDate": "2026-05-01T00:00:00Z",
  "returnDate": "2026-04-20T10:00:00Z",
  "status": "Returned",
  "renewCount": 0,
  "returnRequestedAt": null
}
```

Notes:
- This is a direct return flow for admin-side or librarian-side operation.
- If return approval workflow is used, system should prefer `request-return` and `approve-return`.

### GET /api/loans/overdue

Authorization:
- Admin or Librarian

Response (200):

```json
{
  "items": [
    {
      "id": 101,
      "memberId": 2,
      "copyId": 11,
      "loanDate": "2026-03-01T10:00:00Z",
      "dueDate": "2026-03-15T10:00:00Z",
      "returnDate": null,
      "status": "Overdue",
      "renewCount": 1,
      "returnRequestedAt": null
    }
  ]
}
```

### GET /api/me/loans

Authorization:
- User

Response (200):

```json
{
  "items": [
    {
      "id": 100,
      "memberId": 1,
      "copyId": 10,
      "loanDate": "2026-04-11T12:00:00Z",
      "dueDate": "2026-05-01T00:00:00Z",
      "returnDate": null,
      "status": "Active",
      "renewCount": 0,
      "returnRequestedAt": null
    }
  ]
}
```

---

## Reservations

### POST /api/reservations

Authorization:
- User

Request:

```json
{
  "bookId": 1
}
```

Response (201):

```json
{
  "id": 500,
  "bookId": 1,
  "reservedAt": "2026-04-11T12:00:00Z",
  "status": "Active"
}
```

### DELETE /api/reservations/{id}

Authorization:
- User

Response (204)

### GET /api/me/reservations

Authorization:
- User

Response (200):

```json
{
  "items": [
    {
      "id": 500,
      "bookId": 1,
      "reservedAt": "2026-04-11T12:00:00Z",
      "status": "Active"
    }
  ]
}
```

---

## User Management

### GET /api/users

Authorization:
- Admin only

Response (200):

```json
{
  "items": [
    {
      "id": 1,
      "username": "admin",
      "role": "Admin"
    },
    {
      "id": 2,
      "username": "librarian1",
      "role": "Librarian"
    },
    {
      "id": 3,
      "username": "user1",
      "role": "User"
    }
  ]
}
```

### POST /api/users

Authorization:
- Admin only

Request:

```json
{
  "username": "librarian1",
  "password": "123456",
  "role": "Librarian"
}
```

Response (201):

```json
{
  "id": 2,
  "username": "librarian1",
  "role": "Librarian"
}
```

### PUT /api/users/{id}/role

Authorization:
- Admin only

Request:

```json
{
  "role": "Librarian"
}
```

Response (200):

```json
{
  "id": 2,
  "username": "librarian1",
  "role": "Librarian"
}
```