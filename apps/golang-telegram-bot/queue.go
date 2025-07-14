package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// QueueJob represents a job in the LLM processing queue
type QueueJob struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"` // "embedding", "chat", "similarity"
	Payload     map[string]interface{} `json:"payload"`
	ChatID      int64                  `json:"chatId"`
	UserID      int64                  `json:"userId"`
	CreatedAt   time.Time              `json:"createdAt"`
	Status      string                 `json:"status"` // "pending", "processing", "completed", "failed"
	Result      interface{}            `json:"result,omitempty"`
	Error       string                 `json:"error,omitempty"`
	CompletedAt *time.Time             `json:"completedAt,omitempty"`
}

// LLMQueue manages the queue of LLM processing jobs
type LLMQueue struct {
	mu           sync.RWMutex
	jobs         map[string]*QueueJob
	pendingQueue []*QueueJob
	processing   map[string]*QueueJob
	llmURL       string
	httpClient   *http.Client
	workerCount  int
	running      bool
	ctx          context.Context
	cancel       context.CancelFunc
}

// NewLLMQueue creates a new LLM queue instance
func NewLLMQueue(llmURL string, workerCount int) *LLMQueue {
	ctx, cancel := context.WithCancel(context.Background())
	return &LLMQueue{
		jobs:         make(map[string]*QueueJob),
		pendingQueue: make([]*QueueJob, 0),
		processing:   make(map[string]*QueueJob),
		llmURL:       llmURL,
		httpClient: &http.Client{
			Timeout: 60 * time.Second, // Longer timeout for LLM operations
		},
		workerCount: workerCount,
		ctx:         ctx,
		cancel:      cancel,
	}
}

// Start begins processing jobs in the queue
func (q *LLMQueue) Start() {
	q.mu.Lock()
	defer q.mu.Unlock()
	
	if q.running {
		return
	}
	
	q.running = true
	log.Printf("🚀 Starting LLM queue with %d workers", q.workerCount)
	
	// Start worker goroutines
	for i := 0; i < q.workerCount; i++ {
		go q.worker(i)
	}
}

// Stop gracefully stops the queue processing
func (q *LLMQueue) Stop() {
	q.mu.Lock()
	defer q.mu.Unlock()
	
	if !q.running {
		return
	}
	
	log.Println("🛑 Stopping LLM queue...")
	q.running = false
	q.cancel()
}

// AddJob adds a new job to the queue
func (q *LLMQueue) AddJob(jobType string, payload map[string]interface{}, chatID, userID int64) string {
	q.mu.Lock()
	defer q.mu.Unlock()
	
	jobID := fmt.Sprintf("%d_%d_%d", time.Now().UnixNano(), chatID, userID)
	job := &QueueJob{
		ID:        jobID,
		Type:      jobType,
		Payload:   payload,
		ChatID:    chatID,
		UserID:    userID,
		CreatedAt: time.Now(),
		Status:    "pending",
	}
	
	q.jobs[jobID] = job
	q.pendingQueue = append(q.pendingQueue, job)
	
	log.Printf("📝 Added job %s (type: %s) to queue. Queue length: %d", jobID, jobType, len(q.pendingQueue))
	return jobID
}

// GetJob retrieves a job by ID
func (q *LLMQueue) GetJob(jobID string) (*QueueJob, bool) {
	q.mu.RLock()
	defer q.mu.RUnlock()
	
	job, exists := q.jobs[jobID]
	return job, exists
}

// GetQueueStatus returns the current queue status
func (q *LLMQueue) GetQueueStatus() map[string]interface{} {
	q.mu.RLock()
	defer q.mu.RUnlock()
	
	return map[string]interface{}{
		"pending":    len(q.pendingQueue),
		"processing": len(q.processing),
		"total_jobs": len(q.jobs),
		"running":    q.running,
	}
}

// worker processes jobs from the queue
func (q *LLMQueue) worker(workerID int) {
	log.Printf("👷 Worker %d started", workerID)
	
	for {
		select {
		case <-q.ctx.Done():
			log.Printf("👷 Worker %d stopping", workerID)
			return
		default:
			job := q.getNextJob()
			if job == nil {
				time.Sleep(100 * time.Millisecond) // Brief pause when no jobs
				continue
			}
			
			q.processJob(workerID, job)
		}
	}
}

// getNextJob retrieves the next pending job
func (q *LLMQueue) getNextJob() *QueueJob {
	q.mu.Lock()
	defer q.mu.Unlock()
	
	if len(q.pendingQueue) == 0 {
		return nil
	}
	
	// Get the first job (FIFO)
	job := q.pendingQueue[0]
	q.pendingQueue = q.pendingQueue[1:]
	
	// Move to processing
	job.Status = "processing"
	q.processing[job.ID] = job
	
	return job
}

// processJob processes a single job
func (q *LLMQueue) processJob(workerID int, job *QueueJob) {
	log.Printf("👷 Worker %d processing job %s (type: %s)", workerID, job.ID, job.Type)
	
	var result interface{}
	var err error
	
	switch job.Type {
	case "embedding":
		result, err = q.processEmbedding(job)
	case "similarity":
		result, err = q.processSimilarity(job)
	case "search":
		result, err = q.processSearch(job)
	default:
		err = fmt.Errorf("unknown job type: %s", job.Type)
	}
	
	q.completeJob(job, result, err)
}

// processEmbedding handles embedding generation
func (q *LLMQueue) processEmbedding(job *QueueJob) (interface{}, error) {
	text, ok := job.Payload["text"].(string)
	if !ok {
		return nil, fmt.Errorf("missing or invalid text field")
	}
	
	payload := map[string]interface{}{
		"text": text,
	}
	
	return q.callLLMService("/embed", payload)
}

// processSimilarity handles similarity calculation
func (q *LLMQueue) processSimilarity(job *QueueJob) (interface{}, error) {
	texts, ok := job.Payload["texts"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("missing or invalid texts field")
	}
	
	payload := map[string]interface{}{
		"texts": texts,
	}
	
	return q.callLLMService("/similarity", payload)
}

// processSearch handles semantic search
func (q *LLMQueue) processSearch(job *QueueJob) (interface{}, error) {
	query, ok := job.Payload["query"].(string)
	if !ok {
		return nil, fmt.Errorf("missing or invalid query field")
	}
	
	documents, ok := job.Payload["documents"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("missing or invalid documents field")
	}
	
	payload := map[string]interface{}{
		"query":     query,
		"documents": documents,
		"top_k":     job.Payload["top_k"], // Optional
	}
	
	return q.callLLMService("/search", payload)
}

// callLLMService makes a request to the LLM service
func (q *LLMQueue) callLLMService(endpoint string, payload map[string]interface{}) (interface{}, error) {
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}
	
	url := q.llmURL + endpoint
	req, err := http.NewRequestWithContext(q.ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := q.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("LLM service returned status %d", resp.StatusCode)
	}
	
	var result interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}
	
	return result, nil
}

// completeJob marks a job as completed or failed
func (q *LLMQueue) completeJob(job *QueueJob, result interface{}, err error) {
	q.mu.Lock()
	defer q.mu.Unlock()
	
	// Remove from processing
	delete(q.processing, job.ID)
	
	now := time.Now()
	job.CompletedAt = &now
	
	if err != nil {
		job.Status = "failed"
		job.Error = err.Error()
		log.Printf("❌ Job %s failed: %v", job.ID, err)
	} else {
		job.Status = "completed"
		job.Result = result
		log.Printf("✅ Job %s completed successfully", job.ID)
	}
}