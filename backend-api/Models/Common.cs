/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
namespace SmartSolar.Api.Models;

public enum UserRole { Backoffice, GridOperator, Prosumer }
public enum AccountStatus { Active, PendingDeactivation, Deactivated }
public enum ReservationStatus { Pending, Approved, Cancelled, Completed }

public record ApiResult<T>(bool Success, string Message, T? Data);
