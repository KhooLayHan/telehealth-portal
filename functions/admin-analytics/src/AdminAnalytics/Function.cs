using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using NodaTime;
using Npgsql;

[assembly: LambdaSerializer(
    typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer)
)]
[assembly: InternalsVisibleTo("TeleHealth.UnitTests")]

namespace AdminAnalytics;

public class Function
{
    private const string DefaultClinicTimeZone = "Asia/Kuala_Lumpur";
    private const string QueryClinicActivitySql = """
        select ds.date, count(*)::int
        from appointments a
        inner join doctor_schedules ds on ds.id = a.schedule_id
        where a.deleted_at is null
          and ds.deleted_at is null
          and ds.date >= @week_start
          and ds.date <= @week_end
        group by ds.date
        """;

    private static readonly JsonSerializerOptions s_jsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly Lazy<Task<NpgsqlDataSource>> s_dataSource = new(CreateDataSourceAsync);

    private readonly IClock _clock;
    private readonly DateTimeZone _clinicTimeZone;
    private readonly Func<CancellationToken, Task<NpgsqlDataSource>> _dataSourceFactory;

    public Function()
        : this(SystemClock.Instance, GetClinicTimeZone(), _ => s_dataSource.Value) { }

    internal Function(
        IClock clock,
        DateTimeZone clinicTimeZone,
        Func<CancellationToken, Task<NpgsqlDataSource>> dataSourceFactory
    )
    {
        _clock = clock;
        _clinicTimeZone = clinicTimeZone;
        _dataSourceFactory = dataSourceFactory;
    }

    public async Task<APIGatewayHttpApiV2ProxyResponse> FunctionHandler(
        APIGatewayHttpApiV2ProxyRequest request,
        ILambdaContext context
    )
    {
        context.Logger.LogInformation("Admin analytics request received.");

        var week = GetCurrentWeek(_clock, _clinicTimeZone);
        var dataSource = await _dataSourceFactory(CancellationToken.None);
        var appointmentCounts = await QueryClinicActivityAsync(
            dataSource,
            week,
            CancellationToken.None
        );
        var data = BuildWeekData(week, appointmentCounts);

        return new APIGatewayHttpApiV2ProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(data, s_jsonOptions),
            Headers = new Dictionary<string, string>
            {
                { "Access-Control-Allow-Origin", "*" },
                { "Content-Type", "application/json" },
            },
        };
    }

    private static async Task<NpgsqlDataSource> CreateDataSourceAsync()
    {
        var password = await GetDatabasePasswordAsync(CancellationToken.None);

        var connectionString = new NpgsqlConnectionStringBuilder
        {
            Host = GetRequiredEnvironmentVariable("DB_HOST"),
            Port = GetEnvironmentVariableAsInt("DB_PORT", 5432),
            Database = GetRequiredEnvironmentVariable("DB_NAME"),
            Username = GetRequiredEnvironmentVariable("DB_USERNAME"),
            Password = password,
            SslMode = SslMode.Prefer,
            Pooling = true,
            MaxPoolSize = 5,
            Timeout = 10,
            CommandTimeout = 10,
        }.ConnectionString;

        var builder = new NpgsqlDataSourceBuilder(connectionString);
        builder.UseNodaTime();
        return builder.Build();
    }

    private static async Task<string> GetDatabasePasswordAsync(CancellationToken ct)
    {
        var secretArn = GetRequiredEnvironmentVariable("DB_PASSWORD_SECRET_ARN");
        using var secretsManager = new AmazonSecretsManagerClient();

        var response = await secretsManager.GetSecretValueAsync(
            new GetSecretValueRequest { SecretId = secretArn },
            ct
        );

        if (string.IsNullOrWhiteSpace(response.SecretString))
        {
            throw new InvalidOperationException("Database password secret is empty.");
        }

        return response.SecretString;
    }

    private static async Task<IReadOnlyDictionary<LocalDate, int>> QueryClinicActivityAsync(
        NpgsqlDataSource dataSource,
        WeekWindow week,
        CancellationToken ct
    )
    {
        var appointmentCounts = new Dictionary<LocalDate, int>();

        await using var command = dataSource.CreateCommand(QueryClinicActivitySql);
        command.Parameters.AddWithValue("week_start", week.Start);
        command.Parameters.AddWithValue("week_end", week.End);

        await using var reader = await command.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            appointmentCounts[reader.GetFieldValue<LocalDate>(0)] = reader.GetInt32(1);
        }

        return appointmentCounts;
    }

    internal static WeekWindow GetCurrentWeek(IClock clock, DateTimeZone clinicTimeZone)
    {
        var today = clock.GetCurrentInstant().InZone(clinicTimeZone).Date;
        var daysSinceMonday = ((int)today.DayOfWeek - (int)IsoDayOfWeek.Monday + 7) % 7;
        var start = today.PlusDays(-daysSinceMonday);

        return new WeekWindow(start, start.PlusDays(6));
    }

    internal static IReadOnlyList<ClinicActivityDataPoint> BuildWeekData(
        WeekWindow week,
        IReadOnlyDictionary<LocalDate, int> appointmentCounts
    )
    {
        var data = new List<ClinicActivityDataPoint>(capacity: 7);

        for (var dayOffset = 0; dayOffset < 7; dayOffset++)
        {
            var date = week.Start.PlusDays(dayOffset);
            var label = date.DayOfWeek switch
            {
                IsoDayOfWeek.Monday => "Mon",
                IsoDayOfWeek.Tuesday => "Tue",
                IsoDayOfWeek.Wednesday => "Wed",
                IsoDayOfWeek.Thursday => "Thu",
                IsoDayOfWeek.Friday => "Fri",
                IsoDayOfWeek.Saturday => "Sat",
                IsoDayOfWeek.Sunday => "Sun",
                _ => throw new InvalidOperationException("Invalid day of week."),
            };

            data.Add(
                new ClinicActivityDataPoint(label, appointmentCounts.GetValueOrDefault(date, 0))
            );
        }

        return data;
    }

    private static DateTimeZone GetClinicTimeZone()
    {
        var timeZoneId =
            Environment.GetEnvironmentVariable("CLINIC_TIME_ZONE") ?? DefaultClinicTimeZone;

        return DateTimeZoneProviders.Tzdb.GetZoneOrNull(timeZoneId)
            ?? DateTimeZoneProviders.Tzdb[DefaultClinicTimeZone];
    }

    private static string GetRequiredEnvironmentVariable(string name)
    {
        return Environment.GetEnvironmentVariable(name)
            ?? throw new InvalidOperationException($"{name} environment variable is required.");
    }

    private static int GetEnvironmentVariableAsInt(string name, int fallback)
    {
        var value = Environment.GetEnvironmentVariable(name);
        return int.TryParse(value, out var parsed) ? parsed : fallback;
    }

    internal sealed record WeekWindow(LocalDate Start, LocalDate End);

    internal sealed record ClinicActivityDataPoint(string Label, int Appointments);
}
