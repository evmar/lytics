package main

import (
	"bufio"
	"encoding/json"
	"io"
	"os"
)

type TableSchema struct {
	Name  string      `json:"name"`
	Type  string      `json:"type"`
	Attrs interface{} `json:"attrs"`
}

type TableWriter struct {
	*bufio.Writer
	io.WriteCloser
}

func NewTableWriter(path string) (*TableWriter, error) {
	f, err := os.Create(path)
	if err != nil {
		return nil, err
	}
	return &TableWriter{WriteCloser: f, Writer: bufio.NewWriter(f)}, nil
}

type NumTabWriter struct {
	*TableWriter
}

func NewNumTabWriter(w *TableWriter) *NumTabWriter {
	return &NumTabWriter{TableWriter: w}
}

func (w *NumTabWriter) Write(n int) error {
	buf := [4]byte{byte(n), byte(n >> 8), byte(n >> 16), byte(n >> 24)}
	_, err := w.Writer.Write(buf[:])
	return err
}

func (w *NumTabWriter) Finish() error {
	return nil
}

type StrTabWriter struct {
	*NumTabWriter
	strs map[string]int
	next int
}

func NewStrTabWriter(w *TableWriter) *StrTabWriter {
	strs := map[string]int{}
	strs[""] = 0
	return &StrTabWriter{
		NumTabWriter: NewNumTabWriter(w),
		strs:         strs,
		next:         1,
	}
}

func (w *StrTabWriter) Write(s string) error {
	n, ok := w.strs[s]
	if !ok {
		n = w.next
		w.strs[s] = n
		w.next++
	}
	return w.NumTabWriter.Write(n)
}

func (w *StrTabWriter) Finish() error {
	arr := make([]string, w.next)
	for s, n := range w.strs {
		arr[n] = s
	}
	return json.NewEncoder(w.Writer).Encode(arr)
}
