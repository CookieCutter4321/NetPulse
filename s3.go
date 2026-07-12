package main

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"net/http"

	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
)

var s3Client *s3.Client
var bucketName string

var presignClient *s3.PresignClient

func s3_init() {
	ctx := context.Background()
	sdkConfig, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Println(err)
	}
	s3Client = s3.NewFromConfig(sdkConfig)
	bucketName = "netpulse"

	presignClient = s3.NewPresignClient(s3Client)
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

// todo: add a rate limiter for calling this endpoint

// //api/upload returns a presigned url to uplaod to?
// the only thing in the payload body should be the name of the file that we want to
func handleUploadFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Not allowed", http.StatusMethodNotAllowed)
		return
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}

	uploadLinkStruct, err := PutObject(r.Context(), string(bodyBytes), 30)

	if err != nil {
		log.Println(err)
	}

	uploadLink, err := json.Marshal(*uploadLinkStruct)
	if err != nil {
		log.Println("error with encoding json")
		http.Error(w, "failed to encode json", http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(uploadLink)
}
