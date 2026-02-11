import type { Rule } from '../types/models';

export interface ComparisonResult {
    winner: 'A' | 'B' | 'TIE';
    reason: string;
}

/**
 * Advanced comparison engine for Phase 2A
 * Supports: Higher, Lower, Manual, Alphanumeric, Ranking
 */
export function compareSpecs(
    valA: string,
    valB: string,
    rule?: Rule
): ComparisonResult {
    if (!rule) {
        return { winner: 'TIE', reason: 'No rule defined for this spec' };
    }

    const { ruleType, options } = rule;

    // Normalization
    const normA = valA.trim();
    const normB = valB.trim();

    if (ruleType === 'manual') {
        return { winner: 'TIE', reason: 'Manual evaluation required' };
    }

    if (ruleType === 'higher_wins' || ruleType === 'lower_wins') {
        const numA = parseFloat(normA.replace(/[^0-9.]/g, ''));
        const numB = parseFloat(normB.replace(/[^0-9.]/g, ''));

        if (isNaN(numA) || isNaN(numB)) {
            return { winner: 'TIE', reason: 'One or both values are not numeric' };
        }

        if (numA === numB) return { winner: 'TIE', reason: 'Values are equal' };

        const aWins = ruleType === 'higher_wins' ? numA > numB : numA < numB;
        return {
            winner: aWins ? 'A' : 'B',
            reason: `${aWins ? normA : normB} is ${ruleType === 'higher_wins' ? 'higher' : 'lower'} than ${aWins ? normB : normA}`
        };
    }

    if (ruleType === 'alphanumeric') {
        const alphaMode = options?.alphaMode || 'high_number_wins';

        const parseAlpha = (s: string) => {
            const numMatch = s.match(/\d+/);
            const num = numMatch ? parseInt(numMatch[0], 10) : null;
            const text = s.replace(/\d+/, '').trim().toLowerCase();
            return { num, text, original: s };
        };

        const partA = parseAlpha(normA);
        const partB = parseAlpha(normB);

        // Compare numbers if present
        if (partA.num !== null && partB.num !== null) {
            if (partA.num !== partB.num) {
                const aWins = alphaMode === 'high_number_wins' ? partA.num > partB.num : partA.num < partB.num;
                return {
                    winner: aWins ? 'A' : 'B',
                    reason: `Numeric part ${aWins ? partA.num : partB.num} wins (${alphaMode.replace(/_/g, ' ')})`
                };
            }
        }

        // If numbers are same or missing, compare text
        if (partA.text === partB.text) {
            // Check suffix case: "G8" vs "G8i"
            if (normA.length !== normB.length) {
                const aWins = normA.length > normB.length;
                return {
                    winner: aWins ? 'A' : 'B',
                    reason: `Version "${aWins ? normA : normB}" has more detail/suffix`
                };
            }
            return { winner: 'TIE', reason: 'Values are identical' };
        }

        // Lexicographical fallback
        const aWins = partA.text > partB.text;
        return {
            winner: aWins ? 'A' : 'B',
            reason: `Alphanumeric fallback: ${aWins ? normA : normB} > ${aWins ? normB : normA}`
        };
    }

    if (ruleType === 'ranking') {
        const list = options?.rankingList || [];
        const direction = options?.rankingDirection || 'ascending';

        const getRank = (val: string) => {
            const index = list.findIndex(item => item.toLowerCase().trim() === val.toLowerCase().trim());
            return index;
        };

        const rankA = getRank(normA);
        const rankB = getRank(normB);

        if (rankA === -1 && rankB === -1) {
            return { winner: 'TIE', reason: 'Neither value found in ranking list' };
        }

        if (rankA !== -1 && rankB === -1) {
            return { winner: 'A', reason: `"${normA}" is a recognized rank, "${normB}" is not` };
        }

        if (rankA === -1 && rankB !== -1) {
            return { winner: 'B', reason: `"${normB}" is a recognized rank, "${normA}" is not` };
        }

        if (rankA === rankB) {
            return { winner: 'TIE', reason: 'Both values have same rank' };
        }

        const aWins = direction === 'ascending' ? rankA > rankB : rankA < rankB;
        return {
            winner: aWins ? 'A' : 'B',
            reason: `Rank: ${aWins ? normA : normB} is higher in hierarchy than ${aWins ? normB : normA}`
        };
    }

    return { winner: 'TIE', reason: 'Unknown rule type' };
}
