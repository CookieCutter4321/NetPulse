package main

import (
	"embed"
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

//go:embed all:frontend/build/client/*
var frontendAssets embed.FS

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type message struct {
	Id     int64
	Msg    string
	Sender string
}

var connections = make(map[*websocket.Conn]struct{})

func chatHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	connections[conn] = struct{}{}

	for {
		_, p, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			continue
		}

		var msg message
		err2 := json.Unmarshal(p, &msg)

		if err2 != nil {
			log.Println(err)
			continue
		}

		for currentConn := range connections {
			payload := message{
				Id:     time.Now().UnixMilli(),
				Msg:    msg.Msg,
				Sender: msg.Sender, // In the future, payloads to this websocket will be in json and so will need rewrite.
			}

			if err := currentConn.WriteJSON(payload); err != nil {
				log.Println(err)
				delete(connections, currentConn)
			}
		}
	}
}

func main() {
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

	log.Println("NetPulse server launching on http://localhost:8080")
	err = http.ListenAndServe("localhost:8080", nil)
	if err != nil {
		log.Fatal("Server crashed: ", err)
	}
}
