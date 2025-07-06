# Stage 1: Build the Go application
FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum* ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/main .

# Stage 2: Create the final, lightweight production image
FROM alpine:latest

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /home/appuser

COPY --from=builder /app/main .

CMD ["./main"]