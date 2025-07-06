package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "LLM Service is healthy!")
	})

	http.HandleFunc("/generate-embeddings", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
			return
		}

		log.Println("Received request to generate embeddings")

		// Make a request to the Convex backend to trigger batch embedding generation
		// Assuming Convex backend is accessible at http://convex-backend:3000
		convexURL := "http://convex-backend:3000/api/documents/embeddings/batch"
		resp, err := http.Post(convexURL, "application/json", nil)
		if err != nil {
			log.Printf("Error calling Convex backend: %v", err)
			http.Error(w, "Failed to trigger embedding generation", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			log.Printf("Convex backend returned non-OK status: %d", resp.StatusCode)
			http.Error(w, "Convex backend returned an error", http.StatusInternalServerError)
			return
		}

		fmt.Fprintf(w, "Successfully triggered embedding generation in Convex backend!")
	})

	log.Println("LLM Service listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}