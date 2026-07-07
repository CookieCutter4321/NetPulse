package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type userLogin struct {
	Username     string
	Password     string
	AuthProvider string
	IsLogin      bool
}
type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func handleSuccessfulLogin(w http.ResponseWriter, username string) {

	expirationTime := time.Now().Add(24 * time.Hour)

	claims := &Claims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "chat_session",
		Value:    tokenString,
		Expires:  expirationTime,
		HttpOnly: true,
		Secure:   false,
		Path:     "/",
		SameSite: http.SameSiteStrictMode,
	})

	fmt.Fprintln(w, "Session created successfully!")
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
				http.Error(w, "User not found", http.StatusBadRequest)
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
			http.Error(w, "Invalid password!", http.StatusBadRequest)
			return
		}
		log.Println("Logged in successfully!")
		handleSuccessfulLogin(w, username)
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
