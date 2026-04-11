namespace TeleHealth.Api.Common.Models;

public sealed record PagedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
    //
    // public static PagedResult<T> Create(
    //     List<T> items,
    //     int totalCount,
    //     int page,
    //     int pageSize
    // )
    // {
    //     var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
    //     return new PagedResult<T>(
    //         items,
    //         totalCount,
    //         page,
    //         pageSize,
    //         totalPages,
    //         page < totalPages,
    //         page > 1
    //     );
    // }
}
