namespace TeleHealth.Api.Features.Admins.GetAllDepartments;

// Query parameters for the paginated admin department listing.
public sealed record AdminGetAllDepartmentsQuery(string? Search, int Page = 1, int PageSize = 10);
