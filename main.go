package main

import (
	"encoding/json"
	"log"
	"net/http"

	"time"

	"github.com/gorilla/websocket"
)

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

func handler(w http.ResponseWriter, r *http.Request) {
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
	http.HandleFunc("/", handler)
	log.Fatal(http.ListenAndServe("localhost:8080", nil))
}
