package main

import (
	"bufio"
	"encoding/json"
	"io"
	"os"
)

type ColumnWriter struct {
	*bufio.Writer
	io.WriteCloser
}

func NewColumnWriter(path string) (*ColumnWriter, error) {
	f, err := os.Create(path)
	if err != nil {
		return nil, err
	}
	return &ColumnWriter{WriteCloser: f, Writer: bufio.NewWriter(f)}, nil
}

type NumColWriter struct {
	*ColumnWriter
}

func NewNumColWriter(w *ColumnWriter) *NumColWriter {
	return &NumColWriter{ColumnWriter: w}
}

func (w *NumColWriter) Write(n int) error {
	buf := [4]byte{byte(n), byte(n >> 8), byte(n >> 16), byte(n >> 24)}
	_, err := w.Writer.Write(buf[:])
	return err
}

func (w *NumColWriter) Finish() error {
	return nil
}

type StrColWriter struct {
	*NumColWriter
	strs map[string]int
	next int
}

func NewStrColWriter(w *ColumnWriter) *StrColWriter {
	strs := map[string]int{}
	strs[""] = 0
	return &StrColWriter{
		NumColWriter: NewNumColWriter(w),
		strs:         strs,
		next:         1,
	}
}

func (w *StrColWriter) Write(s string) error {
	n, ok := w.strs[s]
	if !ok {
		n = w.next
		w.strs[s] = n
		w.next++
	}
	return w.NumColWriter.Write(n)
}

func (w *StrColWriter) Finish() error {
	arr := make([]string, w.next)
	for s, n := range w.strs {
		arr[n] = s
	}
	return json.NewEncoder(w.Writer).Encode(arr)
}
