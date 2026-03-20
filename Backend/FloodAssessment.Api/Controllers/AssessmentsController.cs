using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FloodAssessment.Api.Data;
using FloodAssessment.Api.Models;

namespace FloodAssessment.Api.Controllers
{
    /// <summary>
    /// Controller for handling offline data synchronization.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AssessmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssessmentsController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves paginated assessments from the SQL database.
        /// Supports "Lazy Loading" by accepting Skip/Take parameters to minimize
        /// network payload for historical data extraction.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int skip = 0, [FromQuery] int take = 1000)
        {
            var assessments = await _context.Assessments
                .OrderByDescending(a => a.LastModifiedDate ?? a.CreatedDate)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
                
            return Ok(assessments);
        }

        /// <summary>
        /// Receives a list of offline assessments and saves them to the database.
        /// Implements an "Upsert" (Update or Insert) pattern to handle scenarios where
        /// a record was edited multiple times while offline.
        /// </summary>
        [HttpPost("sync")]
        public async Task<IActionResult> Sync([FromBody] List<Assessment> assessments)
        {
            if (assessments == null || assessments.Count == 0)
            {
                return BadRequest("No data to sync.");
            }

            foreach (var assessment in assessments)
            {
                // Force sync as true when hitting the backend
                assessment.IsSynced = true;
                
                var existing = await _context.Assessments.FindAsync(assessment.Id);
                if (existing == null)
                {
                    _context.Assessments.Add(assessment);
                }
                else
                {
                    // Update existing record if Ids match (Upsert logic)
                    _context.Entry(existing).CurrentValues.SetValues(assessment);
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Synced successfully", count = assessments.Count });
        }
    }
}
