package utils

import (
	"math/rand"
	"time"
)

// RandomInt generates a random integer between min and max (inclusive)
func RandomInt(min, max int) int {
	return min + rand.Intn(max-min+1)
}

// RandomFloat generates a random float between 0 and 1
func RandomFloat() float64 {
	return rand.Float64()
}

// SelectByProbability selects an item based on probability weights
// weights: map of item -> probability (e.g., {1: 50.0, 2: 30.0, 3: 20.0})
// Returns the selected key
func SelectByProbability(weights map[int]float64) int {
	total := 0.0
	for _, weight := range weights {
		total += weight
	}

	r := rand.Float64() * total
	cumulative := 0.0

	for key, weight := range weights {
		cumulative += weight
		if r <= cumulative {
			return key
		}
	}

	// Fallback to first key
	for key := range weights {
		return key
	}
	return 0
}

func init() {
	rand.Seed(time.Now().UnixNano())
}
