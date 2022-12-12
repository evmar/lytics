package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"
)

type ColumnWriter struct {
	file io.Closer
	w    *bufio.Writer
}

func NewColumnWriter(path string) (*ColumnWriter, error) {
	f, err := os.Create(path)
	if err != nil {
		return nil, err
	}
	return &ColumnWriter{file: f, w: bufio.NewWriter(f)}, nil
}

func (w *ColumnWriter) WriteInt(x uint32) error {
	for {
		b := uint8(x & 0x7F)
		x >>= 7
		if x > 0 {
			b |= 0x80
		}
		if err := w.w.WriteByte(b); err != nil {
			return err
		}
		if x == 0 {
			break
		}
	}
	return nil
}

func (w *ColumnWriter) Close() error {
	if err := w.w.Flush(); err != nil {
		return err
	}
	return w.file.Close()
}

type NumColWriter struct {
	col       *ColumnWriter
	Ascending bool
	Prev      int
}

func NewNumColWriter(w *ColumnWriter) *NumColWriter {
	return &NumColWriter{col: w}
}

func (w *NumColWriter) Write(n int) error {
	if w.Ascending {
		if n < w.Prev {
			return fmt.Errorf("column marked ascending, but %d < previous %d", n, w.Prev)
		}
		n, w.Prev = n-w.Prev, n
	}
	return w.col.WriteInt(uint32(n))
}

func (w *NumColWriter) Close() error {
	return w.col.Close()
}

type StrColWriter struct {
	num  *NumColWriter
	strs map[string]int
	next int
}

func NewStrColWriter(w *ColumnWriter) *StrColWriter {
	strs := map[string]int{}
	strs[""] = 0
	return &StrColWriter{
		num:  NewNumColWriter(w),
		strs: strs,
		next: 1,
	}
}

func (w *StrColWriter) Write(s string) error {
	n, ok := w.strs[s]
	if !ok {
		n = w.next
		w.strs[s] = n
		w.next++
	}
	return w.num.Write(n)
}

func (w *StrColWriter) Close() error {
	arr := make([]string, w.next)
	for s, n := range w.strs {
		arr[n] = s
	}
	if err := json.NewEncoder(w.num.col.w).Encode(arr); err != nil {
		return err
	}
	return w.num.Close()
}
