package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

type userLogin struct {
	Username     string
	Password     string
	AuthProvider string
	IsLogin      bool
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
		getUserQuery := "SELECT * FROM users WHERE username = $1"
		var username string
		var passwordHash string
		var authProvider sql.NullString
		err := db.QueryRow(getUserQuery, loginInfo.Username).Scan(&username, &passwordHash, &authProvider)

		if err != nil {
			if err == sql.ErrNoRows {
				fmt.Println("User not found")
				return
			}
			log.Fatal(err)
		}
		if loginInfo.AuthProvider != "" {
			log.Println("Auth login will be added soon")
			return
		}

		// Password check
		err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(loginInfo.Password))

		if err != nil {
			fmt.Println("Invalid password!")
			return
		}
		log.Println("Logged in successfully")

	} else {
		// create an account
		bytes, err := bcrypt.GenerateFromPassword([]byte(loginInfo.Password), bcrypt.DefaultCost)

		if err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}
		insertQuery := `
		INSERT INTO users (username, password_hash, auth_provider) 
		VALUES ($1, $2, NULLIF($3,''))
		ON CONFLICT (username) DO NOTHING;`

		_, err = db.Exec(insertQuery, loginInfo.Username, string(bytes), loginInfo.AuthProvider)
		if err != nil {
			log.Fatalf("Failed to insert user: %v", err)
		}

		log.Printf("Received payload for user: %s (password: %s)", loginInfo.Username, string(bytes))
	}
}
