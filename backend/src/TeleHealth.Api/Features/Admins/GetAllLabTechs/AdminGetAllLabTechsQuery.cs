namespace TeleHealth.Api.Features.Admins.GetAllLabTechs;

// Query parameters for paginated lab technician listing
public sealed record AdminGetAllLabTechsQuery(
    string? Search,
    int Page = 1,
    int PageSize = 10,
    string? SortOrder = "asc"
);
