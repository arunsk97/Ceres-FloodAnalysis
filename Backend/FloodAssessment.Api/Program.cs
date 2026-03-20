using FloodAssessment.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure SQLite DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure CORS for Angular PWA
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", corsBuilder => 
        corsBuilder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// Initialize the Database
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.EnsureCreated(); // Creates database if it doesn't exist
}

// Configure the HTTP request pipeline.
app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.MapControllers();

app.Run();
