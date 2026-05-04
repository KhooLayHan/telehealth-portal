FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS base
RUN apk add --no-cache krb5-libs icu-libs icu-data-full
WORKDIR /app
 
EXPOSE 8080
EXPOSE 8081
 
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
 
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
 
COPY [".editorconfig", "./"]
COPY [".csharpierignore", "./"]
COPY ["Directory.Build.props", "./"]
COPY ["Directory.Packages.props", "./"]
COPY ["backend/src/TeleHealth.Contracts/TeleHealth.Contracts.csproj", "./TeleHealth.Contracts/"]
COPY ["backend/src/TeleHealth.Api/TeleHealth.Api.csproj", "./TeleHealth.Api/"]
RUN dotnet restore "./TeleHealth.Api/TeleHealth.Api.csproj"
 
COPY backend/src/TeleHealth.Api/ ./TeleHealth.Api/
COPY backend/src/TeleHealth.Contracts/ ./TeleHealth.Contracts/  
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