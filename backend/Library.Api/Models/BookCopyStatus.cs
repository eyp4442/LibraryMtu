namespace Library.Api.Models
{
    public enum BookCopyStatus
    {
        Available,
        Reserved,
        Loaned,
        PendingReturnApproval,
        Lost,
        Damaged,
        Maintenance
    }
}