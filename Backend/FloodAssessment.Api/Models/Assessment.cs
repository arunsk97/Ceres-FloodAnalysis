using System;

namespace FloodAssessment.Api.Models
{
    public enum FarmCondition
    {
        Good = 0,
        Moderate = 1,
        Bad = 2 // Priority Flag
    }

    /// <summary>
    /// Represents a field assessment record for a chicken farm.
    /// </summary>
    public class Assessment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        /// <summary>
        /// Latitude coordinate captured automatically
        /// </summary>
        public double Latitude { get; set; }
        
        /// <summary>
        /// Longitude coordinate captured automatically
        /// </summary>
        public double Longitude { get; set; }
        
        /// <summary>
        /// Name of the farm
        /// </summary>
        public string FarmName { get; set; } = string.Empty;
        
        /// <summary>
        /// Address or sector location
        /// </summary>
        public string Address { get; set; } = string.Empty;
        
        /// <summary>
        /// Condition of the farm (Good, Moderate, Bad)
        /// </summary>
        public FarmCondition Condition { get; set; }
        
        /// <summary>
        /// Live Inventory at time of assessment
        /// </summary>
        public int TotalChickens { get; set; }
        
        /// <summary>
        /// Base64 encoded photos captured during assessment (up to 4)
        /// </summary>
        public List<string> PhotosBase64 { get; set; } = new List<string>();
        
        /// <summary>
        /// Sync status flag. Once in DB, it is natively considered synced.
        /// </summary>
        public bool IsSynced { get; set; } = true;

        public string? LivestockNotes { get; set; }
        public bool WaterAccess { get; set; }
        public bool PerimeterFence { get; set; }
        public bool Ventilation { get; set; }

        /// <summary>
        /// Comments on condition and environment
        /// </summary>
        public string? ConditionComments { get; set; }

        /// <summary>
        /// Timestamp when record was initially created offline
        /// </summary>
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Timestamp when record was last modified
        /// </summary>
        public DateTime LastModifiedDate { get; set; } = DateTime.UtcNow;
    }
}
