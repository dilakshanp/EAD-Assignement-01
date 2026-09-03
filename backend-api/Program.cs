/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
using SmartSolar.Api.Services;
using SmartSolar.Api.Settings;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDb"));
builder.Services.AddSingleton<MongoContext>();
builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<ProsumerService>();
builder.Services.AddSingleton<NodeService>();
builder.Services.AddSingleton<ReservationService>();
builder.Services.AddSingleton<AuthService>();
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

app.UseCors("ClientApps");
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

await SeedData.EnsureAsync(app.Services);

app.Run();
