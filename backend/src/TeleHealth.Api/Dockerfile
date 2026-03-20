FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS base
WORKDIR /app

EXPOSE 5000
EXPOSE 5001

FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build

ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["Directory.Build.props", "./"]
COPY ["Directory.Packages.props", "./"]
COPY ["backend/src/TeleHealth.Api/TeleHealth.Api.csproj", "./TeleHealth.Api/"]
RUN dotnet restore "./TeleHealth.Api/TeleHealth.Api.csproj"

COPY backend/src/TeleHealth.Api/ ./TeleHealth.Api/
WORKDIR "/src/TeleHealth.Api"
RUN dotnet build "TeleHealth.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "TeleHealth.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app

USER $APP_UID

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TeleHealth.Api.dll"]
