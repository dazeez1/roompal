/**
 * Roommate Matching Service
 * Implements compatibility scoring algorithm
 */

/**
 * Calculate compatibility score between two roommate profiles
 * @param {Object} profile1 - First roommate profile
 * @param {Object} profile2 - Second roommate profile
 * @returns {number} - Compatibility score (0-100)
 */
const calculateCompatibilityScore = (profile1, profile2) => {
  let score = 0;

  // 1. Budget similarity (30%)
  const budgetScore = calculateBudgetScore(profile1.budget, profile2.budget);
  score += budgetScore * 0.3;

  // 2. Location match (25%)
  const locationScore = calculateLocationScore(
    profile1.preferredLocation,
    profile2.preferredLocation
  );
  score += locationScore * 0.25;

  // 3. Gender preference (15%)
  const genderScore = calculateGenderScore(profile1, profile2);
  score += genderScore * 0.15;

  // 4. Cleanliness similarity (15%)
  const cleanlinessScore = calculateCleanlinessScore(
    profile1.cleanlinessLevel,
    profile2.cleanlinessLevel
  );
  score += cleanlinessScore * 0.15;

  // 5. Lifestyle similarity (10%)
  const lifestyleScore = calculateLifestyleScore(
    profile1.lifestyle,
    profile2.lifestyle
  );
  score += lifestyleScore * 0.1;

  // 6. Smoking/pets compatibility (5%)
  const habitsScore = calculateHabitsScore(profile1, profile2);
  score += habitsScore * 0.05;

  return Math.round(score);
};

/**
 * Calculate budget compatibility score
 * @param {number} budget1 - First profile budget
 * @param {number} budget2 - Second profile budget
 * @returns {number} - Score 0-100
 */
const calculateBudgetScore = (budget1, budget2) => {
  if (!budget1 || !budget2) return 50; // Default if missing

  const avgBudget = (budget1 + budget2) / 2;
  const difference = Math.abs(budget1 - budget2);
  const percentageDiff = (difference / avgBudget) * 100;

  // Perfect match (within 5%)
  if (percentageDiff <= 5) return 100;
  // Very close (5-15%)
  if (percentageDiff <= 15) return 90;
  // Close (15-30%)
  if (percentageDiff <= 30) return 75;
  // Moderate (30-50%)
  if (percentageDiff <= 50) return 60;
  // Far apart (50-75%)
  if (percentageDiff <= 75) return 40;
  // Very far apart (>75%)
  return 20;
};

/**
 * Calculate location compatibility score
 * @param {string} location1 - First profile location
 * @param {string} location2 - Second profile location
 * @returns {number} - Score 0-100
 */
const calculateLocationScore = (location1, location2) => {
  if (!location1 || !location2) return 50;

  const loc1 = location1.toLowerCase().trim();
  const loc2 = location2.toLowerCase().trim();

  // Exact match
  if (loc1 === loc2) return 100;

  // Check if one location contains the other (e.g., "Lagos" and "Lagos, Nigeria")
  if (loc1.includes(loc2) || loc2.includes(loc1)) return 90;

  // Check for similar city names (basic check)
  const loc1Words = loc1.split(/[\s,]+/);
  const loc2Words = loc2.split(/[\s,]+/);
  const commonWords = loc1Words.filter((word) => loc2Words.includes(word));

  if (commonWords.length > 0) return 70;

  // Different locations
  return 30;
};

/**
 * Calculate gender preference compatibility score
 * @param {Object} profile1 - First profile
 * @param {Object} profile2 - Second profile
 * @returns {number} - Score 0-100
 */
const calculateGenderScore = (profile1, profile2) => {
  const pref1 = profile1.preferredGender || 'No Preference';
  const pref2 = profile2.preferredGender || 'No Preference';
  const gender1 = profile1.gender;
  const gender2 = profile2.gender;

  // Both have no preference
  if (pref1 === 'No Preference' && pref2 === 'No Preference') return 100;

  // Profile1's preference matches profile2's gender
  const match1 = pref1 === 'No Preference' || pref1 === gender2;
  // Profile2's preference matches profile1's gender
  const match2 = pref2 === 'No Preference' || pref2 === gender1;

  // Both preferences match
  if (match1 && match2) return 100;
  // One preference matches
  if (match1 || match2) return 70;
  // No match
  return 30;
};

/**
 * Calculate cleanliness compatibility score
 * @param {number} level1 - First profile cleanliness level (1-5)
 * @param {number} level2 - Second profile cleanliness level (1-5)
 * @returns {number} - Score 0-100
 */
const calculateCleanlinessScore = (level1, level2) => {
  if (!level1 || !level2) return 50;

  const difference = Math.abs(level1 - level2);

  // Same level
  if (difference === 0) return 100;
  // 1 level difference
  if (difference === 1) return 85;
  // 2 levels difference
  if (difference === 2) return 65;
  // 3 levels difference
  if (difference === 3) return 40;
  // 4 levels difference (opposite ends)
  return 20;
};

/**
 * Calculate lifestyle compatibility score
 * @param {string} lifestyle1 - First profile lifestyle
 * @param {string} lifestyle2 - Second profile lifestyle
 * @returns {number} - Score 0-100
 */
const calculateLifestyleScore = (lifestyle1, lifestyle2) => {
  if (!lifestyle1 || !lifestyle2) return 50;

  // Exact match
  if (lifestyle1 === lifestyle2) return 100;

  // Compatible pairs
  const compatiblePairs = [
    ['Quiet', 'Moderate'],
    ['Moderate', 'Social'],
    ['Social', 'Party'],
    ['Flexible', 'Quiet'],
    ['Flexible', 'Moderate'],
    ['Flexible', 'Social'],
    ['Flexible', 'Party'],
  ];

  const isCompatible = compatiblePairs.some(
    (pair) =>
      (pair[0] === lifestyle1 && pair[1] === lifestyle2) ||
      (pair[1] === lifestyle1 && pair[0] === lifestyle2)
  );

  if (isCompatible) return 75;

  // Incompatible pairs (Quiet + Party, etc.)
  const incompatiblePairs = [
    ['Quiet', 'Party'],
    ['Party', 'Quiet'],
  ];

  const isIncompatible = incompatiblePairs.some(
    (pair) =>
      (pair[0] === lifestyle1 && pair[1] === lifestyle2) ||
      (pair[1] === lifestyle1 && pair[0] === lifestyle2)
  );

  if (isIncompatible) return 30;

  // Default moderate compatibility
  return 50;
};

/**
 * Calculate smoking/pets habits compatibility score
 * @param {Object} profile1 - First profile
 * @param {Object} profile2 - Second profile
 * @returns {number} - Score 0-100
 */
const calculateHabitsScore = (profile1, profile2) => {
  let score = 100;

  // Smoking compatibility
  // If one smokes and the other doesn't, reduce score
  if (profile1.smoking !== profile2.smoking) {
    score -= 30; // Significant penalty for smoking mismatch
  }

  // Pets compatibility
  // If one has pets and the other doesn't want pets, reduce score
  if (profile1.pets !== profile2.pets) {
    score -= 20; // Moderate penalty for pets mismatch
  }

  // Both have same preferences (both smoke or both don't, both have pets or both don't)
  // Score remains at 100

  return Math.max(0, score); // Ensure score doesn't go below 0
};

module.exports = {
  calculateCompatibilityScore,
  calculateBudgetScore,
  calculateLocationScore,
  calculateGenderScore,
  calculateCleanlinessScore,
  calculateLifestyleScore,
  calculateHabitsScore,
};
