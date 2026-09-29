/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
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
    var allowedOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
        ?? ["http://localhost:5173", "https://localhost:5173"];
    options.AddPolicy("ClientApps", policy => policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("ClientApps");
app.UseMiddleware<AuthenticationMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

await SeedData.EnsureAsync(app.Services);

app.Run();
