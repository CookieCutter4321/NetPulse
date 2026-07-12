package main

import (
	"embed"
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
	"strings"
	"time"

	"database/sql"

	"os"

	"sync"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

//go:embed all:frontend/build/client/*
var frontendAssets embed.FS

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type message struct {
	Id      int64
	Msg     string
	Sender  string
	IsMedia bool
}

var connections = make(map[*websocket.Conn]struct{})
var connectionsMu sync.Mutex

var db *sql.DB
var jwtKey []byte

// todo: use channels to handle the message sends concurrently
func chatHandler(w http.ResponseWriter, r *http.Request) {
	// When the user first connects, check if the cookie is valid first
	cookie, err := r.Cookie("chat_session")
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	claims, err := validateJWT(cookie.Value)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	username := claims.Username

	// Upgrade to a websocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	connectionsMu.Lock()
	connections[conn] = struct{}{}
	connectionsMu.Unlock()

	for {
		_, p, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)

			connectionsMu.Lock()
			delete(connections, conn)
			connectionsMu.Unlock()

			conn.Close()
			break
		}

		var msg message
		err2 := json.Unmarshal(p, &msg)

		if err2 != nil {
			log.Println(err2)
			continue
		}

		connectionsMu.Lock()
		for currentConn := range connections {
			payload := message{
				Id:      time.Now().UnixMilli(),
				Msg:     msg.Msg,
				Sender:  username,
				IsMedia: msg.IsMedia,
			}

			if err := currentConn.WriteJSON(payload); err != nil {
				log.Println(err)
				delete(connections, currentConn)
			}
		}
		connectionsMu.Unlock()
	}
}

func main() {
	godotenv.Load()

	// serve frontend assets
	distFS, err := fs.Sub(frontendAssets, "frontend/build/client")
	if err != nil {
		log.Fatal("Failed to parse embedded client folder:", err)
	}
	fileServer := http.FileServer(http.FS(distFS))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		filePath := strings.TrimPrefix(r.URL.Path, "/")
		if filePath != "" {
			fileInfo, err := fs.Stat(distFS, filePath)
			if err == nil && !fileInfo.IsDir() {
				fileServer.ServeHTTP(w, r)
				return
			}
		}

		indexHTML, err := fs.ReadFile(distFS, "index.html")
		if err != nil {
			http.Error(w, "index.html missing from embedded assets", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		w.Write(indexHTML)
	})
	// set up database access
	db, err = sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Fatalf("Database unreachable: %v", err)
	}
	log.Println("Successfully connected to database")
	jwtKey = []byte(os.Getenv("JWT_TOKEN"))

	// set up aws S3 access
	s3_init()

	http.HandleFunc("/api/auth", handleAuth)
	http.HandleFunc("/api/auth/check", handleAuthCheck)
	http.HandleFunc("/api/chat", chatHandler)
	http.HandleFunc("/api/upload", handleUploadFile)
	log.Println("NetPulse server launching on http://localhost:8080")
	err = http.ListenAndServe("localhost:8080", nil)
	if err != nil {
		log.Fatal("Server crashed: ", err)
	}
}
