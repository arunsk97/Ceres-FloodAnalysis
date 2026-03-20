using Microsoft.EntityFrameworkCore;
using FloodAssessment.Api.Models;

namespace FloodAssessment.Api.Data
{
    /// <summary>
    /// Application Database Context
    /// </summary>
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Assessment> Assessments { get; set; }
    }
}
