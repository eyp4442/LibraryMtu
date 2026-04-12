# Library System API Contract (v0.2)

## Conventions
- Base path: `/api`
- JSON naming: `camelCase`
- Auth: `Authorization: Bearer <accessToken>`
- API date format: ISO-8601 (örnek: `2026-04-11T12:34:56Z`)
- UI display date format: `dd.MM.yyyy HH:mm`

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

Notes:
- Hatalı kullanıcı adı veya şifre durumunda `401 Unauthorized` döner.
- Hata kodu: `AUTH_INVALID_CREDENTIALS`

### POST /api/auth/logout

Notes:
- JWT kullanıldığında istemci token'ı siler.
- Bu endpoint opsiyoneldir.

---

## Books

### GET /api/books

Query params:
- `query` (optional)
- `page` (default: 1)
- `pageSize` (default: 20)
- `category` (optional)
- `author` (optional)
- `availableOnly` (optional)

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
      "category": "Software",
      "description": "A book about writing clean code."
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
  "category": "Software",
  "description": "A book about writing clean code."
}
```

### POST /api/books

Authorization:
- Admin only

Request:

```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "isbn": "9780132350884",
  "publishedYear": 2008,
  "category": "Software",
  "description": "A book about writing clean code."
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
  "category": "Software",
  "description": "A book about writing clean code."
}
```

### PUT /api/books/{id}

Authorization:
- Admin only

Request:

```json
{
  "title": "Clean Code - Updated",
  "author": "Robert C. Martin",
  "isbn": "9780132350884",
  "publishedYear": 2008,
  "category": "Software",
  "description": "Updated description."
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
  "category": "Software",
  "description": "Updated description."
}
```

### DELETE /api/books/{id}

Authorization:
- Admin only

Response (204)

---

## Book Copies

### GET /api/books/{bookId}/copies

Authorization:
- Admin only

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
- Admin only

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
- Admin only

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
- Admin only

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
- Admin only

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
- Admin only

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
- Admin only

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
- Admin only

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
- Admin only

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
- Admin only

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
- Physical copy is confirmed by admin/librarian
- Related copy status becomes `Available`

### POST /api/loans/{id}/reject-return

Authorization:
- Admin only

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
- Admin only

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
- This is a direct return flow for admin-side operation.
- If return approval workflow is used, system should prefer `request-return` and `approve-return`.

### GET /api/loans/overdue

Authorization:
- Admin only

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