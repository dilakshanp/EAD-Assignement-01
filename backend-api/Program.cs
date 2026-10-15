/*
 * File: Program.cs
 * Configures application services, middleware, API routing, and startup seed data.
 */
using SmartSolar.Api.Services;
using SmartSolar.Api.Settings;
using System.Text.Json.Serialization;

EnvLoader.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDb"));
builder.Services.AddSingleton<MongoContext>();
builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<ProsumerService>();
builder.Services.AddSingleton<NodeService>();
builder.Services.AddSingleton<ReservationService>();
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<TokenService>();
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientApps", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseRouting();
app.UseCors("ClientApps");
app.UseMiddleware<AuthenticationMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

await SeedData.EnsureAsync(app.Services);

app.Run();
