package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path"
	"regexp"
	"strconv"
	"time"
)

type LogLine struct {
	Hostname string
	Time     time.Time
	Method   string
	Path     string
	Status   int
	Size     int
	Referer  string
	UA       string
}

var reLine = regexp.MustCompile(`^(\S+) - - \[(.*?) \+0000\] "(\S+) (.*?) HTTP/1.1" (\S+) (\S+) "(.*?)" "(.*?)"`)

func (l *LogLine) parse(text string) error {
	m := reLine.FindStringSubmatch(text)
	if m == nil {
		return fmt.Errorf("failed to match")
	}
	var timeStr string
	var status string
	var size string
	l.Hostname, timeStr, l.Method, l.Path, status, size, l.Referer, l.UA = m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8]

	var err error
	l.Time, err = time.Parse("02/Jan/2006:15:04:05", timeStr)
	if err != nil {
		return err
	}

	n, err := strconv.ParseInt(status, 10, 32)
	if err != nil {
		return err
	}
	l.Status = int(n)

	if size == "-" {
		l.Size = -1
	} else {
		n, err := strconv.ParseInt(size, 10, 32)
		if err != nil {
			return err
		}
		l.Size = int(n)
	}

	return nil
}

type Loader struct {
	metaWriter io.WriteCloser
	timeWriter *NumColWriter
	pathWriter *StrColWriter
	refWriter  *StrColWriter
}

func newLoader(dir string) (*Loader, error) {
	var l Loader

	f, err := os.Create(path.Join(dir, "meta"))
	if err != nil {
		return nil, err
	}
	l.metaWriter = f

	t, err := NewColumnWriter(path.Join(dir, "time"))
	if err != nil {
		return nil, err
	}
	l.timeWriter = NewNumColWriter(t)

	t, err = NewColumnWriter(path.Join(dir, "path"))
	if err != nil {
		return nil, err
	}
	l.pathWriter = NewStrColWriter(t)

	t, err = NewColumnWriter(path.Join(dir, "ref"))
	if err != nil {
		return nil, err
	}
	l.refWriter = NewStrColWriter(t)

	return &l, nil
}

func (l *Loader) parse(r io.Reader) error {
	rows := 0
	lines := 0
	s := bufio.NewScanner(r)
	var logLine LogLine
	for s.Scan() {
		lines++
		line := s.Text()
		if err := logLine.parse(line); err != nil {
			return fmt.Errorf("line %d: %s in %q", lines, err, line)
		}
		if logLine.Status != 200 {
			continue
		}
		rows++
		if err := l.timeWriter.Write(int(logLine.Time.Unix())); err != nil {
			return err
		}
		if err := l.pathWriter.Write(logLine.Path); err != nil {
			return err
		}
		if err := l.refWriter.Write(logLine.Referer); err != nil {
			return err
		}
	}
	if err := s.Err(); err != nil {
		return err
	}
	log.Printf("read %d lines", rows)

	type Column interface {
		Finish() error
		Flush() error
		Close() error
	}

	for _, w := range []Column{l.timeWriter, l.pathWriter, l.refWriter} {
		if err := w.Finish(); err != nil {
			return err
		}
		if err := w.Flush(); err != nil {
			return err
		}
		if err := w.Close(); err != nil {
			return err
		}
	}

	type ColMeta struct {
		Type string `json:"type"`
	}
	type Meta struct {
		Rows int                `json:"rows"`
		Cols map[string]ColMeta `json:"cols"`
	}

	meta := Meta{Rows: rows, Cols: map[string]ColMeta{}}
	meta.Cols["time"] = ColMeta{Type: "num"}
	meta.Cols["path"] = ColMeta{Type: "str"}
	meta.Cols["ref"] = ColMeta{Type: "str"}
	if err := json.NewEncoder(l.metaWriter).Encode(meta); err != nil {
		return err
	}
	if err := l.metaWriter.Close(); err != nil {
		return err
	}

	return nil
}

func run() error {
	l, err := newLoader("../tab")
	if err != nil {
		return err
	}

	return l.parse(os.Stdin)
}

func main() {
	if err := run(); err != nil {
		fmt.Printf("ERROR: %s\n", err)
	}
}
