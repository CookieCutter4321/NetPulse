package main

import (
	"encoding/json"
	"log"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

type userLogin struct {
	Username string
	Password string
	IsLogin  bool
}

// /api/auth
func handleAuth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Not allowed", http.StatusMethodNotAllowed)
		return
	}

	var loginInfo userLogin

	err := json.NewDecoder(r.Body).Decode(&loginInfo)
	if err != nil {
		http.Error(w, "Bad request: Invalid JSON", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if loginInfo.IsLogin {
		return
	} else {
		// create an account
		bytes, err := bcrypt.GenerateFromPassword([]byte(loginInfo.Password), bcrypt.DefaultCost)

		if err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		log.Printf("Received payload for user: %s (password: %s)", loginInfo.Username, string(bytes))
	}
}
