using Asp.Versioning;
using Asp.Versioning.Builder;

namespace TeleHealth.Api.Common.Extensions;

public static class ApiVersioningExtensions
{
    public static IServiceCollection AddApiVersioningConfiguration(this IServiceCollection services)
    {
        services
            .AddApiVersioning(options =>
            {
                options.DefaultApiVersion = new ApiVersion(
                    ApiEndpoints.MajorVersion,
                    ApiEndpoints.MinorVersion
                );
                options.AssumeDefaultVersionWhenUnspecified = true;
                options.ReportApiVersions = true;
                options.ApiVersionReader = new UrlSegmentApiVersionReader();
            })
            .AddApiExplorer(options =>
            {
                options.GroupNameFormat = "'v'V";
                options.SubstituteApiVersionInUrl = true;
            });

        return services;
    }

    public static RouteGroupBuilder CreateVersionedApiGroup(
        this IEndpointRouteBuilder app,
        int majorVersion = ApiEndpoints.MajorVersion,
        int minorVersion = ApiEndpoints.MinorVersion
    )
    {
        var version = new ApiVersion(majorVersion, minorVersion);
        var versionSet = app.NewApiVersionSet().HasApiVersion(version).ReportApiVersions().Build();

        return app.MapGroup($"{ApiEndpoints.ApiBase}/v{{version:apiVersion}}/")
            .WithApiVersionSet(versionSet)
            .MapToApiVersion(version);
    }
}
