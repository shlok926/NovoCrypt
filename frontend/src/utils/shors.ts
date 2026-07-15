const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

// Shor's Algorithm Simulation (simplified for demo)
// This simulates the quantum advantage without actual quantum computing

export interface ShorsResult {
  steps: number;
  period: number;
  factors: number[];
  time: number;
}

// Simulate finding period using quantum order-finding
const findPeriodQuantum = (a: number, n: number): number => {
  // Simplified quantum simulation
  // In real Shor's algorithm, this would use quantum phase estimation
  for (let r = 1; r < n; r++) {
    if (Math.pow(a, r) % n === 1) {
      return r;
    }
  }
  return n - 1;
};

// Shor's Algorithm Simulation
export const shorsAlgorithm = (n: number): ShorsResult => {
  const startTime = performance.now();
  let steps = 0;

  // Step 1: Check if n is even
  steps++;
  if (n % 2 === 0) {
    const endTime = performance.now();
    return {
      steps,
      period: 0,
      factors: [2, n / 2],
      time: endTime - startTime,
    };
  }

  // Step 2: Check if n is a perfect power
  steps++;
  for (let k = 2; k <= Math.log2(n); k++) {
    const root = Math.round(Math.pow(n, 1 / k));
    if (Math.pow(root, k) === n) {
      const endTime = performance.now();
      return {
        steps,
        period: k,
        factors: [root, root],
        time: endTime - startTime,
      };
    }
  }

  // Step 3: Use quantum order-finding (simulated)
  steps++;
  const a = 2 + Math.floor(Math.random() * (n - 3));
  const period = findPeriodQuantum(a, n);

  steps++;
  if (period % 2 !== 0) {
    const endTime = performance.now();
    return {
      steps,
      period,
      factors: [],
      time: endTime - startTime,
    };
  }

  // Step 4: Classical post-processing
  steps++;
  const x = Math.pow(a, period / 2);
  const factor1 = gcd(Math.round(x - 1), n);
  const factor2 = n / factor1;

  const endTime = performance.now();
  return {
    steps,
    period,
    factors: factor1 > 1 && factor2 > 1 ? [factor1, factor2] : [],
    time: endTime - startTime,
  };
};
