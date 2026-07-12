package main

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"net/http"

	"fmt"

	"path/filepath"

	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
)

var s3Client *s3.Client
var bucketName string
var region string
var presignClient *s3.PresignClient

type s3_url struct {
	URL            string
	Method         string
	SignedHeader   http.Header
	FinalPublicUrl string
}

func s3_init() {
	ctx := context.Background()
	sdkConfig, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Println(err)
	}
	s3Client = s3.NewFromConfig(sdkConfig)
	bucketName = "netpulse"
	region = "us-east-2"

	presignClient = s3.NewPresignClient(s3Client)
	log.Println("Set up aws S3")
}

// PutObject makes a presigned request that can be used to put an object in a bucket.
// The presigned request is valid for the specified number of seconds.
func PutObject(ctx context.Context, objectKey string, lifetimeSecs int64) (*v4.PresignedHTTPRequest, error) {
	request, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(lifetimeSecs * int64(time.Second))
	})
	if err != nil {
		log.Printf("Couldn't get a presigned request to put %v:%v. Here's why: %v\n",
			bucketName, objectKey, err)
	}
	return request, err
}

func scrambleFileName(s string) string {
	ext := filepath.Ext(s)

	bytes := make([]byte, 16)
	_, err := rand.Read(bytes)
	if err != nil {
		return s
	}

	return fmt.Sprintf("%x%s", bytes, strings.ToLower(ext))
}

// todo: add a rate limiter for calling this endpoint

// //api/upload returns a presigned url to uplaod to?
// the only thing in the payload body should be the name of the file that we want to
func handleUploadFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("chat_session")
	if err != nil {
		http.Error(w, "cookie error", http.StatusBadRequest)
	}

	_, err = validateJWT(cookie.Value)
	if err != nil {
		http.Error(w, "invalid token", http.StatusBadRequest)
	}

	fileName := r.URL.Query().Get("name")
	uploadLinkStruct, err := PutObject(r.Context(), fileName, 30)

	if err != nil {
		log.Println(err)
	}
	resWrapper := s3_url{
		URL:            uploadLinkStruct.URL,
		Method:         uploadLinkStruct.Method,
		SignedHeader:   uploadLinkStruct.SignedHeader,
		FinalPublicUrl: fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, scrambleFileName(fileName)),
	}

	uploadLink, err := json.Marshal(resWrapper)
	if err != nil {
		log.Println("error with encoding json")
		http.Error(w, "failed to encode json", http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	w.Write(uploadLink)
}
