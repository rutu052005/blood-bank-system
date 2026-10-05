export class ClockService {
  private static offsetMs: number = 0;

  /**
   * Get current simulated Date
   */
  public static now(): Date {
    return new Date(Date.now() + this.offsetMs);
  }

  /**
   * Get current simulated time as ISO String
   */
  public static nowISO(): string {
    return this.now().toISOString();
  }

  /**
   * Get current simulated time as YYYY-MM-DD
   */
  public static nowDateString(): string {
    return this.now().toISOString().split('T')[0];
  }

  /**
   * Advance simulated time by specified hours
   */
  public static advanceHours(hours: number): { previous: string; current: string; advancedHours: number } {
    const previous = this.nowISO();
    this.offsetMs += hours * 60 * 60 * 1000;
    const current = this.nowISO();
    return {
      previous,
      current,
      advancedHours: hours,
    };
  }

  /**
   * Advance simulated time by specified days
   */
  public static advanceDays(days: number): { previous: string; current: string; advancedDays: number } {
    const res = this.advanceHours(days * 24);
    return {
      previous: res.previous,
      current: res.current,
      advancedDays: days,
    };
  }

  /**
   * Reset clock offset to 0
   */
  public static reset(): void {
    this.offsetMs = 0;
  }

  /**
   * Get total offset in hours
   */
  public static getOffsetHours(): number {
    return this.offsetMs / (1000 * 60 * 60);
  }
}
