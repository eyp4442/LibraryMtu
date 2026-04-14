namespace Library.Api.DTOs.Books
{
    public class StockSummaryDto
    {
        public int Total { get; set; }
        public int Available { get; set; }
        public int Loaned { get; set; }
        public int Reserved { get; set; }
        public int PendingReturnApproval { get; set; }
    }

    public class BookListItemDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Isbn { get; set; } = string.Empty;
        public int PublishedYear { get; set; }
        public string Publisher { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public int PageCount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }

        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;

        public int AvailableCopyCount { get; set; }
        public int TotalCopyCount { get; set; }

        public StockSummaryDto StockSummary { get; set; } = new();
    }

    public class BookDetailDto : BookListItemDto
    {
    }

    public class CreateBookDto
    {
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Isbn { get; set; } = string.Empty;
        public int PublishedYear { get; set; }
        public string Publisher { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public int PageCount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public int CategoryId { get; set; }
    }

    public class UpdateBookDto
    {
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Isbn { get; set; } = string.Empty;
        public int PublishedYear { get; set; }
        public string Publisher { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public int PageCount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public int CategoryId { get; set; }
    }
}