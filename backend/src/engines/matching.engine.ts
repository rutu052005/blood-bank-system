import { db } from '../db/db.js';
import { BloodGroup, ComponentType, MatchCandidateExplanation } from '../types/index.js';
import { ClockService } from '../services/clock.service.js';
import { config } from '../config/index.js';

// Priority Queue implementation for Dijkstra Algorithm
class MinPriorityQueue<T> {
  private elements: Array<{ priority: number; item: T }> = [];

  public enqueue(item: T, priority: number): void {
    this.elements.push({ priority, item });
    this.bubbleUp(this.elements.length - 1);
  }

  public dequeue(): T | undefined {
    if (this.elements.length === 0) return undefined;
    const min = this.elements[0].item;
    const end = this.elements.pop();
    if (this.elements.length > 0 && end) {
      this.elements[0] = end;
      this.sinkDown(0);
    }
    return min;
  }

  public isEmpty(): boolean {
    return this.elements.length === 0;
  }

  private bubbleUp(n: number): void {
    const element = this.elements[n];
    while (n > 0) {
      const parentIdx = Math.floor((n - 1) / 2);
      const parent = this.elements[parentIdx];
      if (element.priority >= parent.priority) break;
      this.elements[parentIdx] = element;
      this.elements[n] = parent;
      n = parentIdx;
    }
  }

  private sinkDown(n: number): void {
    const length = this.elements.length;
    const element = this.elements[n];
    while (true) {
      const leftChildIdx = 2 * n + 1;
      const rightChildIdx = 2 * n + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIdx < length) {
        leftChild = this.elements[leftChildIdx];
        if (leftChild.priority < element.priority) {
          swap = leftChildIdx;
        }
      }
      if (rightChildIdx < length) {
        rightChild = this.elements[rightChildIdx];
        if (
          (swap === null && rightChild.priority < element.priority) ||
          (swap !== null && leftChild && rightChild.priority < leftChild.priority)
        ) {
          swap = rightChildIdx;
        }
      }
      if (swap === null) break;
      this.elements[n] = this.elements[swap];
      this.elements[swap] = element;
      n = swap;
    }
  }
}

export class MatchingEngine {
  /**
   * Dijkstra Algorithm for Shortest Path calculation O((V+E) log V)
   */
  public static calculateShortestPath(fromHospitalId: string, toHospitalId: string): { distanceKm: number; path: string[] } {
    if (fromHospitalId === toHospitalId) {
      return { distanceKm: 0, path: [fromHospitalId] };
    }

    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const pq = new MinPriorityQueue<string>();

    for (const h of db.hospitals) {
      distances[h.id] = Infinity;
      previous[h.id] = null;
    }

    distances[fromHospitalId] = 0;
    pq.enqueue(fromHospitalId, 0);

    while (!pq.isEmpty()) {
      const current = pq.dequeue();
      if (!current) break;
      if (current === toHospitalId) break;

      const neighbors = db.distances.filter(d => d.from_hospital_id === current);
      for (const edge of neighbors) {
        const alt = distances[current] + edge.distance_km;
        if (alt < distances[edge.to_hospital_id]) {
          distances[edge.to_hospital_id] = alt;
          previous[edge.to_hospital_id] = current;
          pq.enqueue(edge.to_hospital_id, alt);
        }
      }
    }

    if (distances[toHospitalId] === Infinity) {
      return { distanceKm: Infinity, path: [] };
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | null = toHospitalId;
    while (curr) {
      path.unshift(curr);
      curr = previous[curr];
    }

    return { distanceKm: distances[toHospitalId], path };
  }

  /**
   * Run matching algorithm for a request item (Read-only pipeline)
   */
  public static findMatches(params: {
    requesting_hospital_id: string;
    blood_group: BloodGroup;
    component: ComponentType;
    required_quantity: number;
    rankingProfile?: 'FASTEST' | 'BALANCED';
  }): MatchCandidateExplanation[] {
    const profileKey = params.rankingProfile || 'BALANCED';
    const weights = config.matching.profiles[profileKey];
    const now = ClockService.now();

    // 1. Candidate Fetch (Read-only)
    const validCandidates = db.inventory.filter(unit => {
      const availableQty = unit.quantity_total - unit.quantity_held - unit.quantity_in_transit;
      return (
        unit.status === 'AVAILABLE' &&
        unit.blood_group === params.blood_group &&
        unit.component === params.component &&
        availableQty > 0 &&
        new Date(unit.expiry_date) > now
      );
    });

    const explanations: MatchCandidateExplanation[] = [];

    for (const unit of validCandidates) {
      const availableQty = unit.quantity_total - unit.quantity_held - unit.quantity_in_transit;
      const hospital = db.hospitals.find(h => h.id === unit.hospital_id);
      const hospitalName = hospital ? hospital.name : unit.hospital_id;

      // 2. Dijkstra Distance calculation
      const { distanceKm, path } = this.calculateShortestPath(unit.hospital_id, params.requesting_hospital_id);
      if (distanceKm === Infinity) continue; // Unreachable node

      // 3. Viability Check
      const transitHours = distanceKm / config.matching.avgTransportSpeedKmh;
      const totalBufferHours = transitHours + config.matching.safetyBufferHours;
      const expiryMs = new Date(unit.expiry_date).getTime();
      const arrivalMs = now.getTime() + totalBufferHours * 3600000;
      const isViable = expiryMs > arrivalMs;

      if (!isViable) continue; // Drop non-viable candidates

      // 4. Scoring Calculations (0-100 normalized)
      const daysToExpiry = (expiryMs - now.getTime()) / (1000 * 3600 * 24);
      
      // Expiry score: Sooner expiring (FEFO) scores higher! Range 1 to 30 days.
      const expiryScore = Math.max(0, Math.min(100, (30 - daysToExpiry) * (100 / 30)));

      // Distance score: Shorter distance scores higher! Range 0 to 500 km.
      const distanceScore = Math.max(0, Math.min(100, 100 - (distanceKm / 500) * 100));

      // Quantity fit score: Supplies requested quantity fully scores 100
      const allocatedQty = Math.min(availableQty, params.required_quantity);
      const fitScore = (allocatedQty / params.required_quantity) * 100;

      const totalScore = Math.round(
        weights.w_expiry * expiryScore +
        weights.w_distance * distanceScore +
        weights.w_fit * fitScore
      );

      explanations.push({
        hospital_id: unit.hospital_id,
        hospital_name: hospitalName,
        inventory_id: unit.id,
        blood_group: unit.blood_group,
        component: unit.component,
        quantity_available: availableQty,
        allocated_quantity: allocatedQty,
        expiry_date: unit.expiry_date,
        days_to_expiry: Math.round(daysToExpiry * 10) / 10,
        distance_km: Math.round(distanceKm * 10) / 10,
        shortest_path: path,
        total_score: totalScore,
        expiry_score: Math.round(expiryScore),
        distance_score: Math.round(distanceScore),
        fit_score: Math.round(fitScore),
        checks: {
          blood_group_match: true,
          component_match: true,
          quantity_available: availableQty >= params.required_quantity,
          inventory_available: true,
          viable_before_expiry: true,
        },
      });
    }

    // 5. Rank by totalScore DESC
    explanations.sort((a, b) => b.total_score - a.total_score);
    return explanations;
  }

  /**
   * Create redistribution suggestion from Expiry Engine events
   */
  public static createRedistributionSuggestion(inventoryId: string): void {
    const unit = db.inventory.find(i => i.id === inventoryId);
    if (!unit || unit.status !== 'AVAILABLE') return;

    const availableQty = unit.quantity_total - unit.quantity_held - unit.quantity_in_transit;
    if (availableQty <= 0) return;

    // Find hospital with open requests or lowest inventory for this group
    const potentialRecipients = db.hospitals.filter(h => h.id !== unit.hospital_id);
    if (potentialRecipients.length === 0) return;

    // Pick recipient with shortest distance
    let bestHospital = potentialRecipients[0];
    let minDistance = Infinity;

    for (const h of potentialRecipients) {
      const { distanceKm } = this.calculateShortestPath(unit.hospital_id, h.id);
      if (distanceKm < minDistance) {
        minDistance = distanceKm;
        bestHospital = h;
      }
    }

    db.redistributionSuggestions.push({
      id: `SUGG-${Date.now()}`,
      source_hospital_id: unit.hospital_id,
      target_hospital_id: bestHospital.id,
      inventory_id: unit.id,
      blood_group: unit.blood_group,
      component: unit.component,
      quantity: availableQty,
      status: 'SUGGESTED',
      created_at: ClockService.nowISO(),
    });
  }
}
