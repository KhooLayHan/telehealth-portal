FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["TeleHealth.Api.csproj", "./"]
RUN dotnet restore "TeleHealth.Api.csproj"
COPY . .
WORKDIR "/src/TeleHealth.Api"
RUN dotnet build "./TeleHealth.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "TeleHealth.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
USER $APP_UID
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TeleHealth.Api.dll"]




# ARG BUILD_CONFIGURATION=Release

# FROM mcr.microsoft.com/dotnet/sdk:10-alpine AS build

# WORKDIR /backend/src

# COPY . .

# RUN dotnet restore 

# RUN dotnet build -c $BUILD_CONFIGURATION -o /app/build

# ARG TARGETARCH

# FROM mcr.microsoft.com/dotnet/aspnet:10-alpine AS final
# WORKDIR /app
# EXPOSE 8080

# # Copy everything needed to run the app from the "build" stage.
# COPY --from=build /app .


# USER $APP_UID

# ENTRYPOINT ["dotnet", "TeleHealth.Api.dll"]
