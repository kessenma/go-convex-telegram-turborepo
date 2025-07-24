// main.go
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"time"

	"github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
)

// TelegramMessage represents the structure for saving messages to Convex
type TelegramMessage struct {
	MessageID        int    `json:"messageId"`
	ChatID           int64  `json:"chatId"`
	UserID           *int64 `json:"userId,omitempty"`
	Username         string `json:"username,omitempty"`
	FirstName        string `json:"firstName,omitempty"`
	LastName         string `json:"lastName,omitempty"`
	Text             string `json:"text"`
	MessageType      string `json:"messageType"`
	Timestamp        int64  `json:"timestamp"`
	MessageThreadID  *int   `json:"messageThreadId,omitempty"`
	ReplyToMessageID *int   `json:"replyToMessageId,omitempty"`
}

// ConvexResponse represents the response from Convex API
type ConvexResponse struct {
	Success   bool   `json:"success"`
	MessageID string `json:"messageId,omitempty"`
	Message   string `json:"message,omitempty"`
	Error     string `json:"error,omitempty"`
}

var (
	convexURL string
	httpClient *http.Client
	llmQueue *LLMQueue
)

// handleLLMCommands processes LLM-related commands and returns response text
func handleLLMCommands(ctx context.Context, b *bot.Bot, message *models.Message) string {
	text := strings.TrimSpace(message.Text)
	
	// Check for LLM commands
	if strings.HasPrefix(text, "/embed ") {
		return handleEmbedCommand(ctx, b, message, strings.TrimPrefix(text, "/embed "))
	} else if strings.HasPrefix(text, "/similarity ") {
		return handleSimilarityCommand(ctx, b, message, strings.TrimPrefix(text, "/similarity "))
	} else if strings.HasPrefix(text, "/search ") {
		return handleSearchCommand(ctx, b, message, strings.TrimPrefix(text, "/search "))
	} else if text == "/queue" {
		return handleQueueStatusCommand()
	} else if text == "/help" {
		return handleHelpCommand()
	}
	
	return "" // No LLM command found
}

// handleEmbedCommand processes text embedding requests
func handleEmbedCommand(ctx context.Context, b *bot.Bot, message *models.Message, text string) string {
	if text == "" {
		return "Please provide text to embed. Usage: /embed <text>"
	}
	
	userID := message.From.ID
	chatID := message.Chat.ID
	
	// Create embedding job payload
	payload := map[string]interface{}{
		"text": text,
	}
	
	jobID := llmQueue.AddJob("embedding", payload, chatID, userID)
	log.Printf("🧠 Embedding job queued for user %d: %s", userID, jobID)
	
	status := llmQueue.GetQueueStatus()
	pendingCount := status["pending"].(int)
	
	return fmt.Sprintf("🧠 Embedding job queued (ID: %s). Position in queue: %d", jobID, pendingCount)
}

// handleSimilarityCommand processes similarity calculation requests
func handleSimilarityCommand(ctx context.Context, b *bot.Bot, message *models.Message, text string) string {
	parts := strings.SplitN(text, " | ", 2)
	if len(parts) != 2 {
		return "Please provide two texts separated by ' | '. Usage: /similarity <text1> | <text2>"
	}
	
	userID := message.From.ID
	chatID := message.Chat.ID
	
	// Create similarity job payload
	payload := map[string]interface{}{
		"texts": []interface{}{parts[0], parts[1]},
	}
	
	jobID := llmQueue.AddJob("similarity", payload, chatID, userID)
	log.Printf("🧠 Similarity job queued for user %d: %s", userID, jobID)
	
	status := llmQueue.GetQueueStatus()
	pendingCount := status["pending"].(int)
	
	return fmt.Sprintf("🧠 Similarity job queued (ID: %s). Position in queue: %d", jobID, pendingCount)
}

// handleSearchCommand processes semantic search requests
func handleSearchCommand(ctx context.Context, b *bot.Bot, message *models.Message, query string) string {
	if query == "" {
		return "Please provide a search query. Usage: /search <query>"
	}
	
	userID := message.From.ID
	chatID := message.Chat.ID
	
	// Create search job payload
	payload := map[string]interface{}{
		"query":     query,
		"documents": []interface{}{}, // Empty for now, could be populated from Convex
		"top_k":     5,
	}
	
	jobID := llmQueue.AddJob("search", payload, chatID, userID)
	log.Printf("🧠 Search job queued for user %d: %s", userID, jobID)
	
	status := llmQueue.GetQueueStatus()
	pendingCount := status["pending"].(int)
	
	return fmt.Sprintf("🧠 Search job queued (ID: %s). Position in queue: %d", jobID, pendingCount)
}

// handleQueueStatusCommand returns current queue status
func handleQueueStatusCommand() string {
	status := llmQueue.GetQueueStatus()
	return fmt.Sprintf("📊 Queue Status:\n• Pending: %d\n• Processing: %d\n• Total jobs: %d\n• Running: %t", 
		status["pending"], status["processing"], status["total_jobs"], status["running"])
}

// handleHelpCommand returns available commands
func handleHelpCommand() string {
	return `🤖 Available LLM Commands:

/embed <text> - Generate embeddings for text
/similarity <text1> | <text2> - Calculate similarity between two texts
/search <query> - Perform semantic search
/queue - Show queue status
/help - Show this help message

Example:
/embed Hello world
/similarity apple | orange
/search machine learning`
}

// Result handlers for async callbacks
func handleEmbedResult(ctx context.Context, b *bot.Bot, originalMessage *models.Message, result interface{}, err error) {
	var responseText string
	if err != nil {
		responseText = fmt.Sprintf("❌ Embedding failed: %v", err)
	} else {
		responseText = "✅ Embedding generated successfully! (Vector data saved)"
	}
	
	sendAsyncResponse(ctx, b, originalMessage, responseText)
}

func handleSimilarityResult(ctx context.Context, b *bot.Bot, originalMessage *models.Message, result interface{}, err error) {
	var responseText string
	if err != nil {
		responseText = fmt.Sprintf("❌ Similarity calculation failed: %v", err)
	} else if similarity, ok := result.(float64); ok {
		responseText = fmt.Sprintf("✅ Similarity score: %.4f (%.1f%%)", similarity, similarity*100)
	} else {
		responseText = "✅ Similarity calculated successfully!"
	}
	
	sendAsyncResponse(ctx, b, originalMessage, responseText)
}

func handleSearchResult(ctx context.Context, b *bot.Bot, originalMessage *models.Message, result interface{}, err error) {
	var responseText string
	if err != nil {
		responseText = fmt.Sprintf("❌ Search failed: %v", err)
	} else {
		responseText = "✅ Search completed! (Results processed)"
	}
	
	sendAsyncResponse(ctx, b, originalMessage, responseText)
}

// sendAsyncResponse sends a response message asynchronously
func sendAsyncResponse(ctx context.Context, b *bot.Bot, originalMessage *models.Message, text string) {
	sendParams := &bot.SendMessageParams{
		ChatID: originalMessage.Chat.ID,
		Text:   text,
	}
	
	// Reply in the same thread if applicable
	if originalMessage.MessageThreadID != 0 {
		sendParams.MessageThreadID = originalMessage.MessageThreadID
	}
	
	_, err := b.SendMessage(ctx, sendParams)
	if err != nil {
		log.Printf("❌ Failed to send async response: %v", err)
	} else {
		log.Printf("✅ Async response sent: %s", text)
	}
}

func main() {
	// Configure logging with timestamps for Docker
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	log.SetPrefix("[TELEGRAM-BOT] ")

	// Get bot token from environment variable
	botToken := os.Getenv("TELEGRAM_TOKEN")
	if botToken == "" {
		log.Println("⏸️  TELEGRAM_TOKEN not provided - entering standby mode")
		log.Println("💡 The Telegram bot is in standby mode and can be safely ignored.")
		log.Println("🔧 To activate the bot, set TELEGRAM_TOKEN in your .env file and restart.")
		log.Println("🌐 Other services (web dashboard, LLM, Convex) will continue to work normally.")
		log.Println("⏳ Bot will remain in standby mode indefinitely...")
		
		// Create a context that can be cancelled on interrupt
		ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
		defer cancel()
		
		// Wait indefinitely in standby mode
		<-ctx.Done()
		log.Println("🛑 Telegram bot shutting down from standby mode")
		return
	}

	// Get Convex URL from environment variable
	convexURL = os.Getenv("CONVEX_URL")
	if convexURL == "" {
		convexURL = "http://convex-backend:3211" // Default for Docker
	}

	// Get LLM service URL from environment variable
	llmURL := os.Getenv("VECTOR_CONVERT_LLM_URL")
	if llmURL == "" {
		llmURL = "http://vector-convert-llm:8081" // Default for Docker
	}

	// Initialize HTTP client with timeout
	httpClient = &http.Client{
		Timeout: 10 * time.Second,
	}

	// Initialize LLM queue with 2 workers
	llmQueue = NewLLMQueue(llmURL, 2)
	llmQueue.Start()

	log.Printf("🚀 Initializing Telegram bot at %s", time.Now().Format(time.RFC3339))
	log.Printf("🔗 Convex backend URL: %s", convexURL)
	log.Printf("🧠 LLM service URL: %s", llmURL)

	// Create context that will be cancelled on interrupt signal
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()

	// Configure bot options with default handler
	opts := []bot.Option{
		bot.WithDefaultHandler(messageHandler),
	}

	// Create new bot instance
	b, err := bot.New(botToken, opts...)
	if err != nil {
		log.Fatalf("❌ Failed to create bot: %v", err)
	}

	log.Println("✅ Telegram bot started successfully and listening for messages...")
	
	// Start the bot
	b.Start(ctx)
	
	// Graceful shutdown
	log.Println("🛑 Telegram bot shutting down gracefully...")
	llmQueue.Stop()
	log.Println("✅ LLM queue stopped")
}

// saveMessageToConvex saves a telegram message to the Convex database
func saveMessageToConvex(ctx context.Context, msg *models.Message) error {
	// Prepare the message data
	telegramMsg := TelegramMessage{
		MessageID:   msg.ID,
		ChatID:      msg.Chat.ID,
		Text:        msg.Text,
		MessageType: "text",
		Timestamp:   int64(msg.Date) * 1000, // Convert to milliseconds
	}

	// Add user information if available
	if msg.From != nil {
		telegramMsg.UserID = &msg.From.ID
		telegramMsg.Username = msg.From.Username
		telegramMsg.FirstName = msg.From.FirstName
		telegramMsg.LastName = msg.From.LastName
	}

	// Add thread information if available - THIS IS THE KEY FIX
	if msg.MessageThreadID != 0 {
		threadID := msg.MessageThreadID
		telegramMsg.MessageThreadID = &threadID
		log.Printf("🧵 Message is part of thread ID: %d", threadID)
	} else {
		log.Printf("💬 Message is not part of a thread (regular chat message)")
	}

	// Add reply information if available
	if msg.ReplyToMessage != nil {
		replyID := msg.ReplyToMessage.ID
		telegramMsg.ReplyToMessageID = &replyID
		log.Printf("↩️ Message is replying to message ID: %d", replyID)
	}

	// Convert to JSON
	jsonData, err := json.Marshal(telegramMsg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	log.Printf("🔄 Sending message to Convex: %s", string(jsonData))

	// Create HTTP request
	apiURL := fmt.Sprintf("%s/api/telegram/messages", convexURL)
	log.Printf("🌐 API URL: %s", apiURL)
	
	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	// Send the request
	log.Printf("📤 Sending HTTP request to Convex...")
	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	log.Printf("📥 Received response: Status=%d, ContentLength=%d", resp.StatusCode, resp.ContentLength)

	// Read response body for debugging
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	log.Printf("📄 Response body: %s", string(bodyBytes))

	// Parse the response
	var convexResp ConvexResponse
	if err := json.Unmarshal(bodyBytes, &convexResp); err != nil {
		return fmt.Errorf("failed to decode response: %w (body: %s)", err, string(bodyBytes))
	}

	if !convexResp.Success {
		return fmt.Errorf("convex API error: %s", convexResp.Error)
	}

	log.Printf("💾 Message saved to Convex with ID: %s", convexResp.MessageID)
	return nil
}

// messageHandler handles all incoming messages
func messageHandler(ctx context.Context, b *bot.Bot, update *models.Update) {
	// Check if the update contains a message
	if update.Message == nil {
		return
	}

	// Extract user and chat information for logging
	userInfo := "Unknown"
	if update.Message.From != nil {
		userInfo = fmt.Sprintf("%s (@%s, ID: %d)", 
			update.Message.From.FirstName, 
			update.Message.From.Username, 
			update.Message.From.ID)
	}

	chatInfo := fmt.Sprintf("Chat ID: %d, Type: %s", 
		update.Message.Chat.ID, 
		update.Message.Chat.Type)

	// Enhanced logging to show thread information
	threadInfo := ""
	if update.Message.MessageThreadID != 0 {
		threadInfo = fmt.Sprintf(" | Thread ID: %d", update.Message.MessageThreadID)
	}

	// Log incoming message with detailed information
	log.Printf("📨 Message received from %s | %s%s | Text: '%s'", 
		userInfo, chatInfo, threadInfo, update.Message.Text)

	// Save message to Convex database
	if err := saveMessageToConvex(ctx, update.Message); err != nil {
		log.Printf("⚠️ Failed to save message to Convex: %v", err)
		// Continue processing even if save fails
	}

	// Handle LLM commands
	responseText := handleLLMCommands(ctx, b, update.Message)
	if responseText == "" {
		// Default response for non-LLM messages
		responseText = fmt.Sprintf("Message received and saved: %s", update.Message.Text)
	}

	// Prepare response parameters
	sendParams := &bot.SendMessageParams{
		ChatID: update.Message.Chat.ID,
		Text:   responseText,
	}

	// If the original message was in a thread, reply in the same thread
	if update.Message.MessageThreadID != 0 {
		sendParams.MessageThreadID = update.Message.MessageThreadID
		log.Printf("🧵 Replying in thread ID: %d", update.Message.MessageThreadID)
	}

	// Send response back to the chat
	_, err := b.SendMessage(ctx, sendParams)
	
	if err != nil {
		log.Printf("❌ Failed to send message to %s: %v", userInfo, err)
	} else {
		log.Printf("✅ Response sent to %s | Text: '%s'", userInfo, responseText)
	}
}
