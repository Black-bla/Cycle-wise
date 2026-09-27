import { DirectedEdge, ExchangeCycle, SMEProfile } from '../agent/types';
import { SEEDED_SMES } from './fixtures';
import { computeScoreBreakdown } from './scoring';

export interface GraphEngineProgress {
  phase: 'preparing' | 'building_graph' | 'searching_cycles' | 'ranking' | 'complete';
  elapsed_ms: number;
  node_count: number;
  edge_count: number;
  cycles_examined: number;
  message: string;
}

export interface GraphSearchResult {
  cycles: ExchangeCycle[];
  metadata: {
    node_count: number;
    edge_count: number;
    cycles_examined: number;
    cycles_found: number;
    elapsed_ms: number;
    max_cycle_length: number;
    fallback_used: boolean;
  };
}

export class DeterministicGraphEngine {
  private smes: Map<string, SMEProfile>;
  private disabledEdges: Set<string> = new Set();
  private dynamicEdges: DirectedEdge[] = [];

  constructor(initialSmes: SMEProfile[] = SEEDED_SMES) {
    this.smes = new Map();
    initialSmes.forEach((s) => this.smes.set(s.id, { ...s }));
  }

  public resetFixture(): void {
    this.smes.clear();
    SEEDED_SMES.forEach((s) => this.smes.set(s.id, { ...s }));
    this.disabledEdges.clear();
    this.dynamicEdges = [];
  }

  public getSMEs(): Map<string, SMEProfile> {
    return this.smes;
  }

  public disableEdge(fromId: string, toId: string): void {
    this.disabledEdges.add(`${fromId}->${toId}`);
  }

  public enableEdge(fromId: string, toId: string): void {
    this.disabledEdges.delete(`${fromId}->${toId}`);
  }

  /**
   * Register a newly onboarded SME node into the deterministic graph engine
   * and link compatibility edges with existing Nairobi business nodes.
   */
  public addSME(sme: SMEProfile, customEdges?: DirectedEdge[]): DirectedEdge[] {
    this.smes.set(sme.id, { ...sme });
    if (customEdges && customEdges.length > 0) {
      this.dynamicEdges.push(...customEdges);
      return customEdges;
    }
    const generated = this.inferEdgesForNewSme(sme);
    this.dynamicEdges.push(...generated);
    return generated;
  }

  /**
   * Deterministically infer bidirectional compatibility edges for an onboarded SME
   */
  private inferEdgesForNewSme(sme: SMEProfile): DirectedEdge[] {
    const generated: DirectedEdge[] = [];
    const needText = (sme.need_summary || '').toLowerCase();
    const offerText = (sme.offer_summary || '').toLowerCase();
    const sector = (sme.sector || '').toLowerCase();

    // 1. INWARD EDGES: Who among existing SMEs satisfies what the new SME needs?
    if (needText.includes('box') || needText.includes('packag') || needText.includes('carton') || needText.includes('wrapper') || needText.includes('container')) {
      if (this.smes.has('sme-greenpack')) {
        generated.push({
          id: `edge_sme-greenpack_${sme.id}`,
          from_sme_id: 'sme-greenpack',
          to_sme_id: sme.id,
          item_or_service: '200 food-grade corrugated packaging boxes',
          category: 'Packaging',
          quantity: 200,
          unit: 'boxes',
          estimated_value: 18000,
          compatibility_score: 0.94,
          explanation: `GreenPack manufactures 200 protective packaging cartons for ${sme.name}.`,
        });
      }
    } else if (needText.includes('deliver') || needText.includes('dispatch') || needText.includes('courier') || needText.includes('transport') || needText.includes('logistics') || needText.includes('rider')) {
      if (this.smes.has('sme-swiftmove')) {
        generated.push({
          id: `edge_sme-swiftmove_${sme.id}`,
          from_sme_id: 'sme-swiftmove',
          to_sme_id: sme.id,
          item_or_service: 'Courier parcel dispatch runs (5 trips)',
          category: 'Logistics',
          quantity: 5,
          unit: 'trips',
          estimated_value: 17500,
          compatibility_score: 0.95,
          explanation: `SwiftMove riders provide reliable scheduled dispatch trips for ${sme.name}.`,
        });
      }
    } else if (needText.includes('bookkeep') || needText.includes('tax') || needText.includes('kra') || needText.includes('account') || needText.includes('ledger') || needText.includes('audit')) {
      if (this.smes.has('sme-ledgerpro')) {
        generated.push({
          id: `edge_sme-ledgerpro_${sme.id}`,
          from_sme_id: 'sme-ledgerpro',
          to_sme_id: sme.id,
          item_or_service: 'Quarterly SME bookkeeping & reconciliations',
          category: 'Professional Services',
          quantity: 1,
          unit: 'quarter',
          estimated_value: 18500,
          compatibility_score: 0.93,
          explanation: `LedgerPro prepares audited records and tax compliance for ${sme.name}.`,
        });
      }
    } else if (needText.includes('print') || needText.includes('label') || needText.includes('card') || needText.includes('flyer') || needText.includes('signage')) {
      if (this.smes.has('sme-printlab')) {
        generated.push({
          id: `edge_sme-printlab_${sme.id}`,
          from_sme_id: 'sme-printlab',
          to_sme_id: sme.id,
          item_or_service: '100 custom printed promotional cards or box labels',
          category: 'Printing',
          quantity: 100,
          unit: 'cards',
          estimated_value: 8000,
          compatibility_score: 0.92,
          explanation: `PrintLab produces custom branding labels for ${sme.name}.`,
        });
      }
    } else if (needText.includes('design') || needText.includes('logo') || needText.includes('brand') || needText.includes('vector') || needText.includes('marketing')) {
      if (this.smes.has('sme-studio')) {
        generated.push({
          id: `edge_sme-studio_${sme.id}`,
          from_sme_id: 'sme-studio',
          to_sme_id: sme.id,
          item_or_service: 'Full brand kit & vector graphic design',
          category: 'Graphic Design',
          quantity: 1,
          unit: 'package',
          estimated_value: 8500,
          compatibility_score: 0.94,
          explanation: `Jirani Studio provides vector brand assets and digital templates for ${sme.name}.`,
        });
      }
    } else {
      // Default inward edge: GreenPack packaging or SwiftMove courier
      if (this.smes.has('sme-greenpack')) {
        generated.push({
          id: `edge_sme-greenpack_${sme.id}`,
          from_sme_id: 'sme-greenpack',
          to_sme_id: sme.id,
          item_or_service: '200 food-grade corrugated packaging boxes',
          category: 'Packaging',
          quantity: 200,
          unit: 'boxes',
          estimated_value: 18000,
          compatibility_score: 0.91,
          explanation: `GreenPack manufactures sturdy corrugated boxes to fulfill need of ${sme.name}.`,
        });
      }
    }

    // 2. OUTWARD EDGES: Who among existing SMEs can consume what the new SME offers?
    if (offerText.includes('food') || offerText.includes('bread') || offerText.includes('bakery') || offerText.includes('flour') || offerText.includes('oil') || offerText.includes('produce') || offerText.includes('fruit') || sector.includes('food') || sector.includes('agri')) {
      if (this.smes.has('sme-ledgerpro')) {
        generated.push({
          id: `edge_${sme.id}_sme-ledgerpro`,
          from_sme_id: sme.id,
          to_sme_id: 'sme-ledgerpro',
          item_or_service: sme.offer_summary,
          category: 'Food Supplies',
          quantity: 20,
          unit: 'units',
          estimated_value: 18000,
          compatibility_score: 0.95,
          explanation: `${sme.name} supplies quality provisions to LedgerPro canteen and catering barter.`,
        });
      }
      if (this.smes.has('sme-amina')) {
        generated.push({
          id: `edge_${sme.id}_sme-amina`,
          from_sme_id: sme.id,
          to_sme_id: 'sme-amina',
          item_or_service: sme.offer_summary,
          category: 'Food Wholesale',
          quantity: 15,
          unit: 'lots',
          estimated_value: 17500,
          compatibility_score: 0.92,
          explanation: `${sme.name} provides wholesale food inventory to Amina Foods distribution.`,
        });
      }
    } else if (offerText.includes('packag') || offerText.includes('box') || offerText.includes('carton')) {
      if (this.smes.has('sme-amina')) {
        generated.push({
          id: `edge_${sme.id}_sme-amina`,
          from_sme_id: sme.id,
          to_sme_id: 'sme-amina',
          item_or_service: sme.offer_summary,
          category: 'Packaging',
          quantity: 200,
          unit: 'boxes',
          estimated_value: 18000,
          compatibility_score: 0.94,
          explanation: `${sme.name} satisfies Amina's critical packaging container requirement.`,
        });
      }
    } else if (offerText.includes('deliver') || offerText.includes('transport') || offerText.includes('dispatch') || offerText.includes('courier')) {
      if (this.smes.has('sme-greenpack')) {
        generated.push({
          id: `edge_${sme.id}_sme-greenpack`,
          from_sme_id: sme.id,
          to_sme_id: 'sme-greenpack',
          item_or_service: sme.offer_summary,
          category: 'Logistics',
          quantity: 5,
          unit: 'runs',
          estimated_value: 17500,
          compatibility_score: 0.93,
          explanation: `${sme.name} fulfills GreenPack customer dispatch deliveries across Nairobi.`,
        });
      }
    } else if (offerText.includes('design') || offerText.includes('logo') || offerText.includes('creative')) {
      if (this.smes.has('sme-printlab')) {
        generated.push({
          id: `edge_${sme.id}_sme-printlab`,
          from_sme_id: sme.id,
          to_sme_id: 'sme-printlab',
          item_or_service: sme.offer_summary,
          category: 'Graphic Design',
          quantity: 1,
          unit: 'package',
          estimated_value: 8500,
          compatibility_score: 0.93,
          explanation: `${sme.name} provides creative vector assets for PrintLab print customers.`,
        });
      }
    } else {
      // General outward edge to LedgerPro or Amina
      if (this.smes.has('sme-ledgerpro')) {
        generated.push({
          id: `edge_${sme.id}_sme-ledgerpro`,
          from_sme_id: sme.id,
          to_sme_id: 'sme-ledgerpro',
          item_or_service: sme.offer_summary,
          category: sme.sector || 'Commercial Supplies',
          quantity: 1,
          unit: 'batch',
          estimated_value: 18000,
          compatibility_score: 0.91,
          explanation: `${sme.name} supplies goods/services to LedgerPro client network.`,
        });
      }
    }

    return generated;
  }

  /**
   * Build directed compatibility edges.
   * Edge A -> B means A can satisfy B's need.
   */
  public buildEdges(): DirectedEdge[] {
    const edges: DirectedEdge[] = [];

    const candidates = [
      // 1. Amina Foods (Cooking Oil) -> LedgerPro (Needs Cooking Oil)
      {
        from: 'sme-amina',
        to: 'sme-ledgerpro',
        item: '20 cartons cooking oil',
        category: 'Food Supplies',
        quantity: 20,
        unit: 'cartons',
        val: 18000,
        compat: 0.95,
        desc: 'Amina provides 20 cartons pure vegetable oil for LedgerPro catering allocation.',
      },
      // 2. LedgerPro (Bookkeeping) -> SwiftMove (Needs Bookkeeping)
      {
        from: 'sme-ledgerpro',
        to: 'sme-swiftmove',
        item: 'Quarterly SME bookkeeping & reconciliations',
        category: 'Professional Services',
        quantity: 1,
        unit: 'quarter',
        val: 18500,
        compat: 0.92,
        desc: 'LedgerPro reconciles rider fuel logs, receipts, and KRA compliance for SwiftMove.',
      },
      // 3. SwiftMove (Logistics) -> GreenPack (Needs Delivery)
      {
        from: 'sme-swiftmove',
        to: 'sme-greenpack',
        item: 'Courier parcel dispatch runs (5 trips)',
        category: 'Logistics',
        quantity: 5,
        unit: 'trips',
        val: 17500,
        compat: 0.96,
        desc: 'SwiftMove riders deliver carton samples and customer orders from Industrial Area.',
      },
      // 4. GreenPack (Packaging) -> Amina Foods (Needs Packaging)
      {
        from: 'sme-greenpack',
        to: 'sme-amina',
        item: '200 food-grade corrugated packaging boxes',
        category: 'Packaging',
        quantity: 200,
        unit: 'boxes',
        val: 18000,
        compat: 0.94,
        desc: 'GreenPack manufactures 200 oil-resistant packing boxes for Amina distribution.',
      },
      // Direct pair: PrintLab <-> Jirani Studio
      {
        from: 'sme-printlab',
        to: 'sme-studio',
        item: '100 client showcase postcards',
        category: 'Printing',
        quantity: 100,
        unit: 'cards',
        val: 8000,
        compat: 0.91,
        desc: 'PrintLab outputs premium postcards for Jirani Studio client portfolio.',
      },
      {
        from: 'sme-studio',
        to: 'sme-printlab',
        item: 'Vector logo & promotional catalogue design',
        category: 'Graphic Design',
        quantity: 1,
        unit: 'design_package',
        val: 8500,
        compat: 0.93,
        desc: 'Jirani Studio creates marketing graphics and vector brand assets for PrintLab.',
      },
    ];

    for (const c of candidates) {
      const key = `${c.from}->${c.to}`;
      if (this.disabledEdges.has(key)) {
        continue; // Intentionally broken edge for failure testing
      }
      if (this.smes.has(c.from) && this.smes.has(c.to)) {
        edges.push({
          id: `edge_${c.from}_${c.to}`,
          from_sme_id: c.from,
          to_sme_id: c.to,
          item_or_service: c.item,
          category: c.category,
          quantity: c.quantity,
          unit: c.unit,
          estimated_value: c.val,
          compatibility_score: c.compat,
          explanation: c.desc,
        });
      }
    }

    // Include dynamically inferred edges for newly onboarded SMEs
    for (const de of this.dynamicEdges) {
      const key = `${de.from_sme_id}->${de.to_sme_id}`;
      if (!this.disabledEdges.has(key) && this.smes.has(de.from_sme_id) && this.smes.has(de.to_sme_id)) {
        // Prevent duplicate edge IDs
        if (!edges.some((e) => e.id === de.id)) {
          edges.push(de);
        }
      }
    }

    return edges;
  }

  /**
   * Search for bounded cycles (lengths 2 to 4) using DFS
   */
  public async findCycles(
    maxCycleLength: number = 4,
    onProgress?: (progress: GraphEngineProgress) => void
  ): Promise<GraphSearchResult> {
    const startTime = performance.now();

    onProgress?.({
      phase: 'preparing',
      elapsed_ms: Math.round(performance.now() - startTime),
      node_count: this.smes.size,
      edge_count: 0,
      cycles_examined: 0,
      message: 'Indexing SME participant profiles and capacity graph...',
    });

    const edges = this.buildEdges();

    onProgress?.({
      phase: 'building_graph',
      elapsed_ms: Math.round(performance.now() - startTime),
      node_count: this.smes.size,
      edge_count: edges.length,
      cycles_examined: 0,
      message: `Built ${edges.length} directed compatibility edges across ${this.smes.size} SME nodes.`,
    });

    // Build adjacency list: from_sme_id -> list of outgoing edges
    const adj = new Map<string, DirectedEdge[]>();
    for (const edge of edges) {
      if (!adj.has(edge.from_sme_id)) {
        adj.set(edge.from_sme_id, []);
      }
      adj.get(edge.from_sme_id)!.push(edge);
    }

    const rawCycles: DirectedEdge[][] = [];
    let cyclesExamined = 0;

    const visitedNodes = new Set<string>();

    const dfs = (
      startNode: string,
      currentNode: string,
      path: DirectedEdge[],
      depth: number
    ) => {
      if (depth > maxCycleLength) return;

      const outgoing = adj.get(currentNode) || [];
      for (const edge of outgoing) {
        cyclesExamined++;
        if (edge.to_sme_id === startNode) {
          // Closed cycle found!
          if (path.length + 1 >= 2 && path.length + 1 <= maxCycleLength) {
            rawCycles.push([...path, edge]);
          }
        } else if (!visitedNodes.has(edge.to_sme_id) && depth < maxCycleLength) {
          visitedNodes.add(edge.to_sme_id);
          dfs(startNode, edge.to_sme_id, [...path, edge], depth + 1);
          visitedNodes.delete(edge.to_sme_id);
        }
      }
    };

    const allNodeIds = Array.from(this.smes.keys());
    for (const startNode of allNodeIds) {
      visitedNodes.add(startNode);
      dfs(startNode, startNode, [], 1);
      visitedNodes.delete(startNode);
    }

    onProgress?.({
      phase: 'searching_cycles',
      elapsed_ms: Math.round(performance.now() - startTime),
      node_count: this.smes.size,
      edge_count: edges.length,
      cycles_examined: cyclesExamined,
      message: `Searched bounded paths (max len ${maxCycleLength}); examined ${cyclesExamined} candidate paths.`,
    });

    // Deduplicate cycles across rotations
    const deduplicated = this.canonicalizeCycles(rawCycles);

    onProgress?.({
      phase: 'ranking',
      elapsed_ms: Math.round(performance.now() - startTime),
      node_count: this.smes.size,
      edge_count: edges.length,
      cycles_examined: cyclesExamined,
      message: `Ranking ${deduplicated.length} valid cycles using multi-factor objective function...`,
    });

    // Rank cycles
    deduplicated.sort(
      (a, b) => b.score_breakdown.final_score - a.score_breakdown.final_score
    );

    const elapsed_ms = Math.round(performance.now() - startTime);

    onProgress?.({
      phase: 'complete',
      elapsed_ms,
      node_count: this.smes.size,
      edge_count: edges.length,
      cycles_examined: cyclesExamined,
      message: `Execution complete in ${elapsed_ms}ms. Found ${deduplicated.length} optimal cycles.`,
    });

    return {
      cycles: deduplicated,
      metadata: {
        node_count: this.smes.size,
        edge_count: edges.length,
        cycles_examined: cyclesExamined,
        cycles_found: deduplicated.length,
        elapsed_ms,
        max_cycle_length: maxCycleLength,
        fallback_used: false,
      },
    };
  }

  /**
   * Deduplicates cycles that are the same loop rotated differently
   */
  private canonicalizeCycles(rawCycles: DirectedEdge[][]): ExchangeCycle[] {
    const seenSignatures = new Set<string>();
    const result: ExchangeCycle[] = [];

    for (const cycleEdges of rawCycles) {
      const nodeSeq = cycleEdges.map((e) => e.from_sme_id);
      const cycleLength = nodeSeq.length;

      // Find the lexicographically smallest start node for rotation normalization
      let minIdx = 0;
      for (let i = 1; i < cycleLength; i++) {
        if (nodeSeq[i] < nodeSeq[minIdx]) {
          minIdx = i;
        }
      }

      const canonicalNodes: string[] = [];
      for (let i = 0; i < cycleLength; i++) {
        canonicalNodes.push(nodeSeq[(minIdx + i) % cycleLength]);
      }

      const signature = canonicalNodes.join('->');
      if (seenSignatures.has(signature)) {
        continue;
      }
      seenSignatures.add(signature);

      // Reorder edges to match canonical sequence
      const canonicalEdges: DirectedEdge[] = [];
      for (let i = 0; i < cycleLength; i++) {
        canonicalEdges.push(cycleEdges[(minIdx + i) % cycleLength]);
      }

      // Compute estimated value unlocked (sum of exchanged values)
      const estimated_value_unlocked = canonicalEdges.reduce(
        (sum, e) => sum + e.estimated_value,
        0
      );

      // Multi-factor score
      const avgCompat =
        canonicalEdges.reduce((sum, e) => sum + e.compatibility_score, 0) /
        canonicalEdges.length;

      const scoreBreakdown = computeScoreBreakdown({
        compatibility: avgCompat,
        quantity_fit: 0.95,
        deadline_fit: 0.92,
        location_fit: 0.90,
        trust_evidence: 0.88,
        value_balance: 0.94,
      });

      result.push({
        id: `cycle_${signature.replace(/->/g, '_')}`,
        cycle_length: cycleLength,
        sme_sequence: canonicalNodes,
        edges: canonicalEdges,
        estimated_value_unlocked,
        score_breakdown: scoreBreakdown,
        risk_flags:
          cycleLength === 4
            ? ['Requires coordination among 4 independent Nairobi businesses']
            : [],
        missing_information: [],
        status: 'Proposed',
      });
    }

    return result;
  }
}
