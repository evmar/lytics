package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http/cgi"
	"os"

	"github.com/evmar/lytics/pb"
	"google.golang.org/protobuf/proto"
)

func run() error {
	req, err := cgi.Request()
	if err != nil {
		return err
	}
	body, err := io.ReadAll(req.Body)
	if err != nil {
		return err
	}
	pb := &pb.Log{}
	if err := json.Unmarshal(body, &pb); err != nil {
		return err
	}
	out, err := proto.Marshal(pb)
	if err != nil {
		return err
	}
	log.Printf("%q", out)
	return nil
}

func main() {
	if err := run(); err != nil {
		log.Println(err)
		os.Exit(1)
	}
}
